
import React, { useState, useEffect, useRef } from 'react';
import { 
  Megaphone, 
  Trash2, 
  Loader2, 
  Database, 
  X,
  ShieldAlert,
  Music,
  Image as ImageIcon,
  ChevronDown,
  LayoutGrid,
  ClipboardList,
  Trophy,
  ArrowRightCircle,
  Smartphone,
  DownloadCloud,
  Info,
  MoreVertical
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TickerMessage } from '../types';

interface SettingsProps {
  tickerMessages?: TickerMessage[];
  onUpdateMessages?: (messages: TickerMessage[]) => void;
  onNavigate: (tab: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ tickerMessages = [], onNavigate }) => {
  const [newMessage, setNewMessage] = useState('');
  const [newColor, setNewColor] = useState<'neutral' | 'green' | 'yellow' | 'red'>('neutral');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingMusic, setIsSavingMusic] = useState(false);
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  
  const [musicUrl, setMusicUrl] = useState('');
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [audioLibrary, setAudioLibrary] = useState<{name: string, url: string}[]>([]);
  const audioTestRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // État pour l'installation PWA
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsAlreadyInstalled(true);
    }

    const loadSettings = async () => {
        try {
            const { data } = await supabase
                .from('tv_settings')
                .select('key, value')
                .in('key', ['background_music', 'company_logo']);
            
            if (data) {
                const music = data.find(d => d.key === 'background_music');
                const logo = data.find(d => d.key === 'company_logo');
                if (music && music.value) setMusicUrl(music.value);
                if (logo && logo.value) setLogoUrl(logo.value);
            }
        } catch (error) {
            console.error("Erreur chargement réglages:", error);
        }
    };

    const loadAudioLibrary = async () => {
        try {
            const { data } = await supabase.storage.from('assets').list();
            if (data) {
                const uploadedTracks = data
                    .filter(file => file.name.toLowerCase().endsWith('.mp3') || file.metadata?.mimetype?.startsWith('audio'))
                    .map(file => {
                        const { data: publicUrlData } = supabase.storage.from('assets').getPublicUrl(file.name);
                        return { name: file.name.replace('music_', '').replace(/\.[^/.]+$/, ""), url: publicUrlData.publicUrl };
                    });
                setAudioLibrary(uploadedTracks);
            }
        } catch (error) {
            console.warn("Erreur chargement bibliothèque audio.");
        }
    };

    loadSettings();
    loadAudioLibrary();
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = (window as any).deferredPrompt;
    
    if (promptEvent) {
      // Installation automatique si l'événement est prêt
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        (window as any).deferredPrompt = null;
      }
    } else {
      // Sinon, afficher le guide manuel
      setShowInstallGuide(true);
    }
  };

  const handleSaveMusic = async () => {
    if (!musicUrl) return;
    setIsSavingMusic(true);
    try {
        const { error } = await supabase.from('tv_settings').upsert({ key: 'background_music', value: musicUrl }, { onConflict: 'key' });
        if (error) throw error;
        alert("Musique TV sauvegardée !");
    } catch (e: any) { alert("Erreur : " + e.message); } finally { setIsSavingMusic(false); }
  };

  const handleSaveLogo = async () => {
    if (!logoUrl) return;
    setIsSavingLogo(true);
    try {
        const { error } = await supabase.from('tv_settings').upsert({ key: 'company_logo', value: logoUrl }, { onConflict: 'key' });
        if (error) throw error;
        alert("Logo mis à jour !");
    } catch (e: any) { alert("Erreur : " + e.message); } finally { setIsSavingLogo(false); }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'music' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
        const fileName = `${type}_${Date.now()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('assets').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(fileName);
        if (type === 'music') { setMusicUrl(publicUrl); setAudioLibrary(prev => [{ name: file.name, url: publicUrl }, ...prev]); }
        else setLogoUrl(publicUrl);
    } catch (error: any) { alert("Erreur upload: " + error.message); } finally { setIsUploading(false); }
  };

  const handleAddMessage = async () => {
    if (!newMessage.trim()) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase.from('ticker_messages').insert([{ content: newMessage.trim(), color: newColor }]);
      if (error) throw error;
      setNewMessage('');
      setNewColor('neutral');
    } catch (error: any) { alert(`Erreur : ${error.message}`); } finally { setIsUpdating(false); }
  };

  const handleDeleteMessage = async (msg: TickerMessage) => {
    if (!window.confirm("Supprimer ?")) return;
    setIsUpdating(true);
    try { if (msg.id) await supabase.from('ticker_messages').delete().eq('id', msg.id); } 
    catch (error: any) { alert(`Erreur : ${error.message}`); } finally { setIsUpdating(false); }
  };

  const handleUpdateMessageColor = async (msg: TickerMessage, newColor: 'neutral' | 'green' | 'yellow' | 'red') => {
    if (!msg.id) return;
    try { 
        const { error } = await supabase.from('ticker_messages').update({ color: newColor }).eq('id', msg.id); 
        if (error) throw error; 
    } 
    catch (error: any) { alert(`Erreur : ${error.message}`); } 
  };

  const getColorClass = (c: string) => {
      switch(c) {
          case 'green': return 'bg-green-100 text-green-700 border-green-200';
          case 'yellow': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
          case 'red': return 'bg-red-100 text-red-700 border-red-200';
          default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Paramètres</h2>
          <p className="text-gray-500 text-sm">Système & Base de données</p>
        </div>
        {(isUpdating || isUploading) && <Loader2 size={24} className="animate-spin text-orange-500" />}
      </div>
      <audio ref={audioTestRef} src={musicUrl} />

      {/* BOUTON INSTALLATION PERMANENT */}
      {!isAlreadyInstalled && (
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-200 animate-scale-in relative overflow-hidden group">
            <Smartphone size={120} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="bg-white/20 p-5 rounded-3xl backdrop-blur-sm">
                    <DownloadCloud size={48} className="text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">Installer EBF sur l'écran d'accueil</h3>
                    <p className="text-sm font-bold opacity-90 max-w-md">Utilisez l'application en plein écran comme une application native Android ou iOS.</p>
                </div>
                <button 
                    onClick={handleInstallClick}
                    className="bg-white text-orange-600 px-8 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all whitespace-nowrap"
                >
                    Installer maintenant
                </button>
            </div>
        </div>
      )}

      {/* GUIDE INSTALLATION MANUELLE */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
             <button onClick={() => setShowInstallGuide(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full"><X size={20}/></button>
             
             <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Info size={32}/>
                </div>
                <h3 className="text-xl font-black uppercase italic text-gray-900">Installation Manuelle</h3>
                <p className="text-xs text-gray-500 font-bold mt-2">Votre navigateur ne supporte pas l'installation automatique.</p>
             </div>

             <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-950 text-white flex items-center justify-center font-black shrink-0">1</div>
                  <p className="text-sm font-bold text-gray-700">Appuyez sur le menu <MoreVertical className="inline text-orange-500" size={16}/> de votre navigateur (Chrome ou Safari).</p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-950 text-white flex items-center justify-center font-black shrink-0">2</div>
                  <p className="text-sm font-bold text-gray-700">Sélectionnez <span className="text-orange-600">"Installer l'application"</span> ou <span className="text-orange-600">"Sur l'écran d'accueil"</span>.</p>
                </div>
                <button onClick={() => setShowInstallGuide(false)} className="w-full py-4 bg-gray-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest mt-4">J'ai compris</button>
             </div>
          </div>
        </div>
      )}

      {/* RACCOURCIS DE GESTION */}
      <div className="mb-4">
          <h3 className="font-black text-gray-800 uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
              <ArrowRightCircle size={14} className="text-orange-600"/> Raccourcis Gestion Contenu TV
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => onNavigate('hardware')} className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-orange-500 shadow-sm hover:shadow-lg transition-all flex flex-col items-center gap-3 group active:scale-95">
                  <div className="bg-orange-50 p-3 rounded-full text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-colors"><LayoutGrid size={24} /></div>
                  <span className="font-black uppercase text-sm text-gray-700 group-hover:text-orange-600">Éditer Nos Produits</span>
              </button>
              <button onClick={() => onNavigate('technicians')} className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-lg transition-all flex flex-col items-center gap-3 group active:scale-95">
                  <div className="bg-blue-50 p-3 rounded-full text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors"><ClipboardList size={24} /></div>
                  <span className="font-black uppercase text-sm text-gray-700 group-hover:text-blue-600">Éditer Chantiers</span>
              </button>
              <button onClick={() => onNavigate('achievements')} className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-purple-500 shadow-sm hover:shadow-lg transition-all flex flex-col items-center gap-3 group active:scale-95">
                  <div className="bg-purple-50 p-3 rounded-full text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors"><Trophy size={24} /></div>
                  <span className="font-black uppercase text-sm text-gray-700 group-hover:text-purple-600">Éditer Réalisations</span>
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-600 rounded-3xl p-6 text-white relative min-h-[180px] overflow-hidden">
              <Database size={80} className="absolute -right-4 -top-4 opacity-10" />
              <h4 className="font-black text-xl mb-2 flex items-center gap-2"><ShieldAlert size={20}/> Mise à jour SQL</h4>
              <p className="text-xs opacity-80 mb-6">Ajoute les nouvelles fonctionnalités sans effacer vos données.</p>
              <button onClick={() => setShowSql(true)} className="w-full py-3 bg-white text-blue-700 rounded-xl font-black text-xs uppercase">Voir le script</button>
          </div>
          <div className="bg-purple-700 rounded-3xl p-6 text-white min-h-[180px]">
              <h4 className="font-black text-xl mb-4 flex items-center gap-2"><Music size={20}/> Musique TV</h4>
              <select value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)} className="w-full bg-purple-800 p-3 rounded-xl mb-4 text-xs">
                  <option value="">Choisir un titre...</option>
                  {audioLibrary.map((t, i) => <option key={i} value={t.url}>{t.name}</option>)}
              </select>
              <div className="flex gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 bg-purple-600 rounded-xl text-xs font-bold uppercase">Upload</button>
                  <button onClick={handleSaveMusic} disabled={isSavingMusic} className="flex-1 py-3 bg-white text-purple-700 rounded-xl text-xs font-black uppercase">Sauver</button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'music')} />
          </div>
          <div className="bg-orange-600 rounded-3xl p-6 text-white min-h-[180px]">
              <h4 className="font-black text-xl mb-4 flex items-center gap-2"><ImageIcon size={20}/> Logo</h4>
              <div className="flex gap-4">
                  <div className="w-16 h-16 bg-white rounded-xl overflow-hidden">{logoUrl && <img src={logoUrl} className="w-full h-full object-contain" alt="Logo" />}</div>
                  <div className="flex-1 flex flex-col gap-2">
                      <button onClick={() => logoInputRef.current?.click()} className="py-2 bg-orange-500 rounded-lg text-xs font-bold">Choisir</button>
                      <button onClick={handleSaveLogo} disabled={isSavingLogo} className="py-2 bg-white text-orange-700 rounded-lg text-[10px] font-black uppercase">Sauver</button>
                  </div>
              </div>
              <input type="file" ref={logoInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
          </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
           <h3 className="font-black text-xl mb-6 flex items-center gap-2 uppercase italic"><Megaphone size={24} className="text-orange-500"/> Flash Info TV</h3>
           <div className="flex flex-col md:flex-row gap-3 mb-6">
                <div className="flex-1 flex gap-3">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Texte à diffuser..." className="flex-1 p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-orange-500 transition-colors" />
                    <select value={newColor} onChange={(e) => setNewColor(e.target.value as any)} className="p-4 bg-gray-50 rounded-2xl font-bold outline-none uppercase text-xs border-r-8 border-transparent cursor-pointer">
                        <option value="neutral">⚪ Standard</option>
                        <option value="green">🟢 Info</option>
                        <option value="yellow">🟡 Important</option>
                        <option value="red">🔴 Urgent</option>
                    </select>
                </div>
                <button onClick={handleAddMessage} disabled={isUpdating} className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-orange-600 transition-colors shadow-lg active:scale-95">
                    {isUpdating ? <Loader2 className="animate-spin" /> : 'Ajouter'}
                </button>
           </div>
           <div className="space-y-2">
               {tickerMessages.map((m, i) => (
                   <div key={m.id || i} className={`p-4 rounded-xl flex justify-between items-center border ${getColorClass(m.color)}`}>
                       <span className="font-bold mr-4 flex-1">{m.content}</span>
                       <div className="flex items-center gap-2">
                           <div className="relative group">
                                <select value={m.color} onChange={(e) => handleUpdateMessageColor(m, e.target.value as any)} className="appearance-none bg-white/50 pl-2 pr-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-transparent hover:border-black/10 cursor-pointer outline-none transition-all hover:bg-white">
                                    <option value="neutral">Std</option>
                                    <option value="green">Info</option>
                                    <option value="yellow">Imp</option>
                                    <option value="red">Urg</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"/>
                           </div>
                           <button onClick={() => handleDeleteMessage(m)} className="p-2 bg-white rounded-full text-red-500 shadow-sm hover:scale-110 transition-transform"><Trash2 size={16}/></button>
                       </div>
                   </div>
               ))}
           </div>
      </div>
    </div>
  );
};

export default Settings;
