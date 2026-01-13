
import React, { useState, useEffect, useRef } from 'react';
import { StockItem, Intervention, TickerMessage, Achievement } from '../types';
import { supabase } from '../lib/supabase';
import { 
  X, 
  Zap, 
  ShieldCheck,
  Calendar,
  Megaphone,
  LayoutGrid,
  ClipboardList,
  MapPin,
  Volume2,
  VolumeX,
  Phone,
  Tv,
  Trophy,
  Loader2,
  CloudSun
} from 'lucide-react';
import { Logo } from '../constants';

interface ShowcaseModeProps {
  onClose?: () => void;
  liveStock?: StockItem[];
  liveInterventions?: Intervention[];
  liveMessages?: TickerMessage[];
  liveAchievements?: Achievement[];
  customLogo?: string;
  initialMusicUrl?: string;
}

const ShowcaseMode: React.FC<ShowcaseModeProps> = ({ 
  onClose, 
  liveStock = [], 
  liveInterventions = [], 
  liveMessages = [],
  liveAchievements = [],
  customLogo,
  initialMusicUrl
}) => {
  const [activeMode, setActiveMode] = useState<'PUBLICITE' | 'PLANNING' | 'REALISATIONS'>('PUBLICITE');
  
  // Pagination et Cycles
  const [productIdx, setProductIdx] = useState(0);
  const [planningPage, setPlanningPage] = useState(0);
  const [achievementIdx, setAchievementIdx] = useState(0);
  
  // Audio
  const [isMuted, setIsMuted] = useState(false);
  const [audioSrc, setAudioSrc] = useState(initialMusicUrl || '');
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Video
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Données filtrées
  const products = liveStock.length > 0 ? liveStock : [];
  const planning = liveInterventions.length > 0 
    ? liveInterventions.filter(i => i.status === 'En cours' || i.status === 'En attente') 
    : [];
  const achievements = liveAchievements.length > 0 ? liveAchievements : [];
  const flashes = liveMessages.length > 0 ? liveMessages : [{ content: "Bienvenue chez EBF Technical Center", color: 'neutral' } as TickerMessage];

  // Horloge
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio Sync
  useEffect(() => {
    const channel = supabase.channel('tv-music-showcase')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tv_settings' },
            (payload) => {
                if ((payload.new as any)?.key === 'background_music') {
                    const newVal = (payload.new as any).value;
                    if (newVal) setAudioSrc(newVal);
                }
            }
        )
        .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Audio Autoplay logic
  useEffect(() => {
    if (audioRef.current && audioSrc) {
        audioRef.current.volume = 0.6;
        const tryPlay = async () => {
             try {
                 if (!isMuted) {
                    await audioRef.current?.play();
                    setAutoplayFailed(false);
                 }
             } catch (error) {
                 console.log("Autoplay bloqué");
                 setAutoplayFailed(true);
                 setIsMuted(true);
             }
        };
        tryPlay();
    }
  }, [audioSrc]);

  // Pause audio quand vidéo active
  useEffect(() => {
      const currentAch = achievements[achievementIdx];
      const isVideoPlaying = activeMode === 'REALISATIONS' && currentAch?.mediaType === 'video';
      
      if (audioRef.current) {
          if (isVideoPlaying) {
              audioRef.current.pause();
          } else if (!isMuted && !autoplayFailed) {
              audioRef.current.play().catch(() => {});
          }
      }
  }, [activeMode, achievementIdx, achievements, isMuted, autoplayFailed]);

  const handleStartShow = async () => {
    setIsMuted(false);
    setAutoplayFailed(false);
    if(audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.play().catch(console.error);
    }
    try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch (e) { console.error("Erreur plein écran:", e); }
  };

  const toggleMute = () => {
      setIsMuted(!isMuted);
      if (audioRef.current) {
          audioRef.current.muted = !audioRef.current.muted;
          if (!audioRef.current.muted) audioRef.current.play().catch(() => setAutoplayFailed(true));
      }
  };

  // --- LOGIQUE DES CYCLES ---
  
  // 1. Changement de mode global (toutes les 45 secondes)
  useEffect(() => {
    const modeInterval = setInterval(() => {
      setActiveMode((prev) => {
          if (prev === 'PUBLICITE') return 'PLANNING';
          if (prev === 'PLANNING') return 'REALISATIONS';
          return 'PUBLICITE';
      });
    }, 45000); 
    return () => clearInterval(modeInterval);
  }, []);

  // 2. Cycle Produits (10s)
  useEffect(() => {
    if (activeMode !== 'PUBLICITE' || products.length === 0) return;
    const interval = setInterval(() => {
      setProductIdx((prev) => (prev + 1) % products.length);
    }, 10000); 
    return () => clearInterval(interval);
  }, [activeMode, products.length]);

  // 3. Cycle Planning (15s) - Pagination
  // CRUCIAL: Limite à 3 items pour éviter le scroll sur TV 43"
  const ITEMS_PER_PLANNING_PAGE = 3; 
  const totalPlanningPages = Math.ceil(planning.length / ITEMS_PER_PLANNING_PAGE) || 1;
  
  useEffect(() => {
    if (activeMode !== 'PLANNING' || planning.length === 0) {
        setPlanningPage(0); 
        return;
    }
    const interval = setInterval(() => {
      setPlanningPage((prev) => (prev + 1) % totalPlanningPages);
    }, 15000); 
    return () => clearInterval(interval);
  }, [activeMode, planning.length, totalPlanningPages]);

  // 4. Cycle Réalisations
  useEffect(() => {
      if (activeMode !== 'REALISATIONS' || achievements.length === 0) {
          setAchievementIdx(0);
          return;
      }
      const currentItem = achievements[achievementIdx];
      // Si c'est une image, on passe à la suivante après 10s. Si vidéo, c'est l'event onEnded qui gère.
      if (currentItem.mediaType === 'image') {
          const timer = window.setTimeout(() => {
              setAchievementIdx(prev => (prev + 1) % achievements.length);
          }, 10000);
          return () => clearTimeout(timer);
      }
  }, [activeMode, achievements.length, achievementIdx]);

  const handleVideoEnded = () => {
      setAchievementIdx(prev => (prev + 1) % achievements.length);
  };

  // --- DATA ---
  const currentProduct = products[productIdx];
  const currentPlanningSlice = planning.slice(planningPage * ITEMS_PER_PLANNING_PAGE, (planningPage + 1) * ITEMS_PER_PLANNING_PAGE);
  const currentAchievement = achievements[achievementIdx];
  const todayDate = currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeString = currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  const getMessageColorClass = (color: string) => {
    switch(color) {
        case 'green': return 'text-green-500';
        case 'yellow': return 'text-yellow-400';
        case 'red': return 'text-red-500';
        default: return 'text-white';
    }
  };

  // --- RENDER ---
  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden font-sans select-none z-[1000]">
      
      {/* Background Audio */}
      {audioSrc && (
          <audio ref={audioRef} loop src={audioSrc} preload="auto" onError={(e) => console.error("Erreur lecture audio:", e)} />
      )}

      {/* Ecran "Cliquer pour démarrer" si autoplay bloqué */}
      {autoplayFailed && (
          <div className="absolute inset-0 z-[2000] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
              <button 
                onClick={handleStartShow}
                className="bg-orange-600 hover:bg-orange-500 text-white px-16 py-8 rounded-full font-black text-4xl shadow-[0_0_60px_rgba(234,88,12,0.6)] flex items-center gap-6 hover:scale-105 transition-transform animate-pulse"
              >
                  <Tv size={48} /> 
                  <span>LANCER LA TV</span>
              </button>
          </div>
      )}

      {/* --- HEADER FIXE (Hauteur définie 10%) --- */}
      <header className="h-[10vh] bg-gray-900 border-b-4 border-orange-600 flex items-center justify-between px-8 shrink-0 relative z-20 shadow-2xl">
          <div className="flex items-center gap-6">
              <div className="bg-white/10 p-2 rounded-xl">
                 <Logo url={customLogo} size="md" theme="dark" />
              </div>
              
              {/* Indicateurs de Mode */}
              <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
                  <div className={`px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all ${activeMode === 'PUBLICITE' ? 'bg-orange-600 text-white font-black' : 'text-gray-500'}`}>
                      <LayoutGrid size={16}/> <span className="uppercase text-xs tracking-wider">Offres</span>
                  </div>
                  <div className={`px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all ${activeMode === 'PLANNING' ? 'bg-blue-600 text-white font-black' : 'text-gray-500'}`}>
                      <ClipboardList size={16}/> <span className="uppercase text-xs tracking-wider">Chantiers</span>
                  </div>
                  <div className={`px-4 py-1.5 rounded-lg flex items-center gap-2 transition-all ${activeMode === 'REALISATIONS' ? 'bg-purple-600 text-white font-black' : 'text-gray-500'}`}>
                      <Trophy size={16}/> <span className="uppercase text-xs tracking-wider">Réalisations</span>
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-6">
              <div className="text-right">
                  <p className="text-4xl font-black leading-none tracking-tighter text-white">{timeString}</p>
                  <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">{todayDate}</p>
              </div>
              <div className="h-10 w-px bg-white/20"></div>
              <div className="flex items-center gap-3 text-blue-400">
                  <CloudSun size={32} />
                  <span className="text-xl font-black">30°C</span>
              </div>
              
              <div className="flex gap-2 ml-4">
                 <button onClick={toggleMute} className={`p-3 rounded-full border ${isMuted ? 'border-gray-700 text-gray-500' : 'border-green-500/50 text-green-400 bg-green-500/10'}`}>
                    {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                 </button>
                 {onClose && (
                    <button onClick={onClose} className="p-3 bg-red-900/20 text-red-500 border border-red-900/50 rounded-full hover:bg-red-600 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                 )}
              </div>
          </div>
      </header>

      {/* --- CONTENU PRINCIPAL (Hauteur restante 82%) --- */}
      <main className="flex-1 relative overflow-hidden bg-black flex flex-col justify-center h-[82vh]">
          
          {/* 1. PRODUITS */}
          {activeMode === 'PUBLICITE' && (
              currentProduct ? (
                  <div className="w-full h-full flex animate-fade-in">
                      {/* Image Gauche */}
                      <div className="w-[45%] h-full bg-gray-900 relative flex items-center justify-center p-12 border-r border-white/10">
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                          <img 
                            src={currentProduct.imageUrls?.[0]} 
                            className="max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-10 animate-scale-in"
                            alt={currentProduct.name}
                          />
                          <div className="absolute top-8 left-8 bg-orange-600 text-white px-6 py-2 rounded-lg font-black uppercase tracking-widest text-lg shadow-lg">
                              {currentProduct.category}
                          </div>
                      </div>
                      
                      {/* Info Droite */}
                      <div className="w-[55%] h-full bg-black p-16 flex flex-col justify-center relative overflow-hidden">
                          <div className="absolute right-0 top-0 w-64 h-64 bg-orange-600/20 blur-[100px] rounded-full"></div>
                          
                          <div className="relative z-10">
                              <h2 className="text-7xl font-black text-white uppercase leading-[0.9] tracking-tighter mb-8 line-clamp-3">
                                  {currentProduct.name}
                              </h2>
                              
                              <div className="flex flex-col gap-6 mb-12 border-l-4 border-gray-700 pl-8">
                                  <div className="flex items-center gap-4">
                                      <Zap className="text-yellow-500" size={32} />
                                      <span className="text-3xl text-gray-300 font-bold uppercase">{currentProduct.supplier}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <ShieldCheck className="text-green-500" size={32} />
                                      <span className="text-3xl text-gray-300 font-bold uppercase">Garantie & Qualité</span>
                                  </div>
                              </div>

                              <div className="bg-gray-900 border border-white/10 p-8 rounded-3xl inline-block shadow-2xl">
                                  <p className="text-orange-500 text-xl font-black uppercase tracking-[0.3em] mb-2">Prix Spécial</p>
                                  <p className="text-8xl font-black text-white tracking-tighter">
                                      {currentProduct.unitPrice.toLocaleString()} <span className="text-4xl text-gray-500">FCFA</span>
                                  </p>
                              </div>
                          </div>
                      </div>
                  </div>
              ) : <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-white" size={64}/></div>
          )}

          {/* 2. PLANNING (Optimisé NO SCROLL) */}
          {activeMode === 'PLANNING' && (
              <div className="w-full h-full p-12 bg-gray-900 relative animate-slide-up flex flex-col">
                  {/* Titre Section */}
                  <div className="flex justify-between items-end mb-10 shrink-0 border-b border-white/10 pb-4">
                      <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter">
                          Interventions <span className="text-blue-500">En Cours</span>
                      </h2>
                      <div className="flex items-center gap-4">
                          <span className="text-2xl font-black text-gray-500">
                             PAGE {planningPage + 1} / {totalPlanningPages}
                          </span>
                          <div className="flex gap-1">
                              {[...Array(totalPlanningPages)].map((_, i) => (
                                  <div key={i} className={`w-3 h-3 rounded-full ${i === planningPage ? 'bg-blue-500' : 'bg-gray-700'}`}></div>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* GRILLE 3 COLONNES FIXE */}
                  <div className="grid grid-cols-3 gap-8 flex-1 h-full max-h-full">
                      {currentPlanningSlice.map((inter) => (
                          <div key={inter.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 flex flex-col h-full shadow-2xl relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                  <ClipboardList size={100} className="text-white"/>
                              </div>
                              
                              <div className="flex justify-between items-start mb-6">
                                  <span className={`px-4 py-2 rounded-lg text-lg font-black uppercase tracking-widest ${inter.status === 'En cours' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>
                                      {inter.status}
                                  </span>
                                  {inter.site && (
                                      <span className="flex items-center gap-2 text-gray-400 font-bold uppercase text-lg bg-black/30 px-3 py-1 rounded-lg">
                                          <MapPin size={18}/> {inter.site}
                                      </span>
                                  )}
                              </div>

                              <div className="mb-4">
                                  <h3 className="text-4xl font-black text-white uppercase leading-[0.9] tracking-tight mb-2 line-clamp-2">
                                      {inter.client}
                                  </h3>
                                  <p className="text-xl text-blue-400 font-bold uppercase tracking-wider">{inter.interventionType}</p>
                              </div>

                              <div className="flex-1 bg-black/20 rounded-2xl p-6 mb-6 overflow-hidden">
                                  <p className="text-2xl text-gray-300 font-medium leading-snug line-clamp-4">
                                      {inter.description}
                                  </p>
                              </div>

                              <div className="mt-auto pt-6 border-t border-white/10 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-xl font-black">
                                          {inter.technician.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Technicien</p>
                                          <p className="text-xl text-white font-black uppercase">{inter.technician.split(' ')[0]}</p>
                                      </div>
                                  </div>
                                  <Phone size={32} className="text-green-500" />
                              </div>
                          </div>
                      ))}
                      
                      {/* Placeholders si moins de 3 items */}
                      {[...Array(ITEMS_PER_PLANNING_PAGE - currentPlanningSlice.length)].map((_, i) => (
                          <div key={`empty-${i}`} className="bg-white/5 border border-white/5 border-dashed rounded-[2rem] flex items-center justify-center opacity-20">
                              <div className="text-center">
                                  <Calendar size={64} className="mx-auto mb-4"/>
                                  <p className="text-2xl font-black uppercase">Disponible</p>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* 3. REALISATIONS (Plein écran) */}
          {activeMode === 'REALISATIONS' && (
              currentAchievement ? (
                  <div className="w-full h-full relative bg-black flex items-center justify-center animate-fade-in">
                      {currentAchievement.mediaType === 'video' ? (
                          <video 
                              ref={videoRef}
                              src={currentAchievement.mediaUrl}
                              className="w-full h-full object-contain"
                              autoPlay
                              muted={isMuted}
                              onEnded={handleVideoEnded}
                              onError={handleVideoEnded}
                          />
                      ) : (
                          <img 
                              src={currentAchievement.mediaUrl}
                              alt={currentAchievement.title}
                              className="w-full h-full object-contain animate-scale-in"
                          />
                      )}
                      
                      <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                          <div className="bg-black/80 backdrop-blur-xl px-12 py-8 rounded-[3rem] border border-white/20 text-center max-w-5xl shadow-2xl">
                              <h2 className="text-5xl font-black uppercase text-white tracking-tighter mb-2">
                                  {currentAchievement.title}
                              </h2>
                              {currentAchievement.description && (
                                  <p className="text-2xl text-gray-300 font-medium line-clamp-2">
                                      {currentAchievement.description}
                                  </p>
                              )}
                          </div>
                      </div>
                  </div>
              ) : <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-white" size={64}/></div>
          )}

      </main>

      {/* --- FOOTER TICKER (Hauteur fixe 8%) --- */}
      <footer className="h-[8vh] bg-orange-600 flex items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20 shrink-0">
          <div className="bg-gray-950 h-full px-10 flex items-center justify-center border-r-4 border-orange-800 z-20">
              <Megaphone className="w-8 h-8 text-white animate-bounce" />
              <span className="ml-4 font-black text-white uppercase tracking-[0.2em] text-lg">Flash Info</span>
          </div>
          <div className="flex-1 bg-gray-900 h-full flex items-center overflow-hidden whitespace-nowrap relative">
              <div className="inline-block animate-tv-ticker">
                  {flashes.concat(flashes).concat(flashes).map((msg, i) => (
                      <span 
                        key={i} 
                        className={`${getMessageColorClass(msg.color)} text-4xl font-black px-24 uppercase italic tracking-tight drop-shadow-md`}
                      >
                          {msg.content} <span className="text-white/20 mx-10">///</span>
                      </span>
                  ))}
              </div>
          </div>
      </footer>

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
          animation: scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ShowcaseMode;
