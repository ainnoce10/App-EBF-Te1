import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Technicians from './components/Technicians';
import Accounting from './components/Accounting';
import Secretariat from './components/Secretariat';
import HardwareStore from './components/HardwareStore';
import Achievements from './components/Achievements';
import Settings from './components/Settings';
import ShowcaseMode from './components/ShowcaseMode';
import { Site, Period, StockItem, Intervention, Transaction, Employee, TickerMessage, Achievement, AppNotification } from './types';
import { TICKER_MESSAGES } from './constants';

// Supabase Imports
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Filtres globaux
  const [site, setSite] = useState<Site>('Global');
  const [period, setPeriod] = useState<Period>('Semaine');
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  // États de données
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>(TICKER_MESSAGES);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  
  // Transactions séparées
  const [hardwareTransactions, setHardwareTransactions] = useState<Transaction[]>([]);
  const [secretariatTransactions, setSecretariatTransactions] = useState<Transaction[]>([]);
  const [accountingTransactions, setAccountingTransactions] = useState<Transaction[]>([]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  
  // Custom Branding & Media
  const [customLogo, setCustomLogo] = useState<string>('');
  const [backgroundMusic, setBackgroundMusic] = useState<string>('');
  
  // Indicateur de connexion
  const [isLive, setIsLive] = useState(false);

  // --- LOGIQUE DE NOTIFICATIONS TEMPS RÉEL ---
  const notifications = useMemo<AppNotification[]>(() => {
    const alerts: AppNotification[] = [];

    // 1. Alertes Stock Faible
    stock.forEach(item => {
        if (item.quantity <= item.threshold) {
            alerts.push({
                id: `stock-${item.id}`,
                type: 'stock',
                title: 'Stock Critique',
                message: `${item.name} (${item.quantity} restants, seuil: ${item.threshold})`,
                severity: 'high',
                timestamp: new Date().toISOString()
            });
        }
    });

    // 2. Alertes Interventions "En attente" depuis trop longtemps (simulé par statut simple)
    interventions.forEach(inter => {
        if (inter.status === 'En attente') {
            alerts.push({
                id: `inter-${inter.id}`,
                type: 'intervention',
                title: 'Mission en Attente',
                message: `${inter.client} - ${inter.interventionType} (${inter.site})`,
                severity: 'medium',
                timestamp: inter.date
            });
        }
    });

    // 3. Messages Urgents (Rouge)
    tickerMessages.forEach(msg => {
        if (msg.color === 'red') {
             alerts.push({
                id: `msg-${msg.id}`,
                type: 'message',
                title: 'Message Urgent',
                message: msg.content,
                severity: 'high',
                timestamp: new Date().toISOString()
            });
        }
    });

    return alerts;
  }, [stock, interventions, tickerMessages]);

  // --- DÉTECTION MODE TV AUTOMATIQUE & INITIALISATION ---
  useEffect(() => {
    // 1. Détection via URL (Paramètre 'mode' OU chemin '/tv')
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const pathName = window.location.pathname;

    // 2. Détection via User Agent (Pour Smart TV & Android TV)
    const ua = navigator.userAgent.toLowerCase();
    const isSmartTV = /smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast|webos|tizen/.test(ua);
    const isAndroidTV = /android/.test(ua) && !/mobile/.test(ua); // Android sans "Mobile" est souvent une TV/Tablette

    // Si URL explicite (/tv ou ?mode=tv) OU détection Smart TV => Mode Showcase
    if (modeParam === 'tv' || pathName.startsWith('/tv') || isSmartTV || isAndroidTV) {
        setActiveTab('showcase');
    }

    // Chargement initial des données
    fetchData();

    // Configuration Realtime (Écoute globale des changements sur toutes les tables)
    const channel = supabase.channel('global-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            console.log('Change received!', payload);
            const table = payload.table;

            if (table === 'ticker_messages') {
                 supabase.from('ticker_messages').select('id, content, color').order('created_at', { ascending: false })
                 .then(({ data }) => data && setTickerMessages(data.map(t => ({ id: t.id, content: t.content, color: t.color || 'neutral' }))));
            } else if (table === 'stock') {
                 supabase.from('stock').select('*').order('name')
                 .then(({ data }) => data && setStock(data as StockItem[]));
            } else if (table === 'interventions') {
                 supabase.from('interventions').select('*').order('date', { ascending: false })
                 .then(({ data }) => data && setInterventions(data as Intervention[]));
            } else if (table === 'hardware_transactions') {
                 supabase.from('hardware_transactions').select('*').order('date', { ascending: false })
                 .then(({ data }) => data && setHardwareTransactions(data as Transaction[]));
            } else if (table === 'secretariat_transactions') {
                 supabase.from('secretariat_transactions').select('*').order('date', { ascending: false })
                 .then(({ data }) => data && setSecretariatTransactions(data as Transaction[]));
            } else if (table === 'accounting_transactions') {
                 supabase.from('accounting_transactions').select('*').order('date', { ascending: false })
                 .then(({ data }) => data && setAccountingTransactions(data as Transaction[]));
            } else if (table === 'employees') {
                 supabase.from('employees').select('*').order('name')
                 .then(({ data }) => data && setEmployees(data as Employee[]));
            } else if (table === 'achievements') {
                 supabase.from('achievements').select('*').order('date', { ascending: false })
                 .then(({ data }) => data && setAchievements(data as Achievement[]));
            } else if (table === 'tv_settings') {
                 const newKey = (payload.new as any)?.key;
                 const newValue = (payload.new as any)?.value;
                 if (newKey === 'company_logo') setCustomLogo(newValue);
                 if (newKey === 'background_music') setBackgroundMusic(newValue);
            }
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  // Fonction générique pour charger les données
  const fetchData = async () => {
    try {
        // 1. Messages
        const { data: tickerData } = await supabase
            .from('ticker_messages')
            .select('id, content, color')
            .order('created_at', { ascending: false });
            
        if (tickerData) {
            const formattedMessages: TickerMessage[] = tickerData.map(t => ({
                id: t.id,
                content: t.content,
                color: t.color || 'neutral'
            }));
            setTickerMessages(formattedMessages);
        }

        // 2. Stock
        const { data: stockData } = await supabase.from('stock').select('*').order('name');
        if (stockData) setStock(stockData as StockItem[]);

        // 3. Interventions
        const { data: intervData } = await supabase.from('interventions').select('*').order('date', { ascending: false });
        if (intervData) setInterventions(intervData as Intervention[]);

        // 4. Transactions (CHARGEMENT SÉPARÉ)
        const { data: hardTrx } = await supabase.from('hardware_transactions').select('*').order('date', { ascending: false });
        if (hardTrx) setHardwareTransactions(hardTrx as Transaction[]);

        const { data: secTrx } = await supabase.from('secretariat_transactions').select('*').order('date', { ascending: false });
        if (secTrx) setSecretariatTransactions(secTrx as Transaction[]);

        const { data: accTrx } = await supabase.from('accounting_transactions').select('*').order('date', { ascending: false });
        if (accTrx) setAccountingTransactions(accTrx as Transaction[]);

        // 5. Employés
        const { data: empData } = await supabase.from('employees').select('*').order('name');
        if (empData) setEmployees(empData as Employee[]);

        // 6. Réalisations
        const { data: achData } = await supabase.from('achievements').select('*').order('date', { ascending: false });
        if (achData) setAchievements(achData as Achievement[]);
        
        // 7. Settings
        const { data: settingsData } = await supabase.from('tv_settings').select('key, value').in('key', ['company_logo', 'background_music']);
        if (settingsData) {
             const logo = settingsData.find(s => s.key === 'company_logo');
             const music = settingsData.find(s => s.key === 'background_music');
             if (logo?.value) setCustomLogo(logo.value);
             if (music?.value) setBackgroundMusic(music.value);
        }

        setIsLive(true);
    } catch (error) {
        console.error("Erreur chargement Supabase:", error);
        setIsLive(false);
    }
  };

  // Pour le Dashboard, on combine tout, mais en gardant la trace de l'origine si besoin via la catégorie ou un champ custom si on voulait
  const allTransactions = [...hardwareTransactions, ...secretariatTransactions, ...accountingTransactions];

  if (activeTab === 'showcase') {
    return (
      <ShowcaseMode 
        onClose={() => setActiveTab('hardware')} 
        liveStock={stock}
        liveInterventions={interventions}
        liveMessages={tickerMessages}
        liveAchievements={achievements}
        liveEmployees={employees}
        customLogo={customLogo}
        initialMusicUrl={backgroundMusic}
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
                  liveTransactions={allTransactions}
                  liveInterventions={interventions}
                />
              );
            case 'technicians':
              return <Technicians initialData={interventions} />;
            case 'accounting':
              return (
                <Accounting 
                  liveTransactions={accountingTransactions} 
                  liveEmployees={employees} 
                />
              );
            case 'secretariat':
              return <Secretariat liveInterventions={interventions} liveTransactions={secretariatTransactions} />;
            case 'hardware':
              return <HardwareStore initialData={stock} liveTransactions={hardwareTransactions} />;
            case 'achievements':
              return <Achievements initialData={achievements} />;
            case 'settings':
              return (
                <Settings 
                  tickerMessages={tickerMessages} 
                  onUpdateMessages={(msgs) => setTickerMessages(msgs)}
                  onNavigate={setActiveTab}
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
        notifications={notifications}
        isLive={isLive}
        customLogo={customLogo}
        musicUrl={backgroundMusic}
      >
        {renderContent()}
      </Layout>
    </div>
  );
};

export default App;