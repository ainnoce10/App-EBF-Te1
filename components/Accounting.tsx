
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_EMPLOYEES } from '../constants';
import { Transaction, Employee, Site } from '../types';
import { supabase } from '../lib/supabase';
import { 
  FileText, 
  Users, 
  X, 
  Loader2,
  PlusCircle,
  DollarSign,
  Camera,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Printer,
  CheckCircle2,
  Clock,
  Edit
} from 'lucide-react';

interface AccountingProps {
  liveTransactions?: Transaction[];
  liveEmployees?: Employee[];
}

const JOB_TITLES = [
  "Directeur Général",
  "Technicien en froid",
  "Technicien en bâtiment",
  "Technicien en électricité",
  "Technicien en plomberie",
  "Technicien polyvalent",
  "Responsable technique électricité",
  "Responsable technique bâtiment",
  "Responsable technique froid",
  "Responsable technique plomberie",
  "Responsable technique polyvalent"
];

const ACTIVITY_DOMAINS = [
  "Administration",
  "Électricité",
  "Plomberie",
  "Froid",
  "Bâtiment",
  "Polyvalent"
];

const Accounting: React.FC<AccountingProps> = ({ liveTransactions = [], liveEmployees = [] }) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [employeeFormData, setEmployeeFormData] = useState({ 
      civility: 'M',
      name: '', 
      assignedName: '', 
      role: JOB_TITLES[5],
      domain: 'Polyvalent',
      site: 'Abidjan', 
      entryDate: new Date().toISOString().split('T')[0] 
  });
  
  const [newEmployeePhoto, setNewEmployeePhoto] = useState<File | null>(null);
  const [newEmployeePhotoPreview, setNewEmployeePhotoPreview] = useState<string | null>(null);
  const [photoPos, setPhotoPos] = useState({ x: 50, y: 50 });
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [transactionType, setTransactionType] = useState<'Recette' | 'Dépense'>('Recette');
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    category: '',
    description: '',
    site: 'Abidjan' as Site,
    date: new Date().toISOString().split('T')[0]
  });

  const [payrollStep, setPayrollStep] = useState<1 | 2>(1);
  const [selectedEmployeeForPay, setSelectedEmployeeForPay] = useState<Employee | null>(null);
  const [payrollForm, setPayrollForm] = useState({
      period: new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' }),
      baseSalary: 0,
      transport: 0,
      housing: 0,
      overtime: 0,
      bonus: 0,
      advance: 0,
      cnps: 0,
      tax: 0
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (liveEmployees.length > 0) setEmployees(liveEmployees);
    else if (employees.length === 0) setEmployees(MOCK_EMPLOYEES);
  }, [liveEmployees, employees.length]);

  const openTransactionModal = (type: 'Recette' | 'Dépense') => {
    setTransactionType(type);
    setNewTransaction({
        amount: '',
        category: type === 'Recette' ? 'Virement Bancaire' : 'Charges',
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
        const { error } = await supabase.from('accounting_transactions').insert([trx]);
        if (error) throw error;
        setShowTransactionModal(false);
    } catch (error: any) { alert("Erreur : " + error.message); } finally { setIsSaving(false); }
  };

  const calculateSeniority = (dateString: string) => {
      if (!dateString) return "0 jour";
      const start = new Date(dateString);
      const now = new Date();
      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      if (months < 0 || (months === 0 && now.getDate() < start.getDate())) { years--; months += 12; }
      if (now.getDate() < start.getDate()) months--;
      if (years > 0) return `${years} an(s)${months > 0 ? ` et ${months} mois` : ''}`;
      if (months > 0) return `${months} mois`;
      return "Moins d'un mois";
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setNewEmployeePhoto(file); setNewEmployeePhotoPreview(URL.createObjectURL(file)); setPhotoPos({ x: 50, y: 50 }); }
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
    } catch { setEmployees(employees.map(e => e.id === empId ? { ...e, status: emp.status } : e)); }
  };

  const handleEditEmployee = (emp: Employee) => {
      setEditingEmployeeId(emp.id);
      let civ = 'M', cleanName = emp.name;
      const parts = emp.name.split(' ');
      if (['M', 'Mme', 'Mlle'].includes(parts[0])) { civ = parts[0]; cleanName = parts.slice(1).join(' '); }
      setEmployeeFormData({ civility: civ, name: cleanName, assignedName: emp.assignedName || '', role: emp.role, domain: emp.domain || 'Polyvalent', site: emp.site as string, entryDate: emp.entryDate });
      setNewEmployeePhotoPreview(emp.photoUrl || null);
      setNewEmployeePhoto(null);
      let x = 50, y = 50;
      if (emp.photoPosition) { const parts = emp.photoPosition.split(' '); if (parts.length === 2) { x = parseInt(parts[0]); y = parseInt(parts[1]); } }
      setPhotoPos({ x, y });
      setIsAddingEmployee(true);
  };

  const handleSaveEmployee = async () => {
    if (!employeeFormData.name || !employeeFormData.assignedName) return alert("Nom complet et nom assigné requis.");
    setIsSaving(true);
    try {
        let photoUrl = newEmployeePhotoPreview;
        if (newEmployeePhoto) {
            const fileName = `emp_${Date.now()}.${newEmployeePhoto.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage.from('assets').upload(fileName, newEmployeePhoto);
            if (uploadError) throw uploadError;
            photoUrl = supabase.storage.from('assets').getPublicUrl(fileName).data.publicUrl;
        }
        const fullName = `${employeeFormData.civility} ${employeeFormData.name}`.trim();
        const payload = { name: fullName, assignedName: employeeFormData.assignedName, role: employeeFormData.role, domain: employeeFormData.domain, site: employeeFormData.site, status: 'Actif', entryDate: employeeFormData.entryDate, photoUrl: photoUrl || undefined, photoPosition: `${photoPos.x}% ${photoPos.y}%` };
        if (editingEmployeeId) await supabase.from('employees').update(payload).eq('id', editingEmployeeId);
        else await supabase.from('employees').insert([{ id: `EMP-${Date.now()}`, ...payload }]);
        setIsAddingEmployee(false);
        setEditingEmployeeId(null);
        setEmployeeFormData({ civility: 'M', name: '', assignedName: '', role: JOB_TITLES[5], domain: 'Polyvalent', site: 'Abidjan', entryDate: new Date().toISOString().split('T')[0] });
        setNewEmployeePhotoPreview(null);
    } catch (error: any) { alert("Erreur : " + error.message); } finally { setIsSaving(false); }
  };

  const calculatePayroll = () => {
      const gross = (payrollForm.baseSalary || 0) + (payrollForm.transport || 0) + (payrollForm.housing || 0) + (payrollForm.overtime || 0) + (payrollForm.bonus || 0);
      const deductions = (payrollForm.advance || 0) + (payrollForm.cnps || 0) + (payrollForm.tax || 0);
      return { grossSalary: gross, totalDeductions: deductions, netSalary: gross - deductions };
  };

  const handleGenerateAndSavePayslip = async () => {
    if (!selectedEmployeeForPay) return;
    setIsGenerating(true);
    const { netSalary } = calculatePayroll();
    try {
        await supabase.from('accounting_transactions').insert([{ id: `TRX-PAY-${Date.now()}`, type: 'Dépense', amount: netSalary, category: 'Salaire', description: `Paie ${payrollForm.period} - ${selectedEmployeeForPay.name}`, site: selectedEmployeeForPay.site, date: new Date().toISOString().split('T')[0] }]);
        window.print();
        setShowPayrollModal(false);
        setPayrollStep(1);
    } catch (err: any) { alert("Erreur : " + err.message); } finally { setIsGenerating(false); }
  };

  const displayedTransactions = showAllTransactions ? liveTransactions : liveTransactions.slice(0, 5);
  const totalRev = liveTransactions.filter(t => t.type === 'Recette').reduce((a, t) => a + t.amount, 0);
  const totalExp = liveTransactions.filter(t => t.type === 'Dépense').reduce((a, t) => a + t.amount, 0);

  return (
    <div className="space-y-6 relative pb-24">
       <div className="flex justify-between items-center">
        <div><h2 className="text-3xl font-black text-gray-900 tracking-tight">Comptabilité & RH</h2><p className="text-gray-500 font-bold text-sm">Gestion Structurelle & Sociale</p></div>
      </div>
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
        <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wide"><Users size={20} className="text-blue-500"/> Ressources Humaines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button onClick={() => { setShowPayrollModal(true); setPayrollStep(1); }} className="p-6 border-2 border-gray-100 rounded-3xl flex items-center gap-4 hover:bg-orange-50 transition-all">
                <div className="bg-orange-100 p-4 rounded-2xl text-orange-600"><FileText size={24} /></div>
                <div className="text-left"><p className="font-black text-gray-900 text-lg">Générer Paie</p><p className="text-xs text-gray-500 font-bold">Bulletin, Calcul, Impression</p></div>
             </button>
             <button onClick={() => { setShowEmployeeModal(true); setIsAddingEmployee(false); }} className="p-6 border-2 border-gray-100 rounded-3xl flex items-center gap-4 hover:bg-blue-50 transition-all">
                <div className="bg-blue-100 p-4 rounded-2xl text-blue-600"><Users size={24} /></div>
                <div className="text-left"><p className="font-black text-gray-900 text-lg">Gestion Effectif</p><p className="text-xs text-gray-500 font-bold">Ajouter ou modifier des employés</p></div>
             </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100"><p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Entrées Générales</p><h3 className="text-3xl font-black text-gray-900">{totalRev.toLocaleString()} F</h3></div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100"><p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Charges Structure</p><h3 className="text-3xl font-black text-gray-900">{totalExp.toLocaleString()} F</h3></div>
        <div className="bg-gray-900 p-6 rounded-[2rem] shadow-lg text-white"><p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Solde Opérationnel</p><h3 className={`text-3xl font-black ${totalRev - totalExp >= 0 ? 'text-white' : 'text-red-400'}`}>{(totalRev - totalExp).toLocaleString()} F</h3></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => openTransactionModal('Recette')} className="p-5 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center gap-4 hover:bg-green-100 transition-all">
              <div className="bg-green-500 text-white p-3 rounded-xl"><PlusCircle size={24} /></div>
              <div className="text-left"><h4 className="font-black text-green-900 uppercase text-sm">Virement / Apport</h4><p className="text-green-600 text-xs font-bold">Injecter fonds</p></div>
          </button>
          <button onClick={() => openTransactionModal('Dépense')} className="p-5 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-4 hover:bg-red-100 transition-all">
              <div className="bg-red-500 text-white p-3 rounded-xl"><DollarSign size={24} /></div>
              <div className="text-left"><h4 className="font-black text-red-900 uppercase text-sm">Payer Charge</h4><p className="text-red-600 text-xs font-bold">Loyer, Salaire, Facture</p></div>
          </button>
      </div>
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
          <h3 className="font-black text-gray-800 text-sm uppercase">Journal Général</h3>
          <button onClick={() => setShowAllTransactions(!showAllTransactions)} className="text-orange-600 text-[10px] font-black uppercase">{showAllTransactions ? 'Réduire' : 'Voir tout'}</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[700px]">
            <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase"><tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Libellé</th><th className="px-6 py-4 text-right">Montant</th><th className="px-6 py-4 text-center">Flux</th></tr></thead>
            <tbody className="divide-y text-sm">{displayedTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{new Date(trx.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold">{trx.description}</td>
                  <td className="px-6 py-4 font-black text-right">{trx.amount.toLocaleString()} F</td>
                  <td className="px-6 py-4 text-center">{trx.type === 'Recette' ? <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-[10px] font-black">ENTRÉE</span> : <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-[10px] font-black">SORTIE</span>}</td>
                </tr>
              ))}</tbody>
          </table>
        </div>
      </div>
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-scale-in">
                <div className="flex justify-between items-center mb-8">
                    <h3 className={`text-2xl font-black uppercase ${transactionType === 'Recette' ? 'text-green-600' : 'text-red-600'}`}>{transactionType === 'Recette' ? 'Apport' : 'Charge'}</h3>
                    <button onClick={() => setShowTransactionModal(false)} className="p-3 bg-gray-100 rounded-full"><X size={20}/></button>
                </div>
                <div className="space-y-6">
                    <input type="number" placeholder="0" className="w-full p-4 rounded-2xl font-black text-3xl outline-none bg-gray-50 border-2" value={newTransaction.amount} onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}/>
                    <input type="text" placeholder="Description" className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={newTransaction.description} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}/>
                    <button onClick={handleSaveTransaction} disabled={isSaving} className={`w-full py-5 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl transition-all ${transactionType === 'Recette' ? 'bg-green-600' : 'bg-red-600'}`}>{isSaving ? <Loader2 className="animate-spin"/> : 'Valider'}</button>
                </div>
            </div>
        </div>
      )}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
             <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="text-2xl font-black text-gray-900">{isAddingEmployee ? 'Nouvel Employé' : 'Effectif EBF'}</h3>
                <button onClick={() => setShowEmployeeModal(false)} className="p-3 bg-gray-100 rounded-full"><X size={20}/></button>
             </div>
             <div className="p-8 overflow-y-auto bg-white">
                 {!isAddingEmployee ? (
                   <>
                     <button onClick={() => setIsAddingEmployee(true)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs mb-6 flex items-center justify-center gap-2"><PlusCircle size={18} /> Ajouter un collaborateur</button>
                     <div className="space-y-3">{employees.map(emp => (
                             <div key={emp.id} className="p-4 border-2 rounded-2xl flex justify-between items-center hover:bg-gray-50">
                                 <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border overflow-hidden">{emp.photoUrl ? <img src={emp.photoUrl} className="w-full h-full object-cover" style={{ objectPosition: emp.photoPosition }} /> : emp.name.substring(0,2).toUpperCase()}</div>
                                     <div><p className="font-bold">{emp.assignedName || emp.name}</p><p className="text-xs text-gray-500 uppercase">{emp.role} • {emp.site}</p></div>
                                 </div>
                                 <div className="flex gap-2">
                                     <button onClick={() => handleEditEmployee(emp)} className="p-2 bg-gray-100 rounded-lg"><Edit size={16}/></button>
                                     <button onClick={() => handleToggleStatus(emp.id)} className={`text-[10px] font-black px-3 py-1.5 rounded-lg border ${emp.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{emp.status}</button>
                                 </div>
                             </div>
                         ))}</div>
                   </>
                 ) : (
                   <div className="space-y-6">
                      <div className="flex flex-col items-center gap-4 bg-gray-50 p-6 rounded-3xl">
                           <div className="relative">
                               <div onClick={() => photoInputRef.current?.click()} className="w-32 h-32 rounded-full bg-white border-4 shadow-xl flex items-center justify-center cursor-pointer overflow-hidden">{newEmployeePhotoPreview ? <img src={newEmployeePhotoPreview} className="w-full h-full object-cover" style={{ objectPosition: `${photoPos.x}% ${photoPos.y}%` }} /> : <Camera size={40} className="text-gray-300"/>}<input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} /></div>
                               {newEmployeePhotoPreview && (<div className="absolute inset-0 -m-8 flex items-center justify-center pointer-events-none"><button onClick={() => movePhoto('up')} className="absolute -top-1 pointer-events-auto p-1.5 bg-gray-900 text-white rounded-full"><ArrowUp size={14}/></button><button onClick={() => movePhoto('down')} className="absolute -bottom-1 pointer-events-auto p-1.5 bg-gray-900 text-white rounded-full"><ArrowDown size={14}/></button><button onClick={() => movePhoto('left')} className="absolute -left-1 pointer-events-auto p-1.5 bg-gray-900 text-white rounded-full"><ArrowLeft size={14}/></button><button onClick={() => movePhoto('right')} className="absolute -right-1 pointer-events-auto p-1.5 bg-gray-900 text-white rounded-full"><ArrowRight size={14}/></button></div>)}
                           </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="Nom Complet" className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={employeeFormData.name} onChange={e => setEmployeeFormData({...employeeFormData, name: e.target.value})}/>
                          <input type="text" placeholder="Nom Assigné" className="w-full p-4 bg-orange-50 text-orange-900 rounded-2xl font-black" value={employeeFormData.assignedName} onChange={e => setEmployeeFormData({...employeeFormData, assignedName: e.target.value})}/>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <select value={employeeFormData.role} onChange={e => setEmployeeFormData({...employeeFormData, role: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold">{JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                          <select value={employeeFormData.domain} onChange={e => setEmployeeFormData({...employeeFormData, domain: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold">{ACTIVITY_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                      </div>
                      <div className="flex gap-4"><button onClick={() => setIsAddingEmployee(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs">Annuler</button><button onClick={handleSaveEmployee} disabled={isSaving} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-2">{isSaving && <Loader2 className="animate-spin" />} Enregistrer</button></div>
                   </div>
                 )}
             </div>
           </div>
        </div>
      )}
      {showPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-8 bg-orange-50 border-b flex justify-between items-center">
                <h3 className="font-black text-gray-900 text-2xl uppercase">Générateur de Paie</h3>
                <button onClick={() => setShowPayrollModal(false)} className="p-3 bg-white rounded-full text-gray-400 hover:text-red-500"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">{payrollStep === 1 ? (
                   <div className="space-y-8">
                       <div className="grid grid-cols-2 gap-6">
                           <input type="text" className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={payrollForm.period} onChange={(e) => setPayrollForm({...payrollForm, period: e.target.value})}/>
                           <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={selectedEmployeeForPay?.id || ''} onChange={(e) => setSelectedEmployeeForPay(employees.find(emp => emp.id === e.target.value) || null)}><option value="">Sélectionner...</option>{employees.filter(e => e.status === 'Actif').map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}</select>
                       </div>
                       <div className="grid grid-cols-2 gap-8">
                           <div className="bg-green-50 p-6 rounded-3xl space-y-3"><input type="number" className="w-full p-3 rounded-xl" placeholder="Salaire Base" value={payrollForm.baseSalary} onChange={(e) => setPayrollForm({...payrollForm, baseSalary: parseInt(e.target.value) || 0})} /><input type="number" className="w-full p-3 rounded-xl" placeholder="Transport" value={payrollForm.transport} onChange={(e) => setPayrollForm({...payrollForm, transport: parseInt(e.target.value) || 0})} /></div>
                           <div className="bg-red-50 p-6 rounded-3xl space-y-3"><input type="number" className="w-full p-3 rounded-xl" placeholder="Acompte" value={payrollForm.advance} onChange={(e) => setPayrollForm({...payrollForm, advance: parseInt(e.target.value) || 0})} /><input type="number" className="w-full p-3 rounded-xl" placeholder="CNPS" value={payrollForm.cnps} onChange={(e) => setPayrollForm({...payrollForm, cnps: parseInt(e.target.value) || 0})} /></div>
                       </div>
                   </div>
               ) : (<div className="flex flex-col items-center py-8"><CheckCircle2 size={64} className="text-green-500 mb-6" /><h3 className="text-2xl font-black mb-8">Net à Payer : {calculatePayroll().netSalary.toLocaleString()} F</h3></div>)}</div>
            <div className="p-8 border-t bg-gray-50 flex justify-between items-center">{payrollStep === 1 ? <button disabled={!selectedEmployeeForPay} onClick={() => setPayrollStep(2)} className="ml-auto bg-gray-900 text-white px-8 py-3 rounded-xl font-black uppercase text-xs">Suivant</button> : <button onClick={handleGenerateAndSavePayslip} disabled={isGenerating} className="ml-auto bg-orange-600 text-white px-8 py-4 rounded-xl font-black uppercase text-xs flex items-center gap-2">{isGenerating ? <Loader2 className="animate-spin" /> : <Printer size={18}/>} Imprimer</button>}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;
