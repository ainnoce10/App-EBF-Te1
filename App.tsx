
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Technicians from './components/Technicians';
import Accounting from './components/Accounting';
import Secretariat from './components/Secretariat';
import HardwareStore from './components/HardwareStore';
import Settings from './components/Settings';
import ShowcaseMode from './components/ShowcaseMode';
import { Site, Period, StockItem, Intervention, Transaction, Employee } from './types';
import { TICKER_MESSAGES } from './constants';

// Supabase Imports
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Filtres globaux
  const [site, setSite] = useState<Site>('Global');
  const [period, setPeriod] = useState<Period>('Semaine');
  const [customStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate] = useState(new Date().toISOString().split('T')[0]);

  // États de données
  const [tickerMessages, setTickerMessages] = useState<string[]>(TICKER_MESSAGES);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Indicateur de connexion
  const [isLive, setIsLive] = useState(false);

  // Fonction générique pour charger les données
  const fetchData = async () => {
    try {
        // 1. Messages
        const { data: tickerData } = await supabase
            .from('ticker_messages')
            .select('content')
            .order('created_at', { ascending: false });
        if (tickerData) setTickerMessages(tickerData.map(t => t.content));

        // 2. Stock
        const { data: stockData } = await supabase
            .from('stock')
            .select('*')
            .order('name');
        if (stockData) setStock(stockData as StockItem[]);

        // 3. Interventions
        const { data: intervData } = await supabase
            .from('interventions')
            .select('*')
            .order('date', { ascending: false });
        if (intervData) setInterventions(intervData as Intervention[]);

        // 4. Transactions
        const { data: transData } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false });
        if (transData) setTransactions(transData as Transaction[]);

        // 5. Employés
        const { data: empData } = await supabase
            .from('employees')
            .select('*')
            .order('name');
        if (empData) setEmployees(empData as Employee[]);

        setIsLive(true);
    } catch (error) {
        console.error("Erreur chargement Supabase:", error);
        setIsLive(false);
    }
  };

  useEffect(() => {
    // Chargement initial
    fetchData();

    // Configuration Realtime (Écoute globale des changements)
    const channel = supabase.channel('global-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            console.log('Change received!', payload);
            // Recharger la table concernée (stratégie simple pour v1)
            if (payload.table === 'ticker_messages') {
                 supabase.from('ticker_messages').select('content').order('created_at', { ascending: false })
                 .then(({ data }) => data && setTickerMessages(data.map(t => t.content)));
            } else if (payload.table === 'stock') {
                 supabase.from('stock').select('*').order('name')
                 .then(({ data }) => data && setStock(data as StockItem[]));
            } else if (payload.table === 'interventions') {
                 supabase.from('interventions').select('*').order('date', { ascending: false })
                 .then(({ data }) => data && setInterventions(data as Intervention[]));
            } else if (payload.table === 'transactions') {
                 supabase.from('transactions').select('*').order('date', { ascending: false })
                 .then(({ data }) => data && setTransactions(data as Transaction[]));
            } else if (payload.table === 'employees') {
                 supabase.from('employees').select('*').order('name')
                 .then(({ data }) => data && setEmployees(data as Employee[]));
            }
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  if (activeTab === 'showcase') {
    return (
      <ShowcaseMode 
        onClose={() => setActiveTab('hardware')} 
        liveStock={stock}
        liveInterventions={interventions}
        liveMessages={tickerMessages}
      />
    );
  }

  const renderContent = () => {
    return (
      <div key={activeTab} className="page-transition">
        {(() => {
          switch (activeTab) {
            case 'dashboard':
              return (
                <Dashboard 
                  site={site} 
                  period={period} 
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                  liveTransactions={transactions}
                  liveInterventions={interventions}
                />
              );
            case 'technicians':
              return <Technicians initialData={interventions} />;
            case 'accounting':
              return (
                <Accounting 
                  liveTransactions={transactions} 
                  liveEmployees={employees} 
                />
              );
            case 'secretariat':
              return <Secretariat liveInterventions={interventions} liveTransactions={transactions} />;
            case 'hardware':
              return <HardwareStore initialData={stock} />;
            case 'settings':
              return (
                <Settings 
                  tickerMessages={tickerMessages} 
                  onUpdateMessages={(msgs) => setTickerMessages(msgs)}
                />
              );
            default:
              return <Dashboard site={site} period={period} customStartDate={customStartDate} customEndDate={customEndDate} />;
          }
        })()}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <Layout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        site={site}
        onSiteChange={(s) => setSite(s as Site)}
        period={period}
        onPeriodChange={(p) => setPeriod(p as Period)}
        tickerMessages={tickerMessages}
        isLive={isLive}
      >
        {renderContent()}
      </Layout>
    </div>
  );
};

export default App;
