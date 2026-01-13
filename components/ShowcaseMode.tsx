
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
  Volume1,
  VolumeX,
  Maximize2,
  Settings,
  Minus,
  Plus,
  Monitor,
  Scan,
  Phone,
  Loader2,
  Tv,
  Trophy
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
  const [volume, setVolume] = useState(0.5);
  const [audioSrc, setAudioSrc] = useState(initialMusicUrl || '');
  const [autoplayFailed, setAutoplayFailed] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Video Player Ref (pour Réalisations)
  const videoRef = useRef<HTMLVideoElement>(null);

  // TV UX State
  const [osdMessage, setOsdMessage] = useState<{icon: React.ReactNode, text: string} | null>(null);
  const osdTimeoutRef = useRef<number | null>(null);
  const [cursorVisible, setCursorVisible] = useState(true);
  const cursorTimeoutRef = useRef<number | null>(null);

  // TV Settings State (Overscan & Zoom)
  const [overscanPadding, setOsdverscanPadding] = useState(2); // Défaut 2% pour éviter les bords coupés
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showTvSettings, setShowTvSettings] = useState(false);

  const products = liveStock.length > 0 ? liveStock : [];
  
  // Filtrage des interventions
  const planning = liveInterventions.length > 0 
    ? liveInterventions.filter(i => i.status === 'En cours' || i.status === 'En attente') 
    : [];
    
  const achievements = liveAchievements.length > 0 ? liveAchievements : [];

  const flashes = liveMessages.length > 0 ? liveMessages : [{ content: "Bienvenue chez EBF Technical Center", color: 'neutral' } as TickerMessage];

  // --- 0. GESTION DU CURSEUR (Souris fantôme sur TV) ---
  useEffect(() => {
    const hideCursor = () => setCursorVisible(false);
    const showCursor = () => {
        setCursorVisible(true);
        if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
        cursorTimeoutRef.current = window.setTimeout(hideCursor, 3000);
    };

    window.addEventListener('mousemove', showCursor);
    window.addEventListener('click', showCursor);
    // Masquer initialement après 3s
    cursorTimeoutRef.current = window.setTimeout(hideCursor, 3000);

    return () => {
        window.removeEventListener('mousemove', showCursor);
        window.removeEventListener('click', showCursor);
        if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
    };
  }, []);

  // --- 1. GESTION TÉLÉCOMMANDE (CLAVIER) ---
  useEffect(() => {
    const handleRemoteControl = (e: KeyboardEvent) => {
        // Afficher curseur si interaction clavier (rare mais utile)
        setCursorVisible(true);
        if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
        cursorTimeoutRef.current = window.setTimeout(() => setCursorVisible(false), 3000);

        switch(e.key) {
            case 'ArrowRight': // Mode Suivant
                setActiveMode(prev => {
                    if (prev === 'PUBLICITE') { showOSD(<ClipboardList size={24}/>, "MODE: CHANTIERS"); return 'PLANNING'; }
                    if (prev === 'PLANNING') { showOSD(<Trophy size={24}/>, "MODE: RÉALISATIONS"); return 'REALISATIONS'; }
                    showOSD(<LayoutGrid size={24}/>, "MODE: PRODUITS"); return 'PUBLICITE';
                });
                break;
            case 'ArrowLeft': // Mode Précédent
                setActiveMode(prev => {
                    if (prev === 'PUBLICITE') { showOSD(<Trophy size={24}/>, "MODE: RÉALISATIONS"); return 'REALISATIONS'; }
                    if (prev === 'REALISATIONS') { showOSD(<ClipboardList size={24}/>, "MODE: CHANTIERS"); return 'PLANNING'; }
                    showOSD(<LayoutGrid size={24}/>, "MODE: PRODUITS"); return 'PUBLICITE';
                });
                break;
            case 'ArrowUp': // Volume +
                changeVolume(0.1);
                break;
            case 'ArrowDown': // Volume -
                changeVolume(-0.1);
                break;
            case 'Enter': // OK / Select -> Mute/Unmute ou Play
                if (autoplayFailed) handleStartShow();
                else toggleMute();
                break;
            case 'Backspace': // Retour (WebOS/Tizen)
            case 'Escape':
                if (onClose) onClose();
                break;
            case 'MediaPlayPause':
                toggleMute();
                break;
            default:
                break;
        }
    };

    window.addEventListener('keydown', handleRemoteControl);
    return () => window.removeEventListener('keydown', handleRemoteControl);
  }, [volume, isMuted, autoplayFailed]);

  const showOSD = (icon: React.ReactNode, text: string) => {
      setOsdMessage({ icon, text });
      if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
      osdTimeoutRef.current = window.setTimeout(() => setOsdMessage(null), 2000);
  };

  const changeVolume = (delta: number) => {
      let newVol = Math.max(0, Math.min(1, volume + delta));
      newVol = parseFloat(newVol.toFixed(1));
      setVolume(newVol);
      if (audioRef.current) audioRef.current.volume = newVol;
      
      if (newVol === 0) showOSD(<VolumeX size={24}/>, "VOLUME: MUET");
      else showOSD(<Volume2 size={24}/>, `VOLUME: ${Math.round(newVol * 100)}%`);
      
      if (isMuted && delta > 0) {
          setIsMuted(false);
          if (audioRef.current) audioRef.current.muted = false;
      }
  };

  // --- CHARGEMENT REGLAGES ---
  useEffect(() => {
    const savedPadding = localStorage.getItem('ebf_tv_padding');
    if (savedPadding) setOsdverscanPadding(parseFloat(savedPadding));

    const savedZoom = localStorage.getItem('ebf_tv_zoom');
    if (savedZoom) setZoomLevel(parseFloat(savedZoom));
    
    if (initialMusicUrl) setAudioSrc(initialMusicUrl);
  }, [initialMusicUrl]);

  const updateOverscan = (delta: number) => {
      setOsdverscanPadding(prev => {
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
        setAudioLoading(true);
        audioRef.current.volume = volume;
        
        const tryPlay = async () => {
             try {
                 if (!isMuted) {
                    await audioRef.current?.play();
                    setAutoplayFailed(false);
                 }
             } catch (error) {
                 console.log("Autoplay bloqué, attente interaction utilisateur.", error);
                 setAutoplayFailed(true);
                 setIsMuted(true);
             } finally {
                 setAudioLoading(false);
             }
        };
        tryPlay();
    }
  }, [audioSrc]);

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
        audioRef.current.currentTime = 0;
        audioRef.current.muted = false;
        audioRef.current.volume = volume;
        audioRef.current.play().catch(console.error);
    }
    try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    } catch (e) { console.error("Erreur plein écran manuel:", e); }
  };

  const toggleMute = () => {
      if (isMuted) {
          setIsMuted(false);
          if (audioRef.current) audioRef.current.muted = false;
          audioRef.current?.play().catch(() => setAutoplayFailed(true));
          showOSD(<Volume2 size={24}/>, "SON ACTIVÉ");
      } else {
          setIsMuted(true);
          if (audioRef.current) audioRef.current.muted = true;
          showOSD(<VolumeX size={24}/>, "SON COUPÉ");
      }
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

  // --- CYCLES D'AFFICHAGE ---
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

  // Cycle Produits
  useEffect(() => {
    if (activeMode !== 'PUBLICITE' || products.length === 0) return;
    const interval = setInterval(() => {
      setProductIdx((prev) => (prev + 1) % products.length);
    }, 10000); 
    return () => clearInterval(interval);
  }, [activeMode, products.length]);

  // Cycle Planning (3 items max par page, pas de scroll)
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

  // Cycle Réalisations
  useEffect(() => {
      if (activeMode !== 'REALISATIONS' || achievements.length === 0) {
          setAchievementIdx(0);
          return;
      }
      const currentItem = achievements[achievementIdx];
      let timer: number;
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

  const currentProduct = products[productIdx];
  const currentPlanningSlice = planning.slice(planningPage * itemsPerPage, (planningPage + 1) * itemsPerPage);
  const currentAchievement = achievements[achievementIdx];

  // --- STYLES FIXES POUR EVITER LE SCROLL ---
  // On utilise 100dvh pour la hauteur totale et on désactive le scroll sur le container principal
  const outerStyle: React.CSSProperties = { 
    padding: `${overscanPadding}vmin`,
    height: '100dvh',
    width: '100vw',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: 'black',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 500
  };

  const innerContentStyle: React.CSSProperties = {
      transform: `scale(${zoomLevel})`,
      transformOrigin: 'center center',
      width: `${100 / zoomLevel}%`,
      height: `${100 / zoomLevel}%`,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden', // CRITICAL: Empêche le contenu de déborder du cadre zoomé
      position: 'relative'
  };

  return (
    <div style={outerStyle} className="font-sans select-none text-white">
      
      {/* OSD */}
      {osdMessage && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-4 bg-gray-900/90 backdrop-blur-md px-8 py-4 rounded-full border border-white/20 shadow-2xl animate-fade-in">
              <div className="text-orange-500">{osdMessage.icon}</div>
              <span className="font-black text-xl uppercase tracking-widest text-white">{osdMessage.text}</span>
          </div>
      )}

      {/* CONTAINER PRINCIPAL (ZOOMABLE) */}
      <div className="bg-black relative rounded-xl shadow-2xl ring-1 ring-white/10" style={innerContentStyle}>

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

          {/* ECRAN D'ACCUEIL */}
          {autoplayFailed && (
              <div className="absolute inset-0 z-[600] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
                  <button 
                    onClick={handleStartShow}
                    className="bg-green-600 hover:bg-green-500 text-white px-12 py-8 rounded-[3rem] font-black text-3xl shadow-[0_0_80px_rgba(34,197,94,0.5)] flex items-center gap-6 hover:scale-110 transition-transform animate-pulse"
                  >
                      <Tv size={48} /> 
                      <span>LANCER TV EBF</span>
                  </button>
              </div>
          )}

          {/* 1. HEADER (FIXE HAUT) */}
          <div className="h-20 bg-gray-950 px-4 flex items-center justify-between border-b-4 border-orange-600 shadow-2xl z-50 shrink-0">
              <div className="flex items-center gap-4">
                  <div className="bg-white/10 px-3 py-1.5 rounded-xl">
                    <Logo url={customLogo} size="md" theme="dark" label="TV" />
                  </div>
                  
                  <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                      <button className={`px-3 py-1.5 rounded-lg font-black text-xs uppercase ${activeMode === 'PUBLICITE' ? 'bg-orange-600 text-white' : 'text-white/30'}`}>Produits</button>
                      <button className={`px-3 py-1.5 rounded-lg font-black text-xs uppercase ${activeMode === 'PLANNING' ? 'bg-blue-600 text-white' : 'text-white/30'}`}>Chantiers</button>
                      <button className={`px-3 py-1.5 rounded-lg font-black text-xs uppercase ${activeMode === 'REALISATIONS' ? 'bg-purple-600 text-white' : 'text-white/30'}`}>Réalisations</button>
                  </div>
              </div>

              <div className="flex items-center gap-3 opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <button onClick={() => setShowTvSettings(!showTvSettings)} className="p-2 rounded-full bg-white/5"><Settings size={18}/></button>
                  {showTvSettings && (
                      <div className="absolute top-20 right-4 bg-gray-900 border border-gray-700 p-4 rounded-xl w-64 z-[100]">
                          <div className="mb-4">
                              <div className="flex justify-between text-xs mb-1"><span>Marge</span><span>{overscanPadding}%</span></div>
                              <div className="flex gap-2"><button onClick={() => updateOverscan(-0.5)} className="bg-gray-700 px-2 rounded">-</button><button onClick={() => updateOverscan(0.5)} className="bg-gray-700 px-2 rounded">+</button></div>
                          </div>
                          <div>
                              <div className="flex justify-between text-xs mb-1"><span>Zoom</span><span>{Math.round(zoomLevel*100)}%</span></div>
                              <div className="flex gap-2"><button onClick={() => updateZoom(-0.05)} className="bg-gray-700 px-2 rounded">-</button><button onClick={() => updateZoom(0.05)} className="bg-gray-700 px-2 rounded">+</button></div>
                          </div>
                      </div>
                  )}
                  {onClose && <button onClick={onClose} className="p-2 bg-red-600/20 text-red-500 rounded-full"><X size={18}/></button>}
              </div>
          </div>

          {/* 2. CONTENU (FLEX-1: PREND TOUTE LA HAUTEUR RESTANTE) */}
          <div className={`flex-1 min-h-0 relative transition-colors duration-1000 ${activeMode === 'PLANNING' ? 'bg-[#0f172a]' : activeMode === 'REALISATIONS' ? 'bg-black' : 'bg-gray-900'}`}>
              
              {/* MODE PRODUIT (SPLIT SCREEN) */}
              {activeMode === 'PUBLICITE' && currentProduct ? (
                <div className="flex w-full h-full animate-fade-in">
                    {/* Image: Prend 45% et toute la hauteur, object-contain pour tout voir */}
                    <div className="w-[45%] h-full bg-gray-950 flex items-center justify-center relative border-r border-white/10 p-4">
                         <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
                         <img 
                            src={currentProduct.imageUrls?.[0] || 'https://placehold.co/800x800/1a1a1a/ffffff?text=EBF'} 
                            className="w-full h-full object-contain drop-shadow-2xl z-20"
                            alt={currentProduct.name}
                         />
                    </div>
                    {/* Info: Prend 55%, Flex Column, Justify Center */}
                    <div className="w-[55%] h-full bg-white text-gray-900 p-8 flex flex-col justify-center relative overflow-hidden">
                        <span className="inline-block px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-black uppercase tracking-widest mb-4 w-fit shadow-lg">
                            {currentProduct.category}
                        </span>
                        <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-6 uppercase tracking-tight line-clamp-3">
                            {currentProduct.name}
                        </h1>
                        <div className="flex items-center gap-6 mb-8 text-gray-500 font-bold uppercase text-sm">
                            <span className="flex items-center gap-2"><Zap size={18} className="text-orange-600"/> {currentProduct.supplier}</span>
                            <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-green-600"/> Garantie EBF</span>
                        </div>
                        <div className="mt-auto bg-gray-950 text-white p-6 rounded-2xl border-l-8 border-orange-600 shadow-xl">
                            <p className="text-xs uppercase text-orange-500 font-bold mb-1">Prix Promo</p>
                            <p className="text-6xl font-black tracking-tighter">{currentProduct.unitPrice.toLocaleString()} <span className="text-2xl text-gray-500">F</span></p>
                        </div>
                    </div>
                </div>
              ) : activeMode === 'PLANNING' ? (
                <div className="w-full h-full p-6 flex flex-col animate-slide-up">
                    <div className="flex justify-between items-end mb-4 shrink-0 border-b border-white/10 pb-2">
                        <div>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Chantiers</h2>
                            <p className="text-orange-500 font-bold text-lg uppercase tracking-widest">{todayDate}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                            <span className="text-sm font-mono font-bold text-gray-400">Page {planningPage + 1}/{totalPlanningPages}</span>
                        </div>
                    </div>
                    
                    {/* GRILLE STRICTE 3 COLONNES - HAUTEUR REMPLIE */}
                    <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
                        {currentPlanningSlice.map((inter) => (
                            <div key={inter.id} className="bg-white/10 border border-white/10 rounded-2xl p-5 flex flex-col h-full relative overflow-hidden shadow-lg">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${inter.status === 'En cours' ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}>
                                        {inter.status}
                                    </span>
                                    {inter.site && <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><MapPin size={10}/> {inter.site}</span>}
                                </div>
                                
                                <h3 className="text-xl font-black uppercase leading-tight mb-1 truncate text-white">{inter.client}</h3>
                                <p className="text-xs text-gray-400 font-bold uppercase mb-3 truncate">{inter.interventionType} • {inter.domain}</p>
                                
                                {/* Description qui prend la place restante mais ne déborde pas */}
                                <div className="flex-1 bg-black/20 rounded-xl p-3 mb-3 min-h-0">
                                    <p className="text-sm font-medium text-gray-300 leading-snug line-clamp-4 md:line-clamp-6">
                                        {inter.description}
                                    </p>
                                </div>
                                
                                <div className="mt-auto flex items-center gap-2 text-green-400 pt-2 border-t border-white/5">
                                    <Phone size={14}/>
                                    <span className="text-sm font-mono font-black tracking-wider">{inter.clientPhone || '---'}</span>
                                </div>
                            </div>
                        ))}
                        {/* Empty states filler if less than 3 items */}
                        {[...Array(itemsPerPage - currentPlanningSlice.length)].map((_, i) => (
                            <div key={`empty-${i}`} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-center opacity-30">
                                <Calendar size={40}/>
                            </div>
                        ))}
                    </div>
                </div>
              ) : activeMode === 'REALISATIONS' && currentAchievement ? (
                <div className="w-full h-full relative bg-black flex items-center justify-center">
                    {/* Media Container: Full Size, Object Contain (No Crop) */}
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
                    
                    {/* Caption Overlay (Bottom) */}
                    <div className="absolute bottom-6 left-0 right-0 flex justify-center px-8">
                        <div className="bg-black/80 backdrop-blur-md border border-white/20 px-8 py-4 rounded-2xl text-center max-w-4xl shadow-2xl">
                            <h2 className="text-2xl font-black uppercase text-white tracking-tight mb-1">{currentAchievement.title}</h2>
                            {currentAchievement.description && <p className="text-sm text-gray-300 line-clamp-2">{currentAchievement.description}</p>}
                        </div>
                    </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 size={40} className="animate-spin text-white/20"/>
                </div>
              )}
          </div>

          {/* 3. FOOTER (TICKER FIXE BAS) */}
          <div className="h-14 bg-black border-t-4 border-orange-600 flex items-center shrink-0 relative z-20">
              <div className="h-full bg-gray-950 px-6 flex items-center justify-center border-r-4 border-orange-500">
                  <Megaphone size={20} className="text-orange-500 animate-pulse" />
              </div>
              <div className="flex-1 overflow-hidden whitespace-nowrap">
                  <div className="inline-block animate-tv-ticker">
                      {flashes.concat(flashes).concat(flashes).map((msg, i) => (
                          <span key={i} className={`${getMessageColorClass(msg.color)} text-2xl font-black px-12 uppercase italic tracking-tight`}>
                              {msg.content} <span className="text-gray-800 mx-6">///</span>
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
          0% { transform: scale(0.95); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        /* Utilitaires spécifiques TV */
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-6 {
          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ShowcaseMode;
