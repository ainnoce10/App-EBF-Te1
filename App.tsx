
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

// Firebase Imports
import { db, collection, query, orderBy, onSnapshot } from './lib/firebase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Filtres globaux
  const [site, setSite] = useState<Site>('Global');
  const [period, setPeriod] = useState<Period>('Semaine');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  // États de données (Initialisés vides pour le temps réel, ou avec des placeholders visuels en attendant le chargement)
  const [tickerMessages, setTickerMessages] = useState<string[]>(TICKER_MESSAGES);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Indicateur de connexion
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    // Connexion Temps Réel (Real-time Listeners)
    // Ces fonctions (onSnapshot) ouvrent un WebSocket avec Firebase.
    // Dès qu'une donnée change sur le serveur, les variables d'état (setStock, etc.) sont mises à jour instantanément.

    try {
        // 1. Écoute des Messages Défilants
        const qTicker = query(collection(db, 'ticker_messages'), orderBy('created_at', 'desc'));
        const unsubTicker = onSnapshot(qTicker, (snapshot) => {
          setIsLive(true); // Si on reçoit une réponse, la connexion est active
          if (snapshot && !snapshot.empty) {
            const msgs = snapshot.docs.map((doc) => doc.data().content);
            setTickerMessages(msgs);
          }
        }, (error) => {
            console.error("Erreur connexion Firebase (Ticker):", error);
            setIsLive(false);
        });

        // 2. Écoute du Stock
        const qStock = query(collection(db, 'stock'), orderBy('name'));
        const unsubStock = onSnapshot(qStock, (snapshot) => {
          const items = snapshot.docs.map((doc) => doc.data() as StockItem);
          setStock(items);
        }, (error) => console.error("Erreur connexion Firebase (Stock):", error));

        // 3. Écoute des Interventions
        const qInterventions = query(collection(db, 'interventions'), orderBy('date', 'desc'));
        const unsubInterventions = onSnapshot(qInterventions, (snapshot) => {
          const items = snapshot.docs.map((doc) => doc.data() as Intervention);
          setInterventions(items);
        }, (error) => console.error("Erreur connexion Firebase (Interventions):", error));

        // 4. Écoute des Transactions
        const qTransactions = query(collection(db, 'transactions'), orderBy('date', 'desc'));
        const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
          const items = snapshot.docs.map((doc) => doc.data() as Transaction);
          setTransactions(items);
        }, (error) => console.error("Erreur connexion Firebase (Transactions):", error));

        // 5. Écoute des Employés
        const qEmployees = query(collection(db, 'employees'), orderBy('name'));
        const unsubEmployees = onSnapshot(qEmployees, (snapshot) => {
          const items = snapshot.docs.map((doc) => doc.data() as Employee);
          setEmployees(items);
        }, (error) => console.error("Erreur connexion Firebase (Employés):", error));

        // Nettoyage des écouteurs lors de la fermeture du composant
        return () => {
          unsubTicker();
          unsubStock();
          unsubInterventions();
          unsubTransactions();
          unsubEmployees();
        };
    } catch (e) {
        console.error("Erreur critique d'initialisation Firebase:", e);
    }
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
              // Utilisation directe des données live
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
    <div className="h-screen flex flex-col">
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
    </div>
  );
};

export default App;
