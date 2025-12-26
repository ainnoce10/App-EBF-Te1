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

  useEffect(() => {
    // Connexion temps réel aux collections Supabase
    setIsLive(true); 

    // Data fetchers
    const fetchTicker = async () => {
      const { data } = await supabase.from('ticker_messages').select('content').order('created_at', { ascending: false });
      if (data && data.length > 0) setTickerMessages(data.map((d: any) => d.content));
    };

    const fetchStock = async () => {
       const { data } = await supabase.from('stock').select('*').order('name');
       if (data) setStock(data as StockItem[]);
    };

    const fetchInterventions = async () => {
       const { data } = await supabase.from('interventions').select('*').order('date', { ascending: false });
       if (data) setInterventions(data as Intervention[]);
    };

    const fetchTransactions = async () => {
       const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
       if (data) setTransactions(data as Transaction[]);
    };

    const fetchEmployees = async () => {
       const { data } = await supabase.from('employees').select('*').order('name');
       if (data) setEmployees(data as Employee[]);
    };

    // Initial fetch
    fetchTicker();
    fetchStock();
    fetchInterventions();
    fetchTransactions();
    fetchEmployees();

    // Subscriptions
    const subTicker = subscribeToTable('ticker_messages', fetchTicker);
    const subStock = subscribeToTable('stock', fetchStock);
    const subInter = subscribeToTable('interventions', fetchInterventions);
    const subTrans = subscribeToTable('transactions', fetchTransactions);
    const subEmp = subscribeToTable('employees', fetchEmployees);

    // Cleanup function
    return () => {
      subTicker.unsubscribe();
      subStock.unsubscribe();
      subInter.unsubscribe();
      subTrans.unsubscribe();
      subEmp.unsubscribe();
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
              return <Secretariat liveInterventions={interventions} liveTransactions={transactions} />;
            case 'hardware':
              return <HardwareStore initialData={stock} />;
            case 'settings':
              return (
                <Settings 
                  tickerMessages={tickerMessages} 
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