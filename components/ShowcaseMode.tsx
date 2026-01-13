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
  Play,
  Maximize2,
  Minimize2,
  Settings,
  Minus,
  Plus,
  Monitor,
  Loader2,
  Trophy,
  Video,
  Image as ImageIcon
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
  const [productIdx, setProductIdx] = useState(0);
  const [planningPage, setPlanningPage] = useState(0);
  const [achievementIdx, setAchievementIdx] = useState(0);
  
  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [audioSrc, setAudioSrc] = useState(initialMusicUrl || '');
  const [autoplayFailed, setAutoplayFailed] = useState(false);
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

  // Initialisation Dimensions & Settings
  useEffect(() => {
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
        // RESET DEFAULT
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
            } catch (e) { console.log("Fullscreen auto bloqué", e); setAutoplayFailed(true); }
        };
        const timer = setTimeout(attemptFullscreen, 1500);
        return () => clearTimeout(timer);
    }

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, [isTvRoute, storageKey]);

  // Calcul du Facteur d'Échelle (Scale)
  const scaleX = windowSize.w / BASE_WIDTH;
  const scaleY = windowSize.h / BASE_HEIGHT;
  
  // CORRECTION PAYSAGE : 
  // Si on est en mode TV, on privilégie l'échelle X (Largeur) pour remplir les côtés.
  // Cela évite l'effet "Portrait" (bandes noires sur les côtés) si la hauteur du navigateur est réduite par des barres.
  let baseScale = Math.min(scaleX, scaleY);
  
  if (isTvRoute) {
      // Sur TV, on force le remplissage de la largeur (Priorité Paysage)
      // Si l'écran est plus large que 16:9, scaleX sera plus grand, on l'utilise pour remplir.
      // Si l'écran a des barres en haut/bas, scaleY est petit, mais on veut quand même remplir la largeur.
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
  const planning = liveInterventions.length > 0 
    ? liveInterventions.filter(i => i.status === 'En cours' || i.status === 'En attente') 
    : [];
  const achievements = liveAchievements.length > 0 ? liveAchievements : [];
  const flashes = liveMessages.length > 0 ? liveMessages : [{ content: "Bienvenue chez EBF Technical Center", color: 'neutral' } as TickerMessage];

  // --- AUDIO & DATA SYNC ---
  useEffect(() => {
    if (initialMusicUrl) setAudioSrc(initialMusicUrl);
    
    const channel = supabase.channel('tv-music-showcase')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tv_settings' }, (payload) => {
            if ((payload.new as any)?.key === 'background_music') setAudioSrc((payload.new as any).value);
        })
        .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [initialMusicUrl]);

  useEffect(() => {
    if (audioRef.current && audioSrc) {
        setAudioLoading(true);
        audioRef.current.volume = 0.5;
        const tryPlay = async () => {
             try {
                 if (!isMuted) await audioRef.current?.play();
             } catch (error) {
                 setAutoplayFailed(true);
                 setIsMuted(true);
             } finally { setAudioLoading(false); }
        };
        tryPlay();
    }
  }, [audioSrc]);

  // Pause audio quand vidéo joue
  useEffect(() => {
      const currentAch = achievements[achievementIdx];
      const isVideoPlaying = activeMode === 'REALISATIONS' && currentAch?.mediaType === 'video';
      if (audioRef.current) {
          if (isVideoPlaying) audioRef.current.pause();
          else if (!isMuted && !autoplayFailed) audioRef.current.play().catch(() => {});
      }
  }, [activeMode, achievementIdx, achievements, isMuted, autoplayFailed]);

  const toggleMute = () => {
      if (isMuted) {
          setIsMuted(false);
          audioRef.current?.play().catch(() => setAutoplayFailed(true));
      } else {
          setIsMuted(true);
          audioRef.current?.pause();
      }
  };

  const handleStartShow = async () => {
    setIsMuted(false);
    setAutoplayFailed(false);
    if(audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); }
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); } catch (e) {}
  };

  // --- CYCLES ---
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

  useEffect(() => {
    if (activeMode !== 'PUBLICITE' || products.length === 0) return;
    const interval = setInterval(() => setProductIdx((prev) => (prev + 1) % products.length), 10000); 
    return () => clearInterval(interval);
  }, [activeMode, products.length]);

  const itemsPerPage = 3;
  const totalPlanningPages = Math.ceil(planning.length / itemsPerPage) || 1;
  useEffect(() => {
    if (activeMode !== 'PLANNING' || planning.length === 0) { setPlanningPage(0); return; }
    const interval = setInterval(() => setPlanningPage((prev) => (prev + 1) % totalPlanningPages), 20000); 
    return () => clearInterval(interval);
  }, [activeMode, planning.length, totalPlanningPages]);

  useEffect(() => {
      if (activeMode !== 'REALISATIONS' || achievements.length === 0) { setAchievementIdx(0); return; }
      const currentItem = achievements[achievementIdx];
      if (currentItem.mediaType === 'image') {
          const timer = window.setTimeout(() => setAchievementIdx(prev => (prev + 1) % achievements.length), 10000);
          return () => clearTimeout(timer);
      }
  }, [activeMode, achievements, achievementIdx]);

  const handleVideoEnded = () => setAchievementIdx(prev => (prev + 1) % achievements.length);

  // --- RENDER HELPERS ---
  const currentProduct = products[productIdx];
  const currentPlanningSlice = planning.slice(planningPage * itemsPerPage, (planningPage + 1) * itemsPerPage);
  const currentAchievement = achievements[achievementIdx];
  const todayDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

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
            // Utilisation de translate pour centrer parfaitement le conteneur scalé
            transform: `translate(-50%, -50%) scale(${finalScale})`,
        }}
      >
          {audioSrc && (
              <audio ref={audioRef} loop src={audioSrc} preload="auto" onPlay={() => setAutoplayFailed(false)} onError={(e) => console.error("Audio err", e)} />
          )}

          {autoplayFailed && (
              <div className="absolute inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                 <div className="text-center animate-bounce">
                    <button onClick={handleStartShow} className="bg-green-600 text-white px-10 py-6 rounded-[2rem] font-black text-3xl shadow-2xl flex items-center gap-5 hover:scale-110 transition-transform">
                        <Play size={40} fill="currentColor" /> LANCER LA TV
                    </button>
                    <p className="text-white/80 font-bold uppercase mt-6 text-xl tracking-widest">Cliquez pour activer le son</p>
                 </div>
              </div>
          )}

          {/* === HEADER TV === */}
          <div className="h-24 bg-gray-950 px-8 flex items-center justify-between border-b-8 border-orange-600 shadow-2xl z-50 relative shrink-0">
              <div className="flex items-center gap-10">
                  <div className="bg-white/10 px-5 py-2.5 rounded-2xl">
                    <Logo url={customLogo} size="lg" theme="dark" label="TV" />
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex gap-3 bg-white/5 p-1.5 rounded-3xl border border-white/10">
                      {['PUBLICITE', 'PLANNING', 'REALISATIONS'].map((mode) => (
                        <button 
                            key={mode}
                            onClick={() => setActiveMode(mode as any)}
                            className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl font-black text-lg uppercase transition-all
                            ${activeMode === mode 
                                ? (mode === 'PUBLICITE' ? 'bg-orange-600' : mode === 'PLANNING' ? 'bg-blue-600' : 'bg-purple-600') + ' text-white shadow-lg scale-105' 
                                : 'text-white/30 hover:text-white'}`}
                        >
                            {mode === 'PUBLICITE' ? <LayoutGrid size={20}/> : mode === 'PLANNING' ? <ClipboardList size={20}/> : <Trophy size={20}/>}
                            {mode === 'PUBLICITE' ? 'Nos Produits' : mode === 'PLANNING' ? 'Chantiers' : 'Réalisations'}
                        </button>
                      ))}
                  </div>
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

          {/* === CONTENU PRINCIPAL === */}
          <div className={`flex-1 flex flex-col overflow-hidden relative transition-colors duration-1000 ease-in-out min-h-0 ${activeMode === 'PLANNING' ? 'bg-[#0f172a]' : 'bg-gray-900'}`}>
              
              {/* MODE PUBLICITE */}
              {activeMode === 'PUBLICITE' && (
                  currentProduct ? (
                    <div className="flex w-full h-full animate-fade-in">
                        {/* Image */}
                        <div className="w-[45%] h-full relative flex items-center justify-center bg-gray-950 p-8 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 to-transparent opacity-50"></div>
                            <div key={currentProduct.id} className="relative w-full h-full flex items-center justify-center animate-scale-in">
                                <div className="absolute w-[80%] h-[80%] bg-white/5 blur-[80px] rounded-full animate-pulse-slow"></div>
                                <img 
                                  src={currentProduct.imageUrls?.[0] || 'https://placehold.co/800x800/1a1a1a/ffffff?text=EBF'} 
                                  className="relative z-10 max-w-full max-h-full object-contain rounded-[2.5rem] shadow-[0_30px_80px_rgba(0,0,0,0.8)] border-[8px] border-white/10 animate-float"
                                />
                            </div>
                        </div>
                        {/* Texte */}
                        <div className="w-[55%] h-full bg-white flex flex-col justify-center p-12 shadow-[-40px_0_120px_rgba(0,0,0,0.5)] relative z-10">
                            <span className="self-start px-6 py-2 bg-orange-600 text-white rounded-xl text-xl font-black uppercase mb-6 shadow-xl tracking-widest">{currentProduct.category}</span>
                            <h1 className={`${getTitleSizeClass(currentProduct.name)} font-black leading-none tracking-tighter mb-8 text-gray-950 uppercase italic`}>{currentProduct.name}</h1>
                            
                            <div className="flex gap-8 mb-8 border-b border-gray-100 pb-6">
                                <div className="flex items-center gap-3 text-gray-400 font-black text-xl uppercase tracking-widest">
                                    <Zap size={24} className="text-orange-600" /> {currentProduct.supplier}
                                </div>
                                <div className="flex items-center gap-3 text-gray-400 font-black text-xl uppercase tracking-widest">
                                    <ShieldCheck size={24} className="text-green-600" /> Certifié EBF
                                </div>
                            </div>

                            <div className="bg-gray-950 p-8 rounded-[2.5rem] text-white border-b-[16px] border-orange-600 shadow-2xl self-start min-w-[50%]">
                                <p className="text-xl font-black uppercase text-orange-500 mb-2 tracking-[0.2em]">Prix Exceptionnel</p>
                                <p className="text-6xl font-black tracking-tighter leading-none whitespace-nowrap">
                                    {currentProduct.unitPrice.toLocaleString()} <span className="text-3xl text-gray-500 font-bold ml-1">F</span>
                                </p>
                            </div>
                        </div>
                    </div>
                  ) : <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={80}/></div>
              )}

              {/* MODE PLANNING */}
              {activeMode === 'PLANNING' && (
                <div className="w-full h-full p-12 flex flex-col animate-fade-in">
                    <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
                        <div>
                           <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-2">Chantiers EBF</h2>
                           <span className="text-orange-500 font-black text-3xl uppercase tracking-widest">{todayDate}</span>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                            <span className="text-white/40 font-mono font-bold text-xl">Page {planningPage + 1}/{totalPlanningPages}</span>
                            <Calendar size={48} className="text-blue-500 animate-pulse" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-8 flex-1 min-h-0">
                        {currentPlanningSlice.map((inter) => (
                            <div key={inter.id} className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[2.5rem] flex flex-col shadow-2xl relative overflow-hidden animate-slide-up">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-4 py-1.5 rounded-xl font-black text-lg uppercase tracking-widest shadow-lg ${inter.status === 'En cours' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>
                                      {inter.status}
                                    </span>
                                    {inter.site && (
                                        <div className="flex items-center gap-2 bg-black/20 px-4 py-1.5 rounded-xl">
                                            <MapPin className="text-orange-500" size={20} />
                                            <span className="text-lg font-black text-orange-500 uppercase">{inter.site}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-4 flex-1 flex flex-col">
                                    <div>
                                        <span className="text-gray-400 text-xs uppercase font-bold tracking-widest block mb-1">Client</span>
                                        <h4 className="text-white text-3xl font-black uppercase leading-none truncate">{inter.client}</h4>
                                    </div>
                                    {inter.location && (
                                        <div className="flex items-center gap-3 text-gray-300 text-xl font-bold">
                                            <MapPin size={24} className="text-orange-500 shrink-0"/> {inter.location}
                                        </div>
                                    )}
                                    <div className="bg-black/30 p-4 rounded-2xl border border-white/5 flex-1 min-h-0">
                                        <p className="text-gray-200 text-2xl font-bold leading-tight line-clamp-4">{inter.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                         {Array.from({ length: Math.max(0, 3 - currentPlanningSlice.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="border-4 border-dashed border-white/5 rounded-[2.5rem] flex items-center justify-center opacity-10">
                                <span className="text-white font-black text-5xl uppercase">Libre</span>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {/* MODE REALISATIONS */}
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
                              <img src={currentAchievement.mediaUrl} className="w-full h-full object-contain animate-scale-in" />
                          )}
                          
                          <div className="absolute bottom-12 left-0 right-0 flex justify-center z-20">
                              <div className="bg-black/70 backdrop-blur-xl px-12 py-8 rounded-[2.5rem] border border-white/10 text-center max-w-3xl shadow-2xl animate-slide-up">
                                  <div className="flex justify-center mb-3">
                                      <span className="bg-purple-600 text-white px-5 py-1.5 rounded-xl text-lg font-black uppercase tracking-widest flex items-center gap-2">
                                         {currentAchievement.mediaType === 'video' ? <Video size={20}/> : <ImageIcon size={20}/>} Réalisation
                                      </span>
                                  </div>
                                  <h2 className="text-5xl font-black text-white uppercase tracking-tight mb-3 leading-none">{currentAchievement.title}</h2>
                                  {currentAchievement.description && <p className="text-2xl text-gray-300 font-medium">{currentAchievement.description}</p>}
                              </div>
                          </div>
                      </div>
                  ) : <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={80}/></div>
              )}
          </div>

          {/* === FOOTER TICKER === */}
          <div className="h-20 bg-black relative z-[200] border-t-8 border-orange-600 flex items-center shadow-2xl shrink-0">
              <div className="bg-gray-950 h-full px-8 flex items-center justify-center z-20 border-r-8 border-orange-500 shadow-2xl">
                  <Megaphone size={36} className="text-orange-500 animate-bounce" />
              </div>
              <div className="flex-1 overflow-hidden whitespace-nowrap">
                  <div className="inline-block animate-tv-ticker">
                      {flashes.concat(flashes).concat(flashes).map((msg, i) => (
                          <span key={i} className={`${getMessageColorClass(msg.color)} text-4xl font-black px-16 uppercase italic tracking-tight`}>
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
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-30px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ShowcaseMode;