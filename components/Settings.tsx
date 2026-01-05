
import React, { useState, useEffect } from 'react';
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
  Save
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
  const [showSql, setShowSql] = useState(false);
  
  // State pour la musique
  const [musicUrl, setMusicUrl] = useState('');

  useEffect(() => {
    // Charger la musique sauvegardée au chargement
    const savedMusic = localStorage.getItem('ebf_tv_music_url');
    if (savedMusic) {
        setMusicUrl(savedMusic);
    } else {
        setMusicUrl(MUSIC_PRESETS[0].url);
    }
  }, []);

  const handleSaveMusic = () => {
    if (musicUrl) {
        localStorage.setItem('ebf_tv_music_url', musicUrl);
        alert("Musique sauvegardée ! Elle sera jouée lors de la prochaine diffusion TV.");
    }
  };

  const handleAddMessage = async () => {
    if (!newMessage.trim()) return;
    
    setIsUpdating(true);
    const contentToAdd = newMessage.trim();
    const colorToAdd = selectedColor;

    try {
      const { error } = await supabase
          .from('ticker_messages')
          .insert([{ content: contentToAdd, color: colorToAdd }]);
      
      if (error) throw error;
      
      setNewMessage('');
      setSelectedColor('neutral');

    } catch (error: any) {
      console.error("Erreur insertion:", error);
      if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('violates row-level security')) {
          alert("ERREUR DE PERMISSION :\n\nSupabase bloque l'ajout. Veuillez exécuter le script SQL de configuration (Bouton 'Configuration SQL').");
      } else {
          alert(`Erreur lors de l'ajout : ${error.message || "Problème de connexion"}`);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMessage = async (msg: TickerMessage) => {
    if (!window.confirm("Supprimer ce message définitivement ?")) return;
    
    setIsUpdating(true);
    try {
        if (msg.id) {
             const { error } = await supabase.from('ticker_messages').delete().eq('id', msg.id);
             if (error) throw error;
        }
    } catch (error: any) {
        alert(`Erreur lors de la suppression : ${error.message}`);
    } finally {
        setIsUpdating(false);
    }
  };

  const handleUpdateColor = async (msg: TickerMessage, newColor: string) => {
    try {
        if (msg.id) {
            const { error } = await supabase.from('ticker_messages').update({ color: newColor }).eq('id', msg.id);
            if (error) throw error;
        }
    } catch (error: any) {
        alert(`Erreur changement couleur : ${error.message}`);
    }
  };

  const getFullSchemaScript = () => `
-- 0. NETTOYAGE (ATTENTION : Supprime les tables existantes pour éviter les erreurs)
drop publication if exists supabase_realtime;
drop table if exists public.stock cascade;
drop table if exists public.interventions cascade;
drop table if exists public.transactions cascade;
drop table if exists public.employees cascade;
drop table if exists public.ticker_messages cascade;

-- 1. Activer le Temps Réel (Realtime)
create publication supabase_realtime for all tables;

-- 2. Création de la table STOCK
create table public.stock (
  id text primary key,
  name text not null,
  description text, -- Nouveau champ
  category text,
  quantity integer default 0,
  threshold integer default 5,
  "unitPrice" numeric default 0,
  supplier text,
  site text,
  "imageUrls" text[],
  "technicalSheetUrl" text, -- Nouveau champ
  specs jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Création de la table INTERVENTIONS (Techniciens)
create table public.interventions (
  id text primary key,
  client text,
  "clientPhone" text, -- Requis pour l'app
  domain text,        -- Requis pour l'app
  "interventionType" text, -- Requis pour l'app
  description text,
  technician text,
  status text, -- 'En cours', 'Terminé', etc.
  date date,
  site text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Création de la table TRANSACTIONS (Comptabilité/Caisse)
create table public.transactions (
  id text primary key,
  type text, -- 'Recette' ou 'Dépense'
  category text,
  amount numeric default 0,
  date date,
  description text,
  site text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Création de la table EMPLOYEES (RH)
create table public.employees (
  id text primary key,
  name text,
  role text,
  site text,
  status text, -- 'Actif', 'Congés'
  "entryDate" date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Création de la table TICKER_MESSAGES (Bandeau TV)
create table public.ticker_messages (
  id bigint generated by default as identity primary key,
  content text not null,
  color text default 'neutral', -- Requis pour l'app
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Configuration de la sécurité (Row Level Security)
-- Stock
alter table public.stock enable row level security;
create policy "Public Access Stock" on public.stock for all using (true) with check (true);

-- Interventions
alter table public.interventions enable row level security;
create policy "Public Access Interventions" on public.interventions for all using (true) with check (true);

-- Transactions
alter table public.transactions enable row level security;
create policy "Public Access Transactions" on public.transactions for all using (true) with check (true);

-- Employees
alter table public.employees enable row level security;
create policy "Public Access Employees" on public.employees for all using (true) with check (true);

-- Messages TV
alter table public.ticker_messages enable row level security;
create policy "Public Access Ticker" on public.ticker_messages for all using (true) with check (true);

-- 8. INSERTION DE DONNÉES DE DÉMARRAGE
insert into public.stock (id, name, description, category, quantity, threshold, "unitPrice", supplier, site, "imageUrls", specs)
values 
('STK-001', 'Câble R2V 3G2.5mm²', 'Câble électrique rigide pour installation fixe industrielle ou domestique.', 'Électricité', 500, 100, 25000, 'ElecPro', 'Abidjan', ARRAY['https://images.unsplash.com/photo-1558402529-d2638a7023e9?auto=format&fit=crop&q=80&w=1200'], '{"Type": "R2V"}'::jsonb),
('STK-002', 'Disjoncteur 16A', 'Disjoncteur magnéto-thermique pour protection des circuits.', 'Électricité', 15, 20, 3500, 'ElecPro', 'Bouaké', ARRAY['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=1200'], '{"Calibre": "16A"}'::jsonb);

insert into public.ticker_messages (content, color) values 
('Bienvenue chez EBF - Votre partenaire technique.', 'neutral'),
('Promotion : -15% sur les câbles cette semaine !', 'green');
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getFullSchemaScript());
    alert("Script SQL copié ! Collez-le dans l'éditeur SQL de Supabase.");
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
        {isUpdating && <Loader2 size={24} className="text-orange-500 animate-spin" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    Générer les tables Supabase requises.
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
                  <p className="text-purple-100 text-sm font-medium opacity-90">
                    Choisir la musique de fond du mode diffusion.
                  </p>
              </div>
              
              <div className="relative z-10 space-y-3">
                  <input 
                    type="text" 
                    placeholder="Coller un lien MP3..." 
                    value={musicUrl}
                    onChange={(e) => setMusicUrl(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-purple-900/50 border border-purple-500/30 text-white placeholder-purple-300 text-xs font-bold outline-none focus:border-purple-300 transition-colors"
                  />
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {MUSIC_PRESETS.map((p, i) => (
                          <button 
                            key={i}
                            onClick={() => setMusicUrl(p.url)}
                            className="shrink-0 px-3 py-1.5 bg-purple-600 rounded-lg text-[10px] font-bold uppercase hover:bg-white hover:text-purple-700 transition-colors"
                          >
                             {p.name}
                          </button>
                      ))}
                  </div>
                  <button 
                    onClick={handleSaveMusic}
                    className="w-full px-4 py-2 bg-white text-purple-700 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center justify-center gap-2"
                  >
                     <Save size={14} /> Sauvegarder
                  </button>
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
                    ⚠️ Ce script supprime et recrée toutes les tables pour s'assurer que les nouvelles colonnes (Téléphone, Domaine, etc.) sont bien présentes.
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
