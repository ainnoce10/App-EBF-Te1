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
import { supabase, subscribeToTable } from './lib/supabase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Filtres globaux
  const [site, setSite] = useState<Site>('Global');
  const [period, setPeriod] = useState<Period>('Semaine');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  // États de données Live
  const [tickerMessages, setTickerMessages] = useState<string[]>(TICKER_MESSAGES);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLive, setIsLive] = useState(false);

  // Fonction de chargement globale
  const fetchAllData = async () => {
    try {
      const [
        { data: msgData },
        { data: stkData },
        { data: intData },
        { data: trxData },
        { data: empData }
      ] = await Promise.all([
        supabase.from('ticker_messages').select('content').order('created_at', { ascending: true }),
        supabase.from('stock').select('*').order('name', { ascending: true }),
        supabase.from('interventions').select('*').order('date', { ascending: false }),
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('employees').select('*').order('name', { ascending: true })
      ]);

      if (msgData) setTickerMessages(msgData.map(m => m.content));
      if (stkData) setStock(stkData);
      if (intData) setInterventions(intData);
      if (trxData) setTransactions(trxData);
      if (empData) setEmployees(empData);
      setIsLive(true);
    } catch (error) {
      console.error("Erreur de synchronisation Supabase:", error);
      setIsLive(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    // Abonnements temps réel pour toutes les tables critiques
    const tables = ['ticker_messages', 'stock', 'interventions', 'transactions', 'employees'];
    const channels = tables.map(table => 
      subscribeToTable(table, () => {
        console.log(`Changement détecté dans ${table}`);
        fetchAllData();
      })
    );

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, []);

  // Mode TV (Plein écran total)
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
              return <Secretariat liveInterventions={interventions} />;
            case 'hardware':
              return <HardwareStore initialData={stock} />;
            case 'settings':
              return (
                <Settings 
                  tickerMessages={tickerMessages} 
                  onUpdateMessages={async (newMessages) => {
                    // Les messages sont gérés via Supabase dans Settings.tsx
                  }} 
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
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      site={site}
      onSiteChange={(s) => setSite(s as Site)}
      period={period}
      onPeriodChange={(p) => setPeriod(p as Period)}
      customStartDate={customStartDate}
      onCustomStartDateChange={setCustomStartDate}
      customEndDate={customEndDate}
      onCustomEndDateChange={setCustomEndDate}
      tickerMessages={tickerMessages}
      isLive={isLive}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;