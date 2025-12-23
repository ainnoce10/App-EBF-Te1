import React, { useState, useEffect } from 'react';
import { StockItem, Intervention } from '../types';
import { 
  X, 
  QrCode, 
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
      
      {/* HEADER TV - TRÈS HAUT CONTRASTE (Réduit) */}
      <div className="h-28 bg-gray-950 px-10 flex items-center justify-between border-b-[8px] border-orange-600 shadow-2xl z-50">
          <div className="flex items-center gap-12">
              <div className="bg-orange-600 px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(234,88,12,0.4)] -rotate-1">
                 <span className="text-white font-black text-4xl tracking-tighter">EBF TV</span>
              </div>
              
              <div className="flex gap-4 bg-white/5 p-2 rounded-3xl border border-white/10">
                  <button 
                    onClick={() => setActiveMode('PUBLICITE')}
                    className={`flex items-center gap-4 px-8 py-3 rounded-2xl font-black text-xl uppercase transition-all ${activeMode === 'PUBLICITE' ? 'bg-orange-600 text-white shadow-xl scale-105' : 'text-white/20 hover:text-white/50'}`}
                  >
                    <LayoutGrid size={24} />
                    Nos Produits
                  </button>
                  <button 
                    onClick={() => setActiveMode('PLANNING')}
                    className={`flex items-center gap-4 px-8 py-3 rounded-2xl font-black text-xl uppercase transition-all ${activeMode === 'PLANNING' ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-white/20 hover:text-white/50'}`}
                  >
                    <ClipboardList size={24} />
                    Chantiers
                  </button>
              </div>
          </div>

          <div className="flex items-center gap-8">
              <div className="bg-green-600/10 px-4 py-2 rounded-full border border-green-500/30 flex items-center gap-3">
                 <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                 <span className="text-green-500 font-black text-lg uppercase tracking-widest">En Direct</span>
              </div>
              {onClose && (
                <button onClick={onClose} className="p-4 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white rounded-full transition-all border border-red-500/20">
                  <X size={32} />
                </button>
              )}
          </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden relative bg-gray-900">
          {activeMode === 'PUBLICITE' && currentProduct ? (
            <div className="flex w-full animate-fade-in h-full">
                {/* ZONE IMAGE - 40% */}
                <div className="w-[40%] relative flex items-center justify-center p-12 bg-gray-950 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 to-transparent opacity-50"></div>
                    <img 
                      key={currentProduct.id}
                      src={currentProduct.imageUrls?.[0] || 'https://placehold.co/800x800/1a1a1a/ffffff?text=EBF+Ivoire'} 
                      alt={currentProduct.name}
                      className="w-[85%] aspect-square object-contain rounded-[3rem] shadow-[0_0_60px_rgba(0,0,0,0.8)] animate-scale-in border-[12px] border-white/5 bg-white p-6"
                    />
                </div>
                
                {/* ZONE TEXTE - 60% */}
                <div className="w-[60%] bg-white text-gray-950 flex flex-col p-16 justify-center shadow-[-20px_0_100px_rgba(0,0,0,0.4)] relative">
                    <div className="absolute top-10 right-10 opacity-5">
                       <Zap size={250} />
                    </div>
                    
                    <div className="space-y-12 animate-slide-up relative z-10">
                        <div>
                            <span className="px-8 py-3 bg-orange-600 text-white rounded-xl text-2xl font-black uppercase mb-8 inline-block shadow-lg tracking-widest">
                              {currentProduct.category}
                            </span>
                            <h1 className="text-7xl lg:text-8xl font-black leading-[0.95] tracking-tighter mb-10 text-gray-950 uppercase italic line-clamp-3">
                              {currentProduct.name}
                            </h1>
                            <div className="flex items-center gap-10 text-gray-400 font-black text-2xl uppercase tracking-widest">
                                <div className="flex items-center gap-3"><Zap size={32} className="text-orange-600" /> {currentProduct.supplier}</div>
                                <div className="flex items-center gap-3"><ShieldCheck size={32} className="text-green-600" /> Certifié EBF</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-10 pt-6">
                            <div className="bg-gray-950 p-10 rounded-[3rem] text-white flex-1 border-b-[20px] border-orange-600 shadow-xl">
                                <p className="text-2xl font-black uppercase text-orange-500 mb-4 tracking-widest">Prix Exceptionnel</p>
                                <p className="text-7xl lg:text-8xl font-black tracking-tighter leading-none text-white whitespace-nowrap">
                                  {currentProduct.unitPrice.toLocaleString()} <span className="text-4xl text-gray-600 font-bold ml-1">FCFA</span>
                                </p>
                            </div>
                            <div className="w-48 h-48 bg-gray-50 border-[8px] border-gray-100 rounded-[2rem] flex flex-col items-center justify-center shrink-0 shadow-lg">
                                <QrCode size={100} className="text-gray-950 mb-2" />
                                <p className="text-lg font-black text-gray-400 uppercase tracking-[0.2em]">Scan</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          ) : activeMode === 'PLANNING' ? (
             <div className="flex w-full bg-gray-950 p-16 animate-fade-in flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-16">
                    <h2 className="text-7xl font-black tracking-tighter text-white uppercase italic">Planning Missions</h2>
                    <Calendar size={100} className="text-blue-500 animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-8 flex-1 overflow-hidden content-start">
                    {planning.slice(0, 4).map((inter, i) => (
                        <div key={inter.id} className="bg-white/5 border-[4px] border-white/10 p-8 rounded-[3rem] flex flex-col justify-center gap-4 animate-slide-up shadow-xl h-full max-h-[25vh]" style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="flex justify-between items-center">
                              <span className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-2xl uppercase tracking-widest">{inter.site}</span>
                              <span className="text-white/20 text-xl font-mono font-bold"># {inter.id}</span>
                            </div>
                            <h4 className="text-white text-5xl font-black tracking-tighter leading-tight line-clamp-1">{inter.client}</h4>
                            <p className="text-orange-500 text-3xl font-black uppercase tracking-widest line-clamp-1 italic">{inter.description}</p>
                        </div>
                    ))}
                </div>
             </div>
          ) : (
             <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-6 animate-pulse">
                  <Megaphone size={120} className="text-white/10 mx-auto" />
                  <p className="text-4xl text-white/20 font-black uppercase tracking-[0.5rem]">Mise à jour du contenu...</p>
                </div>
             </div>
          )}
      </div>

      {/* FLASH INFO - RÉDUIT */}
      <div className="h-24 bg-orange-600 relative z-[200] border-t-[8px] border-orange-700 overflow-hidden flex items-center shadow-[0_-10px_50px_rgba(0,0,0,0.5)]">
          <div className="bg-gray-950 h-full px-8 flex items-center justify-center z-20 shadow-[10px_0_30px_rgba(0,0,0,0.8)] border-r-[4px] border-orange-500">
              <Megaphone size={40} className="text-orange-500 animate-bounce" />
          </div>
          
          <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="inline-block animate-tv-ticker">
                  {flashes.concat(flashes).concat(flashes).map((msg, i) => (
                      <span key={i} className="text-white text-6xl font-black px-20 uppercase italic drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] tracking-tight">
                          {msg} <span className="text-orange-300 mx-8 opacity-40">///</span>
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
          animation: tv-ticker 40s linear infinite;
        }
        @keyframes scale-in {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default ShowcaseMode;