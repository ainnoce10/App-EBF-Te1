
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
  Calendar,
  Printer,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface AccountingProps {
  liveTransactions?: Transaction[];
  liveEmployees?: Employee[];
}

// Liste stricte des postes selon le cahier des charges
const JOB_TITLES = [
  "Directeur général",
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
  "Froid & Climatisation",
  "Bâtiment & Travaux",
  "Électricité",
  "Plomberie",
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
      role: JOB_TITLES[5], // Default: Technicien polyvalent
      domain: ACTIVITY_DOMAINS[5],
      site: 'Abidjan', 
      entryDate: new Date().toISOString().split('T')[0] 
  });
  
  const [newEmployeePhoto, setNewEmployeePhoto] = useState<File | null>(null);
  const [newEmployeePhotoPreview, setNewEmployeePhotoPreview] = useState<string | null>(null);
  const [photoPos, setPhotoPos] = useState({ x: 50, y: 50 });
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (liveEmployees.length > 0) setEmployees(liveEmployees);
    else if (employees.length === 0) setEmployees(MOCK_EMPLOYEES);
  }, [liveEmployees, employees.length]);

  // Calcul Ancienneté
  const calculateSeniority = (dateString: string) => {
      if (!dateString) return "0 jour";
      const start = new Date(dateString);
      const now = new Date();
      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      if (months < 0 || (months === 0 && now.getDate() < start.getDate())) {
          years--;
          months += 12;
      }
      if (now.getDate() < start.getDate()) months--;
      if (years > 0) return `${years} an(s)${months > 0 ? ` et ${months} mois` : ''}`;
      if (months > 0) return `${months} mois`;
      return "Nouveau";
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setNewEmployeePhoto(file);
        setNewEmployeePhotoPreview(URL.createObjectURL(file));
        setPhotoPos({ x: 50, y: 50 });
    }
  };

  const handleSaveEmployee = async () => {
    if (!employeeFormData.name || !employeeFormData.assignedName) {
        alert("Champs obligatoires manquants.");
        return;
    }
    setIsSaving(true);
    try {
        let photoUrl = newEmployeePhotoPreview;
        if (newEmployeePhoto) {
            const fileName = `emp_${Date.now()}.${newEmployeePhoto.name.split('.').pop()}`;
            await supabase.storage.from('assets').upload(fileName, newEmployeePhoto);
            const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(fileName);
            photoUrl = publicUrl;
        }

        const fullName = `${employeeFormData.civility} ${employeeFormData.name}`.trim();
        const payload = { 
            name: fullName, 
            assignedName: employeeFormData.assignedName, 
            role: employeeFormData.role, 
            domain: employeeFormData.domain,
            site: employeeFormData.site, 
            status: 'Actif', 
            entryDate: employeeFormData.entryDate,
            photoUrl: photoUrl || undefined,
            photoPosition: `${photoPos.x}% ${photoPos.y}%`
        };

        if (editingEmployeeId) {
            await supabase.from('employees').update(payload).eq('id', editingEmployeeId);
        } else {
            const newId = `EMP-${Math.floor(Math.random() * 10000)}`;
            await supabase.from('employees').insert([{ id: newId, ...payload }]);
        }

        setIsAddingEmployee(false);
        setEditingEmployeeId(null);
    } catch (error: any) { 
        alert("Erreur: " + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  const accountingTransactions = liveTransactions;
  const totalRevenue = accountingTransactions.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = accountingTransactions.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="space-y-6 relative pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Comptabilité & RH</h2>
          <p className="text-gray-500 font-bold text-sm">Gestion des ressources</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6 md:p-8">
        <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wide">
            <Users size={20} className="text-blue-500"/> Ressources Humaines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button onClick={() => setShowPayrollModal(true)} className="p-6 border-2 border-gray-100 rounded-3xl flex items-center gap-4 hover:bg-orange-50 transition-all group">
                <div className="bg-orange-100 p-4 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                <div className="text-left">
                    <p className="font-black text-gray-900 text-lg">Générer Paie</p>
                    <p className="text-xs text-gray-500 font-bold">Bulletins et salaires</p>
                </div>
             </button>
             <button onClick={() => { setShowEmployeeModal(true); setIsAddingEmployee(false); }} className="p-6 border-2 border-gray-100 rounded-3xl flex items-center gap-4 hover:bg-blue-50 transition-all group">
                <div className="bg-blue-100 p-4 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform"><Users size={24} /></div>
                <div className="text-left">
                    <p className="font-black text-gray-900 text-lg">Gestion Effectif</p>
                    <p className="text-xs text-gray-500 font-bold">Liste et ajout d'employés</p>
                </div>
             </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Entrées Globales</p>
          <h3 className="text-3xl font-black text-gray-900">{totalRevenue.toLocaleString()} F</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Dépenses Globales</p>
          <h3 className="text-3xl font-black text-gray-900">{totalExpense.toLocaleString()} F</h3>
        </div>
        <div className="bg-gray-900 p-6 rounded-[2rem] shadow-lg text-white">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Solde Opérationnel</p>
          <h3 className="text-3xl font-black">{(totalRevenue - totalExpense).toLocaleString()} F</h3>
        </div>
      </div>

      {/* MODAL EMPLOYES */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up max-h-[90vh]">
             <div className="p-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <div>
                    <h3 className="text-2xl font-black text-gray-900">{isAddingEmployee ? 'Nouvelle Fiche Employé' : 'Effectif EBF'}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Registre du personnel</p>
                </div>
                <button onClick={() => setShowEmployeeModal(false)} className="p-3 bg-gray-100 rounded-full"><X size={20}/></button>
             </div>

             <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                 {!isAddingEmployee ? (
                   <>
                     <button onClick={() => setIsAddingEmployee(true)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs mb-6 shadow-lg flex items-center justify-center gap-2">
                        <PlusCircle size={18} /> Ajouter un collaborateur
                     </button>
                     <div className="space-y-3">
                         {employees.map(emp => (
                             <div key={emp.id} className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center bg-white">
                                 <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-black overflow-hidden border border-gray-200">
                                         {emp.photoUrl ? <img src={emp.photoUrl} className="w-full h-full object-cover" /> : emp.name[0]}
                                     </div>
                                     <div>
                                        <p className="font-bold text-gray-900">{emp.name}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">{emp.role} • {emp.site}</p>
                                     </div>
                                 </div>
                                 <span className="text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider bg-green-50 text-green-700">{emp.status}</span>
                             </div>
                         ))}
                     </div>
                   </>
                 ) : (
                   <div className="space-y-6">
                      <div className="flex flex-col items-center gap-4 bg-gray-50 p-6 rounded-3xl">
                           <div onClick={() => photoInputRef.current?.click()} className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-xl flex items-center justify-center cursor-pointer overflow-hidden">
                               {newEmployeePhotoPreview ? <img src={newEmployeePhotoPreview} className="w-full h-full object-cover" /> : <Camera size={32} className="text-gray-300"/>}
                               <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                           </div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Photo de profil</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nom Complet (Administratif)</label>
                              <div className="flex gap-2">
                                  <select value={employeeFormData.civility} onChange={e => setEmployeeFormData({...employeeFormData, civility: e.target.value})} className="bg-gray-100 rounded-xl font-bold px-2">
                                      <option value="M">M</option><option value="Mme">Mme</option><option value="Mlle">Mlle</option>
                                  </select>
                                  <input type="text" placeholder="Ex: KOFFI Jean" className="w-full p-4 bg-gray-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 text-sm" value={employeeFormData.name} onChange={e => setEmployeeFormData({...employeeFormData, name: e.target.value})}/>
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Nom Assigné (TV/Planning)</label>
                              <input type="text" placeholder="Ex: Jean K." className="w-full p-4 bg-gray-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 text-sm" value={employeeFormData.assignedName} onChange={e => setEmployeeFormData({...employeeFormData, assignedName: e.target.value})}/>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Poste Occupé</label>
                              <select value={employeeFormData.role} onChange={e => setEmployeeFormData({...employeeFormData, role: e.target.value})} className="w-full p-4 bg-gray-100 rounded-2xl font-bold outline-none appearance-none">
                                  {JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Domaine d'activité</label>
                              <select value={employeeFormData.domain} onChange={e => setEmployeeFormData({...employeeFormData, domain: e.target.value})} className="w-full p-4 bg-gray-100 rounded-2xl font-bold outline-none appearance-none">
                                  {ACTIVITY_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Date d'entrée</label>
                              <div className="relative">
                                  <input type="date" className="w-full p-4 bg-gray-100 rounded-2xl font-bold outline-none" value={employeeFormData.entryDate} onChange={e => setEmployeeFormData({...employeeFormData, entryDate: e.target.value})}/>
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                                      <Clock size={12}/> Ancienneté: {calculateSeniority(employeeFormData.entryDate)}
                                  </div>
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Site</label>
                              <select className="w-full p-4 bg-gray-100 rounded-2xl font-bold outline-none" value={employeeFormData.site} onChange={e => setEmployeeFormData({...employeeFormData, site: e.target.value})}>
                                  <option value="Abidjan">Abidjan</option><option value="Bouaké">Bouaké</option><option value="Korhogo">Korhogo</option>
                              </select>
                          </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                         <button onClick={() => setIsAddingEmployee(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl">Annuler</button>
                         <button onClick={handleSaveEmployee} disabled={isSaving} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2">
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
