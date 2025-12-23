import React, { useState, useEffect } from 'react';
import { MOCK_STOCK, MOCK_INTERVENTIONS, TICKER_MESSAGES } from '../constants';
import { 
  X, 
  QrCode, 
  Zap, 
  ShieldCheck,
  MapPin,
  Clock,
  Calendar,
  Megaphone,
  LayoutGrid,
  ClipboardList,
  Tag
} from 'lucide-react';

type TVMode = 'PUBLICITE' | 'PLANNING';

const ShowcaseMode: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [activeMode, setActiveMode] = useState<TVMode>('PUBLICITE');
  const [productIdx, setProductIdx] = useState(0);
  
  const products = MOCK_STOCK;
  const planning = MOCK_INTERVENTIONS;
  const flashes = TICKER_MESSAGES;

  // Défilement automatique des produits en mode Publicité
  useEffect(() => {
    if (activeMode !== 'PUBLICITE') return;
    const interval = setInterval(() => {
      setProductIdx((prev) => (prev + 1) % products.length);
    }, 8000); 
    return () => clearInterval(interval);
  }, [activeMode, products.length]);

  // Activation du mode plein écran au chargement
  useEffect(() => {
    const handleFullscreen = async () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn("Fullscreen request failed", err);
      }
    };
    handleFullscreen();
  }, []);

  const currentProduct = products[productIdx];

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col overflow-hidden font-sans select-none text-white">
      
      {/* HEADER TV - NAVIGATION */}
      <div className="h-32 bg-gray-950 px-16 flex items-center justify-between border-b-8 border-orange-500 shadow-2xl z-50">
          <div className="flex items-center gap-16">
              <div className="bg-orange-500 p-6 rounded-3xl shadow-2xl -rotate-2">
                 <span className="text-white font-black text-5xl tracking-tighter">EBF TV</span>
              </div>
              
              {/* NAVIGATION TV */}
              <div className="flex gap-8 bg-white/5 p-3 rounded-[2.5rem] border border-white/10">
                  <button 
                    onClick={() => setActiveMode('PUBLICITE')}
                    className={`flex items-center gap-5 px-12 py-6 rounded-2xl font-black text-2xl uppercase tracking-widest transition-all ${activeMode === 'PUBLICITE' ? 'bg-orange-500 text-white shadow-[0_0_40px_rgba(249,115,22,0.5)] scale-105' : 'text-white/30 hover:text-white/80'}`}
                  >
                    <LayoutGrid size={36} />
                    Publicité
                  </button>
                  <button 
                    onClick={() => setActiveMode('PLANNING')}
                    className={`flex items-center gap-5 px-12 py-6 rounded-2xl font-black text-2xl uppercase tracking-widest transition-all ${activeMode === 'PLANNING' ? 'bg-blue-600 text-white shadow-[0_0_40px_rgba(37,99,235,0.5)] scale-105' : 'text-white/30 hover:text-white/80'}`}
                  >
                    <ClipboardList size={36} />
                    Planning
                  </button>
              </div>
          </div>

          <div className="flex items-center gap-10">
              <div className="text-right">
                  <p className="text-orange-500 font-black text-2xl leading-none">IVORIAN TECHNICAL PARTNER</p>
                  <p className="text-white/20 font-bold text-lg tracking-widest uppercase">Abidjan • Bouaké</p>
              </div>
              {onClose && (
                <button onClick={onClose} className="p-6 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all border border-red-500/20">
                  <X size={48} />
                </button>
              )}
          </div>
      </div>

      {/* ZONE DE CONTENU PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden relative bg-gray-900">
          
          {/* VUE PUBLICITÉ */}
          {activeMode === 'PUBLICITE' && (
            <div className="flex w-full animate-fade-in h-full">
                <div className="w-1/2 relative flex items-center justify-center p-24 bg-gray-950">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent opacity-50"></div>
                    <img 
                      key={currentProduct.id}
                      src={currentProduct.imageUrls?.[0]} 
                      alt={currentProduct.name}
                      className="max-w-full max-h-full object-contain rounded-[5rem] shadow-[0_80px_150px_rgba(0,0,0,0.8)] animate-scale-in border-[16px] border-white/5"
                    />
                    <div className="absolute top-20 left-20 bg-orange-600 text-white px-12 py-6 rounded-[2.5rem] font-black text-4xl shadow-2xl -rotate-6 animate-pulse border-4 border-white/20">
                      DISPONIBLE
                    </div>
                </div>
                <div className="w-1/2 bg-white text-gray-900 flex flex-col p-28 justify-center shadow-[-50px_0_100px_rgba(0,0,0,0.5)]">
                    <div className="space-y-16 animate-slide-up">
                        <div>
                            <span className="px-12 py-5 bg-orange-100 text-orange-600 rounded-[2rem] text-3xl font-black uppercase tracking-widest mb-12 inline-block shadow-sm">
                              {currentProduct.category}
                            </span>
                            {/* POLICE DIMINUÉE ICI */}
                            <h1 className="text-7xl font-black leading-[1.1] tracking-tighter mb-14 text-gray-950">
                              {currentProduct.name}
                            </h1>
                            <div className="flex items-center gap-12 text-gray-400 font-bold text-3xl">
                                <div className="flex items-center gap-5"><Zap size={48} className="text-orange-500" /> {currentProduct.supplier}</div>
                                <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                                <div className="flex items-center gap-5"><ShieldCheck size={48} className="text-green-500" /> Qualité EBF</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-20 pt-10">
                            <div className="bg-gray-950 p-16 rounded-[5rem] text-white shadow-2xl flex-1 border-b-[30px] border-orange-600 transform hover:scale-105 transition-transform duration-500">
                                <p className="text-3xl font-black uppercase tracking-[0.5em] text-orange-500 mb-8">PRIX EXCLUSIF</p>
                                <p className="text-[10rem] font-black tracking-tighter leading-none">
                                  {currentProduct.unitPrice.toLocaleString()} <span className="text-6xl text-gray-500">FCFA</span>
                                </p>
                            </div>
                            <div className="w-72 h-72 bg-gray-50 border-8 border-gray-100 rounded-[4.5rem] flex flex-col items-center justify-center p-12 text-center shadow-inner group">
                                <QrCode size={140} className="text-gray-900 mb-6 group-hover:scale-110 transition-transform" />
                                <p className="text-xl font-black text-gray-400 uppercase tracking-widest">Scanner</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {/* VUE PLANNING */}
          {activeMode === 'PLANNING' && (
            <div className="flex w-full bg-gray-950 p-24 animate-fade-in flex-col h-full">
                <div className="flex items-center justify-between mb-28">
                    <div className="space-y-8">
                        <h2 className="text-blue-500 font-black text-5xl uppercase tracking-[0.6em] drop-shadow-lg">Agenda Technique</h2>
                        <h3 className="text-white text-[8.5rem] font-black tracking-tighter leading-tight">Missions Semaine</h3>
                    </div>
                    <div className="bg-white/5 p-16 rounded-[5rem] backdrop-blur-3xl border border-white/10 flex items-center gap-12 shadow-2xl">
                        <Calendar size={100} className="text-blue-500" />
                        <div>
                            <p className="text-8xl font-black leading-none">OCTOBRE</p>
                            <p className="text-3xl font-bold uppercase tracking-[0.4em] text-white/20 mt-4">Programmation</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-16 flex-1">
                    {planning.map((inter, i) => (
                        <div 
                          key={inter.id} 
                          className="bg-white/5 border-4 border-white/10 p-16 rounded-[5.5rem] space-y-10 hover:bg-white/10 transition-all transform hover:-translate-y-6 animate-slide-up shadow-xl"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        >
                            <div className="flex justify-between items-center">
                                <span className="bg-blue-600 text-white px-10 py-4 rounded-3xl font-black text-2xl tracking-widest uppercase shadow-2xl">
                                    {inter.site}
                                </span>
                                <span className="text-white/20 font-mono font-black text-3xl">#{inter.id}</span>
                            </div>
                            <h4 className="text-white text-6xl font-black tracking-tight leading-tight">{inter.client}</h4>
                            {/* POLICE DIMINUÉE ICI */}
                            <p className="text-white/40 text-2xl font-medium leading-relaxed line-clamp-2">{inter.description}</p>
                            <div className="pt-12 border-t-2 border-white/10 flex items-center justify-between text-blue-400 font-black uppercase text-2xl">
                                <div className="flex items-center gap-5"><Clock size={40}/> {new Date(inter.date).toLocaleDateString('fr-FR', {day:'2-digit', month:'long'})}</div>
                                <div className="flex items-center gap-5 text-green-500"><ShieldCheck size={40}/> {inter.status}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}
      </div>

      {/* FLASH INFO PERMANENT - BAS DE L'ÉCRAN */}
      <div className="h-40 bg-orange-600 relative z-[200] border-t-[12px] border-orange-700 overflow-hidden flex items-center shadow-[0_-30px_80px_rgba(0,0,0,0.5)]">
          <div className="bg-black h-full px-12 flex items-center justify-center z-20 shadow-[40px_0_60px_rgba(0,0,0,0.6)] relative">
              {/* UNIQUEMENT L'ICÔNE ANIMÉE DANS LE CADRE NOIR */}
              <Megaphone size={70} className="text-orange-500 animate-bounce" />
          </div>
          
          <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="inline-block animate-tv-ticker">
                  {flashes.concat(flashes).concat(flashes).map((msg, i) => (
                      <span key={i} className="text-white text-7xl font-black px-32 uppercase tracking-tighter italic drop-shadow-2xl">
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
          animation: tv-ticker 50s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ShowcaseMode;