
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
  ArrowDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MOCK_INTERVENTIONS, MOCK_STOCK, MOCK_TRANSACTIONS, MOCK_EMPLOYEES } from '../constants';
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

  const handleAddMessage = async () => {
    if (newMessage.trim()) {
      setIsUpdating(true);
      try {
        const { error } = await supabase
            .from('ticker_messages')
            .insert([{ content: newMessage.trim(), color: selectedColor }]);
        
        if (error) throw error;
        setNewMessage('');
        // Reset color to neutral after add
        setSelectedColor('neutral');
      } catch (error) {
        console.error("Erreur ajout message", error);
        alert("Erreur lors de l'ajout. Vérifiez votre connexion.");
      }
      setIsUpdating(false);
    }
  };

  const handleDeleteMessage = async (msg: TickerMessage) => {
    setIsUpdating(true);
    try {
        let query = supabase.from('ticker_messages').delete();
        
        // Priorité à l'ID, sinon repli sur le contenu (pour les anciennes données)
        if (msg.id) {
            query = query.eq('id', msg.id);
        } else {
            query = query.eq('content', msg.content);
        }

        const { error } = await query;
            
        if (error) throw error;
    } catch (error) {
        console.error("Erreur suppression message", error);
        alert("Impossible de supprimer le message.");
    }
    setIsUpdating(false);
  };

  const handleUpdateColor = async (msg: TickerMessage, newColor: string) => {
    try {
        let query = supabase.from('ticker_messages').update({ color: newColor });
        
        if (msg.id) {
            query = query.eq('id', msg.id);
        } else {
            query = query.eq('content', msg.content);
        }

        const { error } = await query;
        if (error) throw error;
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
      
      // Note: Cela met à jour l'ordre localement, mais Supabase trie par date de création par défaut.
      // Pour persister l'ordre, il faudrait une colonne 'order' en base de données.
      // Ici on met à jour l'état local pour un feedback immédiat.
      if (onUpdateMessages) {
        onUpdateMessages(newMessages);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddMessage();
  };

  // Fonction pour créer les tables et injecter les données
  const handleInitializeDatabase = async () => {
    if (!window.confirm("Attention : Cette action va tenter d'écrire les données par défaut dans Supabase. Continuer ?")) {
      return;
    }

    setIsSeeding(true);
    setSeedStatus('idle');

    try {
      if (MOCK_STOCK.length > 0) {
        const { error } = await supabase.from('stock').upsert(MOCK_STOCK, { onConflict: 'id' });
        if (error) throw error;
      }
      if (MOCK_INTERVENTIONS.length > 0) {
        const { error } = await supabase.from('interventions').upsert(MOCK_INTERVENTIONS, { onConflict: 'id' });
        if (error) throw error;
      }
      if (MOCK_TRANSACTIONS.length > 0) {
        const { error } = await supabase.from('transactions').upsert(MOCK_TRANSACTIONS, { onConflict: 'id' });
        if (error) throw error;
      }
      if (MOCK_EMPLOYEES.length > 0) {
        const { error } = await supabase.from('employees').upsert(MOCK_EMPLOYEES, { onConflict: 'id' });
        if (error) throw error;
      }
      
      setSeedStatus('success');
      alert("Base de données initialisée avec succès !");
    } catch (error) {
      console.error("Erreur initialisation BDD:", error);
      setSeedStatus('error');
      alert("Erreur lors de l'initialisation : " + (error as any).message);
    } finally {
      setIsSeeding(false);
    }
  };

  // Helper pour afficher la couleur dans la liste
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
          <p className="text-gray-500 text-sm">Gérez la configuration globale</p>
        </div>
        {isUpdating && <Loader2 size={24} className="text-orange-500 animate-spin" />}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
        <div className="p-6 border-b border-red-100 bg-red-50">
           <h3 className="font-bold text-red-800 flex items-center gap-2">
              <Database className="text-red-600" size={20} />
              Administration Supabase
           </h3>
        </div>
        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
           <div>
             <h4 className="font-bold text-gray-800">Initialiser les Collections</h4>
             <p className="text-sm text-gray-500 max-w-lg">
               Injecter les données de démonstration dans vos tables Supabase.
             </p>
           </div>
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
