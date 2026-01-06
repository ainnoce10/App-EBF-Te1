import React, { useState, useEffect, useRef } from 'react';
import { StockItem, Intervention, TickerMessage } from '../types';
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
  Settings,
  Minus,
  Plus,
  Monitor,
  Scan,
  Phone,
  Info
} from 'lucide-react';
import { Logo } from '../constants';

interface ShowcaseModeProps {
  onClose?: () => void;
  liveStock?: StockItem[];
  liveInterventions?: Intervention[];
  liveMessages?: TickerMessage[];
  customLogo?: string;
}

const ShowcaseMode: React.FC<ShowcaseModeProps> = ({ 
  onClose, 
  liveStock = [], 
  liveInterventions = [], 
  liveMessages = [],
  customLogo
}) => {
  const [activeMode, setActiveMode] = useState<'PUBLICITE' | 'PLANNING'>('PUBLICITE');
  const [productIdx, setProductIdx] = useState(0);
  const [planningPage, setPlanningPage] = useState(0);
  
  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [audioSrc, setAudioSrc] = useState('');
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // TV Settings State (Overscan & Zoom)
  const [overscanPadding, setOverscanPadding] = useState(4); // Marge %
  const [zoomLevel, setZoomLevel] = useState(1); // Echelle (1 = 100%)
  const [showTvSettings, setShowTvSettings] = useState(false);

  const products = liveStock.length > 0 ? liveStock : [];
  const planning = liveInterventions.length > 0 ? liveInterventions : [];
  const flashes = liveMessages.length > 0 ? liveMessages : [{ content: "Bienvenue chez EBF Technical Center", color: 'neutral' } as TickerMessage];

  // 0. CHARGEMENT REGLAGES TV & DETECTION PLEIN ECRAN
  useEffect(() => {
    // Charger réglages sauvegardés
    const savedPadding = localStorage.getItem('ebf_tv_padding');
    if (savedPadding) setOverscanPadding(parseFloat(savedPadding));

    const savedZoom = localStorage.getItem('ebf_tv_zoom');
    if (savedZoom) setZoomLevel(parseFloat(savedZoom));

    // Tenter le plein écran au montage
    const requestFullScreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch (e) {
            console.log("Plein écran auto bloqué (attente interaction).");
        }
    };
    
    requestFullScreen();
    setTimeout(requestFullScreen, 1000);
  }, []);

  const updateOverscan = (delta: number) => {
      setOverscanPadding(prev => {
          const newVal = Math.max(0, Math.min(15, prev + delta)); 
          localStorage.setItem('ebf_tv_padding', newVal.toString());
          return newVal;
      });
  };

  const updateZoom = (delta: number) => {
      setZoomLevel(prev => {
          const newVal = Math.max(0.5, Math.min(1.5, parseFloat((prev + delta).toFixed(2))));
          localStorage.setItem('ebf_tv_zoom', newVal.toString());
          return newVal;
      });
  };

  // 1. Chargement de la musique depuis SUPABASE (Avec Realtime)
  useEffect(() => {
    const fetchMusic = async () => {
        try {
            const { data } = await supabase
                .from('tv_settings')
                .select('value')
                .eq('key', 'background_music')
                .maybeSingle();
            
            if (data && data.value) {
                setAudioSrc(data.value);
            } else {
                setAudioSrc('https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=corporate-ambient-14224.mp3');
            }
        } catch (e) {
            console.error("Erreur lecture musique DB", e);
        }
    };
    fetchMusic();

    const channel = supabase.channel('tv-music-update')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'tv_settings' },
            (payload) => {
                if ((payload.new as any)?.key === 'background_music') {
                    const newVal = (payload.new as any).value;
                    if (newVal) {
                        setAudioSrc(newVal);
                    }
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, []);

  // 2. Gestion Playback Robuste
  useEffect(() => {
    if (audioRef.current && audioSrc) {
        audioRef.current.volume = 0.3;
        audioRef.current.load();
        const tryPlay = async () => {
             try {
                 if (!isMuted) {
                    const playPromise = audioRef.current?.play();
                    if (playPromise !== undefined) {
                        await playPromise;
                        setAutoplayFailed(false);
                    }
                 }
             } catch (error) {
                 console.log("Autoplay bloqué par le navigateur:", error);
                 setAutoplayFailed(true);
                 setIsMuted(true);
             }
        };
        tryPlay();
    }
  }, [audioSrc]);

  // 3. Gestion Mute/Unmute
  useEffect(() => {
      if (audioRef.current) {
          if (isMuted) {
              audioRef.current.pause();
          } else {
              audioRef.current.play().catch(() => setAutoplayFailed(true));
          }
      }
  }, [isMuted]);

  const handleStartShow = async () => {
    setIsMuted(false);
    setAutoplayFailed(false);
    if(audioRef.current) audioRef.current.play().catch(console.error);
    try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch (e) { console.error("Erreur plein écran manuel:", e); }
  };

  const getMessageColorClass = (color: string) => {
    switch(color) {
        case 'green': return 'text-green-400';
        case 'yellow': return 'text-yellow-400';
        case 'red': return 'text-red-500';
        default: return 'text-white';
    }
  };

  const todayDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const getTitleSizeClass = (text: string) => {
    const len = text.length;
    if (len < 20) return "text-3xl md:text-6xl lg:text-7xl xl:text-8xl"; 
    if (len < 40) return "text-2xl md:text-5xl lg:text-6xl xl:text-7xl"; 
    if (len < 80) return "text-xl md:text-4xl lg:text-5xl xl:text-6xl"; 
    return "text-lg md:text-3xl lg:text-4xl xl:text-5xl"; 
  };

  useEffect(() => {
    const modeInterval = setInterval(() => {
      setActiveMode((prev) => (prev === 'PUBLICITE' ? 'PLANNING' : 'PUBLICITE'));
    }, 60000); 
    return () => clearInterval(modeInterval);
  }, []);

  useEffect(() => {
    if (activeMode !== 'PUBLICITE' || products.length === 0) return;
    const interval = setInterval(() => {
      setProductIdx((prev) => (prev + 1) % products.length);
    }, 10000); 
    return () => clearInterval(interval);
  }, [activeMode, products.length]);

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

  // --- STYLE CALCULÉ POUR LE ZOOM ET L'OVERSCAN ---
  const outerStyle = {
      padding: `${overscanPadding}vmin`
  };

  // Astuce pour le zoom : On scale le contenu, mais on augmente la largeur/hauteur inversement
  // pour que le contenu remplisse toujours l'écran une fois scalé.
  const innerContentStyle: React.CSSProperties = {
      transform: `scale(${zoomLevel})`,
      transformOrigin: 'center center',
      width: `${100 / zoomLevel}%`,
      height: `${100 / zoomLevel}%`,
      // On centre le contenu scalé s'il est plus petit que le conteneur visuel
      display: 'flex',
      flexDirection: 'column'
  };

  return (
    <div 
        className="fixed inset-0 z-[500] bg-black flex items-center justify-center overflow-hidden font-sans select-none text-white transition-all duration-300 box-border"
        style={outerStyle}
    >
      
      {/* WRAPPER DE MISE A L'ECHELLE (ZOOM) */}
      <div className="relative overflow-hidden bg-black rounded-xl md:rounded-3xl shadow-2xl ring-1 ring-white/10" style={innerContentStyle}>

          {audioSrc && <audio ref={audioRef} loop src={audioSrc} autoPlay playsInline />}

          {autoplayFailed && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[600] animate-bounce flex flex-col items-center gap-4">
                  <button 
                    onClick={handleStartShow}
                    className="bg-green-600 hover:bg-green-500 text-white px-10 py-6 rounded-[2rem] font-black text-2xl shadow-[0_0_50px_rgba(34,197,94,0.6)] flex items-center gap-4 hover:scale-110 transition-transform"
                  >
                      <Play size={32} fill="currentColor" /> 
                      <span>LANCER LA TV</span>
                  </button>
                  <p className="text-white/70 font-bold uppercase tracking-widest bg-black/50 px-4 py-2 rounded-xl">Cliquez pour le son et le plein écran</p>
              </div>
          )}

          {/* HEADER TV */}
          <div className="bg-gray-950 px-4 py-4 md:px-10 md:h-28 flex flex-col md:flex-row items-center justify-between border-b-4 md:border-b-[8px] border-orange-600 shadow-2xl z-50 gap-4 md:gap-0 shrink-0 transition-colors duration-500">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-12 w-full md:w-auto">
                  <div className="bg-white/10 px-4 py-2 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    <Logo url={customLogo} />
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
                  {/* BOUTON REGLAGE TV */}
                  <div className="relative">
                      <button 
                        onClick={() => setShowTvSettings(!showTvSettings)}
                        className={`p-3 rounded-full border transition-all ${showTvSettings ? 'bg-orange-600 text-white border-orange-500' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'}`}
                      >
                          <Settings size={20} className={showTvSettings ? "animate-spin-slow" : ""} />
                      </button>

                      {/* POPUP DE REGLAGE */}
                      {showTvSettings && (
                          <div className="absolute top-16 right-0 bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-2xl w-72 z-[100] animate-fade-in">
                              <h4 className="flex items-center gap-2 text-white font-black uppercase text-sm mb-4 border-b border-gray-700 pb-2">
                                  <Monitor size={16} className="text-orange-500"/> Ajuster Écran TV
                              </h4>
                              
                              <div className="space-y-6">
                                  {/* Marge Control */}
                                  <div>
                                      <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                                          <span>Marge noire (Overscan)</span>
                                          <span className="text-white">{overscanPadding}%</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <button onClick={() => updateOverscan(-0.5)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-white"><Minus size={16}/></button>
                                          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                              <div className="h-full bg-orange-500 transition-all" style={{ width: `${(overscanPadding / 15) * 100}%` }}></div>
                                          </div>
                                          <button onClick={() => updateOverscan(0.5)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-white"><Plus size={16}/></button>
                                      </div>
                                  </div>

                                  {/* Zoom Control */}
                                  <div>
                                      <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                                          <span>Zoom Contenu</span>
                                          <span className="text-white">{Math.round(zoomLevel * 100)}%</span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <button onClick={() => updateZoom(-0.05)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-white"><Scan size={16}/></button>
                                          <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                              {/* 0.5 to 1.5 range mapping */}
                                              <div className="h-full bg-blue-500 transition-all" style={{ width: `${((zoomLevel - 0.5) / 1) * 100}%` }}></div>
                                          </div>
                                          <button onClick={() => updateZoom(0.05)} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 text-white"><Maximize2 size={16}/></button>
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-2 italic text-center">Utilisez le Zoom si le contenu est trop gros.</p>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  <button 
                    onClick={() => { const newState = !isMuted; setIsMuted(newState); }}
                    className={`p-3 rounded-full border transition-all ${isMuted ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'}`}
                  >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  
                  <button onClick={() => document.documentElement.requestFullscreen().catch(console.error)} className="hidden md:block p-3 rounded-full border bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10">
                    <Maximize2 size={20}/>
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

          {/* CONTENU PRINCIPAL - FLEX-1 POUR PRENDRE JUSTE L'ESPACE RESTANT */}
          <div className={`flex-1 flex flex-col overflow-hidden relative transition-colors duration-1000 ease-in-out min-h-0 ${activeMode === 'PLANNING' ? 'bg-[#0f172a]' : 'bg-gray-900'}`}>
              
              {activeMode === 'PUBLICITE' && currentProduct ? (
                <div className="flex flex-col lg:flex-row w-full animate-fade-in h-full min-h-0">
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
                            <div className="flex-1 min-h-0 flex flex-col justify-center">
                                <div className="w-full">
                                    <span className="px-4 py-1.5 md:px-8 md:py-3 bg-orange-600 text-white rounded-lg md:rounded-xl text-xs md:text-2xl font-black uppercase mb-2 md:mb-6 inline-block shadow-lg tracking-widest shrink-0">
                                    {currentProduct.category}
                                    </span>
                                    <h1 className={`${getTitleSizeClass(currentProduct.name)} font-black leading-tight md:leading-[0.95] tracking-tighter mb-4 md:mb-8 text-gray-950 uppercase italic line-clamp-4`}>
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
                <div className="flex w-full p-6 md:p-16 animate-fade-in flex-col h-full min-h-0 overflow-hidden">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-8 shrink-0 border-b border-white/10 pb-4 md:pb-6 gap-4">
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
                    
                    {/* GRILLE ELASTIQUE QUI NE DEBORDE PAS VERTICALEMENT */}
                    <div 
                        key={planningPage} 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 min-h-0 animate-slide-up"
                    >
                        {currentPlanningSlice.map((inter) => (
                            <div key={inter.id} className="bg-white/10 backdrop-blur-md border border-white/20 p-6 md:p-8 rounded-3xl flex flex-col gap-4 shadow-2xl h-full relative overflow-hidden group">
                                {/* Header: Status + Site + Badge Nature/Domaine */}
                                <div className="flex justify-between items-start shrink-0">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-wrap gap-2">
                                             <span className={`px-4 py-2 rounded-xl font-black text-xs md:text-sm uppercase tracking-widest inline-block text-center shadow-lg
                                              ${inter.status === 'Terminé' ? 'bg-green-500 text-white' : 
                                                inter.status === 'En cours' ? 'bg-orange-500 text-white' : 
                                                inter.status === 'En attente' ? 'bg-blue-600 text-white' :
                                                'bg-gray-700 text-gray-300'}`}>
                                              {inter.status}
                                            </span>
                                            {inter.site && (
                                                <span className="px-3 py-2 bg-white/20 rounded-lg text-white font-bold text-xs uppercase flex items-center gap-1">
                                                    <MapPin size={12} /> {inter.site}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {inter.domain && (
                                                <span className="text-[10px] md:text-xs font-bold uppercase text-white/70 bg-black/20 px-2 py-1 rounded border border-white/5">
                                                   {inter.domain}
                                                </span>
                                            )}
                                            {inter.interventionType && (
                                                <span className="text-[10px] md:text-xs font-bold uppercase text-blue-200 bg-blue-900/20 px-2 py-1 rounded border border-blue-500/20">
                                                   {inter.interventionType}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Body Information ordered as requested: Client -> Lieu -> Tel -> Détails */}
                                <div className="flex-1 flex flex-col justify-center min-h-0 space-y-4">
                                    {/* 1. CLIENT */}
                                    <div className="border-l-4 border-orange-500 pl-4">
                                        <h4 className="text-white text-2xl md:text-4xl font-black tracking-tight leading-none drop-shadow-md uppercase line-clamp-1">
                                            {inter.client}
                                        </h4>
                                    </div>

                                    {/* 2. LIEU (Location precise) */}
                                    {inter.location && (
                                        <div className="flex items-center gap-3 text-blue-200">
                                            <div className="p-2 bg-blue-500/20 rounded-full">
                                                <MapPin size={24} />
                                            </div>
                                            <span className="text-lg md:text-xl font-bold uppercase tracking-wide line-clamp-1">
                                                {inter.location}
                                            </span>
                                        </div>
                                    )}

                                    {/* 3. TEL */}
                                    {inter.clientPhone && (
                                        <div className="flex items-center gap-3 text-green-400">
                                            <div className="p-2 bg-green-500/20 rounded-full">
                                                <Phone size={24} />
                                            </div>
                                            <span className="text-lg md:text-xl font-mono font-bold tracking-widest">
                                                {inter.clientPhone}
                                            </span>
                                        </div>
                                    )}

                                    {/* 4. DETAILS (Description) */}
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex-1 min-h-0 overflow-hidden relative">
                                        <div className="absolute top-2 right-2 opacity-20"><Info size={20}/></div>
                                        <p className="text-gray-300 text-sm md:text-lg font-medium leading-relaxed line-clamp-4">
                                            {inter.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        {Array.from({ length: Math.max(0, 3 - currentPlanningSlice.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center opacity-10 h-full">
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

          {/* FLASH INFO - FOND NOIR */}
          <div className="h-14 md:h-24 bg-black relative z-[200] border-t-4 md:border-t-[8px] border-orange-600 overflow-hidden flex items-center shadow-[0_-10px_50px_rgba(0,0,0,0.5)] shrink-0 rounded-b-xl md:rounded-b-3xl">
              <div className="bg-gray-950 h-full px-4 md:px-8 flex items-center justify-center z-20 shadow-[10px_0_30px_rgba(0,0,0,0.8)] border-r-4 border-orange-500 rounded-bl-xl md:rounded-bl-3xl">
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
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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