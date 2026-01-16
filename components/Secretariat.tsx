
import React, { useState, useMemo } from 'react';
import { Intervention, Transaction } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Calendar, 
  User, 
  Phone, 
  Search, 
  Plus, 
  X, 
  Wallet
} from 'lucide-react';

interface SecretariatProps {
  liveInterventions?: Intervention[];
  liveTransactions?: Transaction[];
}

interface DerivedClient {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  lastInteraction: string;
}

const Secretariat: React.FC<SecretariatProps> = ({ liveInterventions = [], liveTransactions = [] }) => {
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCaisseModal, setShowCaisseModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  const clients: DerivedClient[] = useMemo(() => {
    const uniqueClients = new Map<string, DerivedClient>();
    liveInterventions.forEach(inter => {
        if (!uniqueClients.has(inter.client)) {
            uniqueClients.set(inter.client, {
                id: `CL-${inter.client.substring(0,3).toUpperCase()}`,
                name: inter.client,
                phone: inter.clientPhone || '+225 XX XX XX XX',
                email: 'contact@client.com',
                location: inter.site,
                lastInteraction: new Date(inter.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            });
        }
    });
    return Array.from(uniqueClients.values());
  }, [liveInterventions]);

  // Plus de filtrage nécessaire, liveTransactions ne contient que les données secrétariat
  const secretariatTransactions = liveTransactions;

  const currentBalance = useMemo(() => {
      const income = secretariatTransactions.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
      const outcome = secretariatTransactions.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);
      return income - outcome;
  }, [secretariatTransactions]);

  const todayIncome = useMemo(() => {
      const today = new Date().toISOString().split('T')[0];
      return secretariatTransactions.filter(t => t.type === 'Recette' && t.date === today).reduce((acc, t) => acc + t.amount, 0);
  }, [secretariatTransactions]);

  const todayOutcome = useMemo(() => {
      const today = new Date().toISOString().split('T')[0];
      return secretariatTransactions.filter(t => t.type === 'Dépense' && t.date === today).reduce((acc, t) => acc + t.amount, 0);
  }, [secretariatTransactions]);

  const [newTransaction, setNewTransaction] = useState<{
      type: 'in'|'out', 
      amount: string, 
      civility: string,
      clientName: string,
      reason: string
  }>({ 
      type: 'out', 
      amount: '', 
      civility: 'M',
      clientName: '',
      reason: '' 
  });

  const handleCall = (phone: string) => {
    if (!phone || phone.includes('X')) {
        alert("Numéro non disponible ou invalide.");
        return;
    }
    window.location.href = `tel:${phone}`;
  };

  const handleSaveTransaction = async () => {
    if (!newTransaction.amount) return;
    const newId = `TRX-SEC-${Math.floor(Math.random() * 10000)}`;
    
    // Construction description
    let finalDesc = newTransaction.reason;
    if (newTransaction.clientName) {
        finalDesc += ` - Client: ${newTransaction.civility} ${newTransaction.clientName}`;
    }

    const trx: Transaction = {
        id: newId,
        type: newTransaction.type === 'in' ? 'Recette' : 'Dépense',
        category: newTransaction.type === 'in' ? 'Caisse' : 'Service', 
        amount: parseInt(newTransaction.amount),
        date: new Date().toISOString().split('T')[0],
        description: finalDesc,
        site: 'Abidjan' 
    };
    try {
        // Sauvegarde dans secretariat_transactions
        const { error } = await supabase.from('secretariat_transactions').insert([trx]);
        if (error) throw error;
        setNewTransaction({ type: 'out', amount: '', civility: 'M', clientName: '', reason: '' });
        setShowCaisseModal(false);
    } catch (error) { console.error(error); }
  };

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));

  return (
    <div className="space-y-4 md:space-y-6 relative pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Secrétariat</h2>
          <p className="text-gray-500">Planning & Caisse</p>
        </div>
        <div className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100 hidden md:block">
           {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* --- PLANNING --- */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Calendar className="text-orange-500" size={18} /> Planning
                </h3>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
                {liveInterventions.length > 0 ? liveInterventions.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex flex-col items-center justify-center bg-white text-orange-600 w-12 h-12 rounded-lg shrink-0 font-bold border border-orange-100">
                            <span className="text-[10px] uppercase">{new Date(item.date).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                            <span className="text-lg leading-none">{new Date(item.date).getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-800 text-sm truncate">{item.client}</h4>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-gray-200">{item.status}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{item.description}</p>
                            {item.clientPhone && (
                                <a href={`tel:${item.clientPhone}`} className="text-[10px] text-blue-600 font-black hover:underline mt-1 block">
                                    {item.clientPhone}
                                </a>
                            )}
                        </div>
                    </div>
                )) : <div className="text-center text-gray-400 py-8 text-sm">Rien de prévu</div>}
            </div>
        </div>

        {/* --- CRM --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <User className="text-green-600" size={18} /> Clients
            </h3>
             <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
                {clients.slice(0, 5).map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">{client.name.substring(0,2)}</div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-800 truncate">{client.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold truncate">{client.phone}</p>
                            </div>
                        </div>
                        <button onClick={() => handleCall(client.phone)} className="p-2 bg-gray-100 rounded-full text-green-600 hover:bg-green-600 hover:text-white transition-colors"><Phone size={14}/></button>
                    </div>
                ))}
            </div>
            <button onClick={() => setShowClientModal(true)} className="w-full mt-4 py-3 bg-gray-50 text-gray-600 rounded-xl font-bold text-sm">Voir tout</button>
        </div>
      </div>

       {/* --- CAISSE WIDGET --- */}
       <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Wallet className="text-gray-600" size={18} /> Caisse Secrétariat
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-900 rounded-xl text-center text-white col-span-2 md:col-span-1">
                    <p className="text-gray-400 text-[10px] uppercase font-bold">Solde Caisse</p>
                    <p className="text-2xl font-black">{currentBalance.toLocaleString()} F</p>
                </div>
                 <div className="p-3 bg-green-50 rounded-xl text-center border border-green-100">
                    <p className="text-green-600 text-[10px] uppercase font-bold">Entrées</p>
                    <p className="text-lg font-black text-green-700">+{todayIncome.toLocaleString()}</p>
                </div>
                 <div className="p-3 bg-red-50 rounded-xl text-center border border-red-100">
                    <p className="text-red-500 text-[10px] uppercase font-bold">Sorties</p>
                    <p className="text-lg font-black text-red-600">-{todayOutcome.toLocaleString()}</p>
                </div>
                <button onClick={() => setShowCaisseModal(true)} className="p-3 bg-orange-500 rounded-xl text-white font-bold shadow-md flex flex-col items-center justify-center active:scale-95 col-span-2 md:col-span-1">
                    <Plus size={20} /> <span className="text-xs uppercase mt-1">Opération Caisse</span>
                </button>
            </div>
       </div>

       {/* --- MODAL CAISSE --- */}
       {showCaisseModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-start justify-center md:pt-24 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white w-full rounded-t-[2rem] md:rounded-[2.5rem] p-6 animate-slide-up max-w-sm mx-auto shadow-2xl relative md:mb-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-black text-gray-800 text-lg">Mouvement Caisse</h3>
                    <button onClick={() => setShowCaisseModal(false)}><X/></button>
                </div>
                <div className="space-y-4">
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                        <button onClick={() => setNewTransaction({...newTransaction, type: 'in'})} className={`flex-1 py-3 rounded-lg font-bold text-sm ${newTransaction.type === 'in' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}>ENTRÉE</button>
                        <button onClick={() => setNewTransaction({...newTransaction, type: 'out'})} className={`flex-1 py-3 rounded-lg font-bold text-sm ${newTransaction.type === 'out' ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}>SORTIE</button>
                    </div>
                    <input type="number" placeholder="Montant (FCFA)" className="w-full p-4 bg-gray-50 rounded-xl font-bold text-xl outline-none" value={newTransaction.amount} onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})} autoFocus/>
                    
                    {/* Nom Client */}
                    <div className="flex gap-2">
                        <select 
                            value={newTransaction.civility}
                            onChange={(e) => setNewTransaction({...newTransaction, civility: e.target.value})}
                            className="bg-gray-50 rounded-xl font-bold text-xs px-2 outline-none border border-transparent focus:border-orange-500"
                        >
                            <option value="M">M</option>
                            <option value="Mme">Mme</option>
                            <option value="Mlle">Mlle</option>
                        </select>
                        <input type="text" placeholder="Nom Client / Tiers" className="w-full p-4 bg-gray-50 rounded-xl font-bold text-sm outline-none" value={newTransaction.clientName} onChange={e => setNewTransaction({...newTransaction, clientName: e.target.value})}/>
                    </div>

                    <input type="text" placeholder="Motif" className="w-full p-4 bg-gray-50 rounded-xl font-bold text-sm outline-none" value={newTransaction.reason} onChange={e => setNewTransaction({...newTransaction, reason: e.target.value})}/>
                    <button onClick={handleSaveTransaction} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold uppercase shadow-lg">Valider</button>
                </div>
            </div>
        </div>
       )}

       {/* --- MODAL CLIENTS --- */}
       {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 pt-12 md:pt-24 overflow-y-auto">
            <div className="bg-white w-full h-full md:h-[80vh] md:max-w-2xl rounded-3xl flex flex-col overflow-hidden animate-fade-in shadow-2xl relative mb-10">
                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                    <Search className="text-gray-400"/>
                    <input type="text" placeholder="Chercher client..." className="flex-1 outline-none font-bold text-lg" value={clientSearch} onChange={e => setClientSearch(e.target.value)}/>
                    <button onClick={() => setShowClientModal(false)} className="bg-gray-100 p-2 rounded-full"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                    {filteredClients.map(c => (
                        <div key={c.id} className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-800">{c.name}</span>
                                <span className="text-xs text-gray-500">{c.phone}</span>
                            </div>
                            <button onClick={() => handleCall(c.phone)} className="text-green-600 font-bold text-xs bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition-colors">Appeler</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
       )}
    </div>
  );
};

export default Secretariat;
