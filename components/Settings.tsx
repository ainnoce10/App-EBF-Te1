
import React, { useState } from 'react';
import { 
  Megaphone, 
  Trash2, 
  Plus, 
  Loader2, 
  Database, 
  AlertTriangle, 
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Code,
  Copy,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MOCK_INTERVENTIONS, MOCK_STOCK, MOCK_TRANSACTIONS, MOCK_EMPLOYEES, TICKER_MESSAGES } from '../constants';
import { TickerMessage } from '../types';

interface SettingsProps {
  tickerMessages?: TickerMessage[];
  onUpdateMessages?: (messages: TickerMessage[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ tickerMessages = [], onUpdateMessages }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedColor, setSelectedColor] = useState<'green' | 'yellow' | 'red' | 'neutral'>('neutral');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // États pour l'initialisation de la BDD
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showSql, setShowSql] = useState(false);

  const handleAddMessage = async () => {
    if (newMessage.trim()) {
      setIsUpdating(true);
      
      const tempMsg: TickerMessage = {
          id: `local-${Date.now()}`,
          content: newMessage.trim(),
          color: selectedColor
      };

      try {
        const { error } = await supabase
            .from('ticker_messages')
            .insert([{ content: tempMsg.content, color: tempMsg.color }]);
        
        if (error) throw error;
        
        setNewMessage('');
        setSelectedColor('neutral');

      } catch (error: any) {
        console.error("Erreur ajout message", error);
        
        if (onUpdateMessages) {
             onUpdateMessages([tempMsg, ...tickerMessages]);
        }
        setNewMessage('');
        setSelectedColor('neutral');
        
        alert(`Note: Sauvegarde locale uniquement.\nErreur Supabase : ${error.message || "Table introuvable ?"}\n\nAstuce : Utilisez le bouton 'Script SQL de Création' ci-dessus pour configurer votre base de données.`);
      }
      setIsUpdating(false);
    }
  };

  const handleDeleteMessage = async (msg: TickerMessage) => {
    if (!window.confirm("Supprimer ce message ?")) return;
    
    setIsUpdating(true);
    try {
        if (msg.id && !msg.id.startsWith('local-')) {
             const { error } = await supabase.from('ticker_messages').delete().eq('id', msg.id);
             if (error) throw error;
        } else {
             throw new Error("Message local ou ID manquant");
        }
    } catch (error: any) {
        console.error("Erreur suppression message", error);
        if (onUpdateMessages) {
            const updated = tickerMessages.filter(m => m !== msg);
            onUpdateMessages(updated);
        }
        if (msg.id && !msg.id.startsWith('local-')) {
             alert(`Suppression locale uniquement. Erreur synchro: ${error.message}`);
        }
    }
    setIsUpdating(false);
  };

  const handleUpdateColor = async (msg: TickerMessage, newColor: string) => {
    const updatedList = tickerMessages.map(m => m === msg ? { ...m, color: newColor as any } : m);
    if (onUpdateMessages) onUpdateMessages(updatedList);

    try {
        if (msg.id && !msg.id.startsWith('local-')) {
            const { error } = await supabase.from('ticker_messages').update({ color: newColor }).eq('id', msg.id);
            if (error) throw error;
        }
    } catch (error) {
        console.error("Erreur mise à jour couleur", error);
    }
  };

  const handleMoveMessage = (index: number, direction: 'up' | 'down') => {
    const newMessages = [...tickerMessages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newMessages.length) {
      const temp = newMessages[index];
      newMessages[index] = newMessages[targetIndex];
      newMessages[targetIndex] = temp;
      
      if (onUpdateMessages) {
        onUpdateMessages(newMessages);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddMessage();
  };

  const handleInitializeDatabase = async () => {
    if (!window.confirm("Attention : Cette action va injecter les données par défaut. Assurez-vous d'avoir exécuté le script SQL d'abord.")) {
      return;
    }

    setIsSeeding(true);
    setSeedStatus('idle');

    try {
      // 1. Messages Flash
      if (TICKER_MESSAGES.length > 0) {
         // On insère simplement car pas d'ID fixe
         await supabase.from('ticker_messages').insert(TICKER_MESSAGES.map(m => ({ content: m.content, color: m.color })));
      }

      // 2. Stock
      if (MOCK_STOCK.length > 0) {
        const { error } = await supabase.from('stock').upsert(MOCK_STOCK, { onConflict: 'id' });
        if (error) throw error;
      }
      // 3. Interventions
      if (MOCK_INTERVENTIONS.length > 0) {
        const { error } = await supabase.from('interventions').upsert(MOCK_INTERVENTIONS, { onConflict: 'id' });
        if (error) throw error;
      }
      // 4. Transactions
      if (MOCK_TRANSACTIONS.length > 0) {
        const { error } = await supabase.from('transactions').upsert(MOCK_TRANSACTIONS, { onConflict: 'id' });
        if (error) throw error;
      }
      // 5. Employés
      if (MOCK_EMPLOYEES.length > 0) {
        const { error } = await supabase.from('employees').upsert(MOCK_EMPLOYEES, { onConflict: 'id' });
        if (error) throw error;
      }
      
      setSeedStatus('success');
      alert("Données injectées avec succès !");
    } catch (error: any) {
      console.error("Erreur initialisation BDD:", error);
      setSeedStatus('error');
      alert("Erreur d'injection. Avez-vous créé les tables ?\nMessage: " + (error.message || error));
    } finally {
      setIsSeeding(false);
    }
  };

  const getSqlScript = () => `
-- ----------------------------------------------------------------
-- SCRIPT DE CONFIGURATION DE LA BASE DE DONNÉES EBF
-- Copiez tout ce contenu et collez-le dans l'éditeur SQL de Supabase
-- ----------------------------------------------------------------

-- 1. Table Messages Flash
CREATE TABLE IF NOT EXISTS ticker_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'neutral'
);

-- 2. Table Stock
CREATE TABLE IF NOT EXISTS stock (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  quantity INTEGER DEFAULT 0,
  threshold INTEGER DEFAULT 5,
  "unitPrice" INTEGER DEFAULT 0,
  supplier TEXT,
  site TEXT,
  "imageUrls" TEXT[],
  description TEXT,
  "technicalSheetUrl" TEXT,
  specs JSONB
);

-- 3. Table Interventions
CREATE TABLE IF NOT EXISTS interventions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  client TEXT NOT NULL,
  "clientPhone" TEXT,
  description TEXT,
  technician TEXT,
  status TEXT,
  date DATE,
  site TEXT,
  domain TEXT,
  "interventionType" TEXT
);

-- 4. Table Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  type TEXT,
  category TEXT,
  amount INTEGER,
  date DATE,
  description TEXT,
  site TEXT
);

-- 5. Table Employés
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  site TEXT,
  status TEXT,
  "entryDate" DATE
);

-- 6. POLITIQUES DE SÉCURITÉ (RLS) - ACCÈS PUBLIC (PROTOTYPE)
-- IMPORTANT : Permet à l'application de lire et écrire sans authentification utilisateur complexe

ALTER TABLE ticker_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Messages" ON ticker_messages FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Stock" ON stock FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Interventions" ON interventions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Employees" ON employees FOR ALL USING (true) WITH CHECK (true);
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getSqlScript());
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
          <p className="text-gray-500 text-sm">Configuration et Base de Données</p>
        </div>
        {isUpdating && <Loader2 size={24} className="text-orange-500 animate-spin" />}
      </div>

      {/* --- SECTION SQL SETUP --- */}
      {showSql && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white w-full max-w-4xl h-[80vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                      <Code size={20} className="text-blue-600"/> Script de Création des Tables
                  </h3>
                  <button onClick={() => setShowSql(false)}><X size={24} className="text-gray-400 hover:text-black"/></button>
              </div>
              <div className="flex-1 bg-gray-900 overflow-auto p-6">
                  <pre className="text-green-400 font-mono text-xs md:text-sm whitespace-pre-wrap selection:bg-green-900">
                      {getSqlScript()}
                  </pre>
              </div>
              <div className="p-6 border-t bg-white flex justify-end gap-4">
                  <button onClick={() => setShowSql(false)} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Fermer</button>
                  <button onClick={copyToClipboard} className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 shadow-lg">
                      <Copy size={18}/> Copier le Code
                  </button>
              </div>
           </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
        <div className="p-6 border-b border-red-100 bg-red-50">
           <h3 className="font-bold text-red-800 flex items-center gap-2">
              <Database className="text-red-600" size={20} />
              Configuration Base de Données
           </h3>
        </div>
        <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
           <div>
             <h4 className="font-bold text-gray-800 mb-1">1. Créer les Tables (Obligatoire)</h4>
             <p className="text-sm text-gray-500 max-w-lg mb-4">
               Si vous voyez des erreurs "Table introuvable", cliquez ci-dessous pour obtenir le code SQL à exécuter dans Supabase.
             </p>
             <button 
                onClick={() => setShowSql(true)}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-2"
             >
                <Code size={16}/> Script SQL de Création
             </button>
           </div>
           
           <div className="h-px w-full md:w-px md:h-20 bg-gray-200"></div>

           <div>
             <h4 className="font-bold text-gray-800 mb-1">2. Injecter les Données</h4>
             <p className="text-sm text-gray-500 max-w-lg mb-4">
               Une fois les tables créées, cliquez ici pour envoyer les données de démonstration vers Supabase.
             </p>
             <button 
               onClick={handleInitializeDatabase}
               disabled={isSeeding}
               className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md active:scale-95
                 ${seedStatus === 'success' ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'}
               `}
             >
               {isSeeding ? <Loader2 size={18} className="animate-spin" /> : seedStatus === 'success' ? <CheckCircle size={18}/> : <AlertTriangle size={18} className="text-yellow-400"/>}
               {isSeeding ? 'Injection...' : seedStatus === 'success' ? 'Injecté !' : 'Injecter Démo'}
             </button>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-orange-50">
           <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Megaphone className="text-orange-600" size={20} />
              Gestion du Flash Info (Bandeau TV)
           </h3>
           <p className="text-sm text-gray-500 mt-1">Les messages apparaissent instantanément sur la TV. Choisissez une couleur pour le type d'annonce.</p>
        </div>
        <div className="p-6">
           {/* Zone d'ajout */}
           <div className="flex flex-col gap-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
               <span className="text-xs font-black uppercase text-gray-400 tracking-widest">Nouveau Message</span>
               <div className="flex gap-4 items-center">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setSelectedColor('green')}
                            className={`w-8 h-8 rounded-full bg-green-500 border-4 transition-all ${selectedColor === 'green' ? 'border-green-200 scale-110 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`}
                            title="Positif / Promo"
                        />
                        <button 
                            onClick={() => setSelectedColor('yellow')}
                            className={`w-8 h-8 rounded-full bg-yellow-400 border-4 transition-all ${selectedColor === 'yellow' ? 'border-yellow-200 scale-110 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`}
                            title="Info / Attention"
                        />
                        <button 
                            onClick={() => setSelectedColor('red')}
                            className={`w-8 h-8 rounded-full bg-red-600 border-4 transition-all ${selectedColor === 'red' ? 'border-red-200 scale-110 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`}
                            title="Urgent / Alerte"
                        />
                        <button 
                            onClick={() => setSelectedColor('neutral')}
                            className={`w-8 h-8 rounded-full bg-gray-600 border-4 transition-all ${selectedColor === 'neutral' ? 'border-gray-200 scale-110 shadow-md' : 'border-transparent opacity-50 hover:opacity-100'}`}
                            title="Standard / Neutre"
                        />
                    </div>
               </div>
               <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Nouveau message flash..."
                        className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold bg-white"
                    />
                    <button 
                        onClick={handleAddMessage}
                        disabled={isUpdating}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-md"
                    >
                        <Plus size={18} /> Ajouter
                    </button>
               </div>
           </div>
           
           {/* Liste des messages */}
           <div className="space-y-3">
              {tickerMessages.map((msg, index) => (
                <div key={msg.id || index} className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition-all ${getColorClass(msg.color)}`}>
                   
                   <div className="flex items-center gap-4 flex-1">
                      <div className="flex flex-col gap-1">
                         <button 
                           onClick={() => handleMoveMessage(index, 'up')}
                           disabled={index === 0}
                           className="p-1 opacity-50 hover:opacity-100 disabled:opacity-20 transition-colors"
                         >
                            <ArrowUp size={16} />
                         </button>
                         <button 
                           onClick={() => handleMoveMessage(index, 'down')}
                           disabled={index === tickerMessages.length - 1}
                           className="p-1 opacity-50 hover:opacity-100 disabled:opacity-20 transition-colors"
                         >
                            <ArrowDown size={16} />
                         </button>
                      </div>
                      <span className="font-bold text-sm md:text-base break-words">{msg.content}</span>
                   </div>

                   {/* Actions: Changer couleur & Supprimer */}
                   <div className="flex items-center gap-4 mt-4 md:mt-0 pl-8 md:pl-0 border-t md:border-t-0 border-black/5 pt-2 md:pt-0">
                       <div className="flex gap-1.5 p-1.5 bg-white/50 rounded-full backdrop-blur-sm border border-black/5 shadow-sm">
                            <button 
                                onClick={() => handleUpdateColor(msg, 'green')}
                                className={`w-6 h-6 rounded-full border-2 ${msg.color === 'green' ? 'border-gray-600 scale-110' : 'border-transparent opacity-30 hover:opacity-100'} bg-green-500 transition-all`}
                            />
                            <button 
                                onClick={() => handleUpdateColor(msg, 'yellow')}
                                className={`w-6 h-6 rounded-full border-2 ${msg.color === 'yellow' ? 'border-gray-600 scale-110' : 'border-transparent opacity-30 hover:opacity-100'} bg-yellow-400 transition-all`}
                            />
                            <button 
                                onClick={() => handleUpdateColor(msg, 'red')}
                                className={`w-6 h-6 rounded-full border-2 ${msg.color === 'red' ? 'border-gray-600 scale-110' : 'border-transparent opacity-30 hover:opacity-100'} bg-red-600 transition-all`}
                            />
                            <button 
                                onClick={() => handleUpdateColor(msg, 'neutral')}
                                className={`w-6 h-6 rounded-full border-2 ${msg.color === 'neutral' ? 'border-gray-600 scale-110' : 'border-transparent opacity-30 hover:opacity-100'} bg-gray-600 transition-all`}
                            />
                       </div>

                       <div className="h-8 w-px bg-black/10"></div>

                       <button 
                         onClick={() => handleDeleteMessage(msg)}
                         className="opacity-50 hover:opacity-100 p-2 rounded-full hover:bg-red-500 hover:text-white transition-all text-red-600"
                         title="Supprimer"
                       >
                         <Trash2 size={20} />
                       </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
