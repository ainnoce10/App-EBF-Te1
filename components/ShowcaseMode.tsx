import React, { useState, useEffect } from 'react';
import { StockItem, Intervention } from '../types';
import { 
  X, 
  QrCode, 
  Zap, 
  ShieldCheck,
  Clock,
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
  
  // Utilise les données live si disponibles, sinon les mocks (ou liste vide)
  const products = liveStock.length > 0 ? liveStock : [];
  const planning = liveInterventions.length > 0 ? liveInterventions : [];
  const flashes = liveMessages.length > 0 ? liveMessages : ["Bienvenue chez EBF Technical Center"];

  // Défilement automatique des produits en mode Publicité
  useEffect(() => {
    if (activeMode !== 'PUBLICITE' || products.length === 0) return;
    const interval = setInterval(() => {
      setProductIdx((prev) => (prev + 1) % products.length);
    }, 8000); 
    return () => clearInterval(interval);
  }, [activeMode, products.length]);

  const currentProduct = products[productIdx];

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col overflow-hidden font-sans select-none text-white">
      
      {/* HEADER TV */}
      <div className="h-32 bg-gray-950 px-16 flex items-center justify-between border-b-8 border-orange-500 shadow-2xl z-50">
          <div className="flex items-center gap-16">
              <div className="bg-orange-500 p-6 rounded-3xl shadow-2xl -rotate-2">
                 <span className="text-white font-black text-5xl tracking-tighter">EBF TV</span>
              </div>
              
              <div className="flex gap-8 bg-white/5 p-3 rounded-[2.5rem] border border-white/10">
                  <button 
                    onClick={() => setActiveMode('PUBLICITE')}
                    className={`flex items-center gap-5 px-12 py-6 rounded-2xl font-black text-2xl uppercase transition-all ${activeMode === 'PUBLICITE' ? 'bg-orange-500 text-white shadow-[0_0_40px_rgba(249,115,22,0.5)] scale-105' : 'text-white/30'}`}
                  >
                    <LayoutGrid size={36} />
                    Articles
                  </button>
                  <button 
                    onClick={() => setActiveMode('PLANNING')}
                    className={`flex items-center gap-5 px-12 py-6 rounded-2xl font-black text-2xl uppercase transition-all ${activeMode === 'PLANNING' ? 'bg-blue-600 text-white shadow-[0_0_40px_rgba(37,99,235,0.5)] scale-105' : 'text-white/30'}`}
                  >
                    <ClipboardList size={36} />
                    Chantiers
                  </button>
              </div>
          </div>

          <div className="flex items-center gap-10">
              <div className="bg-green-600/20 px-4 py-2 rounded-full border border-green-500/30 flex items-center gap-3">
                 <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                 <span className="text-green-500 font-black text-sm uppercase tracking-widest">Live Sync</span>
              </div>
              {onClose && (
                <button onClick={onClose} className="p-6 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all border border-red-500/20">
                  <X size={48} />
                </button>
              )}
          </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden relative bg-gray-900">
          {activeMode === 'PUBLICITE' && currentProduct ? (
            <div className="flex w-full animate-fade-in h-full">
                <div className="w-1/2 relative flex items-center justify-center p-24 bg-gray-950">
                    <img 
                      key={currentProduct.id}
                      src={currentProduct.imageUrls?.[0]} 
                      alt={currentProduct.name}
                      className="max-w-full max-h-full object-contain rounded-[5rem] shadow-2xl animate-scale-in border-[16px] border-white/5"
                    />
                </div>
                <div className="w-1/2 bg-white text-gray-900 flex flex-col p-28 justify-center shadow-2xl">
                    <div className="space-y-16 animate-slide-up">
                        <div>
                            <span className="px-12 py-5 bg-orange-100 text-orange-600 rounded-[2rem] text-3xl font-black uppercase mb-12 inline-block shadow-sm">
                              {currentProduct.category}
                            </span>
                            <h1 className="text-7xl font-black leading-[1.1] tracking-tighter mb-14 text-gray-950">
                              {currentProduct.name}
                            </h1>
                            <div className="flex items-center gap-12 text-gray-400 font-bold text-3xl">
                                <Zap size={48} className="text-orange-500" /> {currentProduct.supplier}
                                <ShieldCheck size={48} className="text-green-500" /> Qualité EBF
                            </div>
                        </div>

                        <div className="flex items-center gap-20 pt-10">
                            <div className="bg-gray-950 p-16 rounded-[5rem] text-white flex-1 border-b-[30px] border-orange-600">
                                <p className="text-3xl font-black uppercase text-orange-500 mb-8">PRIX EXCLUSIF</p>
                                <p className="text-[10rem] font-black tracking-tighter leading-none">
                                  {currentProduct.unitPrice.toLocaleString()} <span className="text-6xl text-gray-500">FCFA</span>
                                </p>
                            </div>
                            <div className="w-72 h-72 bg-gray-50 border-8 border-gray-100 rounded-[4.5rem] flex flex-col items-center justify-center">
                                <QrCode size={140} className="text-gray-900 mb-6" />
                                <p className="text-xl font-black text-gray-400 uppercase tracking-widest">Scanner</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          ) : activeMode === 'PLANNING' ? (
             <div className="flex w-full bg-gray-950 p-24 animate-fade-in flex-col h-full">
                <div className="flex items-center justify-between mb-28 text-white">
                    <h2 className="text-[8.5rem] font-black tracking-tighter">Missions Semaine</h2>
                    <Calendar size={100} className="text-blue-500" />
                </div>
                <div className="grid grid-cols-3 gap-16 flex-1">
                    {planning.slice(0, 6).map((inter, i) => (
                        <div key={inter.id} className="bg-white/5 border-4 border-white/10 p-16 rounded-[5.5rem] space-y-10 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                            <span className="bg-blue-600 text-white px-10 py-4 rounded-3xl font-black text-2xl uppercase">{inter.site}</span>
                            <h4 className="text-white text-6xl font-black tracking-tight">{inter.client}</h4>
                            <p className="text-white/40 text-3xl line-clamp-2">{inter.description}</p>
                        </div>
                    ))}
                </div>
             </div>
          ) : (
             <div className="flex-1 flex items-center justify-center">
                <p className="text-4xl text-white/20 font-black italic">Aucune donnée disponible...</p>
             </div>
          )}
      </div>

      {/* FLASH INFO PERMANENT */}
      <div className="h-40 bg-orange-600 relative z-[200] border-t-[12px] border-orange-700 overflow-hidden flex items-center shadow-2xl">
          <div className="bg-black h-full px-12 flex items-center justify-center z-20 shadow-2xl relative">
              <Megaphone size={70} className="text-orange-500 animate-bounce" />
          </div>
          
          <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="inline-block animate-tv-ticker">
                  {flashes.concat(flashes).concat(flashes).map((msg, i) => (
                      <span key={i} className="text-white text-7xl font-black px-32 uppercase italic drop-shadow-2xl">
                          {msg} <span className="text-orange-400 mx-10 opacity-50">///</span>
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
          animation: tv-ticker 60s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ShowcaseMode;