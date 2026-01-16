
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
  MapPin,
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
  Briefcase
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
  const [activeMode, setActiveMode] = useState<'PUBLICITE' | 'PLANNING' | 'REALISATIONS'>('PUBLICITE');
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
  const planning = liveInterventions.length > 0 
    ? liveInterventions
        .filter(i => i.status === 'En cours' || i.status === 'En attente')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  const achievements = liveAchievements.length > 0 ? liveAchievements : [];
  const flashes = liveMessages.length > 0 ? liveMessages : [{ content: "Bienvenue chez EBF Technical Center", color: 'neutral' } as TickerMessage];

  // --- AUDIO & DATA SYNC ---
  // Synchronisation immédiate quand App.tsx met à jour initialMusicUrl
  useEffect(() => {
    if (initialMusicUrl && initialMusicUrl !== audioSrc) {
        console.log("Mise à jour musique détectée:", initialMusicUrl);
        setAudioSrc(initialMusicUrl);
    }
  }, [initialMusicUrl]);

  // Gestion Audio Principale (Background Music)
  useEffect(() => {
    if (audioRef.current && audioSrc) {
        // Logique simplifiée : si pas muet, on tente de jouer
        if (!isMuted) {
            setAudioLoading(true);
            audioRef.current.volume = 0.5;
            const playPromise = audioRef.current.play();
            
            if (playPromise !== undefined) {
                playPromise
                .catch((e) => {
                    console.log("Autoplay audio bloqué par le navigateur", e);
                    setIsMuted(true); // On mute silencieusement si ça bloque pour garantir le lancement auto visuel
                })
                .finally(() => setAudioLoading(false));
            }
        } else {
            audioRef.current.pause();
            setAudioLoading(false);
        }
    }
  }, [audioSrc, isMuted, activeMode]);

  const toggleMute = () => {
      if (isMuted) {
          setIsMuted(false);
      } else {
          setIsMuted(true);
          audioRef.current?.pause();
      }
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

  // Recherche de l'objet employé (avec correspondance sur nom assigné)
  const getTechnician = (techName: string) => {
      return liveEmployees.find(e => 
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
             className={`absolute top-24 bottom-32 left-0 right-0 flex flex-col overflow-hidden transition-colors duration-1000 ease-in-out ${activeMode === 'PLANNING' ? 'bg-[#0f172a]' : 'bg-gray-900'}`}
          >
              
              {/* MODE PUBLICITE */}
              {activeMode === 'PUBLICITE' && (
                  currentProduct ? (
                    <div className="flex w-full h-full animate-fade-in">
                        {/* Image - Section Gauche */}
                        <div className="w-[45%] h-full relative flex flex-col items-center justify-start bg-gray-950 p-8 pt-20 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 to-transparent opacity-50"></div>
                            
                            {/* TITRE AJOUTÉ */}
                            <div className="relative z-10 mb-8 animate-slide-up">
                                <h2 className="text-6xl font-black text-white uppercase tracking-widest text-center leading-tight">
                                    EBF Quincaillerie
                                </h2>
                            </div>

                            {/* CONTENEUR CARRE 1:1 */}
                            <div key={currentProduct.id} className="relative aspect-square h-[75%] bg-white rounded-[3rem] shadow-[0_30px_80px_rgba(0,0,0,0.8)] border-[8px] border-white/10 animate-scale-in flex items-center justify-center z-20">
                                <img 
                                  src={currentProduct.imageUrls?.[0] || 'https://placehold.co/800x800/1a1a1a/ffffff?text=EBF'} 
                                  className="w-[90%] h-[90%] object-contain animate-float"
                                />
                                
                                {/* Badge PROMO Standard toujours affiché sur l'image */}
                                <div className="absolute -top-6 -right-6 bg-red-600 text-white w-24 h-24 rounded-full flex items-center justify-center font-black text-xl rotate-12 shadow-lg border-4 border-gray-900 z-20">
                                    PROMO
                                </div>
                            </div>
                        </div>
                        
                        {/* Texte - Section Droite */}
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
                                
                                {/* AFFICHAGE PRIX NORMAL BARRE */}
                                {currentProduct.regularPrice && currentProduct.regularPrice > currentProduct.unitPrice && (
                                    <span className="block text-3xl text-gray-400 line-through decoration-red-500 decoration-4 mb-1">
                                        {currentProduct.regularPrice.toLocaleString()} F
                                    </span>
                                )}

                                <p className="text-6xl font-black tracking-tighter leading-none whitespace-nowrap">
                                    {currentProduct.unitPrice.toLocaleString()} <span className="text-3xl text-gray-500 font-bold ml-1">F</span>
                                </p>
                            </div>

                            {/* BADGE INSTALLATION OFFERTE (UNIQUEMENT CLIMATISEURS) - PLACÉ ICI */}
                            {currentProduct.name.trim().toUpperCase().startsWith('CLIMATISEUR') && (
                                <div className="mt-8 bg-[#E3001B] text-white px-10 py-6 rounded-tr-[3rem] rounded-bl-[3rem] shadow-[0_20px_50px_rgba(227,0,27,0.3)] self-start flex flex-col items-center justify-center -rotate-2 border-4 border-white/20 transform origin-left hover:scale-105 transition-transform cursor-default animate-bounce-slow">
                                    <span className="text-2xl font-bold italic leading-none drop-shadow-sm">Installation</span>
                                    <span className="text-5xl font-black uppercase leading-[0.85] tracking-tighter drop-shadow-md mt-1">OFFERTE*</span>
                                    <span className="text-sm font-bold mt-2 opacity-90 tracking-widest bg-black/20 px-3 py-1 rounded-full">OFFRE LIMITÉE</span>
                                </div>
                            )}
                        </div>
                    </div>
                  ) : <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={80}/></div>
              )}

              {/* MODE PLANNING */}
              {activeMode === 'PLANNING' && (
                <div className="w-full h-full p-12 flex flex-col animate-fade-in">
                    <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-6">
                        <div>
                           <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-2">programmes des interventions en cours...</h2>
                           <span className="text-orange-500 font-black text-3xl uppercase tracking-widest">{todayDate}</span>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                            <span className="text-white/40 font-mono font-bold text-xl">Page {planningPage + 1}/{totalPlanningPages}</span>
                            <Calendar size={48} className="text-blue-500 animate-pulse" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-8 flex-1 min-h-0">
                        {currentPlanningSlice.map((inter) => {
                            const technician = getTechnician(inter.technician);
                            
                            return (
                                <div key={inter.id} className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[2.5rem] flex flex-col shadow-2xl relative overflow-hidden animate-slide-up">
                                    
                                    {/* Status & Tech Header */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex flex-col gap-3">
                                            <span className={`px-5 py-2 rounded-xl font-black text-xl uppercase tracking-widest shadow-lg h-fit w-fit ${inter.status === 'En cours' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>
                                            {inter.status}
                                            </span>
                                            {/* DATE AJOUTÉE ICI */}
                                            <div className="flex items-center gap-2 text-white/50 font-black text-lg uppercase tracking-wider bg-black/20 px-4 py-1 rounded-lg w-fit">
                                                <Calendar size={20} />
                                                {new Date(inter.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="flex flex-col items-end pt-1">
                                                {/* Label */}
                                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Technicien (Chef de groupe)</p>
                                                {/* Name - Now under the label but left of photo */}
                                                <p className="text-orange-400 font-black text-2xl uppercase text-right leading-tight max-w-[150px]">{inter.technician}</p>
                                            </div>
                                            
                                            {/* Photo - Pushed to the right and stuck to the top of the block */}
                                            {technician?.photoUrl ? (
                                                <img 
                                                  src={technician.photoUrl} 
                                                  className="w-20 h-20 rounded-full object-cover border-4 border-orange-400 shadow-md" 
                                                  alt={inter.technician}
                                                  style={{ objectPosition: technician.photoPosition || '50% 50%' }}
                                                />
                                            ) : (
                                                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-white border-4 border-orange-400 shadow-md">
                                                    <User size={32}/>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Centered Content */}
                                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                                        
                                        {/* Domaine d'activité (Ajout) */}
                                        {inter.domain && (
                                            <div className="flex items-center gap-3 bg-white/20 px-5 py-2 rounded-full border border-white/10 shadow-lg mb-2 backdrop-blur-sm">
                                                <Briefcase size={20} className="text-orange-400" />
                                                <span className="text-white font-black text-lg uppercase tracking-widest">
                                                    {inter.domain} {inter.interventionType && <span className="text-white/60 mx-1">•</span>} {inter.interventionType}
                                                </span>
                                            </div>
                                        )}

                                        <div>
                                            <h4 className="text-white text-5xl font-black uppercase leading-none tracking-tighter mb-3 drop-shadow-lg">
                                                {inter.client.replace(/Société/g, 'Sté').replace(/Entreprise/g, 'Ets')}
                                            </h4>
                                            {inter.clientPhone ? (
                                                <span className="text-blue-300 text-2xl font-bold tracking-widest block bg-blue-900/30 px-4 py-1 rounded-lg border border-blue-500/30 mx-auto w-fit">{inter.clientPhone}</span>
                                            ) : (
                                                <span className="text-gray-500 text-xl font-bold tracking-widest block italic">Numéro masqué</span>
                                            )}
                                        </div>

                                        {inter.location && (
                                            <div className="flex items-center justify-center gap-2 text-gray-200 text-2xl font-bold uppercase tracking-wide">
                                                <MapPin size={28} className="text-red-500"/> {inter.location}
                                            </div>
                                        )}
                                        
                                        {/* Description Box Centered */}
                                        <div className="w-full bg-black/40 p-6 rounded-3xl border border-white/10 backdrop-blur-sm flex items-center justify-center min-h-[120px]">
                                            <p className="text-white text-2xl font-bold leading-tight">{inter.description}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Site Badge Bottom */}
                                    {inter.site && (
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-30">
                                            <span className="text-4xl font-black text-white uppercase tracking-[0.5em]">{inter.site}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
                      <div key={currentAchievement.id} className="w-full h-full flex animate-fade-slow">
                          {/* Partie Gauche : Texte & Description */}
                          <div className="w-[40%] h-full bg-white flex flex-col justify-center p-16 shadow-[40px_0_100px_rgba(0,0,0,0.5)] z-20 relative">
                              <div className="self-start mb-12">
                                   <span className="bg-purple-600 text-white px-6 py-3 rounded-2xl text-xl font-black uppercase tracking-widest flex items-center gap-3 shadow-lg">
                                      {currentAchievement.mediaType === 'video' ? <Video size={28}/> : <ImageIcon size={28}/>} 
                                      Réalisation
                                   </span>
                              </div>
                              
                              <h2 className="text-5xl font-black text-gray-950 uppercase tracking-tighter mb-8 leading-normal text-center">
                                  {currentAchievement.title}
                              </h2>
                              
                              <div className="w-24 h-4 bg-orange-600 mb-8 rounded-full mx-auto"></div>

                              {currentAchievement.description && (
                                  <p className="text-4xl text-gray-500 font-bold leading-snug">
                                      {currentAchievement.description}
                                  </p>
                              )}
                              
                              <div className="mt-12 text-gray-400 font-black text-2xl uppercase tracking-[0.2em] flex items-center gap-2">
                                  <Calendar size={24} className="text-orange-500"/>
                                  {new Date(currentAchievement.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                              </div>
                          </div>

                          {/* Partie Droite : Média (Image/Vidéo) */}
                          <div className="w-[60%] h-full bg-black relative flex items-center justify-center overflow-hidden">
                               {/* Fond flouté pour l'ambiance */}
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
                                      muted // IMPORTANT: Vidéo muette pour ne pas clasher avec la musique de fond
                                      playsInline // Empêche le plein écran natif forcé sur certains navigateurs
                                      loop={false}
                                      onEnded={handleVideoEnded}
                                      onError={handleVideoEnded}
                                      style={{ pointerEvents: 'none' }} // Désactive toutes les interactions souris (overlays, boutons)
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
