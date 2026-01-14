
import React, { useState, useEffect, useRef } from 'react';
import { StockItem, Intervention, TickerMessage, Achievement, Employee } from '../types';
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
  Music
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
  initialMusicUrl?: string; // Gardé pour compatibilité mais on utilise la playlist désormais
}

const ShowcaseMode: React.FC<ShowcaseModeProps> = ({ 
  onClose, 
  liveStock = [], 
  liveInterventions = [], 
  liveMessages = [],
  liveAchievements = [],
  liveEmployees = [],
  customLogo
}) => {
  const [activeMode, setActiveMode] = useState<'PUBLICITE' | 'PLANNING' | 'REALISATIONS'>('PUBLICITE');
  const [productIdx, setProductIdx] = useState(0);
  const [planningPage, setPlanningPage] = useState(0);
  const [achievementIdx, setAchievementIdx] = useState(0);
  
  // Audio Playlist state
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- LOGIQUE DE MISE A L'ECHELLE ---
  const BASE_WIDTH = 1920;
  const BASE_HEIGHT = 1080;
  const [windowSize, setWindowSize] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 1920, h: typeof window !== 'undefined' ? window.innerHeight : 1080 });
  const [userScaleModifier, setUserScaleModifier] = useState(1); 
  const [showTvSettings, setShowTvSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    const savedScale = localStorage.getItem('ebf_tv_scale_v5');
    if (savedScale) setUserScaleModifier(parseFloat(savedScale));
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const finalScale = (windowSize.w / BASE_WIDTH) * userScaleModifier;

  // --- CHARGEMENT DE LA PLAYLIST AUDIO ---
  useEffect(() => {
      const loadPlaylist = async () => {
          try {
              const { data, error } = await supabase.storage.from('assets').list();
              if (error) throw error;
              
              const tracks = data
                  .filter(f => f.name.toLowerCase().endsWith('.mp3') || f.name.toLowerCase().endsWith('.wav'))
                  .map(f => {
                      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(f.name);
                      return publicUrl;
                  });
              
              if (tracks.length > 0) {
                  setPlaylist(tracks);
                  console.log(`${tracks.length} morceaux chargés dans la playlist TV`);
              }
          } catch (e) {
              console.error("Erreur playlist audio:", e);
          }
      };
      loadPlaylist();
  }, []);

  // Gestion du lecteur audio
  useEffect(() => {
    if (audioRef.current && playlist.length > 0) {
        if (!isMuted) {
            setAudioLoading(true);
            audioRef.current.play()
                .catch(() => setIsMuted(true)) // Mute si autoplay bloqué
                .finally(() => setAudioLoading(false));
        } else {
            audioRef.current.pause();
        }
    }
  }, [playlist, currentTrackIdx, isMuted]);

  const handleTrackEnded = () => {
      setCurrentTrackIdx(prev => (prev + 1) % playlist.length);
  };

  const toggleMute = () => setIsMuted(!isMuted);

  // --- CYCLES DE CONTENU ---
  useEffect(() => {
    const modeInterval = setInterval(() => {
      setActiveMode((prev) => prev === 'PUBLICITE' ? 'PLANNING' : prev === 'PLANNING' ? 'REALISATIONS' : 'PUBLICITE');
    }, 60000); 
    return () => clearInterval(modeInterval);
  }, []);

  useEffect(() => {
    if (activeMode !== 'PUBLICITE' || liveStock.length === 0) return;
    const interval = setInterval(() => setProductIdx((prev) => (prev + 1) % liveStock.length), 10000); 
    return () => clearInterval(interval);
  }, [activeMode, liveStock.length]);

  const itemsPerPage = 3;
  const planning = liveInterventions.filter(i => i.status !== 'Terminé').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const totalPlanningPages = Math.ceil(planning.length / itemsPerPage) || 1;
  useEffect(() => {
    if (activeMode !== 'PLANNING' || planning.length === 0) return;
    const interval = setInterval(() => setPlanningPage((prev) => (prev + 1) % totalPlanningPages), 20000); 
    return () => clearInterval(interval);
  }, [activeMode, planning.length, totalPlanningPages]);

  const achievements = liveAchievements;
  useEffect(() => {
      if (activeMode !== 'REALISATIONS' || achievements.length === 0) return;
      if (achievements[achievementIdx].mediaType === 'image') {
          const timer = setTimeout(() => setAchievementIdx(prev => (prev + 1) % achievements.length), 10000);
          return () => clearTimeout(timer);
      }
  }, [activeMode, achievements, achievementIdx]);

  // --- RENDER HELPERS ---
  const currentProduct = liveStock[productIdx];
  const currentPlanningSlice = planning.slice(planningPage * itemsPerPage, (planningPage + 1) * itemsPerPage);
  const currentAchievement = achievements[achievementIdx];

  return (
    <div className="fixed inset-0 bg-black overflow-hidden z-[9999]">
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
          {playlist.length > 0 && (
              <audio 
                ref={audioRef} 
                src={playlist[currentTrackIdx]} 
                onEnded={handleTrackEnded} 
                onError={handleTrackEnded} 
                preload="auto"
              />
          )}

          {/* HEADER TV */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gray-950 px-8 flex items-center justify-between border-b-8 border-orange-600 z-50">
              <div className="flex items-center gap-10">
                  <Logo url={customLogo} size="lg" theme="dark" label="TV" />
                  <div className="flex gap-3 bg-white/5 p-1.5 rounded-3xl border border-white/10">
                      {['PUBLICITE', 'PLANNING', 'REALISATIONS'].map((mode) => (
                        <button key={mode} className={`px-6 py-2.5 rounded-2xl font-black text-lg uppercase transition-all ${activeMode === mode ? 'bg-orange-600 text-white shadow-lg scale-105' : 'text-white/30'}`}>
                            {mode === 'PUBLICITE' ? 'Produits' : mode === 'PLANNING' ? 'Missions' : 'Réalisations'}
                        </button>
                      ))}
                  </div>
              </div>

              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-2xl border border-white/10">
                      <Music size={20} className={!isMuted ? "text-green-500 animate-spin-slow" : "text-gray-500"} />
                      <span className="text-white/50 font-black text-sm uppercase">Playlist TV</span>
                  </div>
                  <button onClick={toggleMute} className={`p-3 rounded-full border-2 transition-all ${isMuted ? 'bg-gray-800 text-gray-400' : 'bg-green-500/20 text-green-400 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]'}`}>
                      {audioLoading ? <Loader2 size={24} className="animate-spin" /> : (isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />)}
                  </button>
                  {onClose && <button onClick={onClose} className="p-3 bg-red-600/10 text-red-600 rounded-full"><X size={24} /></button>}
              </div>
          </div>

          {/* CONTENU CENTRAL */}
          <div className={`absolute top-24 bottom-32 left-0 right-0 overflow-hidden transition-colors duration-1000 ${activeMode === 'PLANNING' ? 'bg-[#0f172a]' : 'bg-gray-900'}`}>
              
              {activeMode === 'PUBLICITE' && currentProduct && (
                <div className="flex w-full h-full animate-fade-in">
                    <div className="w-[45%] h-full relative flex flex-col items-center justify-center bg-gray-950 p-8 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-600/10 to-transparent"></div>
                        <h2 className="text-5xl font-black text-white uppercase mb-8 z-10">EBF Quincaillerie</h2>
                        <div className="relative aspect-square h-[70%] bg-white rounded-[3rem] shadow-2xl border-[8px] border-white/10 animate-scale-in flex items-center justify-center z-10">
                            <img src={currentProduct.imageUrls?.[0] || ''} className="w-[85%] h-[85%] object-contain animate-float" />
                            <div className="absolute -top-6 -right-6 bg-red-600 text-white w-20 h-20 rounded-full flex items-center justify-center font-black text-xl rotate-12">DISPO</div>
                        </div>
                    </div>
                    <div className="w-[55%] h-full bg-white flex flex-col justify-center p-16 shadow-2xl z-20">
                        <span className="px-6 py-2 bg-orange-600 text-white rounded-xl text-2xl font-black uppercase mb-6 w-fit">{currentProduct.category}</span>
                        <h1 className="text-7xl font-black text-gray-950 uppercase italic leading-none mb-10">{currentProduct.name}</h1>
                        <div className="bg-gray-950 p-10 rounded-[3rem] text-white border-b-[16px] border-orange-600 shadow-2xl w-fit min-w-[60%]">
                            <p className="text-xl font-black uppercase text-orange-500 mb-2">Offre Exceptionnelle</p>
                            <p className="text-7xl font-black">{currentProduct.unitPrice.toLocaleString()} <span className="text-3xl text-gray-500">F</span></p>
                        </div>
                    </div>
                </div>
              )}

              {activeMode === 'PLANNING' && (
                <div className="w-full h-full p-12 flex flex-col animate-fade-in">
                    <div className="flex justify-between items-end mb-10 border-b border-white/10 pb-8">
                        <div>
                           <h2 className="text-6xl font-black text-white uppercase italic mb-2">Missions programmées</h2>
                           <span className="text-orange-500 font-black text-3xl uppercase tracking-widest">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                        </div>
                        <div className="bg-white/5 px-8 py-4 rounded-3xl border border-white/10 text-white/40 font-black text-2xl uppercase">
                            Page {planningPage + 1} / {totalPlanningPages}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-8 flex-1">
                        {currentPlanningSlice.map((inter) => (
                            <div key={inter.id} className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[3rem] flex flex-col shadow-2xl relative overflow-hidden animate-slide-up">
                                <div className="flex justify-between items-start mb-6">
                                    <span className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black text-xl uppercase">{inter.status}</span>
                                    <div className="text-right">
                                        <p className="text-gray-400 text-xs font-bold uppercase mb-1">Technicien</p>
                                        <p className="text-orange-400 font-black text-2xl uppercase tracking-tighter">{inter.technician}</p>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center text-center">
                                    <h4 className="text-white text-5xl font-black uppercase mb-4">{inter.client}</h4>
                                    <div className="flex items-center justify-center gap-2 text-gray-300 text-2xl font-bold uppercase mb-8">
                                        <MapPin size={28} className="text-red-500"/> {inter.location || inter.site}
                                    </div>
                                    <div className="bg-black/40 p-8 rounded-[2rem] border border-white/10 text-white text-3xl font-bold italic leading-snug">
                                        {inter.description}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {activeMode === 'REALISATIONS' && currentAchievement && (
                <div key={currentAchievement.id} className="w-full h-full flex animate-fade-slow">
                    <div className="w-[40%] h-full bg-white flex flex-col justify-center p-20 shadow-2xl z-20">
                        <span className="bg-purple-600 text-white px-6 py-3 rounded-2xl text-xl font-black uppercase tracking-widest w-fit mb-10 flex items-center gap-3">
                            <Trophy size={24}/> Réalisation EBF
                        </span>
                        <h2 className="text-7xl font-black text-gray-950 uppercase leading-none mb-8">{currentAchievement.title}</h2>
                        <div className="w-24 h-4 bg-orange-600 mb-10 rounded-full"></div>
                        <p className="text-4xl text-gray-500 font-bold leading-snug">{currentAchievement.description}</p>
                    </div>
                    <div className="w-[60%] h-full bg-black relative flex items-center justify-center">
                        {currentAchievement.mediaType === 'video' ? (
                            <video src={currentAchievement.mediaUrl} className="w-full h-full object-cover" autoPlay muted playsInline onEnded={() => setAchievementIdx(prev => (prev + 1) % achievements.length)} />
                        ) : (
                            <img src={currentAchievement.mediaUrl} className="w-full h-full object-cover animate-scale-in" style={{ objectPosition: currentAchievement.position || '50% 50%' }} />
                        )}
                    </div>
                </div>
              )}
          </div>

          {/* FOOTER TICKER */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-black border-t-8 border-orange-600 flex items-center z-[200]">
              <div className="bg-gray-950 h-full px-10 flex items-center justify-center border-r-8 border-orange-500">
                  <Megaphone size={48} className="text-orange-500 animate-bounce" />
              </div>
              <div className="flex-1 overflow-hidden whitespace-nowrap">
                  <div className="inline-block animate-tv-ticker">
                      {liveMessages.concat(liveMessages).map((msg, i) => (
                          <span key={i} className={`text-6xl font-black px-24 uppercase italic ${msg.color === 'red' ? 'text-red-500' : 'text-white'}`}>
                              {msg.content} <span className="text-white/20 mx-8">///</span>
                          </span>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      <style>{`
        @keyframes tv-ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-tv-ticker { animation: tv-ticker 30s linear infinite; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ShowcaseMode;
