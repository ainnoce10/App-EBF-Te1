import React, { useState, useEffect, useRef } from 'react';
import { 
  Megaphone, 
  Trash2, 
  Loader2, 
  Database, 
  Code,
  X,
  ShieldAlert,
  Plus,
  Music,
  Save,
  Upload,
  Play,
  Pause,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TickerMessage } from '../types';

interface SettingsProps {
  tickerMessages?: TickerMessage[];
  onUpdateMessages?: (messages: TickerMessage[]) => void;
}

const MUSIC_PRESETS = [
  { name: 'Ambiance Corporate', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=corporate-ambient-14224.mp3' },
  { name: 'Piano Doux', url: 'https://cdn.pixabay.com/download/audio/2022/03/09/audio_822ca808a3.mp3?filename=piano-moment-14032.mp3' },
  { name: 'Lounge Chill', url: 'https://cdn.pixabay.com/download/audio/2020/05/20/audio_145d04589d.mp3?filename=lounge-11005.mp3' },
  { name: 'Focus Travail', url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf87a.mp3?filename=lofi-study-112191.mp3' }
];

const Settings: React.FC<SettingsProps> = ({ tickerMessages = [] }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedColor, setSelectedColor] = useState<'green' | 'yellow' | 'red' | 'neutral'>('neutral');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingMusic, setIsSavingMusic] = useState(false);
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSql, setShowSql] = useState(false);
  
  // State pour la musique
  const [musicUrl, setMusicUrl] = useState('');
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const audioTestRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State pour le logo
  const [logoUrl, setLogoUrl] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Charger la musique et le logo depuis Supabase (Table tv_settings)
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
                else setMusicUrl(MUSIC_PRESETS[0].url);

                if (logo && logo.value) setLogoUrl(logo.value);
            }
        } catch (error) {
            console.error("Erreur chargement réglages:", error);
        }
    };
    loadSettings();
  }, []);

  // Gestion du test audio
  useEffect(() => {
    if (audioTestRef.current) {
        if (isPlayingTest) {
            audioTestRef.current.play().catch(e => {
                console.error("Erreur lecture test:", e);
                setIsPlayingTest(false);
            });
        } else {
            audioTestRef.current.pause();
            audioTestRef.current.currentTime = 0;
        }
    }
  }, [isPlayingTest, musicUrl]);

  const handleSaveMusic = async () => {
    if (!musicUrl) return;
    
    setIsSavingMusic(true);
    try {
        const { error } = await supabase
            .from('tv_settings')
            .upsert({ key: 'background_music', value: musicUrl }, { onConflict: 'key' });

        if (error) {
             if (error.code === '42P01') { 
                 alert("Erreur : La table 'tv_settings' n'existe pas.\n\nVeuillez exécuter le script SQL mis à jour.");
             } else {
                 throw error;
             }
        } else {
            alert("Musique sauvegardée !");
        }
    } catch (e: any) {
        alert("Erreur sauvegarde : " + e.message);
    } finally {
        setIsSavingMusic(false);
    }
  };

  const handleSaveLogo = async () => {
    if (!logoUrl) return;

    setIsSavingLogo(true);
    try {
        const { error } = await supabase
            .from('tv_settings')
            .upsert({ key: 'company_logo', value: logoUrl }, { onConflict: 'key' });
        
        if (error) throw error;
        alert("Logo mis à jour ! Il apparaîtra au prochain rechargement.");
    } catch (e: any) {
        alert("Erreur sauvegarde logo : " + e.message);
    } finally {
        setIsSavingLogo(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'music' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // MÉTHODE 1 : Upload vers Supabase Storage (Recommandé pour gros fichiers)
    // On essaie d'uploader dans le bucket 'assets'.
    setIsUploading(true);
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${type}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 1. Upload
        const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
             // Si le bucket n'existe pas ou erreur d'upload, on fallback sur la méthode Base64 si le fichier est petit
             console.warn("Upload Storage échoué (Bucket 'assets' manquant ?), tentative Base64...", uploadError.message);
             
             if (file.size > 4.5 * 1024 * 1024) {
                 alert("Erreur: Le stockage de fichiers 'assets' n'est pas configuré et ce fichier est trop gros pour la base de données.\n\nVeuillez exécuter le script SQL mis à jour pour activer le stockage de gros fichiers.");
                 setIsUploading(false);
                 return;
             }
             
             // Fallback Base64 (Ancienne méthode pour petits fichiers)
             const reader = new FileReader();
             reader.onload = (e) => {
                const result = e.target?.result as string;
                if (type === 'music') {
                    setMusicUrl(result);
                    setIsPlayingTest(false);
                } else {
                    setLogoUrl(result);
                }
                setIsUploading(false);
             };
             reader.readAsDataURL(file);
             return;
        }

        // 2. Get URL si upload réussi
        const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(filePath);

        if (type === 'music') {
            setMusicUrl(publicUrl);
            setIsPlayingTest(false);
        } else {
            setLogoUrl(publicUrl);
        }
        
    } catch (error: any) {
        alert("Erreur upload: " + error.message);
    } finally {
        setIsUploading(false);
    }
  };

  const handleAddMessage = async () => {
    if (!newMessage.trim()) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
          .from('ticker_messages')
          .insert([{ content: newMessage.trim(), color: selectedColor }]);
      
      if (error) throw error;
      setNewMessage('');
      setSelectedColor('neutral');

    } catch (error: any) {
      alert(`Erreur lors de l'ajout : ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMessage = async (msg: TickerMessage) => {
    if (!window.confirm("Supprimer ce message définitivement ?")) return;
    setIsUpdating(true);
    try {
        if (msg.id) await supabase.from('ticker_messages').delete().eq('id', msg.id);
    } catch (error: any) {
        alert(`Erreur lors de la suppression : ${error.message}`);
    } finally {
        setIsUpdating(false);
    }
  };

  const handleUpdateColor = async (msg: TickerMessage, newColor: string) => {
    try {
        if (msg.id) await supabase.from('ticker_messages').update({ color: newColor }).eq('id', msg.id);
    } catch (error: any) {
        alert(`Erreur changement couleur : ${error.message}`);
    }
  };

  const getFullSchemaScript = () => `
-- 0. NETTOYAGE
drop publication if exists supabase_realtime;

-- 1. ACTIVATION REALTIME
create publication supabase_realtime for all tables;

-- 2. STOCKAGE
insert into storage.buckets (id, name, public) 
values ('assets', 'assets', true)
on conflict (id) do nothing;

drop policy if exists "Public Access Assets" on storage.objects;
create policy "Public Access Assets" 
on storage.objects for all 
using ( bucket_id = 'assets' ) 
with check ( bucket_id = 'assets' );

-- 3. TABLES DE CONFIGURATION
create table if not exists public.tv_settings (
  key text primary key,
  value text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists public.ticker_messages (
  id bigint generated by default as identity primary key,
  content text not null,
  color text default 'neutral',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. MODULE GESTION (Tables spécifiques par métier)

-- A. Table STOCK (Quincaillerie)
create table if not exists public.stock (
  id text primary key,
  name text not null,
  description text,
  category text,
  quantity integer default 0,
  threshold integer default 5,
  "unitPrice" numeric default 0,
  supplier text,
  site text,
  "imageUrls" text[],
  "technicalSheetUrl" text,
  specs jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- B. Table INTERVENTIONS (Secrétariat & Technique)
create table if not exists public.interventions (
  id text primary key,
  client text,
  "clientPhone" text,
  domain text,
  "interventionType" text,
  description text,
  location text, 
  technician text,
  status text,
  date date,
  site text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- C. Table EMPLOYES (RH)
create table if not exists public.employees (
  id text primary key,
  name text,
  role text,
  site text,
  status text,
  "entryDate" date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- D. TABLES FINANCIERES INDEPENDANTES
-- 1. Transactions Quincaillerie
create table if not exists public.hardware_transactions (
  id text primary key,
  type text, -- 'Recette' ou 'Dépense'
  category text,
  amount numeric default 0,
  date date,
  description text,
  site text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Transactions Secrétariat
create table if not exists public.secretariat_transactions (
  id text primary key,
  type text,
  category text,
  amount numeric default 0,
  date date,
  description text,
  site text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Transactions Comptabilité Générale
create table if not exists public.accounting_transactions (
  id text primary key,
  type text,
  category text,
  amount numeric default 0,
  date date,
  description text,
  site text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. SECURITE (RLS) - Activation pour toutes les tables
alter table public.tv_settings enable row level security;
create policy "Public Access Settings" on public.tv_settings for all using (true) with check (true);

alter table public.ticker_messages enable row level security;
create policy "Public Access Ticker" on public.ticker_messages for all using (true) with check (true);

alter table public.stock enable row level security;
create policy "Public Access Stock" on public.stock for all using (true) with check (true);

alter table public.interventions enable row level security;
create policy "Public Access Interventions" on public.interventions for all using (true) with check (true);

alter table public.employees enable row level security;
create policy "Public Access Employees" on public.employees for all using (true) with check (true);

-- RLS pour les tables financières
alter table public.hardware_transactions enable row level security;
create policy "Public Access Hardware Trx" on public.hardware_transactions for all using (true) with check (true);

alter table public.secretariat_transactions enable row level security;
create policy "Public Access Secretariat Trx" on public.secretariat_transactions for all using (true) with check (true);

alter table public.accounting_transactions enable row level security;
create policy "Public Access Accounting Trx" on public.accounting_transactions for all using (true) with check (true);
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getFullSchemaScript());
    alert("Script SQL copié ! Exécutez-le dans Supabase pour corriger les erreurs et activer le stockage.");
  };

  const getColorClass = (color: string) => {
      switch(color) {
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
          <p className="text-gray-500 text-sm">Configuration Système & Base de Données</p>
        </div>
        {(isUpdating || isUploading) && (
            <div className="flex items-center gap-2 text-orange-500 font-bold animate-pulse">
                <Loader2 size={24} className="animate-spin" />
                {isUploading ? 'Transfert du fichier...' : 'Mise à jour...'}
            </div>
        )}
      </div>

      {/* Audio element caché pour le test */}
      <audio ref={audioTestRef} src={musicUrl} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Config DB */}
          <div className="bg-blue-600 rounded-3xl shadow-lg p-6 flex flex-col justify-between text-white overflow-hidden relative min-h-[180px]">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Database size={120} />
              </div>
              <div className="relative z-10 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                      <ShieldAlert size={24} className="text-blue-200" />
                      <h4 className="font-black text-xl tracking-tight">Base de Données</h4>
                  </div>
                  <p className="text-blue-100 text-sm font-medium opacity-90">
                    Configurer les tables et le stockage de fichiers volumineux.
                  </p>
              </div>
              <button 
                onClick={() => setShowSql(true)}
                className="w-full px-6 py-3 bg-white text-blue-700 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2 relative z-10"
              >
                <Code size={16}/> Configurer SQL
              </button>
          </div>

          {/* Card Config Music TV */}
          <div className="bg-purple-700 rounded-3xl shadow-lg p-6 flex flex-col justify-between text-white overflow-hidden relative min-h-[180px]">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Music size={120} />
              </div>
              <div className="relative z-10 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                      <Music size={24} className="text-purple-200" />
                      <h4 className="font-black text-xl tracking-tight">Ambiance TV</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex gap-2">
                        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex-1 bg-purple-500 hover:bg-purple-400 text-white p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                            <Upload size={14} /> {isUploading ? '...' : 'MP3 (Max 50Mo)'}
                        </button>
                        <input type="file" ref={fileInputRef} accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'music')} />
                        <button onClick={() => setIsPlayingTest(!isPlayingTest)} className="p-2 bg-purple-800 rounded-xl">
                            {isPlayingTest ? <Pause size={14}/> : <Play size={14}/>}
                        </button>
                    </div>
                    <button onClick={handleSaveMusic} disabled={isSavingMusic} className="w-full px-4 py-2 bg-white text-purple-700 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center justify-center gap-2">
                        {isSavingMusic ? <Loader2 size={14} className="animate-spin"/> : <Save size={14} />} Sauver
                    </button>
                  </div>
              </div>
          </div>

          {/* Card Config Logo */}
          <div className="bg-orange-600 rounded-3xl shadow-lg p-6 flex flex-col justify-between text-white overflow-hidden relative min-h-[180px]">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ImageIcon size={120} />
              </div>
              <div className="relative z-10 mb-4">
                  <div className="flex items-center gap-3 mb-2">
                      <ImageIcon size={24} className="text-orange-200" />
                      <h4 className="font-black text-xl tracking-tight">Logo Entreprise</h4>
                  </div>
                  <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden border-2 border-orange-400">
                          {logoUrl ? <img src={logoUrl} className="w-full h-full object-contain" /> : <span className="text-orange-600 font-bold text-xs">EBF</span>}
                      </div>
                      <div className="space-y-2 flex-1">
                          <button onClick={() => logoInputRef.current?.click()} disabled={isUploading} className="w-full bg-orange-500 hover:bg-orange-400 text-white p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                              <Upload size={14} /> {isUploading ? '...' : 'Choisir Logo'}
                          </button>
                          <input type="file" ref={logoInputRef} accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} />
                          <button onClick={handleSaveLogo} disabled={isSavingLogo} className="w-full bg-white text-orange-700 p-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                              {isSavingLogo ? <Loader2 size={14} className="animate-spin"/> : <Save size={14} />} Sauver
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* SECTION FLASH INFO */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-gray-100 bg-orange-50 flex items-center gap-4">
           <div className="bg-orange-500 p-2.5 rounded-xl text-white shadow-md">
                <Megaphone size={24} />
           </div>
           <h3 className="font-black text-gray-800 uppercase tracking-tight text-lg md:text-xl">Contrôle Flash Info TV</h3>
        </div>
        
        <div className="p-6 md:p-8">
           <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-200 mb-8">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Créer une annonce</label>
               <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap gap-3">
                        {(['neutral', 'green', 'yellow', 'red'] as const).map(color => (
                            <button 
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-bold text-xs uppercase
                                    ${color === 'green' ? 'bg-green-50 border-green-200 text-green-700' : 
                                      color === 'yellow' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 
                                      color === 'red' ? 'bg-red-50 border-red-200 text-red-700' : 
                                      'bg-white border-gray-200 text-gray-600'}
                                    ${selectedColor === color ? 'ring-4 ring-orange-100 scale-105 border-orange-500' : 'opacity-60'}
                                `}
                            >
                                <div className={`w-3 h-3 rounded-full ${color === 'green' ? 'bg-green-500' : color === 'yellow' ? 'bg-yellow-400' : color === 'red' ? 'bg-red-600' : 'bg-gray-600'}`}></div>
                                {color === 'neutral' ? 'Standard' : color === 'green' ? 'Promo' : color === 'yellow' ? 'Info' : 'Urgent'}
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-col md:flex-row gap-3">
                        <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMessage()}
                            placeholder="Ex: Arrivage de nouveaux câbles..."
                            className="flex-1 p-5 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-800 outline-none focus:border-orange-500 shadow-inner"
                        />
                        <button 
                            onClick={handleAddMessage}
                            disabled={isUpdating || !newMessage.trim()}
                            className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-30 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                        >
                            {isUpdating ? <Loader2 size={20} className="animate-spin"/> : <Plus size={20}/>}
                            {isUpdating ? 'Envoi...' : 'Diffuser'}
                        </button>
                    </div>
               </div>
           </div>

           <div className="space-y-3">
              {tickerMessages.length > 0 ? tickerMessages.map((msg, index) => (
                <div key={msg.id || index} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all group ${getColorClass(msg.color)}`}>
                   <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-current animate-pulse"></div>
                      <span className="font-bold text-gray-800 md:text-lg">{msg.content}</span>
                   </div>

                   <div className="flex items-center gap-3">
                       <div className="flex gap-1 bg-white/50 p-1 rounded-full border border-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {['green', 'yellow', 'red', 'neutral'].map(c => (
                                <button 
                                    key={c}
                                    onClick={() => handleUpdateColor(msg, c)}
                                    className={`w-6 h-6 rounded-full border-2 ${msg.color === c ? 'border-gray-800 scale-110' : 'border-transparent opacity-30'} 
                                        ${c === 'green' ? 'bg-green-500' : c === 'yellow' ? 'bg-yellow-400' : c === 'red' ? 'bg-red-600' : 'bg-gray-600'}
                                    `}
                                />
                            ))}
                       </div>
                       <button 
                         onClick={() => handleDeleteMessage(msg)}
                         className="p-3 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-md"
                       >
                         <Trash2 size={20} />
                       </button>
                   </div>
                </div>
              )) : (
                  <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                      <Megaphone size={48} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-gray-400 font-bold italic">Aucun message flash en cours de diffusion</p>
                  </div>
              )}
           </div>
        </div>
      </div>

      {showSql && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-8 border-b flex justify-between items-center bg-blue-50">
                  <h3 className="font-black text-2xl flex items-center gap-3 text-blue-900">
                      <Code size={28} className="text-blue-600"/> Script de Configuration
                  </h3>
                  <button onClick={() => setShowSql(false)} className="p-2 bg-white rounded-full text-gray-400"><X size={24}/></button>
              </div>
              <div className="p-8">
                  <div className="mb-4 bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-yellow-800 text-xs font-bold">
                    ⚠️ Mettez à jour votre base de données pour activer le stockage des fichiers volumineux (bucket 'assets').
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-6 rounded-2xl text-xs md:text-sm font-mono overflow-auto max-h-60 mb-8 custom-scrollbar">
                        {getFullSchemaScript()}
                  </pre>
                  <div className="flex justify-center gap-4">
                      <button onClick={copyToClipboard} className="px-12 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-orange-700 transition-colors">
                        Copier le SQL
                      </button>
                      <button onClick={() => setShowSql(false)} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-colors">
                        Fermer
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;