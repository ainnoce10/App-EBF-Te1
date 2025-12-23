import React, { useState } from 'react';
import { Intervention } from '../types';
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
  FileText,
  MapPin,
  Mail
} from 'lucide-react';

// Types locaux pour le secrétariat
interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  lastInteraction: string;
}

interface CaisseTransaction {
  id: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  date: string;
}

interface SecretariatProps {
  liveInterventions?: Intervention[];
}

const Secretariat: React.FC<SecretariatProps> = ({ liveInterventions }) => {
  // --- STATES ---
  const [showClientModal, setShowClientModal] = useState(false);
  const [showCaisseModal, setShowCaisseModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  // --- MOCK DATA ---
  const [clients] = useState<Client[]>([
    { id: 'CL-001', name: 'Transport Express', phone: '+225 07 07 01 02', email: 'contact@trans-express.ci', location: 'Abidjan - Zone 4', lastInteraction: '24 Oct' },
    { id: 'CL-002', name: 'Mme. Koffi', phone: '+225 05 04 03 02', email: 'koffi.s@gmail.com', location: 'Bouaké - Commerce', lastInteraction: '22 Oct' },
    { id: 'CL-003', name: 'Imprimerie Moderne', phone: '+225 01 02 03 04', email: 'imprimerie@moderne.ci', location: 'Abidjan - Plateau', lastInteraction: '20 Oct' },
    { id: 'CL-004', name: 'Résidence Les Oliviers', phone: '+225 07 88 99 00', email: 'syndic@oliviers.ci', location: 'Abidjan - Cocody', lastInteraction: '18 Oct' },
  ]);

  const [caisseHistory, setCaisseHistory] = useState<CaisseTransaction[]>([
    { id: 'OP-102', type: 'in', amount: 25000, reason: 'Acompte Client M. Kouamé', date: 'Aujourd\'hui 10:30' },
    { id: 'OP-101', type: 'out', amount: 12000, reason: 'Achat fournitures bureau', date: 'Aujourd\'hui 09:15' },
  ]);

  // Form States
  const [newTransaction, setNewTransaction] = useState<{type: 'in'|'out', amount: string, reason: string}>({
    type: 'out',
    amount: '',
    reason: ''
  });

  // --- HANDLERS ---

  const handleCall = (phone: string, name: string) => {
    // Simulation d'appel
    alert(`Appel en cours vers ${name} (${phone})...`);
    // window.location.href = `tel:${phone}`; // Décommenter pour un vrai lien tel
  };

  const handleSaveTransaction = () => {
    if (!newTransaction.amount || !newTransaction.reason) return;

    const transaction: CaisseTransaction = {
      id: `OP-${Math.floor(Math.random() * 1000)}`,
      type: newTransaction.type,
      amount: parseInt(newTransaction.amount),
      reason: newTransaction.reason,
      date: "A l'instant"
    };

    setCaisseHistory([transaction, ...caisseHistory]);
    setNewTransaction({ type: 'out', amount: '', reason: '' });
    setShowCaisseModal(false);
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
                    <Calendar className="text-orange-500" /> Planning de la semaine
                </h3>
                <button className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded hover:bg-orange-100 transition-colors">
                    + Nouveau RDV
                </button>
            </div>
            
            <div className="space-y-4 flex-1">
                {/* Fallback to mock if no live data, or slice of live data */}
                {(liveInterventions && liveInterventions.length > 0 ? liveInterventions.slice(0, 3) : [1, 2, 3]).map((item, i) => {
                    const isMock = typeof item === 'number';
                    const date = isMock ? 24 + i : new Date((item as Intervention).date).getDate();
                    const clientName = isMock ? 'Transport Express' : (item as Intervention).client;
                    const desc = isMock ? 'Intervention Site Bouaké' : (item as Intervention).description;
                    
                    return (
                        <div key={i} className="flex gap-4 p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all cursor-pointer group">
                            <div className="flex flex-col items-center justify-center bg-orange-100 text-orange-700 w-14 h-14 rounded-lg shrink-0 group-hover:bg-orange-200 transition-colors">
                                <span className="text-xs font-bold uppercase">Oct</span>
                                <span className="text-xl font-bold">{date}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-gray-800">{desc}</h4>
                                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Confirmé</span>
                                </div>
                                <p className="text-sm text-gray-500">Client: {clientName}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                    <span className="flex items-center gap-1"><Clock size={12} /> 09:00 - 12:00</span>
                                    <span className="flex items-center gap-1"><User size={12} /> Tech: Moussa</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
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
                {clients.slice(0, 4).map((client) => (
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
                <span className="text-xs font-mono text-gray-400">ID: CAISSE-MAIN-01</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div 
                    className="p-4 bg-gray-50 rounded-xl text-center border border-gray-200 hover:border-orange-500 transition-colors group"
                >
                    <p className="text-gray-500 text-xs uppercase mb-1 font-semibold tracking-wide">Solde Actuel</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">150.000 F</p>
                </div>
                 <div className="p-4 bg-green-50 rounded-xl text-center border border-green-100 hover:border-green-300 transition-colors">
                    <p className="text-green-600 text-xs uppercase mb-1 font-semibold tracking-wide flex items-center justify-center gap-1">
                        <ArrowUpRight size={12}/> Entrées Jour
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-green-700">+25.000 F</p>
                </div>
                 <div className="p-4 bg-red-50 rounded-xl text-center border border-red-100 hover:border-red-300 transition-colors">
                    <p className="text-red-500 text-xs uppercase mb-1 font-semibold tracking-wide flex items-center justify-center gap-1">
                        <ArrowDownRight size={12}/> Sorties Jour
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-red-600">-12.000 F</p>
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

       {/* --- MODAL: CLIENT DATABASE (CRM) --- */}
       {showClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <User className="text-green-600"/> Base Clients (CRM)
                    </h3>
                    <button onClick={() => setShowClientModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"><X size={20}/></button>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Toolbar */}
                    <div className="flex gap-4 mb-6">
                        <div className="flex-1 relative">
                            <input 
                                type="text" 
                                placeholder="Rechercher nom, zone..." 
                                value={clientSearch}
                                onChange={(e) => setClientSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18}/>
                        </div>
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 shadow-sm transition-colors">
                            <Plus size={18}/> Nouveau Client
                        </button>
                    </div>

                    {/* Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3">Nom</th>
                                    <th className="px-4 py-3">Contact</th>
                                    <th className="px-4 py-3">Localisation</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredClients.map(client => (
                                    <tr key={client.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            {client.name}
                                            <div className="text-xs text-gray-400 font-normal">{client.id}</div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            <div className="flex flex-col">
                                                <span className="flex items-center gap-1"><Phone size={12}/> {client.phone}</span>
                                                <span className="flex items-center gap-1 text-xs text-gray-400"><Mail size={12}/> {client.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                                                <MapPin size={10}/> {client.location}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleCall(client.phone, client.name)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Appeler">
                                                    <Phone size={16}/>
                                                </button>
                                                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Dossier">
                                                    <FileText size={16}/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredClients.length === 0 && (
                            <div className="p-8 text-center text-gray-500">Aucun client trouvé.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
       )}

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

    </div>
  );
};

export default Secretariat;