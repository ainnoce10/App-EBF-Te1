
import React, { useState } from 'react';
import { Bell, Globe, Megaphone, Trash2, Plus, Loader2, Database, AlertTriangle, CheckCircle } from 'lucide-react';
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
        // Attention : Supabase requiert idéalement un ID unique pour la suppression.
        // Ici on supprime par contenu (risque de supprimer des doublons si existants)
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
      // 1. Initialiser le Stock
      if (MOCK_STOCK.length > 0) {
        const { error } = await supabase.from('stock').upsert(MOCK_STOCK, { onConflict: 'id' });
        if (error) throw error;
      }

      // 2. Initialiser les Interventions
      if (MOCK_INTERVENTIONS.length > 0) {
        const { error } = await supabase.from('interventions').upsert(MOCK_INTERVENTIONS, { onConflict: 'id' });
        if (error) throw error;
      }

      // 3. Initialiser les Transactions
      if (MOCK_TRANSACTIONS.length > 0) {
        const { error } = await supabase.from('transactions').upsert(MOCK_TRANSACTIONS, { onConflict: 'id' });
        if (error) throw error;
      }

      // 4. Initialiser les Employés
      if (MOCK_EMPLOYEES.length > 0) {
        const { error } = await supabase.from('employees').upsert(MOCK_EMPLOYEES, { onConflict: 'id' });
        if (error) throw error;
      }
      
      setSeedStatus('success');
      alert("Base de données initialisée avec succès ! Les données de démonstration ont été injectées.");

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
          <h2 className="text-2xl font-bold text-gray-800">Paramètres de l'application</h2>
          <p className="text-gray-500">Gérez vos préférences et la configuration globale</p>
        </div>
        {isUpdating && <Loader2 size={24} className="text-orange-500 animate-spin" />}
      </div>

      {/* SECTION ADMINISTRATION BDD */}
      <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden">
        <div className="p-6 border-b border-red-100 bg-red-50">
           <h3 className="font-bold text-red-800 flex items-center gap-2">
              <Database className="text-red-600" size={20} />
              Administration Base de Données (Supabase)
           </h3>
           <p className="text-sm text-red-600/80 mt-1">Zone technique pour configurer la base de données.</p>
        </div>
        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
           <div>
             <h4 className="font-bold text-gray-800">Initialiser les Collections</h4>
             <p className="text-sm text-gray-500 max-w-lg">
               Si c'est la première utilisation, cliquez ici pour injecter les données de démonstration (Stock, Employés, Chantiers) dans vos tables Supabase.
             </p>
           </div>
           <button 
             onClick={handleInitializeDatabase}
             disabled={isSeeding}
             className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md active:scale-95
               ${seedStatus === 'success' ? 'bg-green-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-800'}
               ${isSeeding ? 'opacity-70 cursor-not-allowed' : ''}
             `}
           >
             {isSeeding ? <Loader2 size={18} className="animate-spin" /> : seedStatus === 'success' ? <CheckCircle size={18}/> : <AlertTriangle size={18} className="text-yellow-400"/>}
             {isSeeding ? 'Injection en cours...' : seedStatus === 'success' ? 'Données Injectées !' : 'Injecter Données Démo'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Globe className="text-orange-500" size={20} />
              Général
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise</label>
              <input type="text" defaultValue="EBF Ivoire" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Devise par défaut</label>
              <select className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white">
                  <option>FCFA (XOF)</option>
                  <option>Euro (€)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Bell className="text-orange-500" size={20} />
              Notifications
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Alertes Stock Critique</p>
                  <p className="text-sm text-gray-500">Notif quand un produit est &lt; 10</p>
                </div>
                <div className="w-11 h-6 bg-orange-500 rounded-full flex items-center px-1">
                   <div className="w-4 h-4 bg-white rounded-full translate-x-5"></div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-orange-50">
           <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Megaphone className="text-orange-600" size={20} />
              Gestion du Flash Info (Bandeau TV)
           </h3>
           <p className="text-sm text-gray-500 mt-1">Les messages ajoutés ici apparaissent instantanément sur la TV.</p>
        </div>
        <div className="p-6">
           <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nouveau message flash..."
                className="flex-1 p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <button 
                onClick={handleAddMessage}
                disabled={isUpdating}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Plus size={18} /> Ajouter
              </button>
           </div>
           
           <div className="space-y-2 max-h-60 overflow-y-auto">
              {tickerMessages.map((msg, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-gray-300 transition-colors">
                   <span className="text-gray-700 font-medium">{msg}</span>
                   <button 
                     onClick={() => handleDeleteMessage(msg)}
                     className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                   >
                     <Trash2 size={16} />
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
