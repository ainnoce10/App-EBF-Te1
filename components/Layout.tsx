
import React, { useState } from 'react';
import { NAV_ITEMS, Logo } from '../constants';
import ScrollingTicker from './ScrollingTicker';
import { Menu, X, LogOut, Bell, User, Wifi, WifiOff, ChevronRight } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (id: string) => void;
  site: string;
  onSiteChange: (site: string) => void;
  period: string;
  onPeriodChange: (period: string) => void;
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
  tickerMessages,
  isLive = false
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 shadow-sm z-20">
        <div className="p-8 flex justify-center border-b border-gray-100">
          <Logo />
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 text-sm font-bold rounded-2xl transition-all duration-200 group relative overflow-hidden
                ${activeTab === item.id 
                  ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <div className={`transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                 {item.icon}
              </div>
              {item.label}
              {activeTab === item.id && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 rounded-l-full"></div>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm">
            <div className="bg-green-100 p-2 rounded-full text-green-700">
                <User size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-gray-800 truncate">Admin EBF</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">Directeur</p>
            </div>
          </div>
          <button className="w-full mt-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 py-2 transition-colors">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Mobile Header Sticky */}
        <div className="sticky top-0 z-30 w-full shadow-sm">
             <ScrollingTicker messages={tickerMessages} />
             
             <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 md:px-8 md:py-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button 
                      className="md:hidden p-2 -ml-2 text-gray-600 active:scale-95 transition-transform"
                      onClick={() => setMobileMenuOpen(true)}
                    >
                      <Menu size={28} />
                    </button>
                    
                    <div className="flex flex-col">
                        <h1 className="text-lg md:text-2xl font-black text-gray-800 tracking-tight leading-none">
                            {NAV_ITEMS.find(n => n.id === activeTab)?.label}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            {isLive ? (
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                <Wifi size={10} strokeWidth={3} /> En Ligne
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                <WifiOff size={10} strokeWidth={3} /> Hors Ligne
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Filters & Actions (Compact on Mobile) */}
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="hidden md:block relative">
                        <select 
                            value={site} 
                            onChange={(e) => onSiteChange(e.target.value)}
                            className="bg-gray-50 border-none text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-orange-500 block py-2.5 pl-4 pr-10 font-bold outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <option value="Global">🌍 Global</option>
                            <option value="Abidjan">📍 Abidjan</option>
                            <option value="Bouaké">📍 Bouaké</option>
                        </select>
                    </div>

                    <button className="relative p-2.5 text-gray-400 hover:text-orange-500 transition-colors bg-gray-50 rounded-xl hover:bg-orange-50 border border-transparent hover:border-orange-200 active:scale-95">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>

                    <div className="md:hidden">
                         <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                             <div className="w-full h-full flex items-center justify-center bg-orange-500 text-white font-bold text-xs">A</div>
                         </div>
                    </div>
                </div>
            </header>
            
            {/* Mobile Filters Bar (Sub-header) */}
            <div className="md:hidden bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
                <select 
                    value={site} 
                    onChange={(e) => onSiteChange(e.target.value)}
                    className="bg-gray-50 border border-gray-100 text-gray-600 text-xs rounded-lg py-1.5 px-3 font-bold outline-none"
                >
                    <option value="Global">🌍 Global</option>
                    <option value="Abidjan">📍 Abidjan</option>
                    <option value="Bouaké">📍 Bouaké</option>
                </select>
                <select 
                    value={period} 
                    onChange={(e) => onPeriodChange(e.target.value)}
                    className="bg-gray-50 border border-gray-100 text-gray-600 text-xs rounded-lg py-1.5 px-3 font-bold outline-none"
                >
                    <option value="Semaine">📅 Semaine</option>
                    <option value="Mois">📅 Mois</option>
                    <option value="Année">📅 Année</option>
                </select>
            </div>
        </div>

        {/* Mobile Menu Overlay (Drawer) */}
        {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden">
                <div 
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                  onClick={() => setMobileMenuOpen(false)}
                />
                <div className="absolute top-0 bottom-0 left-0 w-[80%] max-w-sm bg-white shadow-2xl flex flex-col animate-slide-right">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50/50">
                        <Logo />
                        <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white rounded-full shadow-sm text-gray-500 active:scale-90 transition-transform">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        <p className="px-4 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Menu Principal</p>
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id);
                                    setMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border-2
                                    ${activeTab === item.id 
                                    ? 'bg-orange-50 border-orange-100 text-orange-600 shadow-sm' 
                                    : 'bg-white border-transparent text-gray-600 hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center gap-4">
                                    {item.icon}
                                    <span className="font-bold">{item.label}</span>
                                </div>
                                {activeTab === item.id && <ChevronRight size={16} />}
                            </button>
                        ))}
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-orange-500 font-black shadow-sm">
                                AE
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Admin EBF</p>
                                <p className="text-xs text-gray-500">admin@ebf.ci</p>
                            </div>
                        </div>
                        <button className="w-full bg-white border border-gray-200 text-gray-600 font-bold py-3 rounded-xl shadow-sm flex items-center justify-center gap-2 active:bg-gray-100">
                             <LogOut size={16} /> Déconnexion
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50/50">
            <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
                 {children}
            </div>
        </div>
      </main>

      <style>{`
        .animate-slide-right {
          animation: slideRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes slideRight {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default Layout;
