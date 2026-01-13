
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
  Clock,
  CloudSun,
  PlayCircle
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
  
  // États de pagination pour les cycles
  const [productIdx, setProductIdx] = useState(0);
  const [planningPage, setPlanningPage] = useState(0);
  const [achievementIdx, setAchievementIdx] = useState(0);
  
  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [audioSrc, setAudioSrc] = useState(initialMusicUrl || '');
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Video Player Ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const products = liveStock.length > 0 ? liveStock : [];
  
  // Filtrage des interventions (En cours ou En attente)
  const planning = liveInterventions.length > 0 
    ? liveInterventions.filter(i => i.status === 'En cours' || i.status === 'En attente') 
    : [];
    
  const achievements = liveAchievements.length > 0 ? liveAchievements : [];
  const flashes = liveMessages.length > 0 ? liveMessages : [{ content: "Bienvenue chez EBF Technical Center", color: 'neutral' } as TickerMessage];

  // --- HORLOGE ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- AUDIO ENGINE ---
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

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && audioSrc) {
        audioRef.current.volume = 0.5;
        const tryPlay = async () => {
             try {
                 if (!isMuted) {
                    await audioRef.current?.play();
                    setAutoplayFailed(false);
                 }
             } catch (error) {
                 console.log("Autoplay bloqué par le navigateur.", error);
                 setAutoplayFailed(true);
                 setIsMuted(true);
             }
        };
        tryPlay();
    }
  }, [audioSrc]);

  // Gestion audio/vidéo
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

  // --- CYCLES ---
  // 1. Changement de mode (60s)
  useEffect(() => {
    const modeInterval = setInterval(() => {
      setActiveMode((prev) => {
          if (prev === 'PUBLICITE') return 'PLANNING';
          if (prev === 'PLANNING') return 'REALISATIONS';
          return 'PUBLICITE';
      });
    }, 60000); 
    return () => clearInterval(modeInterval);
  }, []);

  // 2. Produits (10s)
  useEffect(() => {
    if (activeMode !== 'PUBLICITE' || products.length === 0) return;
    const interval = setInterval(() => {
      setProductIdx((prev) => (prev + 1) % products.length);
    }, 10000); 
    return () => clearInterval(interval);
  }, [activeMode, products.length]);

  // 3. Planning (15s) - 3 items max
  const itemsPerPage = 3; 
  const totalPlanningPages = Math.ceil(planning.length / itemsPerPage) || 1;
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

  // 4. Réalisations
  useEffect(() => {
      if (activeMode !== 'REALISATIONS' || achievements.length === 0) {
          setAchievementIdx(0);
          return;
      }
      const currentItem = achievements[achievementIdx];
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
  const currentPlanningSlice = planning.slice(planningPage * itemsPerPage, (planningPage + 1) * itemsPerPage);
  const currentAchievement = achievements[achievementIdx];
  const todayDateFull = currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const getMessageColorClass = (color: string) => {
    switch(color) {
        case 'green': return 'text-green-500';
        case 'yellow': return 'text-yellow-500';
        case 'red': return 'text-red-500';
        default: return 'text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex overflow-hidden font-sans select-none z-[1000]">
      
      {/* AUDIO HIDDEN */}
      {audioSrc && (
          <audio 
            ref={audioRef} 
            loop 
            src={audioSrc} 
            preload="auto"
            onError={(e) => console.error("Erreur lecture audio:", e)}
          />
      )}

      {/* OVERLAY AUTOPLAY */}
      {autoplayFailed && (
          <div className="absolute inset-0 z-[2000] bg-black/90 flex flex-col items-center justify-center animate-fade-in">
              <button 
                onClick={handleStartShow}
                className="bg-orange-600 hover:bg-orange-500 text-white px-12 py-6 rounded-2xl font-black text-3xl shadow-2xl flex items-center gap-4 hover:scale-105 transition-transform animate-bounce"
              >
                  <Tv size={40} /> 
                  <span>ACTIVER L'AFFICHAGE</span>
              </button>
          </div>
      )}

      {/* --- SIDEBAR GAUCHE (Type App) --- */}
      <aside className="w-[340px] bg-white border-r border-gray-200 flex flex-col justify-between shadow-xl z-20 shrink-0">
          <div>
              {/* Logo Header */}
              <div className="h-32 flex items-center justify-center border-b border-gray-100 p-6">
                  <Logo url={customLogo} size="lg" />
              </div>

              {/* Menu Items (Indicateurs de mode) */}
              <div className="p-4 space-y-3">
                  <div className={`p-4 rounded-2xl flex items-center gap-4 transition-all duration-500 ${activeMode === 'PUBLICITE' ? 'bg-orange-500 text-white shadow-lg scale-105' : 'bg-gray-50 text-gray-400'}`}>
                      <LayoutGrid size={28} />
                      <div>
                          <p className="font-black uppercase text-sm tracking-wider">Catalogue</p>
                          <p className="text-[10px] font-bold opacity-80 uppercase">Nos Produits</p>
                      </div>
                  </div>

                  <div className={`p-4 rounded-2xl flex items-center gap-4 transition-all duration-500 ${activeMode === 'PLANNING' ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-50 text-gray-400'}`}>
                      <ClipboardList size={28} />
                      <div>
                          <p className="font-black uppercase text-sm tracking-wider">Planning</p>
                          <p className="text-[10px] font-bold opacity-80 uppercase">Interventions</p>
                      </div>
                  </div>

                  <div className={`p-4 rounded-2xl flex items-center gap-4 transition-all duration-500 ${activeMode === 'REALISATIONS' ? 'bg-purple-600 text-white shadow-lg scale-105' : 'bg-gray-50 text-gray-400'}`}>
                      <Trophy size={28} />
                      <div>
                          <p className="font-black uppercase text-sm tracking-wider">Réalisations</p>
                          <p className="text-[10px] font-bold opacity-80 uppercase">Nos Succès</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="mb-6 space-y-4">
                  <div className="flex items-center gap-3 text-gray-600">
                      <Clock size={24} className="text-orange-500"/>
                      <div>
                          <p className="text-2xl font-black leading-none">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest">{todayDateFull}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                      <CloudSun size={24} className="text-blue-500"/>
                      <div>
                          <p className="text-lg font-black leading-none">Abidjan</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest">30°C Ensoleillé</p>
                      </div>
                  </div>
              </div>
              
              <div className="flex gap-2">
                 <button onClick={toggleMute} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 flex items-center justify-center">
                     {isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}
                 </button>
                 {onClose && (
                    <button onClick={onClose} className="flex-1 py-3 bg-red-50 border border-red-100 rounded-xl text-red-500 hover:bg-red-100 flex items-center justify-center font-black text-xs uppercase">
                        Fermer
                    </button>
                 )}
              </div>
          </div>
      </aside>

      {/* --- CONTENU PRINCIPAL (DROITE) --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-900 relative overflow-hidden">
          
          {/* Header Zone (Titre Module) */}
          <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 relative z-10">
               <h1 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter flex items-center gap-3">
                   {activeMode === 'PUBLICITE' && <><span className="text-orange-500">///</span> Catalogue Numérique</>}
                   {activeMode === 'PLANNING' && <><span className="text-blue-600">///</span> Planning Opérationnel</>}
                   {activeMode === 'REALISATIONS' && <><span className="text-purple-600">///</span> Portfolio EBF</>}
               </h1>
               <div className="flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full border border-green-200">
                   <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                   <span className="text-xs font-black uppercase tracking-widest">Diffusion Live</span>
               </div>
          </header>

          {/* CONTENT BODY (Flex-1) */}
          <div className="flex-1 relative overflow-hidden flex flex-col">
              
              {/* MODE 1: PUBLICITE */}
              {activeMode === 'PUBLICITE' && (
                  currentProduct ? (
                      <div className="flex-1 flex animate-fade-in bg-white">
                          <div className="w-1/2 h-full p-8 flex items-center justify-center bg-gray-50 relative overflow-hidden">
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-gray-50 to-gray-200 opacity-50"></div>
                             <img 
                                src={currentProduct.imageUrls?.[0]} 
                                className="max-w-full max-h-full object-contain drop-shadow-2xl z-10 animate-scale-in"
                                alt={currentProduct.name}
                             />
                          </div>
                          <div className="w-1/2 h-full p-12 flex flex-col justify-center bg-white">
                              <span className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-lg text-sm font-black uppercase tracking-widest mb-4 w-fit">
                                  {currentProduct.category}
                              </span>
                              <h2 className="text-5xl font-black text-gray-900 leading-tight uppercase mb-8 line-clamp-3">
                                  {currentProduct.name}
                              </h2>
                              <div className="space-y-6 mb-12">
                                  <div className="flex items-center gap-4 text-gray-500">
                                      <Zap size={28} className="text-orange-500"/>
                                      <span className="text-xl font-bold uppercase tracking-wider">{currentProduct.supplier}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-gray-500">
                                      <ShieldCheck size={28} className="text-green-500"/>
                                      <span className="text-xl font-bold uppercase tracking-wider">Garantie EBF</span>
                                  </div>
                              </div>
                              <div className="mt-auto bg-gray-900 text-white p-8 rounded-3xl shadow-2xl flex items-center justify-between">
                                  <div>
                                      <p className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] mb-1">Prix Promo</p>
                                      <p className="text-6xl font-black tracking-tighter">{currentProduct.unitPrice.toLocaleString()}<span className="text-2xl text-orange-500 ml-1">F</span></p>
                                  </div>
                                  <div className="bg-orange-600 p-4 rounded-2xl">
                                      <Zap size={32} className="text-white"/>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ) : <div className="flex-1 flex items-center justify-center text-white"><Loader2 className="animate-spin" size={48}/></div>
              )}

              {/* MODE 2: PLANNING */}
              {activeMode === 'PLANNING' && (
                  <div className="flex-1 bg-[#0f172a] p-8 flex flex-col animate-slide-up">
                      <div className="flex items-center justify-between mb-6 text-white/50">
                           <span className="text-lg font-bold uppercase tracking-widest">Suivi des Techniciens</span>
                           <span className="bg-white/10 px-4 py-1 rounded-full text-xs font-mono">Page {planningPage + 1}/{totalPlanningPages}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
                          {currentPlanningSlice.map(inter => (
                              <div key={inter.id} className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col relative overflow-hidden">
                                  <div className="flex justify-between items-start mb-4">
                                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${inter.status === 'En cours' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>
                                          {inter.status}
                                      </span>
                                      {inter.site && <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><MapPin size={12}/> {inter.site}</span>}
                                  </div>
                                  <h3 className="text-2xl font-black text-white uppercase leading-none mb-2 line-clamp-2">{inter.client}</h3>
                                  <p className="text-xs text-gray-400 font-bold uppercase mb-4">{inter.interventionType} • {inter.domain}</p>
                                  <div className="flex-1 bg-black/20 rounded-2xl p-4 mb-4 min-h-0">
                                      <p className="text-sm font-medium text-gray-300 leading-snug line-clamp-5">{inter.description}</p>
                                  </div>
                                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-3 text-green-400">
                                      <Phone size={18}/>
                                      <span className="text-lg font-mono font-black tracking-widest">{inter.clientPhone || '---'}</span>
                                  </div>
                              </div>
                          ))}
                          {/* Empty placeholders */}
                          {[...Array(itemsPerPage - currentPlanningSlice.length)].map((_, i) => (
                              <div key={`empty-${i}`} className="bg-white/5 border border-white/5 border-dashed rounded-3xl flex items-center justify-center opacity-10">
                                  <Calendar size={48} className="text-white"/>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* MODE 3: REALISATIONS */}
              {activeMode === 'REALISATIONS' && (
                  currentAchievement ? (
                      <div className="flex-1 relative bg-black flex items-center justify-center animate-fade-in">
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
                                className="w-full h-full object-contain animate-scale-in"
                                alt={currentAchievement.title}
                              />
                          )}
                          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                              <div className="bg-black/70 backdrop-blur-md px-10 py-6 rounded-3xl border border-white/10 text-center max-w-4xl">
                                  <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">{currentAchievement.title}</h2>
                                  {currentAchievement.description && <p className="text-lg text-gray-300 line-clamp-2">{currentAchievement.description}</p>}
                              </div>
                          </div>
                          {currentAchievement.mediaType === 'video' && (
                              <div className="absolute top-8 right-8 bg-red-600 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse">
                                  <PlayCircle size={20}/> <span className="text-xs font-black uppercase">Lecture Vidéo</span>
                              </div>
                          )}
                      </div>
                  ) : <div className="flex-1 flex items-center justify-center text-white/20"><Loader2 className="animate-spin" size={48}/></div>
              )}

          </div>

          {/* FOOTER TICKER (Bas de la zone de contenu) */}
          <div className="h-16 bg-black border-t-4 border-orange-600 flex items-center shrink-0 z-20">
              <div className="h-full bg-gray-900 px-6 flex items-center justify-center border-r-4 border-orange-500 shrink-0">
                  <Megaphone size={24} className="text-orange-500 animate-pulse" />
              </div>
              <div className="flex-1 overflow-hidden whitespace-nowrap bg-black">
                  <div className="inline-block animate-tv-ticker leading-[4rem]">
                      {flashes.concat(flashes).concat(flashes).map((msg, i) => (
                          <span key={i} className={`${getMessageColorClass(msg.color)} text-3xl font-black px-16 uppercase italic tracking-tight`}>
                              {msg.content} <span className="text-gray-800 mx-8">///</span>
                          </span>
                      ))}
                  </div>
              </div>
          </div>

      </main>

      <style>{`
        @keyframes tv-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-tv-ticker {
          animation: tv-ticker 30s linear infinite;
        }
        @keyframes scale-in {
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
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
        .line-clamp-5 {
          display: -webkit-box;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ShowcaseMode;
