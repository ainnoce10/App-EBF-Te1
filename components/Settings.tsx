import React, { useState } from 'react';
import { Save, Bell, Globe, Lock, Shield, Megaphone, Trash2, Plus } from 'lucide-react';

interface SettingsProps {
  tickerMessages?: string[];
  onUpdateMessages?: (messages: string[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ tickerMessages = [], onUpdateMessages }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleAddMessage = () => {
    if (newMessage.trim() && onUpdateMessages) {
      onUpdateMessages([...tickerMessages, newMessage.trim()]);
      setNewMessage('');
    }
  };

  const handleDeleteMessage = (index: number) => {
    if (onUpdateMessages) {
      const updated = tickerMessages.filter((_, i) => i !== index);
      onUpdateMessages(updated);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddMessage();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Paramètres de l'application</h2>
        <p className="text-gray-500">Gérez vos préférences et la configuration globale</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* General Settings */}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
              <input type="email" defaultValue="contact@ebf-ivoire.ci" className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Devise par défaut</label>
              <select className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white">
                  <option>FCFA (XOF)</option>
                  <option>Euro (€)</option>
                  <option>Dollar ($)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications & Security */}
        <div className="space-y-6">
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
                    <p className="text-sm text-gray-500">Notif quand un produit est &lt; 10 unités</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-orange-500 transition-all"></div>
                  </label>
              </div>
              <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Rapport Hebdomadaire</p>
                    <p className="text-sm text-gray-500">Résumé PDF par email le Lundi</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-orange-500 transition-all"></div>
                  </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Shield className="text-green-600" size={20} />
                Sécurité & Accès
              </h3>
            </div>
            <div className="p-6">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-2 mb-2">
                   <Lock size={16} /> Changer mot de passe administrateur
                </button>
                <p className="text-xs text-gray-400">Dernière modification: il y a 3 mois</p>
            </div>
          </div>
        </div>

      </div>

      {/* Ticker Management Section (Full Width) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-orange-50">
           <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Megaphone className="text-orange-600" size={20} />
              Gestion du bandeau défilant (Flash Info)
           </h3>
           <p className="text-sm text-gray-500 mt-1">Gérez les messages qui défilent en haut de l'application</p>
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
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus size={18} /> Ajouter
              </button>
           </div>
           
           <div className="space-y-2 max-h-60 overflow-y-auto">
              {tickerMessages.length === 0 ? (
                <p className="text-gray-400 italic text-center py-4">Aucun message flash actif.</p>
              ) : (
                tickerMessages.map((msg, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group hover:border-gray-300 transition-colors">
                     <span className="text-gray-700">{msg}</span>
                     <button 
                       onClick={() => handleDeleteMessage(index)}
                       className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                     >
                       <Trash2 size={16} />
                     </button>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-md">
           <Save size={18} /> Enregistrer les modifications
        </button>
      </div>
    </div>
  );
};

export default Settings;