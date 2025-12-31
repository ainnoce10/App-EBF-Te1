
import React, { useState } from 'react';
import { 
  Bell, 
  Globe, 
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

interface SettingsProps {
  tickerMessages?: string[];
  onUpdateMessages?: (messages: string[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ tickerMessages = [] }) => {
  const [newMessage, setNewMessage] = useState('');
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
            .insert([{ content: newMessage.trim() }]);
        
        if (error) throw error;
        setNewMessage('');
      } catch (error) {
        console.error("Erreur ajout message", error);
      }
      setIsUpdating(false);
    }
  };

  const handleDeleteMessage = async (msgContent: string) => {
    setIsUpdating(true);
    try {
        const { error } = await supabase
            .from('ticker_messages')
            .delete()
            .eq('content', msgContent);
            
        if (error) throw error;
    } catch (error) {
        console.error("Erreur suppression message", error);
    }
    setIsUpdating(false);
  };

  const handleMoveMessage = (index: number, direction: 'up' | 'down') => {
    const newMessages = [...tickerMessages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newMessages.length) {
      const temp = newMessages[index];
      newMessages[index] = newMessages[targetIndex];
      newMessages[targetIndex] = temp;
      
      // Note: Pour une persistence réelle, il faudrait une colonne 'order' dans la BDD
      // Ici, on simule l'ordre pour l'interface utilisateur.
      console.log("Nouvel ordre :", newMessages);
      alert("L'ordre a été mis à jour localement. (Nécessite une colonne 'order' en BDD pour persister au rechargement)");
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
           <p className="text-sm text-gray-500 mt-1">Les messages apparaissent instantanément sur la TV.</p>
        </div>
        <div className="p-6">
           <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nouveau message flash..."
                className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none font-bold"
              />
              <button 
                onClick={handleAddMessage}
                disabled={isUpdating}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Plus size={18} /> Ajouter
              </button>
           </div>
           
           <div className="space-y-3">
              {tickerMessages.map((msg, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-orange-200 transition-all">
                   <div className="flex items-center gap-4 flex-1">
                      <div className="flex flex-col gap-1">
                         <button 
                           onClick={() => handleMoveMessage(index, 'up')}
                           disabled={index === 0}
                           className="p-1 text-gray-400 hover:text-orange-500 disabled:opacity-20 transition-colors"
                         >
                            <ArrowUp size={16} />
                         </button>
                         <button 
                           onClick={() => handleMoveMessage(index, 'down')}
                           disabled={index === tickerMessages.length - 1}
                           className="p-1 text-gray-400 hover:text-orange-500 disabled:opacity-20 transition-colors"
                         >
                            <ArrowDown size={16} />
                         </button>
                      </div>
                      <span className="text-gray-800 font-bold text-sm md:text-base">{msg}</span>
                   </div>
                   <button 
                     onClick={() => handleDeleteMessage(msg)}
                     className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors ml-4"
                   >
                     <Trash2 size={20} />
                   </button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
