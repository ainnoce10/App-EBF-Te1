
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
  X,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TickerMessage } from '../types';

interface SettingsProps {
  tickerMessages?: TickerMessage[];
  onUpdateMessages?: (messages: TickerMessage[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ tickerMessages = [], onUpdateMessages }) => {
  const [newMessage, setNewMessage] = useState('');
  const [selectedColor, setSelectedColor] = useState<'green' | 'yellow' | 'red' | 'neutral'>('neutral');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSql, setShowSql] = useState(false);

  const handleAddMessage = async () => {
    if (!newMessage.trim()) return;
    
    setIsUpdating(true);
    const contentToAdd = newMessage.trim();
    const colorToAdd = selectedColor;

    try {
      // Tentative d'insertion dans Supabase
      const { data, error } = await supabase
          .from('ticker_messages')
          .insert([{ content: contentToAdd, color: colorToAdd }])
          .select();
      
      if (error) throw error;
      
      // Si succès, on vide le champ. Le Realtime dans App.tsx s'occupera de mettre à jour la liste.
      setNewMessage('');
      setSelectedColor('neutral');

    } catch (error: any) {
      console.error("Erreur Supabase:", error);
      
      // Si l'erreur est liée aux permissions (RLS), on prévient l'utilisateur
      const isRlsError = error.code === '42501' || error.message?.includes('policy');
      
      alert(
        isRlsError 
        ? "Action bloquée par Supabase (Erreur RLS).\n\nVous devez autoriser l'écriture dans votre tableau de bord Supabase ou utiliser le script 'Débloquer les Permissions' ci-dessus." 
        : `Erreur technique : ${error.message || "Connexion perdue"}`
      );
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

  const getRlsFixScript = () => `
-- EXECUTER CECI DANS LE SQL EDITOR DE SUPABASE POUR DEBLOQUER L'AJOUT
-- Active la sécurité
ALTER TABLE ticker_messages ENABLE ROW LEVEL SECURITY;

-- Autorise tout le monde (Public) à LIRE, INSERER, MODIFIER et SUPPRIMER
-- Note: Pour une app pro, on filtrerait par utilisateur, mais pour ce prototype on ouvre l'accès.
CREATE POLICY "Accès total public sur ticker_messages" 
ON ticker_messages 
FOR ALL 
USING (true) 
WITH CHECK (true);
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getRlsFixScript());
    alert("Script SQL copié !");
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
          <p className="text-gray-500 text-sm">Gestion des messages et accès</p>
        </div>
        {isUpdating && <Loader2 size={24} className="text-orange-500 animate-spin" />}
      </div>

      {/* MODAL SQL FIX */}
      {showSql && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-2xl rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-scale-in">
              <div className="p-6 border-b flex justify-between items-center bg-orange-50">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-orange-800">
                      <ShieldAlert size={20}/> Débloquer les Permissions (SQL)
                  </h3>
                  <button onClick={() => setShowSql(false)}><X size={24} className="text-gray-400"/></button>
              </div>
              <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4 font-medium">
                    Si vous ne pouvez pas ajouter de messages, c'est que Supabase bloque l'accès "Public". 
                    Copiez ce code et collez-le dans l'onglet <b>SQL Editor</b> de Supabase :
                  </p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs font-mono overflow-auto max-h-48 mb-6">
                      {getRlsFixScript()}
                  </pre>
                  <div className="flex justify-end gap-3">
                      <button onClick={() => setShowSql(false)} className="px-6 py-3 font-bold text-gray-500">Annuler</button>
                      <button onClick={copyToClipboard} className="px-6 py-3 bg-orange-600 text-white rounded-xl font-bold flex items-center gap-2">
                        <Copy size={18}/> Copier
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* SECTION DIAGNOSTIC */}
      <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
                  <Database size={24}/>
              </div>
              <div>
                  <h4 className="font-bold text-gray-800">La sauvegarde échoue ?</h4>
                  <p className="text-xs text-gray-500">Il faut autoriser l'écriture publique sur la table 'ticker_messages'.</p>
              </div>
          </div>
          <button 
            onClick={() => setShowSql(true)}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <Code size={18}/> Débloquer les Permissions
          </button>
      </div>

      {/* SECTION MESSAGES */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-orange-50 flex items-center gap-3">
           <Megaphone className="text-orange-600" size={24} />
           <h3 className="font-black text-gray-800 uppercase tracking-tight">Flash Info TV</h3>
        </div>
        
        <div className="p-6">
           <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-8">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Nouveau Message</label>
               <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex gap-2">
                        {(['green', 'yellow', 'red', 'neutral'] as const).map(color => (
                            <button 
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={`w-10 h-10 rounded-full border-4 transition-all shadow-sm
                                    ${color === 'green' ? 'bg-green-500' : color === 'yellow' ? 'bg-yellow-400' : color === 'red' ? 'bg-red-600' : 'bg-gray-600'}
                                    ${selectedColor === color ? 'border-white scale-110 ring-2 ring-orange-200' : 'border-transparent opacity-40'}
                                `}
                            />
                        ))}
                    </div>
                    <div className="flex-1 flex gap-2">
                        <input 
                            type="text" 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMessage()}
                            placeholder="Tapez votre annonce ici..."
                            className="flex-1 p-4 bg-white border border-gray-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <button 
                            onClick={handleAddMessage}
                            disabled={isUpdating || !newMessage.trim()}
                            className="bg-orange-500 text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest disabled:opacity-50 active:scale-95 transition-all shadow-lg"
                        >
                            {isUpdating ? <Loader2 size={18} className="animate-spin"/> : 'Ajouter'}
                        </button>
                    </div>
               </div>
           </div>

           <div className="space-y-3">
              {tickerMessages.length > 0 ? tickerMessages.map((msg, index) => (
                <div key={msg.id || index} className={`flex items-center justify-between p-4 rounded-2xl border-2 animate-fade-in ${getColorClass(msg.color)}`}>
                   <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                      <span className="font-bold">{msg.content}</span>
                   </div>

                   <div className="flex items-center gap-3">
                       <div className="flex gap-1">
                            {['green', 'yellow', 'red', 'neutral'].map(c => (
                                <button 
                                    key={c}
                                    onClick={() => handleUpdateColor(msg, c)}
                                    className={`w-4 h-4 rounded-full border ${msg.color === c ? 'ring-2 ring-gray-400' : 'opacity-20'} 
                                        ${c === 'green' ? 'bg-green-500' : c === 'yellow' ? 'bg-yellow-400' : c === 'red' ? 'bg-red-600' : 'bg-gray-600'}
                                    `}
                                />
                            ))}
                       </div>
                       <div className="w-px h-6 bg-black/10 mx-2"></div>
                       <button 
                         onClick={() => handleDeleteMessage(msg)}
                         className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-all"
                       >
                         <Trash2 size={18} />
                       </button>
                   </div>
                </div>
              )) : (
                  <div className="text-center py-10 text-gray-400 italic">Aucun message flash actif</div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
