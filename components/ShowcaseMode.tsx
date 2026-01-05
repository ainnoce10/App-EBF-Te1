
import React, { useState, useEffect, useRef } from 'react';
import { StockItem, Intervention, TickerMessage } from '../types';
import { 
  X, 
  Zap, 
  ShieldCheck,
  Calendar,
  Megaphone,
  LayoutGrid,
  ClipboardList,
  Clock,
  MapPin,
  Briefcase,
  Layers,
  Volume2,
  VolumeX
} from 'lucide-react';

interface ShowcaseModeProps {
  onClose?: () => void;
  liveStock?: StockItem[];
  liveInterventions?: Intervention[];
  liveMessages?: TickerMessage[];
}

const ShowcaseMode: React.FC<ShowcaseModeProps> = ({ 
  onClose, 
  liveStock = [], 
  liveInterventions = [], 
  liveMessages = [] 
}) => {
  const [activeMode, setActiveMode] = useState<'PUBLICITE' | 'PLANNING'>('PUBLICITE');
  const [productIdx, setProductIdx] = useState(0);
  const [planningPage, setPlanningPage] = useState(0);
  
  // Audio state
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  const products = liveStock.length > 0 ? liveStock : [];
  const planning = liveInterventions.length > 0 ? liveInterventions : [];
  const flashes = liveMessages.length > 0 ? liveMessages : [{ content: "Bienvenue chez EBF Technical Center", color: 'neutral' } as TickerMessage];

  // Gestion Audio
  useEffect(() => {
    if (audioRef.current) {
        if (isMuted) {
            audioRef.current.pause();
        } else {
            audioRef.current.volume = 0.3; // Volume doux
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Lecture auto bloquée par le navigateur:", error);
                });
            }
        }
    }
  }, [isMuted]);

  const getMessageColorClass = (color: string) => {
    switch(color) {
        case 'green': return 'text-green-400';
        case 'yellow': return 'text-yellow-400';
        case 'red': return 'text-red-500';
        default: return 'text-white';
    }
  };

  const todayDate = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  const getTitleSizeClass = (text: string) => {
    const len = text.length;
    if (len < 20) return "text-3xl md:text-6xl lg:text-7xl xl:text-8xl"; 
    if (len < 40) return "text-2xl md:text-5xl lg:text-6xl xl:text-7xl"; 
    if (len < 80) return "text-xl md:text-4xl lg:text-5xl xl:text-6xl"; 
    return "text-lg md:text-3xl lg:text-4xl xl:text-5xl"; 
  };

  // 1. Alternance automatique (60s)
  useEffect(() => {
    const modeInterval = setInterval(() => {
      setActiveMode((prev) => (prev === 'PUBLICITE' ? 'PLANNING' : 'PUBLICITE'));
    }, 60000); 
    return () => clearInterval(modeInterval);
  }, []);

  // 2. Rotation Produits (10s)
  useEffect(() => {
    if (activeMode !== 'PUBLICITE' || products.length === 0) return;
    const interval = setInterval(() => {
      setProductIdx((prev) => (prev + 1) % products.length);
    }, 10000); 
    return () => clearInterval(interval);
  }, [activeMode, products.length]);

  // 3. Rotation Planning (20s)
  const itemsPerPage = 3;
  const totalPlanningPages = Math.ceil(planning.length / itemsPerPage) || 1;

  useEffect(() => {
    if (activeMode !== 'PLANNING' || planning.length === 0) {
        setPlanningPage(0); 
        return;
    }
    const interval = setInterval(() => {
      setPlanningPage((prev) => (prev + 1) % totalPlanningPages);
    }, 20000); 
    return () => clearInterval(interval);
  }, [activeMode, planning.length, totalPlanningPages]);

  const currentProduct = products[productIdx];
  const currentPlanningSlice = planning.slice(planningPage * itemsPerPage, (planningPage + 1) * itemsPerPage);

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col overflow-hidden font-sans select-none text-white">
      
      {/* Musique de fond (Libre de droit - Corporate Ambient) */}
      <audio ref={audioRef} loop src="https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=corporate-ambient-14224.mp3" />

      {/* HEADER TV */}
      <div className="bg-gray-950 px-4 py-4 md:px-10 md:h-28 flex flex-col md:flex-row items-center justify-between border-b-4 md:border-b-[8px] border-orange-600 shadow-2xl z-50 gap-4 md:gap-0 shrink-0 transition-colors duration-500">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12 w-full md:w-auto">
              <div className="bg-yellow-500 px-4 py-2 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.4)] md:-rotate-1">
                 <span className="font-black text-xl md:text-4xl tracking-tighter shadow-sm">
                    <span className="text-green-700">E</span>
                    <span className="text-red-600">B</span>
                    <span className="text-green-700">F</span>
                    <span className="text-white ml-3 drop-shadow-md">TV</span>
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
              {/* Bouton Mute/Unmute */}
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-full border transition-all ${isMuted ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'}`}
              >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

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

      {/* CONTENU PRINCIPAL - ANIMATION BACKGROUND ET CONTENU */}
      {/* Modification ici : Changement de fond dynamique selon le mode */}
      <div className={`flex-1 flex overflow-hidden relative transition-colors duration-1000 ease-in-out ${activeMode === 'PLANNING' ? 'bg-[#0f172a]' : 'bg-gray-900'}`}>
          
          {activeMode === 'PUBLICITE' && currentProduct ? (
            <div className="flex flex-col lg:flex-row w-full animate-fade-in h-full">
                {/* ZONE IMAGE */}
                <div className="w-full lg:w-[45%] h-[45%] lg:h-full relative flex items-center justify-center p-4 md:p-8 bg-gray-950 overflow-hidden shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 to-transparent opacity-50"></div>
                    <div key={currentProduct.id} className="relative w-full h-full flex items-center justify-center animate-scale-in">
                        <div className="absolute w-[90%] h-[90%] bg-white/5 blur-[60px] rounded-full animate-pulse-slow"></div>
                        <img 
                          src={currentProduct.imageUrls?.[0] || 'https://placehold.co/800x800/1a1a1a/ffffff?text=EBF+Ivoire'} 
                          alt={currentProduct.name}
                          className="relative z-10 w-full h-full object-cover rounded-3xl md:rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.9)] border-4 md:border-[8px] border-white/20 bg-gray-800 animate-float"
                        />
                    </div>
                </div>
                
                {/* ZONE TEXTE */}
                <div className="w-full lg:w-[55%] h-[55%] lg:h-full bg-white text-gray-950 flex flex-col p-6 md:p-16 justify-center shadow-[-20px_0_100px_rgba(0,0,0,0.4)] relative overflow-hidden">
                    <div className="flex flex-col h-full justify-between space-y-4 md:space-y-8 animate-slide-up relative z-10 max-h-full">
                        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col">
                            <div className="m-auto w-full pt-4 md:pt-0">
                                <span className="px-4 py-1.5 md:px-8 md:py-3 bg-orange-600 text-white rounded-lg md:rounded-xl text-xs md:text-2xl font-black uppercase mb-2 md:mb-6 inline-block shadow-lg tracking-widest shrink-0">
                                {currentProduct.category}
                                </span>
                                <h1 className={`${getTitleSizeClass(currentProduct.name)} font-black leading-tight md:leading-[0.95] tracking-tighter mb-4 md:mb-8 text-gray-950 uppercase italic line-clamp-5`}>
                                {currentProduct.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 md:gap-10 text-gray-400 font-black text-xs md:text-2xl uppercase tracking-widest shrink-0 pb-2">
                                    <div className="flex items-center gap-2 md:gap-3"><Zap size={16} className="md:w-8 md:h-8 text-orange-600" /> {currentProduct.supplier}</div>
                                    <div className="flex items-center gap-2 md:gap-3"><ShieldCheck size={16} className="md:w-8 md:h-8 text-green-600" /> Certifié EBF</div>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-10 pt-2 md:pt-4 border-t border-gray-100/50">
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
             <div className="flex w-full p-6 md:p-16 animate-fade-in flex-col h-full overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-10 shrink-0 border-b border-white/10 pb-6 gap-4">
                    <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8">
                      <h2 className="text-2xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white uppercase italic truncate drop-shadow-lg">
                          Chantiers EBF
                      </h2>
                      <span className="text-blue-400 font-bold text-lg md:text-4xl uppercase tracking-widest drop-shadow-md">
                         {todayDate}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <span className="text-white/30 font-mono font-bold">Page {planningPage + 1}/{totalPlanningPages}</span>
                        <Calendar size={40} className="md:w-[80px] md:h-[80px] text-blue-500 animate-pulse shrink-0" />
                    </div>
                </div>
                
                {/* Grille ajustée pour 3 items max */}
                <div 
                    key={planningPage} 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-hidden content-start pb-20 animate-slide-up"
                >
                    {currentPlanningSlice.map((inter) => (
                        <div key={inter.id} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 md:p-10 rounded-3xl flex flex-col justify-between gap-4 shadow-2xl hover:bg-white/15 transition-all duration-300 hover:-translate-y-2 h-full min-h-[350px]">
                            
                            {/* Header Card */}
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-2">
                                    {/* Modification ici : Statut "En attente" en bleu */}
                                    <span className={`px-4 py-2 rounded-xl font-black text-xs md:text-sm uppercase tracking-widest inline-block text-center shadow-lg
                                      ${inter.status === 'Terminé' ? 'bg-green-500 text-white' : 
                                        inter.status === 'En cours' ? 'bg-orange-500 text-white' : 
                                        inter.status === 'En attente' ? 'bg-blue-600 text-white' : // Nouveau Style Bleu
                                        'bg-gray-700 text-gray-300'}`}>
                                      {inter.status}
                                    </span>
                                    <div className="flex items-center gap-2 text-blue-300 font-bold uppercase text-xs md:text-sm mt-1">
                                        <MapPin size={16} /> {inter.site}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-white font-black text-2xl md:text-4xl drop-shadow-md">{new Date(inter.date).getDate()}</span>
                                    <span className="block text-blue-200 text-sm font-bold uppercase">{new Date(inter.date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                                </div>
                            </div>

                            {/* Tags Domaine / Type */}
                            <div className="flex flex-wrap gap-2 my-2">
                                {inter.domain && (
                                    <span className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg text-white/90 text-sm font-bold uppercase border border-white/10">
                                       <Briefcase size={16}/> {inter.domain}
                                    </span>
                                )}
                                {inter.interventionType && (
                                    <span className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-lg text-white/90 text-sm font-bold uppercase border border-white/10">
                                       <Layers size={16}/> {inter.interventionType}
                                    </span>
                                )}
                            </div>

                            {/* Main Info */}
                            <div className="flex-1 flex flex-col justify-center py-4">
                                <h4 className="text-white text-2xl md:text-4xl font-black tracking-tight leading-none mb-4 line-clamp-2 drop-shadow-md">{inter.client}</h4>
                                <p className="text-gray-200 text-base md:text-xl font-medium leading-relaxed line-clamp-4">{inter.description}</p>
                            </div>
                            
                            {/* Footer Card */}
                            <div className="pt-6 border-t border-white/10 flex justify-between items-center text-white/50 text-sm font-mono mt-auto">
                                <span>ID: {inter.id}</span>
                                <span className="flex items-center gap-2 text-blue-300"><Clock size={16}/> {inter.technician}</span>
                            </div>
                        </div>
                    ))}
                    
                    {/* Remplissage vide */}
                    {Array.from({ length: Math.max(0, 3 - currentPlanningSlice.length) }).map((_, i) => (
                         <div key={`empty-${i}`} className="border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center opacity-10">
                            <span className="text-white font-black text-4xl uppercase">EBF</span>
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

      {/* FLASH INFO - RESPONSIVE AVEC COULEURS DYNAMIQUES */}
      <div className="h-14 md:h-24 bg-orange-600 relative z-[200] border-t-4 md:border-t-[8px] border-orange-700 overflow-hidden flex items-center shadow-[0_-10px_50px_rgba(0,0,0,0.5)] shrink-0">
          <div className="bg-gray-950 h-full px-4 md:px-8 flex items-center justify-center z-20 shadow-[10px_0_30px_rgba(0,0,0,0.8)] border-r-4 border-orange-500">
              <Megaphone size={24} className="md:w-10 md:h-10 text-orange-500 animate-bounce" />
          </div>
          
          <div className="flex-1 overflow-hidden whitespace-nowrap">
              <div className="inline-block animate-tv-ticker">
                  {flashes.concat(flashes).concat(flashes).map((msg, i) => (
                      <span 
                        key={i} 
                        className={`${getMessageColorClass(msg.color)} text-xl md:text-6xl font-black px-8 md:px-20 uppercase italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] tracking-tight transition-colors duration-500`}
                      >
                          {msg.content} <span className="text-orange-950/30 mx-4 md:mx-8">///</span>
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
          animation: tv-ticker 35s linear infinite;
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
