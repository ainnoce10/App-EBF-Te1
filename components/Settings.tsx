
import React, { useState } from 'react';
import { 
  Megaphone, 
  Trash2, 
  Loader2, 
  Database, 
  Code,
  Copy,
  X,
  ShieldAlert,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TickerMessage } from '../types';

interface SettingsProps {
  tickerMessages?: TickerMessage[];
  onUpdateMessages?: (messages: TickerMessage[]) => void;
}

const Settings: React.FC<SettingsProps> = ({ tickerMessages = [] }) => {
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
      const { error } = await supabase
          .from('ticker_messages')
          .insert([{ content: contentToAdd, color: colorToAdd }]);
      
      if (error) throw error;
      
      setNewMessage('');
      setSelectedColor('neutral');

    } catch (error: any) {
      console.error("Erreur insertion:", error);
      if (error.code === '42501' || error.message?.includes('policy')) {
          alert("ERREUR DE PERMISSION :\n\nSupabase bloque l'ajout car la sécurité RLS est active.\n\nCliquez sur le bouton bleu 'Débloquer les Permissions' ci-dessus.");
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

  const getRlsFixScript = () => `
-- Débloquer l'accès public pour la table ticker_messages
ALTER TABLE ticker_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Accès total public" ON ticker_messages;
CREATE POLICY "Accès total public" ON ticker_messages FOR ALL USING (true) WITH CHECK (true);
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getRlsFixScript());
    alert("Code SQL copié !");
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
          <p className="text-gray-500 text-sm">Gestion des messages flash</p>
        </div>
        {isUpdating && <Loader2 size={24} className="text-orange-500 animate-spin" />}
      </div>

      <div className="bg-blue-600 rounded-3xl shadow-lg p-6 flex flex-col md:flex-row items-center justify-between gap-6 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <Database size={120} />
          </div>
          <div className="flex items-center gap-6 relative z-10">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                  <ShieldAlert size={32} />
              </div>
              <div>
                  <h4 className="font-black text-xl md:text-2xl tracking-tight">Problème d'ajout ?</h4>
                  <p className="text-blue-100 text-sm md:text-base font-medium opacity-90">
                    Débloquez l'écriture SQL sur Supabase.
                  </p>
              </div>
          </div>
          <button 
            onClick={() => setShowSql(true)}
            className="w-full md:w-auto px-8 py-4 bg-white text-blue-700 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-3 relative z-10"
          >
            <Code size={20}/> Débloquer SQL
          </button>
      </div>

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
                      <Code size={28} className="text-blue-600"/> Correction SQL
                  </h3>
                  <button onClick={() => setShowSql(false)} className="p-2 bg-white rounded-full text-gray-400"><X size={24}/></button>
              </div>
              <div className="p-8">
                  <pre className="bg-gray-900 text-green-400 p-6 rounded-2xl text-xs md:text-sm font-mono overflow-auto max-h-60 mb-8">
                        {getRlsFixScript()}
                  </pre>
                  <div className="flex justify-center gap-4">
                      <button onClick={copyToClipboard} className="px-12 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">
                        Copier
                      </button>
                      <button onClick={() => setShowSql(false)} className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">
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
