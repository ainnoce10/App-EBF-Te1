
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

// Firebase Imports
import { db, collection, query, orderBy, onSnapshot } from './lib/firebase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Filtres globaux
  const [site, setSite] = useState<Site>('Global');
  const [period, setPeriod] = useState<Period>('Semaine');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  // États de données Live
  // On initialise avec les données MOCK pour avoir un affichage initial, 
  // puis Firebase prendra le relais dès que la connexion est établie.
  const [tickerMessages, setTickerMessages] = useState<string[]>(TICKER_MESSAGES);
  const [stock, setStock] = useState<StockItem[]>(MOCK_STOCK);
  const [interventions, setInterventions] = useState<Intervention[]>(MOCK_INTERVENTIONS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  
  // Indicateur de connexion réelle
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // --- 1. Ticker Messages ---
    // On wrap dans un try/catch global au cas où la config Firebase est vide
    try {
        const qTicker = query(collection(db, 'ticker_messages'), orderBy('created_at', 'desc'));
        const unsubTicker = onSnapshot(qTicker, (snapshot) => {
          setIsLive(true); // Si on reçoit des données, c'est qu'on est connecté
          if (snapshot && !snapshot.empty) {
            const msgs = snapshot.docs.map((doc) => doc.data().content);
            setTickerMessages(msgs);
          }
        }, (error) => {
            console.warn("Firebase non connecté ou vide (Ticker)", error);
            setIsLive(false);
        });

        // --- 2. Stock ---
        const qStock = query(collection(db, 'stock'), orderBy('name'));
        const unsubStock = onSnapshot(qStock, (snapshot) => {
          if (snapshot && !snapshot.empty) {
            const items = snapshot.docs.map((doc) => doc.data() as StockItem);
            setStock(items);
          }
        }, (error) => console.warn("Firebase Stock error", error));

        // --- 3. Interventions ---
        const qInterventions = query(collection(db, 'interventions'), orderBy('date', 'desc'));
        const unsubInterventions = onSnapshot(qInterventions, (snapshot) => {
          if (snapshot && !snapshot.empty) {
            const items = snapshot.docs.map((doc) => doc.data() as Intervention);
            setInterventions(items);
          }
        }, (error) => console.warn("Firebase Interventions error", error));

        // --- 4. Transactions ---
        const qTransactions = query(collection(db, 'transactions'), orderBy('date', 'desc'));
        const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
          if (snapshot && !snapshot.empty) {
            const items = snapshot.docs.map((doc) => doc.data() as Transaction);
            setTransactions(items);
          }
        }, (error) => console.warn("Firebase Transactions error", error));

        // --- 5. Employees ---
        const qEmployees = query(collection(db, 'employees'), orderBy('name'));
        const unsubEmployees = onSnapshot(qEmployees, (snapshot) => {
          if (snapshot && !snapshot.empty) {
            const items = snapshot.docs.map((doc) => doc.data() as Employee);
            setEmployees(items);
          }
        }, (error) => console.warn("Firebase Employees error", error));

        // Cleanup function
        return () => {
          unsubTicker();
          unsubStock();
          unsubInterventions();
          unsubTransactions();
          unsubEmployees();
        };
    } catch (e) {
        console.error("Erreur d'initialisation Firebase. Avez-vous rempli lib/firebase.ts ?", e);
    }
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
