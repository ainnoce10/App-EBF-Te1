
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
  MoreVertical,
  Copy
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
  const [audioLibrary, setAudioLibrary] = useState<{name: string, url: string}[]>([]);
  const audioTestRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // État pour l'installation PWA
  const [isAlreadyInstalled, setIsAlreadyInstalled] = useState(false);
  const [isPromptAvailable, setIsPromptAvailable] = useState(!!(window as any).deferredPrompt);

  useEffect(() => {
    // Vérifier si l'app est déjà lancée en mode "app installée"
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsAlreadyInstalled(true);
    }

    const handlePwaReady = () => {
      setIsPromptAvailable(true);
    };

    window.addEventListener('ebf-pwa-ready', handlePwaReady);

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

    return () => window.removeEventListener('ebf-pwa-ready', handlePwaReady);
  }, []);

  const handleInstallClick = async () => {
    const promptEvent = (window as any).deferredPrompt;
    
    if (promptEvent) {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        (window as any).deferredPrompt = null;
        setIsPromptAvailable(false);
      }
    } else {
      // Si l'événement n'est pas là, on guide l'utilisateur pour l'installation manuelle Android
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

  const sqlScript = `-- EBF Management Suite - Database Structure

-- 1. Table Stock (Mise à jour avec regularPrice)
CREATE TABLE IF NOT EXISTS public.stock (
    id text PRIMARY KEY,
    name text NOT NULL,
    category text,
    quantity numeric DEFAULT 0,
    threshold numeric DEFAULT 5,
    "unitPrice" numeric DEFAULT 0,
    "regularPrice" numeric DEFAULT 0, -- Nouveau champ
    supplier text,
    site text,
    "imageUrls" text[],
    "technicalSheetUrl" text,
    specs jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- COMMANDE DE CORRECTION SI LA TABLE EXISTE DEJA :
ALTER TABLE public.stock ADD COLUMN IF NOT EXISTS "regularPrice" numeric DEFAULT 0;

-- 2. Table Interventions
CREATE TABLE IF NOT EXISTS public.interventions (
    id text PRIMARY KEY,
    client text NOT NULL,
    "clientPhone" text,
    domain text,
    "interventionType" text,
    location text,
    description text,
    technician text,
    status text,
    has_report boolean DEFAULT false,
    date date,
    site text,
    created_at timestamptz DEFAULT now()
);

-- 3. Table Employés
CREATE TABLE IF NOT EXISTS public.employees (
    id text PRIMARY KEY,
    name text NOT NULL,
    "assignedName" text,
    role text,
    domain text,
    site text,
    status text,
    "entryDate" date,
    "photoUrl" text,
    "photoPosition" text,
    created_at timestamptz DEFAULT now()
);

-- 4. Table Transactions (Hardware)
CREATE TABLE IF NOT EXISTS public.hardware_transactions (
    id text PRIMARY KEY,
    type text, -- Recette / Dépense
    category text,
    amount numeric,
    date date,
    description text,
    site text,
    created_at timestamptz DEFAULT now()
);

-- 5. Table Transactions (Comptabilité)
CREATE TABLE IF NOT EXISTS public.accounting_transactions (
    id text PRIMARY KEY,
    type text,
    category text,
    amount numeric,
    date date,
    description text,
    site text,
    created_at timestamptz DEFAULT now()
);

-- 6. Table Transactions (Secrétariat)
CREATE TABLE IF NOT EXISTS public.secretariat_transactions (
    id text PRIMARY KEY,
    type text,
    category text,
    amount numeric,
    date date,
    description text,
    site text,
    created_at timestamptz DEFAULT now()
);

-- 7. Table Ticker Messages (TV)
CREATE TABLE IF NOT EXISTS public.ticker_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content text NOT NULL,
    color text DEFAULT 'neutral',
    created_at timestamptz DEFAULT now()
);

-- 8. Table Réalisations (TV)
CREATE TABLE IF NOT EXISTS public.achievements (
    id text PRIMARY KEY,
    title text,
    description text,
    "mediaUrl" text,
    "mediaType" text,
    position text,
    date timestamptz DEFAULT now()
);

-- 9. Table Paramètres TV
CREATE TABLE IF NOT EXISTS public.tv_settings (
    key text PRIMARY KEY,
    value text,
    updated_at timestamptz DEFAULT now()
);

-- STORAGE BUCKETS (À configurer dans Storage > Buckets)
-- 'assets' (Public)
-- 'voice_reports' (Public)
`;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Paramètres</h2>
          <p className="text-gray-500 text-xs font-bold uppercase">Configuration Système</p>
        </div>
        {(isUpdating || isUploading) && <Loader2 size={24} className="animate-spin text-orange-500" />}
      </div>
      
      <audio ref={audioTestRef} src={musicUrl} />

      {/* SECTION INSTALLATION ANDROID / IOS */}
      {!isAlreadyInstalled && (
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-orange-200 animate-scale-in relative overflow-hidden group">
            <Smartphone size={150} className="absolute -right-6 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="bg-white/20 p-5 rounded-3xl backdrop-blur-md">
                    <DownloadCloud size={48} className="text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-1 italic">Installer EBF sur Android</h3>
                    <p className="text-sm font-bold opacity-90 max-w-sm">
                        Installez l'application complète pour une utilisation hors-ligne et un accès instantané en plein écran.
                    </p>
                </div>
                <button 
                    onClick={handleInstallClick}
                    className="bg-white text-orange-600 px-8 py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all whitespace-nowrap hover:bg-orange-50"
                >
                    {isPromptAvailable ? "Installer l'application" : "Guide d'installation"}
                </button>
            </div>
        </div>
      )}

      {/* GUIDE POUR INSTALLATION MANUELLE (SI AUTO ECHOUE) */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
             <button onClick={() => setShowInstallGuide(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><X size={20}/></button>
             
             <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Info size={32}/>
                </div>
                <h3 className="text-xl font-black uppercase italic text-gray-900">Installation Android</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-2 tracking-widest">Suivez ces étapes simples</p>
             </div>

             <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-black shrink-0 shadow-lg shadow-orange-100">1</div>
                  <p className="text-sm font-bold text-gray-700">Appuyez sur les 3 points <MoreVertical className="inline text-orange-500" size={16}/> en haut à droite de Chrome.</p>
                </div>
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-black shrink-0 shadow-lg shadow-orange-100">2</div>
                  <p className="text-sm font-bold text-gray-700">Sélectionnez <span className="text-orange-600 font-black">"Installer l'application"</span> dans le menu.</p>
                </div>
                <button onClick={() => setShowInstallGuide(false)} className="w-full py-5 bg-gray-950 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] mt-2 shadow-xl active:scale-95 transition-all">J'ai compris</button>
             </div>
          </div>
        </div>
      )}

      {/* RACCOURCIS RAPIDES */}
      <div className="mb-4">
          <h3 className="font-black text-gray-400 uppercase text-[10px] tracking-[0.2em] mb-4 flex items-center gap-2 px-1">
              <ArrowRightCircle size={14} className="text-orange-600"/> Navigation rapide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => onNavigate('hardware')} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center gap-3 group active:scale-95">
                  <div className="bg-orange-50 p-4 rounded-2xl text-orange-600 group-hover:bg-orange-500 group-hover:text-white transition-all shadow-sm"><LayoutGrid size={24} /></div>
                  <span className="font-black uppercase text-[10px] tracking-widest text-gray-700">Gestion Stock</span>
              </button>
              <button onClick={() => onNavigate('technicians')} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center gap-3 group active:scale-95">
                  <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm"><ClipboardList size={24} /></div>
                  <span className="font-black uppercase text-[10px] tracking-widest text-gray-700">Planning Missions</span>
              </button>
              <button onClick={() => onNavigate('achievements')} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col items-center gap-3 group active:scale-95">
                  <div className="bg-purple-50 p-4 rounded-2xl text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-sm"><Trophy size={24} /></div>
                  <span className="font-black uppercase text-[10px] tracking-widest text-gray-700">Réalisations TV</span>
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white relative min-h-[180px] overflow-hidden shadow-xl shadow-blue-100">
              <Database size={100} className="absolute -right-6 -top-6 opacity-10" />
              <h4 className="font-black text-xl mb-2 flex items-center gap-2 uppercase tracking-tighter italic"><ShieldAlert size={20}/> Base SQL</h4>
              <p className="text-xs font-bold opacity-80 mb-6">Mise à jour de la structure des tables Supabase.</p>
              <button onClick={() => setShowSql(true)} className="w-full py-4 bg-white text-blue-700 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Consulter le script</button>
          </div>

          <div className="bg-purple-700 rounded-[2.5rem] p-8 text-white min-h-[180px] shadow-xl shadow-purple-100">
              <h4 className="font-black text-xl mb-4 flex items-center gap-2 uppercase tracking-tighter italic"><Music size={20}/> Musique TV</h4>
              <select value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)} className="w-full bg-purple-800 p-4 rounded-2xl mb-4 text-xs font-bold border-none outline-none">
                  <option value="">Sélectionner un titre...</option>
                  {audioLibrary.map((t, i) => <option key={i} value={t.url}>{t.name}</option>)}
              </select>
              <div className="flex gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 bg-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-purple-500/50">Upload</button>
                  <button onClick={handleSaveMusic} disabled={isSavingMusic} className="flex-1 py-3 bg-white text-purple-700 rounded-xl text-[10px] font-black uppercase tracking-widest">Sauver</button>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'music')} />
          </div>

          <div className="bg-orange-600 rounded-[2.5rem] p-8 text-white min-h-[180px] shadow-xl shadow-orange-100">
              <h4 className="font-black text-xl mb-4 flex items-center gap-2 uppercase tracking-tighter italic"><ImageIcon size={20}/> Logo</h4>
              <div className="flex gap-4">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center p-2 shadow-inner overflow-hidden">
                      {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain" alt="Logo" /> : <ImageIcon className="text-gray-200" size={32}/>}
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                      <button onClick={() => logoInputRef.current?.click()} className="py-3 bg-orange-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-orange-400">Changer</button>
                      <button onClick={handleSaveLogo} disabled={isSavingLogo} className="py-3 bg-white text-orange-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Sauver</button>
                  </div>
              </div>
              <input type="file" ref={logoInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
          </div>
      </div>

      {/* SQL MODAL */}
      {showSql && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 animate-scale-in shadow-2xl relative">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black uppercase italic text-gray-900 tracking-tighter text-xl">Script SQL Supabase</h3>
                      <button onClick={() => setShowSql(false)} className="p-2 bg-gray-100 rounded-full"><X/></button>
                  </div>
                  <pre className="bg-gray-950 text-green-400 p-6 rounded-3xl text-[10px] overflow-x-auto mb-6 max-h-60 border-t-8 border-blue-500 font-mono">
                      {sqlScript}
                  </pre>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(sqlScript); alert("Script SQL copié dans le presse-papier !"); }}
                    className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all tracking-[0.2em]"
                  >
                      <Copy size={18}/> Copier pour SQL Editor
                  </button>
              </div>
          </div>
      )}

      {/* FLASH INFO EDIT */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
           <h3 className="font-black text-xl mb-6 flex items-center gap-3 uppercase italic tracking-tighter text-gray-800"><Megaphone size={24} className="text-orange-500"/> Flash Info TV</h3>
           <div className="flex flex-col md:flex-row gap-3 mb-8">
                <div className="flex-1 flex gap-3">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Texte à diffuser sur la TV..." className="flex-1 p-5 bg-gray-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-orange-500 transition-colors" />
                    <select value={newColor} onChange={(e) => setNewColor(e.target.value as any)} className="p-5 bg-gray-50 rounded-2xl font-black uppercase text-[10px] border-none cursor-pointer outline-none">
                        <option value="neutral">⚪ Standard</option>
                        <option value="green">🟢 Succès</option>
                        <option value="yellow">🟡 Important</option>
                        <option value="red">🔴 Urgent</option>
                    </select>
                </div>
                <button onClick={handleAddMessage} disabled={isUpdating} className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 transition-colors shadow-xl active:scale-95">
                    {isUpdating ? <Loader2 className="animate-spin" /> : 'Diffuser'}
                </button>
           </div>
           <div className="space-y-3">
               {tickerMessages.map((m, i) => (
                   <div key={m.id || i} className={`p-5 rounded-[1.5rem] flex justify-between items-center border transition-all ${getColorClass(m.color)}`}>
                       <span className="font-bold text-sm mr-4 flex-1">{m.content}</span>
                       <div className="flex items-center gap-3">
                           <div className="relative">
                                <select value={m.color} onChange={(e) => handleUpdateMessageColor(m, e.target.value as any)} className="appearance-none bg-white/50 pl-3 pr-8 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border-none outline-none cursor-pointer">
                                    <option value="neutral">Std</option>
                                    <option value="green">Info</option>
                                    <option value="yellow">Imp</option>
                                    <option value="red">Urg</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"/>
                           </div>
                           <button onClick={() => handleDeleteMessage(m)} className="p-3 bg-white/50 rounded-full text-red-500 shadow-sm hover:bg-red-50 hover:scale-110 transition-all"><Trash2 size={16}/></button>
                       </div>
                   </div>
               ))}
               {tickerMessages.length === 0 && <p className="text-center py-10 text-gray-300 font-bold uppercase text-[10px] tracking-widest">Aucun message actif</p>}
           </div>
      </div>
    </div>
  );
};

export default Settings;
