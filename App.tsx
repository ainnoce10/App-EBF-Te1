import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Technicians from './components/Technicians';
import Accounting from './components/Accounting';
import Secretariat from './components/Secretariat';
import HardwareStore from './components/HardwareStore';
import Settings from './components/Settings';
import ShowcaseMode from './components/ShowcaseMode';
import { Site, Period } from './types';
import { TICKER_MESSAGES } from './constants';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // États de filtrage globaux
  const [site, setSite] = useState<Site>('Global');
  const [period, setPeriod] = useState<Period>('Semaine');
  
  // États pour la plage de dates personnalisée
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

  // État pour les messages du ticker (Flash Info)
  const [tickerMessages, setTickerMessages] = useState<string[]>(TICKER_MESSAGES);

  // Si on est en mode Diffusion TV, on affiche UNIQUEMENT le mode TV (Plein écran total)
  if (activeTab === 'showcase') {
    return <ShowcaseMode onClose={() => setActiveTab('hardware')} />;
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
                />
              );
            case 'technicians':
              return <Technicians />;
            case 'accounting':
              return <Accounting />;
            case 'secretariat':
              return <Secretariat />;
            case 'hardware':
              return <HardwareStore />;
            case 'settings':
              return (
                <Settings 
                  tickerMessages={tickerMessages} 
                  onUpdateMessages={setTickerMessages} 
                />
              );
            default:
              return (
                <Dashboard 
                  site={site} 
                  period={period}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                />
              );
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
    >
      {renderContent()}
    </Layout>
  );
};

export default App;