import React, { useState, useMemo } from 'react';
import { Intervention, Transaction } from '../types';
import { db, doc, setDoc } from '../lib/firebase';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Search, 
  Plus, 
  X, 
  Save, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet,
  MapPin
} from 'lucide-react';

interface SecretariatProps {
  liveInterventions?: Intervention[];
  liveTransactions?: Transaction[];
}

// Client dérivé de l'intervention
interface DerivedClient {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  lastInteraction: string;
}

const Secretariat: React.FC<SecretariatProps> = ({ liveInterventions = [], liveTransactions = [] }) => {
  // --- STATES ---
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCaisseModal, setShowCaisseModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  // --- DERIVED DATA ---
  
  // Extraire les clients uniques des interventions
  const clients: DerivedClient[] = useMemo(() => {
    const uniqueClients = new Map<string, DerivedClient>();
    
    liveInterventions.forEach(inter => {
        if (!uniqueClients.has(inter.client)) {
            uniqueClients.set(inter.client, {
                id: `CL-${inter.client.substring(0,3).toUpperCase()}`,
                name: inter.client,
                phone: '+225 XX XX XX XX', // Donnée non dispo dans Intervention, placeholder
                email: 'contact@client.com', // Donnée non dispo
                location: inter.site,
                lastInteraction: new Date(inter.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            });
        }
    });
    return Array.from(uniqueClients.values());
  }, [liveInterventions]);

  // Extraire l'historique de caisse des transactions
  const caisseHistory = useMemo(() => {
    return liveTransactions
        .filter(t => t.category === 'Caisse' || true) 
        .slice(0, 5)
        .map(t => ({
            id: t.id,
            type: t.type === 'Recette' ? 'in' as const : 'out' as const,
            amount: t.amount,
            reason: t.description,
            date: new Date(t.date).toLocaleDateString('fr-FR')
        }));
  }, [liveTransactions]);

  // Calcul du solde
  const currentBalance = useMemo(() => {
      const income = liveTransactions.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
      const outcome = liveTransactions.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);
      return income - outcome;
  }, [liveTransactions]);

  const todayIncome = useMemo(() => {
      const today = new Date().toISOString().split('T')[0];
      return liveTransactions
        .filter(t => t.type === 'Recette' && t.date === today)
        .reduce((acc, t) => acc + t.amount, 0);
  }, [liveTransactions]);

  const todayOutcome = useMemo(() => {
      const today = new Date().toISOString().split('T')[0];
      return liveTransactions
        .filter(t => t.type === 'Dépense' && t.date === today)
        .reduce((acc, t) => acc + t.amount, 0);
  }, [liveTransactions]);


  // Form States
  const [newTransaction, setNewTransaction] = useState<{type: 'in'|'out', amount: string, reason: string}>({
    type: 'out',
    amount: '',
    reason: ''
  });

  // --- HANDLERS ---

  const handleCall = (phone: string, name: string) => {
    alert(`Appel simulé vers ${name} (${phone})...`);
  };

  const handleSaveTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.reason) return;

    const newId = `TRX-${Math.floor(Math.random() * 10000)}`;
    const globalTransaction: Transaction = {
        id: newId,
        type: newTransaction.type === 'in' ? 'Recette' : 'Dépense',
        category: 'Caisse',
        amount: parseInt(newTransaction.amount),
        date: new Date().toISOString().split('T')[0],
        description: newTransaction.reason,
        site: 'Abidjan' 
    };

    try {
        // FIREBASE CREATE (setDoc avec ID custom)
        await setDoc(doc(db, 'transactions', newId), globalTransaction);

        setNewTransaction({ type: 'out', amount: '', reason: '' });
        setShowCaisseModal(false);
    } catch (error) {
        console.error("Erreur sauvegarde transaction", error);
        alert("Erreur lors de l'enregistrement");
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    c.location.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Secrétariat</h2>
          <p className="text-gray-500">Planning, Clients et Caisse</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
           {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* --- WIDGET 1: PLANNING --- */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="text-orange-500" /> Planning des Interventions
                </h3>
                <button className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 transition-colors">
                    + Nouveau RDV
                </button>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px]">
                {liveInterventions.length > 0 ? liveInterventions.slice(0, 5).map((item) => {
                    const dateObj = new Date(item.date);
                    const day = dateObj.getDate();
                    const month = dateObj.toLocaleDateString('fr-FR', { month: 'short' });
                    
                    return (
                        <div key={item.id} className="flex gap-4 p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all cursor-pointer group">
                            <div className="flex flex-col items-center justify-center bg-orange-100 text-orange-700 w-14 h-14 rounded-lg shrink-0 group-hover:bg-orange-200 transition-colors">
                                <span className="text-xs font-bold uppercase">{month}</span>
                                <span className="text-xl font-bold">{day}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-gray-800">{item.description}</h4>
                                    <span className={`text-xs px-2 py-0.5 rounded ${item.status === 'Terminé' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{item.status}</span>
                                </div>
                                <p className="text-sm text-gray-500">Client: {item.client}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                    <span className="flex items-center gap-1"><Clock size={12} /> {item.date}</span>
                                    <span className="flex items-center gap-1"><User size={12} /> {item.technician}</span>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="text-center text-gray-400 py-8">Aucune intervention planifiée</div>
                )}
            </div>
        </div>

        {/* --- WIDGET 2: CRM / CLIENT LIST --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <User className="text-green-600" /> Clients Récents
                </h3>
            </div>
            
             <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px]">
                {clients.slice(0, 5).map((client) => (
                    <div key={client.id} className="flex items-center justify-between pb-3 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-xs shrink-0">
                                {client.name.substring(0,2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{client.name}</p>
                                <p className="text-xs text-gray-500 truncate">{client.location}</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleCall(client.phone, client.name)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-green-500 rounded-full transition-all"
                            title="Appeler"
                        >
                            <Phone size={14} />
                        </button>
                    </div>
                ))}
                {clients.length === 0 && <div className="text-gray-400 text-center text-sm">Aucun client trouvé</div>}
            </div>
            <button 
                onClick={() => setShowClientModal(true)}
                className="w-full mt-4 py-2.5 text-sm text-green-700 bg-green-50 rounded-lg hover:bg-green-100 font-medium transition-colors flex items-center justify-center gap-2"
            >
                <Search size={14}/> Voir base clients
            </button>
        </div>
      </div>

       {/* --- WIDGET 3: CAISSE --- */}
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Wallet className="text-gray-600" /> Caisse Menu Dépenses
                </h3>
                <span className="text-xs font-mono text-gray-400">LIVE</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                    className="p-4 bg-gray-50 rounded-xl text-center border border-gray-200 hover:border-orange-500 transition-colors group"
                >
                    <p className="text-gray-500 text-xs uppercase mb-1 font-semibold tracking-wide">Solde Actuel</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                        {currentBalance.toLocaleString()} F
                    </p>
                </div>
                 <div className="p-4 bg-green-50 rounded-xl text-center border border-green-100 hover:border-green-300 transition-colors">
                    <p className="text-green-600 text-xs uppercase mb-1 font-semibold tracking-wide flex items-center justify-center gap-1">
                        <ArrowUpRight size={12}/> Entrées Jour
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-green-700">+{todayIncome.toLocaleString()} F</p>
                </div>
                 <div className="p-4 bg-red-50 rounded-xl text-center border border-red-100 hover:border-red-300 transition-colors">
                    <p className="text-red-500 text-xs uppercase mb-1 font-semibold tracking-wide flex items-center justify-center gap-1">
                        <ArrowDownRight size={12}/> Sorties Jour
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-red-600">-{todayOutcome.toLocaleString()} F</p>
                </div>
                <button 
                    onClick={() => setShowCaisseModal(true)}
                    className="p-4 bg-gray-800 rounded-xl text-white font-bold hover:bg-gray-900 shadow-md flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                >
                    <Plus size={24} className="text-orange-400" />
                    <span className="text-sm">Nouvelle Opération</span>
                </button>
            </div>
       </div>

       {/* --- MODAL: CAISSE TRANSACTION --- */}
       {showCaisseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Wallet className="text-orange-500"/> Mouvement de Caisse
                    </h3>
                    <button onClick={() => setShowCaisseModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-4">
                    {/* Type Selector */}
                    <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-lg">
                        <button 
                            onClick={() => setNewTransaction({...newTransaction, type: 'in'})}
                            className={`py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${newTransaction.type === 'in' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <ArrowUpRight size={16}/> ENTRÉE
                        </button>
                        <button 
                            onClick={() => setNewTransaction({...newTransaction, type: 'out'})}
                            className={`py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${newTransaction.type === 'out' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <ArrowDownRight size={16}/> SORTIE
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                        <input 
                            type="number" 
                            value={newTransaction.amount}
                            onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-xl font-bold text-gray-800 placeholder-gray-300"
                            placeholder="0"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motif / Libellé</label>
                        <textarea 
                            rows={3}
                            value={newTransaction.reason}
                            onChange={(e) => setNewTransaction({...newTransaction, reason: e.target.value})}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                            placeholder="Ex: Achat café, Règlement facture..."
                        />
                    </div>

                    {/* Recent History Preview */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Historique récent</p>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                            {caisseHistory.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${item.type === 'in' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-gray-700 truncate max-w-[150px]">{item.reason}</span>
                                    </div>
                                    <span className={`font-medium ${item.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                        {item.type === 'in' ? '+' : '-'}{item.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button 
                        onClick={() => setShowCaisseModal(false)}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={handleSaveTransaction}
                        className={`px-6 py-2 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2
                            ${newTransaction.type === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        <Save size={18} /> Valider
                    </button>
                </div>
            </div>
        </div>
       )}

       {/* --- MODAL: CLIENT LIST --- */}
       {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-green-50">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <User className="text-green-600"/> Base Clients
                    </h3>
                    <button onClick={() => setShowClientModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="Rechercher un client..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredClients.map(client => (
                        <div key={client.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                                    {client.name.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{client.name}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <MapPin size={12} /> {client.location}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleCall(client.phone, client.name)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                            >
                                <Phone size={18} />
                            </button>
                        </div>
                    ))}
                    {filteredClients.length === 0 && (
                        <div className="text-center py-10 text-gray-400">Aucun client trouvé</div>
                    )}
                </div>
            </div>
        </div>
       )}

    </div>
  );
};

export default Secretariat;