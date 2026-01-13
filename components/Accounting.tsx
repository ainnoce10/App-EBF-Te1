
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_EMPLOYEES } from '../constants';
import { Transaction, Employee, Site } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Download, 
  FileText, 
  Users, 
  X, 
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  PlusCircle,
  Briefcase,
  TrendingUp,
  Wallet,
  Camera,
  Edit,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Calendar
} from 'lucide-react';

interface AccountingProps {
  liveTransactions?: Transaction[];
  liveEmployees?: Employee[];
}

const Accounting: React.FC<AccountingProps> = ({ liveTransactions = [], liveEmployees = [] }) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  
  // Modals States
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  
  // State pour le formulaire Employé (Ajout ou Edition)
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [employeeFormData, setEmployeeFormData] = useState({ name: '', assignedName: '', role: '', site: 'Abidjan', entryDate: new Date().toISOString().split('T')[0] });
  
  // Gestion Photo et Position
  const [newEmployeePhoto, setNewEmployeePhoto] = useState<File | null>(null);
  const [newEmployeePhotoPreview, setNewEmployeePhotoPreview] = useState<string | null>(null);
  const [photoPos, setPhotoPos] = useState({ x: 50, y: 50 });
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Transaction Form State
  const [transactionType, setTransactionType] = useState<'Recette' | 'Dépense'>('Recette');
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    category: '',
    description: '',
    site: 'Abidjan' as Site,
    date: new Date().toISOString().split('T')[0]
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (liveEmployees.length > 0) setEmployees(liveEmployees);
    else if (employees.length === 0) setEmployees(MOCK_EMPLOYEES);
  }, [liveEmployees, employees.length]);

  // --- ACTIONS TRANSACTIONS ---

  const openTransactionModal = (type: 'Recette' | 'Dépense') => {
    setTransactionType(type);
    setNewTransaction({
        amount: '',
        category: type === 'Recette' ? 'Virement Bancaire' : 'Charges', // Defaults spécifiques Compta
        description: '',
        site: 'Abidjan',
        date: new Date().toISOString().split('T')[0]
    });
    setShowTransactionModal(true);
  };

  const handleSaveTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.description) return;
    
    setIsSaving(true);
    const newId = `TRX-ACC-${Math.floor(Math.random() * 100000)}`;
    
    const trx: Transaction = {
        id: newId,
        type: transactionType,
        amount: parseInt(newTransaction.amount),
        category: newTransaction.category,
        description: newTransaction.description,
        site: newTransaction.site,
        date: newTransaction.date
    };

    try {
        // Sauvegarde dans accounting_transactions
        const { error } = await supabase.from('accounting_transactions').insert([trx]);
        if (error) throw error;
        setShowTransactionModal(false);
    } catch (error: any) {
        alert("Erreur enregistrement : " + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  // --- ACTIONS RH ---

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setNewEmployeePhoto(file);
        setNewEmployeePhotoPreview(URL.createObjectURL(file));
        setPhotoPos({ x: 50, y: 50 }); // Reset position on new photo
    }
  };

  const movePhoto = (direction: 'up' | 'down' | 'left' | 'right') => {
      setPhotoPos(prev => {
          const step = 10;
          switch(direction) {
              case 'up': return { ...prev, y: Math.max(0, prev.y - step) };
              case 'down': return { ...prev, y: Math.min(100, prev.y + step) };
              case 'left': return { ...prev, x: Math.max(0, prev.x - step) };
              case 'right': return { ...prev, x: Math.min(100, prev.x + step) };
              default: return prev;
          }
      });
  };

  const handleToggleStatus = async (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    const newStatus = emp.status === 'Actif' ? 'Congés' : 'Actif';
    try {
        setEmployees(employees.map(e => e.id === empId ? { ...e, status: newStatus } : e));
        const { error } = await supabase.from('employees').update({ status: newStatus }).eq('id', empId);
        if (error) throw error;
    } catch (error) {
        setEmployees(employees.map(e => e.id === empId ? { ...e, status: emp.status } : e));
    }
  };

  const handleEditEmployee = (emp: Employee) => {
      setEditingEmployeeId(emp.id);
      setEmployeeFormData({
          name: emp.name,
          assignedName: emp.assignedName || '',
          role: emp.role,
          site: emp.site as string,
          entryDate: emp.entryDate
      });
      setNewEmployeePhotoPreview(emp.photoUrl || null);
      setNewEmployeePhoto(null);
      
      // Parse position
      let x = 50, y = 50;
      if (emp.photoPosition) {
          const parts = emp.photoPosition.split(' ');
          if (parts.length === 2) {
              x = parseInt(parts[0]);
              y = parseInt(parts[1]);
          }
      }
      setPhotoPos({ x, y });
      
      setIsAddingEmployee(true); // Reuse the adding form logic
  };

  const handleSaveEmployee = async () => {
    if (!employeeFormData.name || !employeeFormData.assignedName) {
        alert("Le Nom Complet et le Nom Assigné sont obligatoires.");
        return;
    }
    setIsSaving(true);
    
    try {
        let photoUrl = newEmployeePhotoPreview;

        // 1. Upload Photo if changed
        if (newEmployeePhoto) {
            const timestamp = Date.now();
            const fileExt = newEmployeePhoto.name.split('.').pop();
            const fileName = `emp_${timestamp}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('assets').upload(fileName, newEmployeePhoto);
            
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(fileName);
            photoUrl = publicUrl;
        }

        const employeePayload = { 
            name: employeeFormData.name, 
            assignedName: employeeFormData.assignedName, 
            role: employeeFormData.role, 
            site: employeeFormData.site, 
            status: 'Actif', 
            entryDate: employeeFormData.entryDate,
            photoUrl: photoUrl || undefined,
            photoPosition: `${photoPos.x}% ${photoPos.y}%`
        };

        if (editingEmployeeId) {
            // UPDATE
            const { error } = await supabase.from('employees').update(employeePayload).eq('id', editingEmployeeId);
            if (error) throw error;
        } else {
            // INSERT
            const newId = `EMP-${Math.floor(Math.random() * 10000)}`;
            const { error } = await supabase.from('employees').insert([{ id: newId, ...employeePayload }]);
            if (error) throw error;
        }

        // Reset form
        setIsAddingEmployee(false);
        setEditingEmployeeId(null);
        setEmployeeFormData({ name: '', assignedName: '', role: '', site: 'Abidjan', entryDate: new Date().toISOString().split('T')[0] });
        setNewEmployeePhoto(null);
        setNewEmployeePhotoPreview(null);
        setPhotoPos({ x: 50, y: 50 });

    } catch (error: any) { 
        alert("Erreur sauvegarde employé: " + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleGeneratePaie = () => {
    setIsGenerating(true);
    setTimeout(() => { setIsGenerating(false); setShowPayrollModal(false); alert('Fiches de paie générées et envoyées.'); }, 2000);
  };

  const handleExport = () => {
    // Export GLOBAL (Tout) car la compta peut vouloir tout voir en CSV
    const headers = ['Date', 'Type', 'Catégorie', 'Description', 'Montant', 'Site'];
    const rows = liveTransactions.map(t => [t.date, t.type, t.category, t.description, t.amount, t.site].join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transactions_ebf_global.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- FILTRAGE COMPTA ---
  const accountingTransactions = liveTransactions;

  const displayedTransactions = showAllTransactions ? accountingTransactions : accountingTransactions.slice(0, 5);
  const totalRevenue = accountingTransactions.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = accountingTransactions.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);
  const netMargin = totalRevenue - totalExpense;

  return (
    <div className="space-y-6 relative pb-24">
       
       {/* HEADER */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Comptabilité & RH</h2>
          <p className="text-gray-500 font-bold text-sm">Gestion Structurelle & Sociale</p>
        </div>
        <button onClick={handleExport} className="bg-white border border-gray-200 text-gray-700 px-5 py-3 rounded-2xl flex items-center gap-2 shadow-sm text-xs font-black uppercase tracking-widest hover:bg-gray-50 active:scale-95 transition-all">
            <Download size={16} /> Exporter Global
        </button>
      </div>

      {/* SECTION RH (DEPLACÉE EN HAUT) */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8">
        <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Users size={20} className="text-blue-500"/> Ressources Humaines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button onClick={() => setShowPayrollModal(true)} className="p-6 border-2 border-gray-100 rounded-3xl flex items-center gap-4 hover:border-orange-200 hover:bg-orange-50 transition-all group">
                <div className="bg-orange-100 p-4 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                <div className="text-left">
                    <p className="font-black text-gray-900 text-lg">Fiches de Paie</p>
                    <p className="text-xs text-gray-500 font-bold">Générer les bulletins mensuels</p>
                </div>
             </button>
             <button onClick={() => { setShowEmployeeModal(true); setIsAddingEmployee(false); }} className="p-6 border-2 border-gray-100 rounded-3xl flex items-center gap-4 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                <div className="bg-blue-100 p-4 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform"><Users size={24} /></div>
                <div className="text-left">
                    <p className="font-black text-gray-900 text-lg">Gestion Effectif</p>
                    <p className="text-xs text-gray-500 font-bold">Ajouter ou modifier des employés</p>
                </div>
             </button>
        </div>
      </div>

      {/* KPI CARDS (Specifique Compta) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ArrowUpCircle size={80} className="text-green-600"/></div>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Entrées Générales</p>
          <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{totalRevenue.toLocaleString()} <span className="text-sm text-gray-400">FCFA</span></h3>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><ArrowDownCircle size={80} className="text-red-600"/></div>
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Charges Structure</p>
          <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{totalExpense.toLocaleString()} <span className="text-sm text-gray-400">FCFA</span></h3>
        </div>
        
        <div className="bg-gray-900 p-6 rounded-[2rem] shadow-lg border border-gray-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={80} className="text-white"/></div>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Solde Opérationnel</p>
          <h3 className={`text-3xl font-black tracking-tighter ${netMargin >= 0 ? 'text-white' : 'text-red-400'}`}>
              {netMargin > 0 && '+'}{netMargin.toLocaleString()} <span className="text-sm text-gray-600">FCFA</span>
          </h3>
        </div>
      </div>

      {/* ACTION BAR FINANCIERE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button 
            onClick={() => openTransactionModal('Recette')}
            className="group flex items-center justify-between p-5 bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-2xl transition-all active:scale-95"
          >
              <div className="flex items-center gap-4">
                  <div className="bg-green-500 text-white p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                      <PlusCircle size={24} />
                  </div>
                  <div className="text-left">
                      <h4 className="font-black text-green-900 uppercase text-sm tracking-wide">Virement / Apport</h4>
                      <p className="text-green-600 text-xs font-bold">Injecter fonds</p>
                  </div>
              </div>
              <ArrowUpCircle className="text-green-300 group-hover:text-green-500 transition-colors" size={32} />
          </button>

          <button 
            onClick={() => openTransactionModal('Dépense')}
            className="group flex items-center justify-between p-5 bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-2xl transition-all active:scale-95"
          >
              <div className="flex items-center gap-4">
                  <div className="bg-red-500 text-white p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                      <Briefcase size={24} />
                  </div>
                  <div className="text-left">
                      <h4 className="font-black text-red-900 uppercase text-sm tracking-wide">Payer Charge</h4>
                      <p className="text-red-600 text-xs font-bold">Loyer, Salaire, Facture</p>
                  </div>
              </div>
              <ArrowDownCircle className="text-red-300 group-hover:text-red-500 transition-colors" size={32} />
          </button>
      </div>

      {/* TABLEAU TRANSACTIONS */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
             <TrendingUp size={20} className="text-orange-500"/>
             <h3 className="font-black text-gray-800 text-sm uppercase tracking-wide">Journal Général</h3>
          </div>
          <button onClick={() => setShowAllTransactions(!showAllTransactions)} className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-orange-600 text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-colors">
            {showAllTransactions ? 'Réduire' : 'Voir tout'}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-black">Date</th>
                <th className="px-6 py-4 font-black">Libellé</th>
                <th className="px-6 py-4 font-black">Catégorie</th>
                <th className="px-6 py-4 font-black">Site</th>
                <th className="px-6 py-4 font-black text-right">Montant</th>
                <th className="px-6 py-4 font-black text-center">Flux</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-medium">
              {displayedTransactions.length > 0 ? displayedTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-500">{new Date(trx.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{trx.description}</td>
                  <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs font-bold border border-gray-200">{trx.category}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs uppercase">{trx.site}</td>
                  <td className="px-6 py-4 font-black text-right">{trx.amount.toLocaleString()} F</td>
                  <td className="px-6 py-4 text-center">
                    {trx.type === 'Recette' 
                        ? <span className="text-green-600 bg-green-100 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Entrée</span>
                        : <span className="text-red-600 bg-red-100 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider">Sortie</span>}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-300 font-bold">Aucune transaction structurelle enregistrée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL TRANSACTION (RECETTE/DEPENSE) --- */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 animate-scale-in shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className={`text-2xl font-black uppercase tracking-tighter ${transactionType === 'Recette' ? 'text-green-600' : 'text-red-600'}`}>
                            {transactionType === 'Recette' ? 'Apport / Virement' : 'Charge / Dépense'}
                        </h3>
                        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Comptabilité Générale</p>
                    </div>
                    <button onClick={() => setShowTransactionModal(false)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                </div>

                <div className="space-y-6">
                    {/* Amount Input */}
                    <div className="relative">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Montant (FCFA)</label>
                        <input 
                            type="number" 
                            autoFocus
                            placeholder="0" 
                            className={`w-full p-4 rounded-2xl font-black text-3xl outline-none border-4 transition-all ${transactionType === 'Recette' ? 'bg-green-50 text-green-700 border-green-100 focus:border-green-400' : 'bg-red-50 text-red-700 border-red-100 focus:border-red-400'}`}
                            value={newTransaction.amount} 
                            onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}
                        />
                    </div>

                    {/* Category Select */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Type de Charge/Produit</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(transactionType === 'Recette' 
                                ? ['Virement Bancaire', 'Apport Capital', 'Divers', 'Autre'] 
                                : ['Salaire', 'Loyer', 'Transport', 'Repas', 'Charges', 'Impots']
                            ).map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setNewTransaction({...newTransaction, category: cat})}
                                    className={`py-3 px-2 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all ${newTransaction.category === cat ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Libellé / Détails</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Salaire Mars 2024 ou Facture CIE" 
                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-800 outline-none border-2 border-transparent focus:border-gray-300"
                            value={newTransaction.description} 
                            onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                        />
                    </div>

                    {/* Meta Data Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Date</label>
                             <div className="relative">
                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
                                <input 
                                    type="date" 
                                    className="w-full pl-10 p-3 bg-gray-50 rounded-xl font-bold text-sm outline-none"
                                    value={newTransaction.date}
                                    onChange={e => setNewTransaction({...newTransaction, date: e.target.value})}
                                />
                             </div>
                        </div>
                        <div>
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Site</label>
                             <select 
                                className="w-full p-3 bg-gray-50 rounded-xl font-bold text-sm outline-none appearance-none"
                                value={newTransaction.site}
                                onChange={e => setNewTransaction({...newTransaction, site: e.target.value as any})}
                             >
                                 <option value="Abidjan">Abidjan</option>
                                 <option value="Bouaké">Bouaké</option>
                                 <option value="Korhogo">Korhogo</option>
                             </select>
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveTransaction} 
                        disabled={isSaving}
                        className={`w-full py-5 text-white rounded-2xl font-black uppercase text-sm tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 ${transactionType === 'Recette' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                        {isSaving ? <Loader2 className="animate-spin"/> : (transactionType === 'Recette' ? <PlusCircle size={20}/> : <Briefcase size={20}/>)}
                        {isSaving ? 'Enregistrement...' : 'Valider la transaction'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL PAIE (Mobile optimized) --- */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-sm flex flex-col overflow-hidden animate-slide-up">
            <div className="p-8 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                <h3 className="font-black text-gray-800 text-xl">Paie Mensuelle</h3>
                <button onClick={() => setShowPayrollModal(false)} className="p-2 bg-white rounded-full text-gray-400"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
               <div className="bg-blue-50 p-6 rounded-2xl text-center">
                   <FileText size={40} className="mx-auto text-blue-500 mb-2"/>
                   <p className="text-blue-900 font-bold">Génération des bulletins</p>
                   <p className="text-xs text-blue-600 mt-1">Période: Mois en cours</p>
               </div>
               <button onClick={handleGeneratePaie} disabled={isGenerating} className="w-full py-4 bg-gray-900 text-white font-black uppercase tracking-widest rounded-2xl flex justify-center gap-2 shadow-lg active:scale-95 transition-all">
                   {isGenerating ? <Loader2 className="animate-spin"/> : 'Lancer Traitement'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EMPLOYES --- */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
           <div className="bg-white w-full h-[90vh] md:h-auto md:max-h-[85vh] md:max-w-3xl rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
             <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{isAddingEmployee ? (editingEmployeeId ? 'Modifier Employé' : 'Nouvel Employé') : 'Effectif EBF'}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Gestion du personnel</p>
                </div>
                <button onClick={() => setShowEmployeeModal(false)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
             </div>

             <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar bg-white">
                 {!isAddingEmployee ? (
                   <>
                     <button onClick={() => { setEditingEmployeeId(null); setIsAddingEmployee(true); }} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs mb-6 shadow-lg flex items-center justify-center gap-2 transition-all">
                        <PlusCircle size={18} /> Ajouter un collaborateur
                     </button>
                     <div className="space-y-3">
                         {employees.map(emp => (
                             <div key={emp.id} className="p-4 border-2 border-gray-100 rounded-2xl flex justify-between items-center bg-white hover:border-gray-200 transition-colors">
                                 <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-black text-xs border border-gray-200 overflow-hidden shrink-0">
                                         {emp.photoUrl ? (
                                             <img 
                                                src={emp.photoUrl} 
                                                className="w-full h-full object-cover"
                                                style={{ objectPosition: emp.photoPosition || '50% 50%' }}
                                             />
                                         ) : emp.name.substring(0,2).toUpperCase()}
                                     </div>
                                     <div>
                                        <p className="font-bold text-gray-900">{emp.assignedName || emp.name}</p>
                                        <p className="text-xs text-gray-500 font-bold uppercase">{emp.role} • {emp.site}</p>
                                     </div>
                                 </div>
                                 <div className="flex gap-2">
                                     <button onClick={() => handleEditEmployee(emp)} className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"><Edit size={16}/></button>
                                     <button 
                                        onClick={() => handleToggleStatus(emp.id)} 
                                        className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider border ${emp.status === 'Actif' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                                     >
                                         {emp.status}
                                     </button>
                                 </div>
                             </div>
                         ))}
                     </div>
                   </>
                 ) : (
                   <div className="space-y-6">
                      
                      {/* Photo Upload & Positioning */}
                      <div className="flex flex-col items-center gap-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                           <div className="relative">
                               {/* Image Container */}
                               <div onClick={() => photoInputRef.current?.click()} className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform overflow-hidden relative z-10">
                                   {newEmployeePhotoPreview ? (
                                       <img 
                                        src={newEmployeePhotoPreview} 
                                        className="w-full h-full object-cover" 
                                        style={{ objectPosition: `${photoPos.x}% ${photoPos.y}%` }}
                                       />
                                   ) : (
                                       <Camera size={40} className="text-gray-300"/>
                                   )}
                                   <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                               </div>
                               
                               {/* Arrows Controls */}
                               {newEmployeePhotoPreview && (
                                   <div className="absolute inset-0 -m-8 flex items-center justify-center pointer-events-none">
                                       <button onClick={() => movePhoto('up')} className="absolute -top-1 pointer-events-auto p-1.5 bg-gray-900 text-white rounded-full shadow-md hover:bg-orange-500 transition-colors"><ArrowUp size={14}/></button>
                                       <button onClick={() => movePhoto('down')} className="absolute -bottom-1 pointer-events-auto p-1.5 bg-gray-900 text-white rounded-full shadow-md hover:bg-orange-500 transition-colors"><ArrowDown size={14}/></button>
                                       <button onClick={() => movePhoto('left')} className="absolute -left-1 pointer-events-auto p-1.5 bg-gray-900 text-white rounded-full shadow-md hover:bg-orange-500 transition-colors"><ArrowLeft size={14}/></button>
                                       <button onClick={() => movePhoto('right')} className="absolute -right-1 pointer-events-auto p-1.5 bg-gray-900 text-white rounded-full shadow-md hover:bg-orange-500 transition-colors"><ArrowRight size={14}/></button>
                                   </div>
                               )}
                           </div>
                           <div className="text-center">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Photo de profil</p>
                                {newEmployeePhotoPreview && <p className="text-[9px] text-orange-500 font-bold mt-1">Utilisez les flèches pour cadrer</p>}
                           </div>
                      </div>

                      {/* Champs Nom distincts */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom Complet (Administratif)</label>
                              <input type="text" placeholder="Ex: KOUASSI Jean-Pierre" className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all text-sm" value={employeeFormData.name} onChange={e => setEmployeeFormData({...employeeFormData, name: e.target.value})}/>
                          </div>

                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1 flex items-center gap-1"><Users size={12}/> Nom Assigné (Planning TV)</label>
                              <input type="text" placeholder="Ex: Jean K." className="w-full p-4 bg-orange-50 text-orange-900 rounded-2xl font-black outline-none border-2 border-orange-100 focus:border-orange-500 transition-all text-sm" value={employeeFormData.assignedName} onChange={e => setEmployeeFormData({...employeeFormData, assignedName: e.target.value})}/>
                              <p className="text-[9px] text-gray-400 font-bold ml-1">C'est ce nom qui apparaîtra dans les fiches missions.</p>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Poste</label>
                              <input type="text" placeholder="Ex: Technicien" className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" value={employeeFormData.role} onChange={e => setEmployeeFormData({...employeeFormData, role: e.target.value})}/>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Site</label>
                              <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all appearance-none" value={employeeFormData.site} onChange={e => setEmployeeFormData({...employeeFormData, site: e.target.value})}>
                                  <option value="Abidjan">Abidjan</option>
                                  <option value="Bouaké">Bouaké</option>
                                  <option value="Korhogo">Korhogo</option>
                              </select>
                          </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                         <button onClick={() => { setIsAddingEmployee(false); setEditingEmployeeId(null); }} disabled={isSaving} className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-500 font-black uppercase text-xs tracking-widest rounded-2xl transition-colors">Annuler</button>
                         <button onClick={handleSaveEmployee} disabled={isSaving} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg transition-colors flex items-center justify-center gap-2">
                            {isSaving && <Loader2 className="animate-spin" size={16} />} Enregistrer
                         </button>
                      </div>
                   </div>
                 )}
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;
