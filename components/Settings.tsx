
import React, { useState, useEffect, useRef } from 'react';
import { 
  Megaphone, 
  Trash2, 
  Loader2, 
  Database, 
  X,
  ShieldAlert,
  Music,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TickerMessage } from '../types';

interface SettingsProps {
  tickerMessages?: TickerMessage[];
  onUpdateMessages?: (messages: TickerMessage[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ tickerMessages = [] }) => {
  const [newMessage, setNewMessage] = useState('');
  const [newColor, setNewColor] = useState<'neutral' | 'green' | 'yellow' | 'red'>('neutral');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingMusic, setIsSavingMusic] = useState(false);
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSql, setShowSql] = useState(false);
  
  const [musicUrl, setMusicUrl] = useState('');
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [audioLibrary, setAudioLibrary] = useState<{name: string, url: string}[]>([]);
  const audioTestRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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

  useEffect(() => {
    if (audioTestRef.current) {
        if (isPlayingTest) audioTestRef.current.play().catch(() => setIsPlayingTest(false));
        else { audioTestRef.current.pause(); audioTestRef.current.currentTime = 0; }
    }
  }, [isPlayingTest, musicUrl]);

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

  const getColorClass = (c: string) => {
      switch(c) {
          case 'green': return 'bg-green-100 text-green-700 border-green-200';
          case 'yellow': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
          case 'red': return 'bg-red-100 text-red-700 border-red-200';
          default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
  };

  const getFullSchemaScript = () => `
-- 1. CONFIGURATION STORAGE (Dossier pour les rapports vocaux)
insert into storage.buckets (id, name, public) 
values ('assets', 'assets', true), ('voice_reports', 'voice_reports', true)
on conflict (id) do nothing;

-- 2. POLITIQUES DE STORAGE
drop policy if exists "Public Access Assets" on storage.objects;
create policy "Public Access Assets" on storage.objects for all using ( bucket_id = 'assets' ) with check ( bucket_id = 'assets' );

drop policy if exists "Public Access Reports" on storage.objects;
create policy "Public Access Reports" on storage.objects for all using ( bucket_id = 'voice_reports' ) with check ( bucket_id = 'voice_reports' );

-- 3. TABLES DE DONNÉES
create table if not exists public.tv_settings ( 
    key text primary key, 
    value text, 
    updated_at timestamp with time zone default now() 
);

create table if not exists public.ticker_messages ( 
    id bigint generated by default as identity primary key, 
    content text not null, 
    color text default 'neutral', 
    created_at timestamp with time zone default now() 
);

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
    created_at timestamp with time zone default now() 
);

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
    has_report boolean default false, 
    date date, 
    site text, 
    created_at timestamp with time zone default now() 
);

create table if not exists public.employees ( 
    id text primary key, 
    name text, 
    role text, 
    site text, 
    status text, 
    "entryDate" date, 
    created_at timestamp with time zone default now() 
);

create table if not exists public.hardware_transactions ( 
    id text primary key, 
    type text, 
    category text, 
    amount numeric default 0, 
    date date, 
    description text, 
    site text, 
    created_at timestamp with time zone default now() 
);

create table if not exists public.secretariat_transactions ( 
    id text primary key, 
    type text, 
    category text, 
    amount numeric default 0, 
    date date, 
    description text, 
    site text, 
    created_at timestamp with time zone default now() 
);

create table if not exists public.accounting_transactions ( 
    id text primary key, 
    type text, 
    category text, 
    amount numeric default 0, 
    date date, 
    description text, 
    site text, 
    created_at timestamp with time zone default now() 
);

-- 4. ACTIVATION REALTIME
drop publication if exists supabase_realtime;
create publication supabase_realtime for all tables;

-- 5. SÉCURITÉ (RLS)
alter table public.tv_settings enable row level security;
drop policy if exists "Public" on public.tv_settings;
create policy "Public" on public.tv_settings for all using (true) with check (true);

alter table public.ticker_messages enable row level security;
drop policy if exists "Public" on public.ticker_messages;
create policy "Public" on public.ticker_messages for all using (true) with check (true);

alter table public.stock enable row level security;
drop policy if exists "Public" on public.stock;
create policy "Public" on public.stock for all using (true) with check (true);

alter table public.interventions enable row level security;
drop policy if exists "Public" on public.interventions;
create policy "Public" on public.interventions for all using (true) with check (true);

alter table public.employees enable row level security;
drop policy if exists "Public" on public.employees;
create policy "Public" on public.employees for all using (true) with check (true);

alter table public.hardware_transactions enable row level security;
drop policy if exists "Public" on public.hardware_transactions;
create policy "Public" on public.hardware_transactions for all using (true) with check (true);

alter table public.secretariat_transactions enable row level security;
drop policy if exists "Public" on public.secretariat_transactions;
create policy "Public" on public.secretariat_transactions for all using (true) with check (true);

alter table public.accounting_transactions enable row level security;
drop policy if exists "Public" on public.accounting_transactions;
create policy "Public" on public.accounting_transactions for all using (true) with check (true);
`;

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-600 rounded-3xl p-6 text-white relative min-h-[180px] overflow-hidden">
              <Database size={80} className="absolute -right-4 -top-4 opacity-10" />
              <h4 className="font-black text-xl mb-2 flex items-center gap-2"><ShieldAlert size={20}/> Mise à jour SQL</h4>
              <p className="text-xs opacity-80 mb-6">Ajoute les nouvelles fonctionnalités (Vocal) sans effacer vos données.</p>
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
                    <input 
                        type="text" 
                        value={newMessage} 
                        onChange={e => setNewMessage(e.target.value)} 
                        placeholder="Texte à diffuser..." 
                        className="flex-1 p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-orange-500 transition-colors" 
                    />
                    <select 
                        value={newColor} 
                        onChange={(e) => setNewColor(e.target.value as any)}
                        className="p-4 bg-gray-50 rounded-2xl font-bold outline-none uppercase text-xs border-r-8 border-transparent cursor-pointer"
                    >
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
                       <span className="font-bold">{m.content}</span>
                       <button onClick={() => handleDeleteMessage(m)} className="p-2 bg-white rounded-full text-red-500 shadow-sm hover:scale-110 transition-transform"><Trash2 size={16}/></button>
                   </div>
               ))}
               {tickerMessages.length === 0 && (
                   <p className="text-center text-gray-400 text-sm font-bold py-4">Aucun message en diffusion</p>
               )}
           </div>
      </div>

      {showSql && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden flex flex-col">
              <div className="p-8 border-b bg-blue-50 flex justify-between items-center">
                  <h3 className="font-black text-xl text-blue-900">Script SQL Consolidé</h3>
                  <button onClick={() => setShowSql(false)}><X/></button>
              </div>
              <div className="p-8 overflow-y-auto">
                  <p className="text-xs text-blue-600 font-bold mb-4 uppercase tracking-widest">Utilisez ce script pour ajouter les buckets audio et les politiques de sécurité sans effacer vos tables actuelles.</p>
                  <pre className="bg-gray-900 text-green-400 p-6 rounded-2xl text-xs overflow-auto max-h-60 mb-8">{getFullSchemaScript()}</pre>
                  <button onClick={() => { navigator.clipboard.writeText(getFullSchemaScript()); alert("Script SQL copié !"); }} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black uppercase shadow-xl active:scale-95 transition-all">Copier pour Supabase SQL Editor</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
