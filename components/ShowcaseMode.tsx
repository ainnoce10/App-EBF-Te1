
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
  Loader2
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

  const products = liveStock.length > 0 ? liveStock : [];
  
  // Filtrage des interventions (En cours ou En attente)
  const planning = liveInterventions.length > 0 
    ? liveInterventions.filter(i => i.status === 'En cours' || i.status === 'En attente') 
    : [];
    
  const achievements = liveAchievements.length > 0 ? liveAchievements : [];
  const flashes = liveMessages.length > 0 ? liveMessages : [{ content: "Bienvenue chez EBF Technical Center", color: 'neutral' } as TickerMessage];

  // --- AUDIO ENGINE ---
  useEffect(() => {
    // Écoute des changements de musique en temps réel
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

  // Gestion intelligente de l'audio pendant les vidéos
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

  // --- INTERACTION UTILISATEUR (Pour débloquer l'audio) ---
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
      if (isMuted) {
          setIsMuted(false);
          if (audioRef.current) {
              audioRef.current.muted = false;
              audioRef.current.play().catch(() => setAutoplayFailed(true));
          }
      } else {
          setIsMuted(true);
          if (audioRef.current) audioRef.current.muted = true;
      }
  };

  // --- CYCLES D'AFFICHAGE AUTOMATIQUES ---
  
  // 1. Changement de mode global (toutes les 60 secondes)
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

  // 2. Cycle Produits (toutes les 10 secondes)
  useEffect(() => {
    if (activeMode !== 'PUBLICITE' || products.length === 0) return;
    const interval = setInterval(() => {
      setProductIdx((prev) => (prev + 1) % products.length);
    }, 10000); 
    return () => clearInterval(interval);
  }, [activeMode, products.length]);

  // 3. Cycle Planning (3 items par page, toutes les 15 secondes)
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

  // 4. Cycle Réalisations (Image: 10s, Vidéo: Auto)
  useEffect(() => {
      if (activeMode !== 'REALISATIONS' || achievements.length === 0) {
          setAchievementIdx(0);
          return;
      }
      const currentItem = achievements[achievementIdx];
      let timer: number;
      
      // Si c'est une image, on change après 10s. Si c'est une vidéo, le onEnded s'en charge.
      if (currentItem.mediaType === 'image') {
          timer = window.setTimeout(() => {
              setAchievementIdx(prev => (prev + 1) % achievements.length);
          }, 10000);
      }
      return () => clearTimeout(timer);
  }, [activeMode, achievements.length, achievementIdx]);

  const handleVideoEnded = () => {
      setAchievementIdx(prev => (prev + 1) % achievements.length);
  };

  // --- DONNÉES COURANTES ---
  const currentProduct = products[productIdx];
  const currentPlanningSlice = planning.slice(planningPage * itemsPerPage, (planningPage + 1) * itemsPerPage);
  const currentAchievement = achievements[achievementIdx];
  const todayDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  // Helpers de rendu
  const getMessageColorClass = (color: string) => {
    switch(color) {
        case 'green': return 'text-green-400';
        case 'yellow': return 'text-yellow-400';
        case 'red': return 'text-red-500';
        default: return 'text-white';
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white font-sans overflow-hidden flex flex-col z-50">
      
      {/* LECTEUR AUDIO INVISIBLE */}
      {audioSrc && (
          <audio 
            ref={audioRef} 
            loop 
            src={audioSrc} 
            preload="auto"
            onPlay={() => setAutoplayFailed(false)}
            onError={(e) => console.error("Erreur lecture audio:", e)}
          />
      )}

      {/* OVERLAY SI AUTOPLAY BLOQUÉ */}
      {autoplayFailed && (
          <div className="absolute inset-0 z-[1000] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
              <button 
                onClick={handleStartShow}
                className="bg-orange-600 hover:bg-orange-500 text-white px-12 py-8 rounded-[3rem] font-black text-4xl shadow-[0_0_80px_rgba(249,115,22,0.6)] flex items-center gap-6 hover:scale-105 transition-transform animate-pulse"
              >
                  <Tv size={60} /> 
                  <span>LANCER TV EBF</span>
              </button>
              <p className="text-white/50 mt-8 font-bold text-xl uppercase tracking-widest">Cliquez pour activer le son et le plein écran</p>
          </div>
      )}

      {/* 1. HEADER (FIXE: 15% HAUTEUR MAX) */}
      <header className="h-[12vh] shrink-0 bg-gray-950 border-b-8 border-orange-600 flex items-center justify-between px-6 shadow-2xl relative z-20">
          <div className="flex items-center gap-6">
              <div className="bg-white p-2 rounded-xl h-16 w-auto flex items-center">
                  <Logo url={customLogo} size="md" theme="light" />
              </div>
              
              {/* Indicateurs de mode */}
              <div className="flex bg-white/10 rounded-xl p-1.5 border border-white/10">
                  <div className={`px-6 py-2 rounded-lg font-black uppercase tracking-wider flex items-center gap-3 transition-all ${activeMode === 'PUBLICITE' ? 'bg-orange-600 text-white shadow-lg' : 'text-white/30'}`}>
                      <LayoutGrid size={20}/> Produits
                  </div>
                  <div className={`px-6 py-2 rounded-lg font-black uppercase tracking-wider flex items-center gap-3 transition-all ${activeMode === 'PLANNING' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/30'}`}>
                      <ClipboardList size={20}/> Chantiers
                  </div>
                  <div className={`px-6 py-2 rounded-lg font-black uppercase tracking-wider flex items-center gap-3 transition-all ${activeMode === 'REALISATIONS' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/30'}`}>
                      <Trophy size={20}/> Réalisations
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-4">
              <div className="text-right hidden xl:block">
                  <p className="text-2xl font-black leading-none">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{todayDate}</p>
              </div>
              <button onClick={toggleMute} className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                  {isMuted ? <VolumeX size={24} className="text-red-400"/> : <Volume2 size={24} className="text-green-400"/>}
              </button>
              {onClose && (
                  <button onClick={onClose} className="p-4 bg-red-600/20 text-red-500 rounded-full hover:bg-red-600 hover:text-white transition-colors">
                      <X size={24}/>
                  </button>
              )}
          </div>
      </header>

      {/* 2. CONTENU PRINCIPAL (EXTENSIBLE: FLEX-1) */}
      <main className="flex-1 min-h-0 relative bg-gray-900 overflow-hidden">
          
          {/* MODE: PUBLICITE (PRODUITS) */}
          {activeMode === 'PUBLICITE' && (
              currentProduct ? (
                  <div className="flex w-full h-full animate-fade-in">
                      {/* Image Gauche (45%) */}
                      <div className="w-[45%] h-full bg-black relative flex items-center justify-center p-8 border-r border-white/10">
                          <div className="absolute inset-0 bg-gradient-to-tr from-orange-900/20 to-transparent"></div>
                          <img 
                              src={currentProduct.imageUrls?.[0] || 'https://placehold.co/800x800/1a1a1a/ffffff?text=No+Image'} 
                              alt={currentProduct.name}
                              className="max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10"
                          />
                      </div>
                      {/* Infos Droite (55%) */}
                      <div className="w-[55%] h-full bg-white text-gray-900 p-12 flex flex-col justify-center">
                          <div className="mb-auto">
                              <span className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-lg text-lg font-black uppercase tracking-widest mb-4">
                                  {currentProduct.category}
                              </span>
                              <h1 className="text-6xl font-black uppercase leading-tight tracking-tighter mb-6 line-clamp-3">
                                  {currentProduct.name}
                              </h1>
                              <div className="flex gap-8 mb-8">
                                  <div className="flex items-center gap-3 text-gray-500 font-bold uppercase tracking-wider text-xl">
                                      <Zap className="text-orange-500" size={24}/> {currentProduct.supplier}
                                  </div>
                                  <div className="flex items-center gap-3 text-gray-500 font-bold uppercase tracking-wider text-xl">
                                      <ShieldCheck className="text-green-500" size={24}/> Stock: {currentProduct.quantity}
                                  </div>
                              </div>
                          </div>
                          
                          <div className="bg-gray-900 text-white p-8 rounded-3xl flex items-center justify-between shadow-2xl">
                              <div>
                                  <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Prix Unitaire</p>
                                  <p className="text-7xl font-black tracking-tighter text-white">
                                      {currentProduct.unitPrice.toLocaleString()} <span className="text-2xl text-orange-500">FCFA</span>
                                  </p>
                              </div>
                              <div className="bg-orange-600 p-4 rounded-2xl">
                                  <Zap size={40} className="text-white"/>
                              </div>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="flex items-center justify-center h-full text-white/20">
                      <Loader2 size={60} className="animate-spin"/>
                  </div>
              )
          )}

          {/* MODE: PLANNING (CHANTIERS) - GRILLE STRICTE */}
          {activeMode === 'PLANNING' && (
              <div className="w-full h-full p-8 flex flex-col animate-slide-up bg-[#0f172a]">
                  <div className="flex justify-between items-end mb-6 shrink-0 border-b border-white/10 pb-4">
                      <div>
                          <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">Planning Chantiers</h2>
                          <p className="text-blue-400 font-bold text-xl uppercase tracking-widest mt-2">{todayDate}</p>
                      </div>
                      <div className="bg-white/10 px-6 py-2 rounded-full font-mono text-xl font-bold text-blue-300">
                          Page {planningPage + 1} / {totalPlanningPages}
                      </div>
                  </div>

                  {/* GRILLE 3 COLONNES QUI REMPLIT L'ESPACE RESTANT */}
                  <div className="flex-1 grid grid-cols-3 gap-8 min-h-0">
                      {currentPlanningSlice.map((inter) => (
                          <div key={inter.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex flex-col h-full relative overflow-hidden shadow-lg group">
                              <div className="flex justify-between items-start mb-4">
                                  <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${inter.status === 'En cours' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>
                                      {inter.status}
                                  </span>
                                  {inter.site && (
                                      <span className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase">
                                          <MapPin size={14}/> {inter.site}
                                      </span>
                                  )}
                              </div>

                              <h3 className="text-2xl font-black uppercase leading-tight mb-2 text-white line-clamp-2">
                                  {inter.client}
                              </h3>
                              <p className="text-sm text-gray-400 font-bold uppercase mb-4">
                                  {inter.interventionType} • {inter.domain}
                              </p>

                              {/* Description: Flex-1 pour prendre l'espace restant dans la carte */}
                              <div className="flex-1 bg-black/20 rounded-2xl p-4 mb-4 min-h-0 overflow-hidden">
                                  <p className="text-lg font-medium text-gray-300 leading-snug line-clamp-6">
                                      {inter.description}
                                  </p>
                              </div>

                              <div className="mt-auto flex items-center gap-3 text-green-400 pt-4 border-t border-white/5">
                                  <Phone size={20}/>
                                  <span className="text-xl font-mono font-black tracking-wider">
                                      {inter.clientPhone || 'Numéro non disponible'}
                                  </span>
                              </div>
                          </div>
                      ))}
                      
                      {/* Remplissage vide pour garder la grille alignée */}
                      {[...Array(itemsPerPage - currentPlanningSlice.length)].map((_, i) => (
                          <div key={`empty-${i}`} className="bg-white/5 border border-white/5 border-dashed rounded-[2rem] flex items-center justify-center opacity-20">
                              <Calendar size={60} />
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* MODE: REALISATIONS (PLEIN ECRAN) */}
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
                      
                      <div className="absolute bottom-12 left-0 right-0 flex justify-center z-20">
                          <div className="bg-black/70 backdrop-blur-xl border border-white/20 px-12 py-6 rounded-3xl text-center max-w-5xl shadow-2xl">
                              <h2 className="text-4xl font-black uppercase text-white tracking-tight mb-2">
                                  {currentAchievement.title}
                              </h2>
                              {currentAchievement.description && (
                                  <p className="text-xl text-gray-300 line-clamp-2">
                                      {currentAchievement.description}
                                  </p>
                              )}
                          </div>
                      </div>
                  </div>
              ) : (
                <div className="flex items-center justify-center h-full text-white/20">
                    <Loader2 size={60} className="animate-spin"/>
                </div>
              )
          )}

      </main>

      {/* 3. FOOTER (TICKER FIXE: 8% HAUTEUR) */}
      <footer className="h-[10vh] shrink-0 bg-black border-t-8 border-orange-600 flex items-center relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="h-full bg-gray-900 px-8 flex items-center justify-center border-r-4 border-orange-500 min-w-[120px]">
              <Megaphone size={32} className="text-orange-500 animate-pulse" />
          </div>
          <div className="flex-1 overflow-hidden whitespace-nowrap bg-black">
              <div className="inline-block animate-tv-ticker py-2">
                  {flashes.concat(flashes).concat(flashes).map((msg, i) => (
                      <span key={i} className={`${getMessageColorClass(msg.color)} text-3xl font-black px-16 uppercase italic tracking-tight`}>
                          {msg.content} <span className="text-gray-800 mx-8">///</span>
                      </span>
                  ))}
              </div>
          </div>
      </footer>

      {/* STYLES SPECIFIQUES AU COMPOSANT */}
      <style>{`
        @keyframes tv-ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .animate-tv-ticker {
          animation: tv-ticker 40s linear infinite;
        }
        @keyframes scale-in {
          0% { transform: scale(1.1); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ShowcaseMode;
