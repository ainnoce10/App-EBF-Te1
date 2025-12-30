
import React, { useState, useEffect } from 'react';
import { StockItem, Intervention } from '../types';
import { 
  X, 
  Zap, 
  ShieldCheck,
  Calendar,
  Megaphone,
  LayoutGrid,
  ClipboardList
} from 'lucide-react';

interface ShowcaseModeProps {
  onClose?: () => void;
  liveStock?: StockItem[];
  liveInterventions?: Intervention[];
  liveMessages?: string[];
}

const ShowcaseMode: React.FC<ShowcaseModeProps> = ({ 
  onClose, 
  liveStock = [], 
  liveInterventions = [], 
  liveMessages = [] 
}) => {
  const [activeMode, setActiveMode] = useState<'PUBLICITE' | 'PLANNING'>('PUBLICITE');
  const [productIdx, setProductIdx] = useState(0);
  
  const products = liveStock.length > 0 ? liveStock : [];
  const planning = liveInterventions.length > 0 ? liveInterventions : [];
  const flashes = liveMessages.length > 0 ? liveMessages : ["Bienvenue chez EBF Technical Center"];

  // Date du jour dynamique pour le titre
  const todayDate = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  useEffect(() => {
    if (activeMode !== 'PUBLICITE' || products.length === 0) return;
    const interval = setInterval(() => {
      setProductIdx((prev) => (prev + 1) % products.length);
    }, 10000); // 10 secondes par produit
    return () => clearInterval(interval);
  }, [activeMode, products.length]);

  const currentProduct = products[productIdx];

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col overflow-hidden font-sans select-none text-white">
      
      {/* HEADER TV - RESPONSIVE */}
      <div className="bg-gray-950 px-4 py-4 md:px-10 md:h-28 flex flex-col md:flex-row items-center justify-between border-b-4 md:border-b-[8px] border-orange-600 shadow-2xl z-50 gap-4 md:gap-0 shrink-0">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12 w-full md:w-auto">
              <div className="bg-orange-600 px-4 py-2 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-[0_0_30px_rgba(234,88,12,0.4)] md:-rotate-1">
                 <span className="font-black text-xl md:text-4xl tracking-tighter shadow-sm">
                    <span className="text-green-300">E</span>
                    <span className="text-red-800">B</span>
                    <span className="text-green-300">F</span>
                    <span className="text-white ml-3">TV</span>
                 </span>
              </div>
              
              <div className="flex gap-2 md:gap-4 bg-white/5 p-1.5 md:p-2 rounded-2xl md:rounded-3xl border border-white/10 w-full md:w-auto justify-center">
                  <button 
                    onClick={() => setActiveMode('PUBLICITE')}
                    className={`flex items-center justify-center gap-2 md:gap-4 px-4 py-2 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-xl uppercase transition-all flex-1 md:flex-none ${activeMode === 'PUBLICITE' ? 'bg-orange-600 text-white shadow-xl scale-105' : 'text-white/20 hover:text-white/50'}`}
                  >
                    <LayoutGrid size={16} className="md:w-6 md:h-6" />
                    <span className="hidden md:inline">Nos</span> Produits
                  </button>
                  <button 
                    onClick={() => setActiveMode('PLANNING')}
                    className={`flex items-center justify-center gap-2 md:gap-4 px-4 py-2 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-xl uppercase transition-all flex-1 md:flex-none ${activeMode === 'PLANNING' ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-white/20 hover:text-white/50'}`}
                  >
                    <ClipboardList size={16} className="md:w-6 md:h-6" />
                    Chantiers
                  </button>
              </div>
          </div>

          <div className="flex items-center gap-4 md:gap-8 absolute top-4 right-4 md:static">
              <div className="hidden md:flex bg-green-600/10 px-4 py-2 rounded-full border border-green-500/30 items-center gap-3">
                 <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                 <span className="text-green-500 font-black text-lg uppercase tracking-widest">En Direct</span>
              </div>
              {onClose && (
                <button onClick={onClose} className="p-2 md:p-4 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white rounded-full transition-all border border-red-500/20">
                  <X size={20} className="md:w-8 md:h-8" />
                </button>
              )}
          </div>
      </div>

      {/* CONTENU PRINCIPAL - RESPONSIVE */}
      <div className="flex-1 flex overflow-hidden relative bg-gray-900">
          {activeMode === 'PUBLICITE' && currentProduct ? (
            <div className="flex flex-col lg:flex-row w-full animate-fade-in h-full">
                {/* ZONE IMAGE - Haut sur mobile, Gauche sur desktop */}
                <div className="w-full lg:w-[40%] h-[40%] lg:h-full relative flex items-center justify-center p-6 md:p-12 bg-gray-950 overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 to-transparent opacity-50"></div>
                    
                    {/* Container avec key pour relancer l'animation d'entrée à chaque changement de produit */}
                    <div key={currentProduct.id} className="relative w-full h-full flex items-center justify-center animate-scale-in">
                        {/* Blob/Glow arrière plan pour effet de profondeur */}
                        <div className="absolute w-[80%] h-[80%] bg-white/5 blur-[50px] rounded-full animate-pulse-slow"></div>
                        
                        <img 
                          src={currentProduct.imageUrls?.[0] || 'https://placehold.co/800x800/1a1a1a/ffffff?text=EBF+Ivoire'} 
                          alt={currentProduct.name}
                          className="relative z-10 h-[90%] w-auto lg:w-[85%] lg:h-auto aspect-square object-contain rounded-3xl md:rounded-[3rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-4 md:border-[12px] border-white/5 bg-white p-4 md:p-6 animate-float"
                        />
                    </div>
                </div>
                
                {/* ZONE TEXTE - Bas sur mobile, Droite sur desktop */}
                <div className="w-full lg:w-[60%] h-[60%] lg:h-full bg-white text-gray-950 flex flex-col p-6 md:p-16 justify-center shadow-[-20px_0_100px_rgba(0,0,0,0.4)] relative">
                    
                    <div className="space-y-4 md:space-y-12 animate-slide-up relative z-10 overflow-y-auto lg:overflow-visible no-scrollbar pb-20 lg:pb-0">
                        <div>
                            <span className="px-4 py-1.5 md:px-8 md:py-3 bg-orange-600 text-white rounded-lg md:rounded-xl text-xs md:text-2xl font-black uppercase mb-2 md:mb-8 inline-block shadow-lg tracking-widest">
                              {currentProduct.category}
                            </span>
                            <h1 className="text-3xl md:text-7xl lg:text-8xl font-black leading-tight md:leading-[0.95] tracking-tighter mb-4 md:mb-10 text-gray-950 uppercase italic line-clamp-3 md:line-clamp-none">
                              {currentProduct.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 md:gap-10 text-gray-400 font-black text-xs md:text-2xl uppercase tracking-widest">
                                <div className="flex items-center gap-2 md:gap-3"><Zap size={16} className="md:w-8 md:h-8 text-orange-600" /> {currentProduct.supplier}</div>
                                <div className="flex items-center gap-2 md:gap-3"><ShieldCheck size={16} className="md:w-8 md:h-8 text-green-600" /> Certifié EBF</div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-10 pt-2 md:pt-6">
                            <div className="bg-gray-950 p-6 md:p-10 rounded-2xl md:rounded-[3rem] text-white w-full md:flex-1 border-b-[8px] md:border-b-[20px] border-orange-600 shadow-xl">
                                <p className="text-sm md:text-2xl font-black uppercase text-orange-500 mb-2 md:mb-4 tracking-widest">Prix Exceptionnel</p>
                                <p className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none text-white whitespace-nowrap">
                                  {currentProduct.unitPrice.toLocaleString()} <span className="text-xl md:text-4xl text-gray-600 font-bold ml-1">F</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          ) : activeMode === 'PLANNING' ? (
             <div className="flex w-full bg-gray-950 p-6 md:p-16 animate-fade-in flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-6 md:mb-16 shrink-0">
                    <h2 className="text-2xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white uppercase italic truncate">
                        Planning <span className="hidden md:inline">du {todayDate}</span>
                    </h2>
                    <Calendar size={40} className="md:w-[100px] md:h-[100px] text-blue-500 animate-pulse shrink-0 ml-4" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 flex-1 overflow-y-auto no-scrollbar content-start pb-20">
                    {planning.slice(0, 6).map((inter, i) => (
                        <div key={inter.id} className="bg-white/5 border-2 md:border-[4px] border-white/10 p-6 md:p-8 rounded-3xl md:rounded-[3rem] flex flex-col justify-center gap-2 md:gap-4 animate-slide-up shadow-xl min-h-[120px] md:min-h-0 md:h-full md:max-h-[25vh]" style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="flex justify-between items-center">
                              <span className="bg-blue-600 text-white px-3 py-1 md:px-6 md:py-2 rounded-lg md:rounded-xl font-black text-xs md:text-2xl uppercase tracking-widest">{inter.site}</span>
                              <span className="text-white/20 text-xs md:text-xl font-mono font-bold"># {inter.id.split('-')[1]}</span>
                            </div>
                            <h4 className="text-white text-xl md:text-5xl font-black tracking-tighter leading-tight line-clamp-1">{inter.client}</h4>
                            <p className="text-orange-500 text-sm md:text-3xl font-black uppercase tracking-widest line-clamp-1 italic">{inter.description}</p>
                        </div>
                    ))}
                </div>
             </div>
          ) : (
             <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-6 animate-pulse p-4">
                  <Megaphone size={60} className="md:w-[120px] md:h-[120px] text-white/10 mx-auto" />
                  <p className="text-xl md:text-4xl text-white/20 font-black uppercase tracking-[0.5rem]">Mise à jour du contenu...</p>
                </div>
             </div>
          )}
      </div>

      {/* FLASH INFO - RESPONSIVE */}
      <div className="h-14 md:h-24 bg-orange-600 relative z-[200] border-t-4 md:border-t-[8px] border-orange-700 overflow-hidden flex items-center shadow-[0_-10px_50px_rgba(0,0,0,0.5)] shrink-0">
          <div className="bg-gray-950 h-full px-4 md:px-8 flex items-center justify-center z-20 shadow-[10px_0_30px_rgba(0,0,0,0.8)] border-r-4 border-orange-500">
              <Megaphone size={24} className="md:w-10 md:h-10 text-orange-500 animate-bounce" />
          </div>
          
          <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="inline-block animate-tv-ticker">
                  {flashes.concat(flashes).concat(flashes).map((msg, i) => (
                      <span key={i} className="text-white text-xl md:text-6xl font-black px-8 md:px-20 uppercase italic drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] tracking-tight">
                          {msg} <span className="text-orange-300 mx-4 md:mx-8 opacity-40">///</span>
                      </span>
                  ))}
              </div>
          </div>
      </div>

      <style>{`
        @keyframes tv-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-tv-ticker {
          animation: tv-ticker 30s linear infinite;
        }
        @keyframes scale-in {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
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

export default ShowcaseMode;
