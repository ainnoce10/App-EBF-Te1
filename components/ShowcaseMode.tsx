
import React, { useState, useEffect, useRef } from 'react';
import { StockItem, Intervention, TickerMessage, Achievement, Employee } from '../types';
import { 
  X, 
  Zap, 
  ShieldCheck, 
  Calendar,
  Megaphone,
  LayoutGrid,
  ClipboardList,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Minus,
  Plus,
  Monitor,
  Loader2,
  Trophy,
  Video,
  Image as ImageIcon,
  User,
  Briefcase,
  MapPin
} from 'lucide-react';
import { Logo } from '../constants';

interface ShowcaseModeProps {
  onClose?: () => void;
  liveStock?: StockItem[];
  liveInterventions?: Intervention[];
  liveMessages?: TickerMessage[];
  liveAchievements?: Achievement[];
  liveEmployees?: Employee[];
  customLogo?: string;
  initialMusicUrl?: string;
}

const ShowcaseMode: React.FC<ShowcaseModeProps> = ({ 
  onClose, 
  liveStock = [], 
  liveInterventions = [], 
  liveMessages = [],
  liveAchievements = [],
  liveEmployees = [],
  customLogo,
  initialMusicUrl
}) => {
  const [activeMode, setActiveMode] = useState<'PUBLICITE' | 'REALISATIONS'>('PUBLICITE');
  const [productIdx, setProductIdx] = useState(0);
  const [planningPage, setPlanningPage] = useState(0);
  const [achievementIdx, setAchievementIdx] = useState(0);
  
  // Time State
  const [currentTime, setCurrentTime] = useState(new Date());

  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [audioSrc, setAudioSrc] = useState(initialMusicUrl || '');
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- LOGIQUE DE MISE A L'ECHELLE (FIXE 1920x1080) ---
  const BASE_WIDTH = 1920;
  const BASE_HEIGHT = 1080;
  
  const [windowSize, setWindowSize] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 1920, h: typeof window !== 'undefined' ? window.innerHeight : 1080 });
  const [userScaleModifier, setUserScaleModifier] = useState(1); 
  const [showTvSettings, setShowTvSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Détection route TV (Strictement séparée)
  const isTvRoute = typeof window !== 'undefined' && (
      window.location.pathname.includes('/tv') || 
      window.location.search.includes('mode=tv')
  );

  // Clé de stockage distincte pour ne pas mélanger les réglages PC et TV
  const storageKey = isTvRoute ? 'ebf_tv_scale_v5' : 'ebf_desktop_scale_v5';

  // Initialisation Dimensions & Settings & Time
  useEffect(() => {
    // Timer Horloge
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    const handleResize = () => {
        setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Appel initial
    handleResize();
    
    // Charger réglage utilisateur
    const savedScale = localStorage.getItem(storageKey);
    
    if (savedScale) {
        setUserScaleModifier(parseFloat(savedScale));
    } else {
        setUserScaleModifier(1.0);
    }

    // Listener plein écran
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);

    // Tentative Fullscreen Auto uniquement sur TV
    if (isTvRoute) {
        const attemptFullscreen = async () => {
            try {
                if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
            } catch (e) { console.log("Fullscreen auto bloqué", e); }
        };
        const timer = setTimeout(attemptFullscreen, 1500);
        return () => clearTimeout(timer);
    }

    return () => {
        clearInterval(clockInterval);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, [isTvRoute, storageKey]);

  // Calcul du Facteur d'Échelle (Scale)
  const scaleX = windowSize.w / BASE_WIDTH;
  const scaleY = windowSize.h / BASE_HEIGHT;
  
  // Priorité Paysage pour TV
  let baseScale = Math.min(scaleX, scaleY);
  if (isTvRoute) {
      baseScale = scaleX; 
  }
  
  const finalScale = baseScale * userScaleModifier;

  const handleUserScaleChange = (delta: number) => {
      setUserScaleModifier(prev => {
          const newVal = Math.max(0.4, Math.min(2.0, parseFloat((prev + delta).toFixed(2))));
          localStorage.setItem(storageKey, newVal.toString());
          return newVal;
      });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
    else if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
  };

  // --- DONNEES ---
  const products = liveStock.length > 0 ? liveStock : [];
  
  // TRI PAR DATE CROISSANTE (PLUS PROCHE -> PLUS ELOIGNÉE)
  // MODIFICATION: Tri par date décroissante pour afficher les plus récents en premier (Effet "Temps Réel")
  const planning = liveInterventions.length > 0 
    ? liveInterventions
        .filter(i => i.status === 'En cours' || i.status === 'En attente')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  const achievements = liveAchievements.length > 0 ? liveAchievements : [];
  const flashes = liveMessages.length > 0 ? liveMessages : [{ content: "Bienvenue chez EBF Technical Center", color: 'neutral' } as TickerMessage];

  // --- RENDER HELPERS (Définis avant les effets qui les utilisent) ---
  const currentProduct = products[productIdx];
  const currentAchievement = achievements[achievementIdx];
  const todayDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  // --- AUDIO & DATA SYNC ---
  // Synchronisation immédiate quand App.tsx met à jour initialMusicUrl
  useEffect(() => {
    if (initialMusicUrl && initialMusicUrl !== audioSrc) {
        setAudioSrc(initialMusicUrl);
    }
  }, [initialMusicUrl]);

  // Gestion Play/Pause Audio Principale
  useEffect(() => {
    if (audioRef.current && audioSrc) {
        if (!isMuted) {
            setAudioLoading(true);
            const playPromise = audioRef.current.play();
            
            if (playPromise !== undefined) {
                playPromise
                .catch((e) => {
                    console.log("Autoplay audio bloqué par le navigateur", e);
                    setIsMuted(true); 
                })
                .finally(() => setAudioLoading(false));
            }
        } else {
            audioRef.current.pause();
            setAudioLoading(false);
        }
    }
  }, [audioSrc, isMuted, activeMode]);

  // --- GESTION INTELLIGENTE DU VOLUME (DUCKING) ---
  useEffect(() => {
    if (audioRef.current && !isMuted) {
        // Si on est dans le mode réalisations ET que l'élément actuel est une vidéo
        const isVideoPlaying = activeMode === 'REALISATIONS' && currentAchievement?.mediaType === 'video';
        
        // On baisse le son à 10% si vidéo, sinon 50%
        const targetVolume = isVideoPlaying ? 0.1 : 0.5;
        audioRef.current.volume = targetVolume;
    }
  }, [activeMode, achievementIdx, currentAchievement, isMuted]);


  const toggleMute = () => {
      if (isMuted) {
          setIsMuted(false);
      } else {
          setIsMuted(true);
          audioRef.current?.pause();
      }
  };

  // --- LOGIQUE DE ROTATION DES MODULES ---
  
  // Helper pour passer au module suivant
  const goToNextMode = () => {
      setActiveMode((prev) => {
          if (prev === 'PUBLICITE') return 'REALISATIONS';
          return 'PUBLICITE';
      });
      // Reset des compteurs pour le prochain module
      setProductIdx(0);
      setAchievementIdx(0);
  };

  // 1. CYCLE PRODUITS (PUBLICITE)
  useEffect(() => {
    if (activeMode !== 'PUBLICITE') return;
    
    // Si vide, on passe tout de suite
    if (products.length === 0) {
        const skipTimer = setTimeout(goToNextMode, 2000); // Petit délai pour éviter flash
        return () => clearTimeout(skipTimer);
    }

    const interval = setInterval(() => {
        setProductIdx((prev) => {
            if (prev >= products.length - 1) {
                // Fin de la liste des produits -> Module suivant
                goToNextMode();
                return 0;
            }
            return prev + 1;
        });
    }, 10000); // 10 secondes par produit

    return () => clearInterval(interval);
  }, [activeMode, products.length]);

  // 2. CYCLE PLANNING (PERMANENT)
  
  useEffect(() => {
    // Le planning tourne en permanence maintenant
    if (planning.length === 0) return;

    const totalPages = Math.ceil(planning.length / 2) || 1;

    const interval = setInterval(() => {
        setPlanningPage((prev) => {
            if (prev >= totalPages - 1) {
                return 0;
            }
            return prev + 1;
        });
    }, 6000); // 6 secondes par page (Rotation plus rapide)

    return () => clearInterval(interval);
  }, [planning.length]);

  // 3. CYCLE REALISATIONS (IMAGES)
  useEffect(() => {
      if (activeMode !== 'REALISATIONS') return;
      
      if (achievements.length === 0) {
          const skipTimer = setTimeout(goToNextMode, 2000);
          return () => clearTimeout(skipTimer);
      }

      const currentItem = achievements[achievementIdx];
      
      // Si c'est une image, on utilise un timer. Si c'est une vidéo, c'est handleVideoEnded qui gère.
      if (currentItem && currentItem.mediaType === 'image') {
          const timer = window.setTimeout(() => {
              setAchievementIdx((prev) => {
                  if (prev >= achievements.length - 1) {
                      // Fin de la liste des réalisations -> Module suivant
                      goToNextMode();
                      return 0;
                  }
                  return prev + 1;
              });
          }, 10000); // 10 secondes par image
          return () => clearTimeout(timer);
      }
  }, [activeMode, achievements, achievementIdx]);

  // 3b. CYCLE REALISATIONS (VIDEO ENDED)
  const handleVideoEnded = () => {
      setAchievementIdx((prev) => {
          if (prev >= achievements.length - 1) {
              // Fin de la liste -> Module suivant
              goToNextMode();
              return 0;
          }
          return prev + 1;
      });
  };

  const getMessageColorClass = (color: string) => {
    switch(color) {
        case 'green': return 'text-green-400';
        case 'yellow': return 'text-yellow-400';
        case 'red': return 'text-red-500';
        default: return 'text-white';
    }
  };

  const getTitleSizeClass = (text: string) => {
      const len = text.length;
      if (len < 20) return "text-7xl";
      if (len < 40) return "text-6xl";
      return "text-5xl";
  };

  // Recherche de l'objet employé (avec correspondance sur nom assigné)
  const getTechnician = (techName: string) => {
      return liveEmployees.find((e: Employee) => 
        (e.assignedName && e.assignedName === techName) || 
        e.name === techName
      );
  };

  return (
    <div 
        className="fixed inset-0 bg-black overflow-hidden z-[9999]"
        style={{ width: '100vw', height: '100vh' }}
    >
      
      {/* Container de Base 1920x1080 centré et mis à l'échelle */}
      <div 
        className="absolute bg-gray-900 overflow-hidden shadow-2xl origin-center"
        style={{
            width: `${BASE_WIDTH}px`,
            height: `${BASE_HEIGHT}px`,
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) scale(${finalScale})`,
        }}
      >
          {audioSrc && (
              // Clé unique pour forcer le rechargement si l'URL change radicalement
              <audio key={audioSrc} ref={audioRef} loop src={audioSrc} preload="auto" onError={(e) => console.error("Audio err", e)} />
          )}

          {/* === HEADER TV (Position Absolue Haut) === */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gray-950 px-8 flex items-center justify-between border-b-8 border-orange-600 shadow-2xl z-50">
              <div className="flex items-center gap-10">
                  <div className="bg-white/10 px-5 py-2.5 rounded-2xl">
                    <Logo url={customLogo} size="lg" theme="dark" label="TV" />
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex gap-3 bg-white/5 p-1.5 rounded-3xl border border-white/10">
                      {['PUBLICITE', 'REALISATIONS'].map((mode) => (
                        <button 
                            key={mode}
                            onClick={() => setActiveMode(mode as any)} 
                            className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl font-black text-lg uppercase transition-all cursor-pointer hover:bg-white/10
                            ${activeMode === mode 
                                ? (mode === 'PUBLICITE' ? 'bg-orange-600' : 'bg-purple-600') + ' text-white shadow-lg scale-105' 
                                : 'text-white/30'}`}
                        >
                            {mode === 'PUBLICITE' ? <LayoutGrid size={20}/> : <Trophy size={20}/>}
                            {mode === 'PUBLICITE' ? 'Nos Produits' : 'Réalisations'}
                        </button>
                      ))}
                  </div>
              </div>

              {/* HORLOGE CENTRÉE DANS LE FLUX (ENTRE GAUCHE ET DROITE) */}
              <div className="flex flex-col items-center justify-center mx-auto">
                  <span className="text-4xl font-black text-white tracking-widest tabular-nums leading-none flex items-center">
                      {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      <span className="text-lg text-orange-500 ml-1 font-bold pt-1">
                          {currentTime.getSeconds().toString().padStart(2, '0')}
                      </span>
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
                      {currentTime.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                  <div className="relative">
                      <button onClick={() => setShowTvSettings(!showTvSettings)} className={`p-3 rounded-full border-2 transition-all ${showTvSettings ? 'bg-orange-600 border-orange-500 text-white' : 'bg-white/5 border-white/10 text-white/50'}`}>
                          <Settings size={24} className={showTvSettings ? "animate-spin-slow" : ""} />
                      </button>
                      {showTvSettings && (
                          <div className="absolute top-16 right-0 bg-gray-900 border-2 border-gray-700 p-6 rounded-3xl shadow-2xl w-80 z-[100] animate-fade-in origin-top-right">
                              <h4 className="flex items-center gap-3 text-white font-black text-lg mb-4 border-b border-gray-700 pb-3">
                                  <Monitor size={20} className="text-orange-500"/> Calibrage ({isTvRoute ? 'TV' : 'PC'})
                              </h4>
                              <div className="space-y-4">
                                  <div>
                                      <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                                          <span>Zoom Affichage</span>
                                          <span className="text-white">{Math.round(userScaleModifier * 100)}%</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <button onClick={() => handleUserScaleChange(-0.01)} className="p-2 bg-gray-800 rounded-xl hover:bg-gray-700 text-white"><Minus size={16}/></button>
                                          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                              <div className="h-full bg-blue-500 transition-all" style={{ width: `${((userScaleModifier - 0.4) / 1.6) * 100}%` }}></div>
                                          </div>
                                          <button onClick={() => handleUserScaleChange(0.01)} className="p-2 bg-gray-800 rounded-xl hover:bg-gray-700 text-white"><Plus size={16}/></button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  <button onClick={toggleFullscreen} className="p-3 rounded-full border-2 border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white hover:border-white/30 transition-all">
                      {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                  </button>
                  <button onClick={toggleMute} className={`p-3 rounded-full border-2 transition-all ${isMuted ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]'}`}>
                      {audioLoading ? <Loader2 size={24} className="animate-spin" /> : (isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />)}
                  </button>
                  {onClose && (
                    <button onClick={onClose} className="p-3 bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white rounded-full transition-all border-2 border-red-500/20 ml-2">
                      <X size={24} />
                    </button>
                  )}
              </div>
          </div>

          {/* === CONTENU PRINCIPAL (Position Absolue Milieu) === */}
          <div 
             className="absolute top-24 bottom-32 left-0 right-0 flex overflow-hidden bg-gray-900"
          >
              {/* === SIDEBAR PLANNING (PERMANENT - 35%) === */}
              <div className="w-[35%] h-full bg-gray-950/95 border-r border-white/10 flex flex-col p-8 backdrop-blur-md z-30 relative shadow-2xl">
                    <div className="mb-8 border-b border-white/10 pb-6 flex justify-between items-end">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="flex items-center gap-2 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                                    <span className="text-red-500 font-black text-[10px] tracking-widest leading-none">LIVE</span>
                                </div>
                                <span className="text-white/30 text-xs font-mono font-bold">
                                    {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </div>
                            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                <ClipboardList className="text-blue-500" size={40} /> Chantiers
                            </h2>
                            <span className="text-orange-500 font-bold text-xl uppercase tracking-widest">{todayDate}</span>
                        </div>
                        <div className="text-white/30 text-sm font-mono uppercase text-right font-bold flex flex-col items-end justify-end h-full">
                            <span>{planning.length} Missions</span>
                            <span>Page {planningPage + 1}/{Math.ceil(planning.length / 2) || 1}</span>
                        </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col gap-8 pb-8 h-full overflow-hidden">
                        {planning.slice(planningPage * 2, (planningPage + 1) * 2).map((inter) => {
                            const technician = getTechnician(inter.technician);
                            
                            return (
                                <div 
                                    key={inter.id}
                                    className="p-8 rounded-[2.5rem] border-4 border-white/10 bg-white/5 shadow-2xl relative overflow-hidden animate-slide-up flex-1 flex flex-col justify-between min-h-0"
                                >
                                    {/* Status Header */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex flex-col gap-3">
                                            <span className={`px-4 py-2 rounded-xl font-black text-lg uppercase tracking-widest shadow-lg w-fit ${inter.status === 'En cours' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>
                                                {inter.status}
                                            </span>
                                            <span className="text-white/60 text-sm font-black uppercase bg-black/30 px-3 py-1 rounded-lg w-fit flex items-center gap-2">
                                                <Calendar size={16} />
                                                {new Date(inter.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>

                                        {/* Tech Mini Profile */}
                                        <div className="flex flex-col items-end">
                                            {technician?.photoUrl ? (
                                                <img 
                                                    src={technician.photoUrl} 
                                                    className="w-20 h-20 rounded-full object-cover border-4 border-orange-400 shadow-lg mb-2" 
                                                    alt={inter.technician}
                                                    style={{ objectPosition: technician.photoPosition || '50% 50%' }}
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-white border-4 border-orange-400 shadow-lg mb-2">
                                                    <User size={32}/>
                                                </div>
                                            )}
                                            <span className="text-orange-400 font-black text-sm uppercase text-right leading-tight max-w-[140px]">{inter.technician}</span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-5 flex-1 flex flex-col">
                                        {inter.domain && (
                                            <div className="flex items-center gap-3 text-white/50 font-bold text-sm uppercase tracking-wider bg-white/5 px-3 py-1 rounded-full w-fit">
                                                <Briefcase size={16} /> {inter.domain}
                                            </div>
                                        )}

                                        <div>
                                            <h3 className="text-4xl font-black text-white uppercase leading-[0.9] tracking-tight mb-3 drop-shadow-md">
                                                {inter.client.replace(/Société/g, 'Sté').replace(/Entreprise/g, 'Ets')}
                                            </h3>
                                            {inter.location && (
                                                <div className="flex items-center gap-2 text-gray-300 text-lg font-bold uppercase tracking-wide">
                                                    <MapPin size={20} className="text-red-500"/> {inter.location}
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-black/30 p-5 rounded-2xl border border-white/10 flex-1 flex items-center overflow-hidden">
                                            <p className="text-gray-100 text-2xl font-bold leading-snug line-clamp-6">
                                                {inter.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {planning.length === 0 && (
                            <div className="text-white/20 text-center italic mt-10 text-2xl">Aucune intervention</div>
                        )}
                        {/* Fill empty space if only 1 item on page */}
                        {planning.slice(planningPage * 2, (planningPage + 1) * 2).length === 1 && (
                             <div className="border-8 border-dashed border-white/5 rounded-[2.5rem] flex items-center justify-center opacity-10 flex-1">
                                <span className="text-white font-black text-6xl uppercase">Libre</span>
                            </div>
                        )}
                    </div>
              </div>

              {/* === MAIN CONTENT (DYNAMIC - 65%) === */}
              <div className="w-[65%] h-full relative bg-gray-900">
                  
                  {/* MODE PUBLICITE */}
                  {activeMode === 'PUBLICITE' && (
                      currentProduct ? (
                        <div className="flex w-full h-full animate-fade-in">
                            {/* Image - Section Gauche */}
                            <div className="w-[45%] h-full relative flex flex-col items-center justify-start bg-gray-950 p-8 pt-12 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 to-transparent opacity-50"></div>
                                
                                <div className="relative z-10 mb-6 animate-slide-up">
                                    <h2 className="text-5xl font-black text-white uppercase tracking-widest text-center leading-tight">
                                        EBF Store
                                    </h2>
                                </div>

                                {/* CONTENEUR CARRE */}
                                <div key={currentProduct.id} className="relative aspect-square h-[65%] bg-white rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.8)] border-[8px] border-white/10 animate-scale-in flex items-center justify-center z-20">
                                    <img 
                                      src={currentProduct.imageUrls?.[0] || 'https://placehold.co/800x800/1a1a1a/ffffff?text=EBF'} 
                                      className="w-[90%] h-[90%] object-contain animate-float"
                                    />
                                    
                                    <div className="absolute -top-4 -right-4 bg-red-600 text-white w-20 h-20 rounded-full flex items-center justify-center font-black text-lg rotate-12 shadow-lg border-4 border-gray-900 z-20">
                                        PROMO
                                    </div>
                                </div>
                            </div>
                            
                            {/* Texte - Section Droite */}
                            <div className="w-[55%] h-full bg-white flex flex-col justify-center p-10 shadow-[-40px_0_120px_rgba(0,0,0,0.5)] relative z-10">
                                <span className="self-start px-5 py-2 bg-orange-600 text-white rounded-xl text-lg font-black uppercase mb-4 shadow-xl tracking-widest">{currentProduct.category}</span>
                                <h1 className={`${getTitleSizeClass(currentProduct.name)} font-black leading-none tracking-tighter mb-6 text-gray-950 uppercase italic`}>{currentProduct.name}</h1>
                                
                                <div className="flex gap-6 mb-6 border-b border-gray-100 pb-4">
                                    <div className="flex items-center gap-2 text-gray-400 font-black text-lg uppercase tracking-widest">
                                        <Zap size={20} className="text-orange-600" /> {currentProduct.supplier}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 font-black text-lg uppercase tracking-widest">
                                        <ShieldCheck size={20} className="text-green-600" /> Certifié
                                    </div>
                                </div>

                                <div className="bg-gray-950 p-6 rounded-[2rem] text-white border-b-[12px] border-orange-600 shadow-2xl self-start min-w-[50%]">
                                    <p className="text-lg font-black uppercase text-orange-500 mb-1 tracking-[0.2em]">Prix EBF</p>
                                    
                                    {currentProduct.regularPrice && currentProduct.regularPrice > currentProduct.unitPrice && (
                                        <span className="block text-2xl text-gray-400 line-through decoration-red-500 decoration-4 mb-1">
                                            {currentProduct.regularPrice.toLocaleString()} F
                                        </span>
                                    )}

                                    <p className="text-5xl font-black tracking-tighter leading-none whitespace-nowrap">
                                        {currentProduct.unitPrice.toLocaleString()} <span className="text-2xl text-gray-500 font-bold ml-1">F</span>
                                    </p>
                                </div>

                                {currentProduct.name.trim().toUpperCase().startsWith('CLIMATISEUR') && (
                                    <div className="mt-6 bg-[#E3001B] text-white px-8 py-4 rounded-tr-[2.5rem] rounded-bl-[2.5rem] shadow-[0_20px_50px_rgba(227,0,27,0.3)] self-start flex flex-col items-center justify-center -rotate-2 border-4 border-white/20 transform origin-left hover:scale-105 transition-transform cursor-default animate-bounce-slow">
                                        <span className="text-xl font-bold italic leading-none drop-shadow-sm">Installation</span>
                                        <span className="text-4xl font-black uppercase leading-[0.85] tracking-tighter drop-shadow-md mt-1">OFFERTE*</span>
                                    </div>
                                )}
                            </div>
                        </div>
                      ) : <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={80}/></div>
                  )}

                  {/* MODE REALISATIONS */}
                  {activeMode === 'REALISATIONS' && (
                      currentAchievement ? (
                          <div key={currentAchievement.id} className="w-full h-full flex animate-fade-slow">
                              {/* Partie Gauche : Texte & Description */}
                              <div className="w-[40%] h-full bg-white flex flex-col justify-center p-10 shadow-[40px_0_100px_rgba(0,0,0,0.5)] z-20 relative">
                                  <div className="self-start mb-8">
                                       <span className="bg-purple-600 text-white px-5 py-2 rounded-xl text-lg font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                                          {currentAchievement.mediaType === 'video' ? <Video size={24}/> : <ImageIcon size={24}/>} 
                                          Réalisation
                                       </span>
                                  </div>
                                  
                                  <h2 className="text-4xl font-black text-gray-950 uppercase tracking-tighter mb-6 leading-tight text-center">
                                      {currentAchievement.title}
                                  </h2>
                                  
                                  <div className="w-20 h-3 bg-orange-600 mb-6 rounded-full mx-auto"></div>

                                  {currentAchievement.description && (
                                      <p className="text-2xl text-gray-500 font-bold leading-snug text-center">
                                          {currentAchievement.description}
                                      </p>
                                  )}
                                  
                                  <div className="mt-8 text-gray-400 font-black text-xl uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                      <Calendar size={20} className="text-orange-500"/>
                                      {new Date(currentAchievement.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                                  </div>
                              </div>

                              {/* Partie Droite : Média (Image/Vidéo) */}
                              <div className="w-[60%] h-full bg-black relative flex items-center justify-center overflow-hidden">
                                   <div 
                                      className="absolute inset-0 opacity-30 bg-cover bg-center blur-3xl scale-110"
                                      style={{ backgroundImage: `url(${currentAchievement.mediaUrl})` }}
                                   ></div>

                                  {currentAchievement.mediaType === 'video' ? (
                                      <video 
                                          ref={videoRef}
                                          src={currentAchievement.mediaUrl}
                                          className="w-full h-full object-contain relative z-10 shadow-2xl"
                                          autoPlay
                                          playsInline 
                                          loop={false}
                                          onEnded={handleVideoEnded}
                                          onError={handleVideoEnded}
                                          style={{ pointerEvents: 'none' }} 
                                      />
                                  ) : (
                                      <img 
                                          src={currentAchievement.mediaUrl} 
                                          className="w-full h-full object-cover relative z-10 animate-scale-in shadow-2xl" 
                                          style={{ objectPosition: currentAchievement.position || '50% 50%' }}
                                      />
                                  )}
                              </div>
                          </div>
                      ) : <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={80}/></div>
                  )}
              </div>
          </div>

          {/* === FOOTER TICKER (Position Absolue Bas) === */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-black border-t-8 border-orange-600 flex items-center shadow-2xl z-[200]">
              <div className="bg-gray-950 h-full px-8 flex items-center justify-center z-20 border-r-8 border-orange-500 shadow-2xl">
                  <Megaphone size={48} className="text-orange-500 animate-bounce" />
              </div>
              <div className="flex-1 overflow-hidden whitespace-nowrap">
                  <div className="inline-block animate-tv-ticker">
                      {/* Multiplication pour assurer une boucle fluide */}
                      {flashes.concat(flashes).concat(flashes).map((msg, i) => (
                          <span key={i} className={`${getMessageColorClass(msg.color)} text-6xl font-black px-24 uppercase italic tracking-tight`}>
                              {msg.content} <span className="text-white/20 mx-8">///</span>
                          </span>
                      ))}
                  </div>
              </div>
          </div>

      </div>

      <style>{`
        @keyframes tv-ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-33.33%); } }
        .animate-tv-ticker { animation: tv-ticker 40s linear infinite; }
        @keyframes scale-in { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        
        /* Nouvelle animation de fondu lent pour les réalisations */
        @keyframes fadeInSlow { 
            0% { opacity: 0; } 
            100% { opacity: 1; } 
        }
        .animate-fade-slow { animation: fadeInSlow 1.5s ease-in-out forwards; }

        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-30px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ShowcaseMode;
