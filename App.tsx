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
import { TICKER_MESSAGES, MOCK_STOCK, MOCK_INTERVENTIONS, MOCK_TRANSACTIONS, MOCK_EMPLOYEES } from './constants';

// Firebase Imports (Mocked)
import { db, collection, query, orderBy, onSnapshot } from './lib/firebase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Filtres globaux
  const [site, setSite] = useState<Site>('Global');
  const [period, setPeriod] = useState<Period>('Semaine');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  // États de données Live
  // On initialise avec les données MOCK pour que l'app fonctionne même si le mock Firebase ne renvoie rien
  const [tickerMessages, setTickerMessages] = useState<string[]>(TICKER_MESSAGES);
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
  const [interventions, setInterventions] = useState<Intervention[]>(MOCK_INTERVENTIONS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    setIsLive(true); 

    // --- 1. Ticker Messages ---
    const qTicker = query(collection(db, 'ticker_messages'), orderBy('created_at', 'desc'));
    const unsubTicker = onSnapshot(qTicker, (snapshot: any) => {
      // Si snapshot.docs existe et n'est pas vide (dans un vrai cas), on met à jour
      if (snapshot && snapshot.docs && snapshot.docs.length > 0) {
        const msgs = snapshot.docs.map((doc: any) => doc.data().content);
        setTickerMessages(msgs);
      }
    }, (error: any) => console.error("Error fetching ticker:", error));

    // --- 2. Stock ---
    const qStock = query(collection(db, 'stock'), orderBy('name'));
    const unsubStock = onSnapshot(qStock, (snapshot: any) => {
      if (snapshot && snapshot.docs && snapshot.docs.length > 0) {
        const items = snapshot.docs.map((doc: any) => doc.data() as StockItem);
        setStock(items);
      }
    }, (error: any) => console.error("Error fetching stock:", error));

    // --- 3. Interventions ---
    const qInterventions = query(collection(db, 'interventions'), orderBy('date', 'desc'));
    const unsubInterventions = onSnapshot(qInterventions, (snapshot: any) => {
      if (snapshot && snapshot.docs && snapshot.docs.length > 0) {
        const items = snapshot.docs.map((doc: any) => doc.data() as Intervention);
        setInterventions(items);
      }
    }, (error: any) => console.error("Error fetching interventions:", error));

    // --- 4. Transactions ---
    const qTransactions = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot: any) => {
      if (snapshot && snapshot.docs && snapshot.docs.length > 0) {
        const items = snapshot.docs.map((doc: any) => doc.data() as Transaction);
        setTransactions(items);
      }
    }, (error: any) => console.error("Error fetching transactions:", error));

    // --- 5. Employees ---
    const qEmployees = query(collection(db, 'employees'), orderBy('name'));
    const unsubEmployees = onSnapshot(qEmployees, (snapshot: any) => {
      if (snapshot && snapshot.docs && snapshot.docs.length > 0) {
        const items = snapshot.docs.map((doc: any) => doc.data() as Employee);
        setEmployees(items);
      }
    }, (error: any) => console.error("Error fetching employees:", error));

    // Cleanup function
    return () => {
      unsubTicker();
      unsubStock();
      unsubInterventions();
      unsubTransactions();
      unsubEmployees();
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