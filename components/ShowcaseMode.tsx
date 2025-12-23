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
      
      {/* HEADER TV - TRÈS HAUT CONTRASTE */}
      <div className="h-40 bg-gray-950 px-20 flex items-center justify-between border-b-[12px] border-orange-600 shadow-2xl z-50">
          <div className="flex items-center gap-24">
              <div className="bg-orange-600 p-8 rounded-[2rem] shadow-[0_0_50px_rgba(234,88,12,0.4)] -rotate-1">
                 <span className="text-white font-black text-6xl tracking-tighter">EBF TV</span>
              </div>
              
              <div className="flex gap-10 bg-white/5 p-4 rounded-[3rem] border-2 border-white/10">
                  <button 
                    onClick={() => setActiveMode('PUBLICITE')}
                    className={`flex items-center gap-6 px-16 py-8 rounded-[2rem] font-black text-3xl uppercase transition-all ${activeMode === 'PUBLICITE' ? 'bg-orange-600 text-white shadow-2xl scale-110' : 'text-white/20 hover:text-white/50'}`}
                  >
                    <LayoutGrid size={48} />
                    Nos Produits
                  </button>
                  <button 
                    onClick={() => setActiveMode('PLANNING')}
                    className={`flex items-center gap-6 px-16 py-8 rounded-[2rem] font-black text-3xl uppercase transition-all ${activeMode === 'PLANNING' ? 'bg-blue-600 text-white shadow-2xl scale-110' : 'text-white/20 hover:text-white/50'}`}
                  >
                    <ClipboardList size={48} />
                    Chantiers
                  </button>
              </div>
          </div>

          <div className="flex items-center gap-14">
              <div className="bg-green-600/10 px-6 py-3 rounded-full border-2 border-green-500/30 flex items-center gap-4">
                 <div className="w-5 h-5 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.8)]"></div>
                 <span className="text-green-500 font-black text-xl uppercase tracking-widest">En Direct</span>
              </div>
              {onClose && (
                <button onClick={onClose} className="p-8 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white rounded-full transition-all border-2 border-red-500/20">
                  <X size={54} />
                </button>
              )}
          </div>
      </div>

      {/* CONTENU PRINCIPAL - VISIBILITÉ ACCRUE */}
      <div className="flex-1 flex overflow-hidden relative bg-gray-900">
          {activeMode === 'PUBLICITE' && currentProduct ? (
            <div className="flex w-full animate-fade-in h-full">
                {/* ZONE IMAGE - 45% */}
                <div className="w-[45%] relative flex items-center justify-center p-20 bg-gray-950 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 to-transparent opacity-50"></div>
                    <img 
                      key={currentProduct.id}
                      src={currentProduct.imageUrls?.[0] || 'https://placehold.co/800x800/1a1a1a/ffffff?text=EBF+Ivoire'} 
                      alt={currentProduct.name}
                      className="max-w-[90%] max-h-[90%] object-contain rounded-[4rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-scale-in border-[20px] border-white/5 bg-white p-10"
                    />
                </div>
                
                {/* ZONE TEXTE - 55% */}
                <div className="w-[55%] bg-white text-gray-950 flex flex-col p-32 justify-center shadow-[-20px_0_100px_rgba(0,0,0,0.4)] relative">
                    <div className="absolute top-20 right-20 opacity-5">
                       <Zap size={400} />
                    </div>
                    
                    <div className="space-y-20 animate-slide-up relative z-10">
                        <div>
                            <span className="px-14 py-6 bg-orange-600 text-white rounded-[2rem] text-4xl font-black uppercase mb-16 inline-block shadow-xl tracking-widest">
                              {currentProduct.category}
                            </span>
                            <h1 className="text-[9rem] font-black leading-[0.95] tracking-tighter mb-20 text-gray-950 uppercase italic">
                              {currentProduct.name}
                            </h1>
                            <div className="flex items-center gap-16 text-gray-400 font-black text-4xl uppercase tracking-widest">
                                <div className="flex items-center gap-4"><Zap size={64} className="text-orange-600" /> {currentProduct.supplier}</div>
                                <div className="flex items-center gap-4"><ShieldCheck size={64} className="text-green-600" /> Certifié EBF</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-24 pt-10">
                            <div className="bg-gray-950 p-20 rounded-[6rem] text-white flex-1 border-b-[40px] border-orange-600 shadow-2xl">
                                <p className="text-4xl font-black uppercase text-orange-500 mb-10 tracking-widest">Prix Exceptionnel</p>
                                <p className="text-[13rem] font-black tracking-tighter leading-none text-white">
                                  {currentProduct.unitPrice.toLocaleString()} <span className="text-6xl text-gray-600 font-bold ml-2">FCFA</span>
                                </p>
                            </div>
                            <div className="w-80 h-80 bg-gray-50 border-[12px] border-gray-100 rounded-[5rem] flex flex-col items-center justify-center shrink-0 shadow-lg">
                                <QrCode size={180} className="text-gray-950 mb-4" />
                                <p className="text-2xl font-black text-gray-400 uppercase tracking-[0.3em]">Catalogue</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          ) : activeMode === 'PLANNING' ? (
             <div className="flex w-full bg-gray-950 p-32 animate-fade-in flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-32">
                    <h2 className="text-[10rem] font-black tracking-tighter text-white uppercase italic">Planning Missions</h2>
                    <Calendar size={180} className="text-blue-500 animate-pulse" />
                </div>
                <div className="grid grid-cols-2 gap-24 flex-1 overflow-hidden">
                    {planning.slice(0, 4).map((inter, i) => (
                        <div key={inter.id} className="bg-white/5 border-[8px] border-white/10 p-20 rounded-[6rem] flex flex-col justify-center gap-10 animate-slide-up shadow-2xl" style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="flex justify-between items-center">
                              <span className="bg-blue-600 text-white px-14 py-6 rounded-[2rem] font-black text-4xl uppercase tracking-widest">{inter.site}</span>
                              <span className="text-white/20 text-3xl font-mono font-bold"># {inter.id}</span>
                            </div>
                            <h4 className="text-white text-[7rem] font-black tracking-tighter leading-tight line-clamp-1">{inter.client}</h4>
                            <p className="text-orange-500 text-5xl font-black uppercase tracking-widest line-clamp-1 italic">{inter.description}</p>
                        </div>
                    ))}
                </div>
             </div>
          ) : (
             <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-10 animate-pulse">
                  <Megaphone size={200} className="text-white/10 mx-auto" />
                  <p className="text-6xl text-white/20 font-black uppercase tracking-[1rem]">Mise à jour du contenu...</p>
                </div>
             </div>
          )}
      </div>

      {/* FLASH INFO - STYLE CONSERVÉ MAIS AGRANDI */}
      <div className="h-48 bg-orange-600 relative z-[200] border-t-[16px] border-orange-700 overflow-hidden flex items-center shadow-[0_-20px_100px_rgba(0,0,0,0.5)]">
          <div className="bg-gray-950 h-full px-16 flex items-center justify-center z-20 shadow-[20px_0_50px_rgba(0,0,0,0.8)] border-r-[8px] border-orange-500">
              <Megaphone size={90} className="text-orange-500 animate-bounce" />
          </div>
          
          <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="inline-block animate-tv-ticker">
                  {flashes.concat(flashes).concat(flashes).map((msg, i) => (
                      <span key={i} className="text-white text-[7.5rem] font-black px-40 uppercase italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] tracking-tight">
                          {msg} <span className="text-orange-300 mx-16 opacity-40">///</span>
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
          animation: tv-ticker 50s linear infinite;
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