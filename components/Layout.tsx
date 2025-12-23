import React, { useState } from 'react';
import { NAV_ITEMS, Logo } from '../constants';
import ScrollingTicker from './ScrollingTicker';
import { Menu, X, LogOut, Bell, User, Wifi, WifiOff } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (id: string) => void;
  site: string;
  onSiteChange: (site: string) => void;
  period: string;
  onPeriodChange: (period: string) => void;
  customStartDate: string;
  onCustomStartDateChange: (date: string) => void;
  customEndDate: string;
  onCustomEndDateChange: (date: string) => void;
  tickerMessages: string[];
  isLive?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  site, 
  onSiteChange, 
  period, 
  onPeriodChange,
  customStartDate,
  onCustomStartDateChange,
  customEndDate,
  onCustomEndDateChange,
  tickerMessages,
  isLive = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6 flex justify-center border-b border-gray-100">
          <Logo />
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                ${activeTab === item.id 
                  ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 text-green-700">
            <User size={20} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">Admin EBF</p>
              <p className="text-xs truncate opacity-75">Directeur</p>
            </div>
          </div>
          <button className="w-full mt-2 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-red-500 py-2 transition-colors">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <ScrollingTicker messages={tickerMessages} />

        <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <button 
                  className="md:hidden text-gray-500"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X /> : <Menu />}
                </button>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
                    {NAV_ITEMS.find(n => n.id === activeTab)?.label}
                  </h1>
                  {isLive ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-tighter animate-fade-in">
                      <Wifi size={10} /> Live
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-tighter">
                      <WifiOff size={10} /> Syncing
                    </div>
                  )}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                <div className="relative">
                   <select 
                    value={site} 
                    onChange={(e) => onSiteChange(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-2.5 pl-3 pr-8 shadow-sm font-medium outline-none"
                   >
                    <option value="Global">🌍 Global (Tous)</option>
                    <option value="Abidjan">📍 Abidjan</option>
                    <option value="Bouaké">📍 Bouaké</option>
                   </select>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-1">
                   <select 
                    value={period} 
                    onChange={(e) => onPeriodChange(e.target.value)}
                    className="bg-transparent border-none text-gray-700 text-sm focus:ring-0 block p-1.5 font-medium outline-none"
                   >
                    <option value="Jour">📅 Jour</option>
                    <option value="Semaine">📅 Semaine</option>
                    <option value="Mois">📅 Mois</option>
                    <option value="Année">📅 Année</option>
                    <option value="Personnalisé">⚙️ Personnalisé</option>
                   </select>
                </div>

                {period === 'Personnalisé' && (
                  <div className="flex items-center gap-2 animate-fade-in bg-white border border-orange-200 p-1 rounded-lg shadow-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">Du</span>
                      <input 
                        type="date" 
                        value={customStartDate}
                        onChange={(e) => onCustomStartDateChange(e.target.value)}
                        className="text-xs border border-gray-200 rounded p-1 text-gray-600 focus:border-orange-500 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">Au</span>
                      <input 
                        type="date" 
                        value={customEndDate}
                        onChange={(e) => onCustomEndDateChange(e.target.value)}
                        className="text-xs border border-gray-200 rounded p-1 text-gray-600 focus:border-orange-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="w-px h-6 bg-gray-200 mx-1"></div>

                <button className="relative p-2 text-gray-400 hover:text-orange-500 transition-colors bg-gray-50 rounded-full hover:bg-orange-50">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>
            </div>
        </header>

        {mobileMenuOpen && (
           <div className="md:hidden absolute top-[130px] left-0 w-full bg-white border-b border-gray-200 z-50 shadow-lg">
              <nav className="p-4 space-y-2">
                {NAV_ITEMS.map((item) => (
                    <button
                    key={item.id}
                    onClick={() => {
                        onTabChange(item.id);
                        setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg
                        ${activeTab === item.id 
                        ? 'bg-orange-50 text-orange-600' 
                        : 'text-gray-600'}`}
                    >
                    {item.icon}
                    {item.label}
                    </button>
                ))}
              </nav>
           </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                 {children}
            </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;