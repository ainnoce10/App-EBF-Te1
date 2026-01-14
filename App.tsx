
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

interface TvSetting {
  key: string;
  value: string;
}

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

    // 2. Alertes Interventions "En attente" depuis trop longtemps
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
    const isAndroidTV = /android/.test(ua) && !/mobile/.test(ua); 

    // Si URL explicite (/tv ou ?mode=tv) OU détection Smart TV => Mode Showcase
    if (modeParam === 'tv' || pathName.startsWith('/tv') || isSmartTV || isAndroidTV) {
        setActiveTab('showcase');
    }

    // Chargement initial des données
    fetchData();

    // Configuration Realtime OPTIMISÉE (Mise à jour locale sans re-fetch complet)
    const channel = supabase.channel('global-app-updates')
        .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
            const { table, eventType, new: newRecord, old: oldRecord } = payload;
            console.log(`Realtime Update: ${table} [${eventType}]`);

            // Helper générique pour mettre à jour une liste
            const handleListUpdate = (
                setter: React.Dispatch<React.SetStateAction<any[]>>, 
                sortFunc?: (a: any, b: any) => number
            ) => {
                setter(prev => {
                    let next = [...prev];
                    if (eventType === 'INSERT') {
                        next = [newRecord, ...next];
                    } else if (eventType === 'UPDATE') {
                        next = next.map(item => item.id === newRecord.id ? newRecord : item);
                    } else if (eventType === 'DELETE') {
                        next = next.filter(item => item.id !== oldRecord.id);
                    }
                    if (sortFunc) next.sort(sortFunc);
                    return next;
                });
            };

            switch(table) {
                case 'ticker_messages':
                    fetchTickerMessages();
                    break;
                case 'stock':
                    handleListUpdate(setStock, (a, b) => a.name.localeCompare(b.name));
                    break;
                case 'interventions':
                    handleListUpdate(setInterventions, (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    break;
                case 'hardware_transactions':
                    handleListUpdate(setHardwareTransactions, (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    break;
                case 'secretariat_transactions':
                    handleListUpdate(setSecretariatTransactions, (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    break;
                case 'accounting_transactions':
                    handleListUpdate(setAccountingTransactions, (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    break;
                case 'employees':
                    handleListUpdate(setEmployees, (a, b) => a.name.localeCompare(b.name));
                    break;
                case 'achievements':
                    handleListUpdate(setAchievements, (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    break;
                case 'tv_settings':
                    if (newRecord && (newRecord as TvSetting).key === 'company_logo') setCustomLogo((newRecord as TvSetting).value);
                    if (newRecord && (newRecord as TvSetting).key === 'background_music') setBackgroundMusic((newRecord as TvSetting).value);
                    break;
            }
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  const fetchTickerMessages = async () => {
      const { data } = await supabase.from('ticker_messages').select('id, content, color').order('created_at', { ascending: false });
      if (data) setTickerMessages(data.map(t => ({ id: t.id, content: t.content, color: t.color || 'neutral' })));
  };

  const fetchData = async () => {
    try {
        const promises = [
            supabase.from('ticker_messages').select('id, content, color').order('created_at', { ascending: false }),
            supabase.from('stock').select('*').order('name'),
            supabase.from('interventions').select('*').order('date', { ascending: false }),
            supabase.from('hardware_transactions').select('*').order('date', { ascending: false }),
            supabase.from('secretariat_transactions').select('*').order('date', { ascending: false }),
            supabase.from('accounting_transactions').select('*').order('date', { ascending: false }),
            supabase.from('employees').select('*').order('name'),
            supabase.from('achievements').select('*').order('date', { ascending: false }),
            supabase.from('tv_settings').select('key, value').in('key', ['company_logo', 'background_music'])
        ];

        const [
            tickerRes, stockRes, intervRes, hardTrxRes, secTrxRes, accTrxRes, empRes, achRes, settingsRes
        ] = await Promise.all(promises);

        if (tickerRes.data) {
            setTickerMessages(tickerRes.data.map(t => ({ id: t.id, content: t.content, color: t.color || 'neutral' })));
        }

        if (stockRes.data) setStock(stockRes.data as StockItem[]);
        if (intervRes.data) setInterventions(intervRes.data as Intervention[]);
        if (hardTrxRes.data) setHardwareTransactions(hardTrxRes.data as Transaction[]);
        if (secTrxRes.data) setSecretariatTransactions(secTrxRes.data as Transaction[]);
        if (accTrxRes.data) setAccountingTransactions(accTrxRes.data as Transaction[]);
        if (empRes.data) setEmployees(empRes.data as Employee[]);
        if (achRes.data) setAchievements(achRes.data as Achievement[]);
        
        if (settingsRes.data) {
             const settings = settingsRes.data as TvSetting[];
             const logo = settings.find(s => s.key === 'company_logo');
             const music = settings.find(s => s.key === 'background_music');
             if (logo?.value) setCustomLogo(logo.value);
             if (music?.value) setBackgroundMusic(music.value);
        }

        setIsLive(true);
    } catch (error) {
        console.error("Erreur chargement Supabase:", error);
        setIsLive(false);
    }
  };

  const allTransactions = useMemo(() => {
      return [...hardwareTransactions, ...secretariatTransactions, ...accountingTransactions];
  }, [hardwareTransactions, secretariatTransactions, accountingTransactions]);

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
