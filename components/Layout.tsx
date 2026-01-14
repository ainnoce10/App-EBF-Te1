import React, { useState, useEffect, useRef } from 'react';
import { NAV_ITEMS, Logo } from '../constants';
import ScrollingTicker from './ScrollingTicker';
import { TickerMessage, AppNotification } from '../types';
import { Menu, X, LogOut, Bell, LogIn } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (id: string) => void;
  site: string;
  onSiteChange: (site: string) => void;
  period: string;
  onPeriodChange: (period: string) => void;
  customStartDate?: string;
  onCustomStartDateChange?: (date: string) => void;
  customEndDate?: string;
  onCustomEndDateChange?: (date: string) => void;
  tickerMessages: TickerMessage[];
  notifications?: AppNotification[];
  isLive?: boolean;
  customLogo?: string;
  musicUrl?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange, 
  site, 
  onSiteChange, 
  period, 
  onPeriodChange,
  tickerMessages,
  notifications = [],
  isLive = false,
  customLogo,
  musicUrl
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (audioRef.current && musicUrl) {
      if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
      else audioRef.current.pause();
    }
  }, [isPlaying, musicUrl]);

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden font-sans">
      {/* Audio Background (Hidden) */}
      <audio ref={audioRef} src={musicUrl} loop className="hidden" />

      {/* Sidebar Desktop (Hidden on mobile) */}
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-100 z-20">
        <div className="p-8 flex justify-center border-b border-gray-50">
          <Logo url={customLogo} size="lg" />
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 text-sm font-bold rounded-2xl transition-all
                ${activeTab === item.id ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <ScrollingTicker messages={tickerMessages} />
        
        {/* Header - Compact & Mobile First */}
        <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30 h-16">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2.5 -ml-2 text-gray-800 active:scale-90 transition-transform bg-gray-50 rounded-xl"
            >
              <Menu size={22} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-sm font-black text-gray-900 leading-none uppercase tracking-tighter">
                {NAV_ITEMS.find(n => n.id === activeTab)?.label}
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-[8px] font-black uppercase text-gray-400 tracking-[0.1em]">
                  {isLive ? 'Serveur Direct' : 'Mode Hors-ligne'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 bg-gray-50 rounded-xl text-gray-500 relative active:scale-90 transition-transform"
            >
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
              )}
            </button>
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md shadow-orange-200">
              {site.substring(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Mobile Sub-Header / Filters - Horizontal Scroll */}
        <div className="bg-white border-b border-gray-50 px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide shrink-0 shadow-sm z-20">
          <div className="flex gap-2">
            <select 
                value={site} 
                onChange={(e) => onSiteChange(e.target.value as any)}
                className="bg-gray-100 text-[10px] font-black uppercase px-4 py-2 rounded-xl border-none outline-none appearance-none min-w-[100px] text-center"
            >
                <option value="Global">🌍 Global</option>
                <option value="Abidjan">📍 Abidjan</option>
                <option value="Bouaké">📍 Bouaké</option>
            </select>
            <select 
                value={period} 
                onChange={(e) => onPeriodChange(e.target.value as any)}
                className="bg-orange-50 text-orange-600 text-[10px] font-black uppercase px-4 py-2 rounded-xl border-none outline-none appearance-none min-w-[100px] text-center"
            >
                <option value="Jour">Jour</option>
                <option value="Semaine">Semaine</option>
                <option value="Mois">Mois</option>
            </select>
          </div>
        </div>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#f8f9fa] custom-scrollbar">
          {children}
        </div>

        {/* Mobile Menu Drawer (App Style) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute top-0 bottom-0 left-0 w-[85%] max-w-sm bg-white flex flex-col animate-slide-right shadow-2xl rounded-r-[2.5rem]">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <Logo url={customLogo} size="md" />
                <button onClick={() => setMobileMenuOpen(false)} className="p-3 bg-white rounded-full text-gray-400 shadow-sm">
                  <X size={22} />
                </button>
              </div>
              <div className="flex-1 p-6 space-y-3 overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { onTabChange(item.id); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-5 p-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95
                      ${activeTab === item.id ? 'bg-orange-500 text-white shadow-xl shadow-orange-200' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    <span className={activeTab === item.id ? 'text-white' : 'text-gray-400'}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="p-8 border-t border-gray-50 bg-gray-50/50">
                <button className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 font-black text-[10px] text-red-500 uppercase tracking-[0.2em] active:bg-red-50">
                  <LogOut size={18} /> Déconnexion
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-right { animation: slideRight 0.3s cubic-bezier(0, 0, 0.2, 1) forwards; }
      `}</style>
    </div>
  );
};

export default Layout;