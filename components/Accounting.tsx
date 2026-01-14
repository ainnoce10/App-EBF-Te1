
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
  Trash2,
  Edit,
  MapPin,
  Briefcase,
  Calendar,
  User as UserIcon,
  ShieldCheck
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
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState<Employee | null>(null);

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

  const calculateSeniority = (dateString: string) => {
      if (!dateString) return "Inconnue";
      const start = new Date(dateString);
      const now = new Date();
      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      if (months < 0 || (months === 0 && now.getDate() < start.getDate())) {
          years--;
          months += 12;
      }
      if (years > 0) return `${years} an(s) ${months > 0 ? `et ${months} mois` : ''}`;
      if (months > 0) return `${months} mois`;
      return "Moins d'un mois";
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setNewEmployeePhoto(file);
        setNewEmployeePhotoPreview(URL.createObjectURL(file));
        setPhotoPos({ x: 50, y: 50 });
    }
  };

  const movePhoto = (direction: 'up' | 'down' | 'left' | 'right') => {
      setPhotoPos(prev => {
          const step = 5;
          switch(direction) {
              case 'up': return { ...prev, y: Math.max(0, prev.y - step) };
              case 'down': return { ...prev, y: Math.min(100, prev.y + step) };
              case 'left': return { ...prev, x: Math.max(0, prev.x - step) };
              case 'right': return { ...prev, x: Math.min(100, prev.x + step) };
              default: return prev;
          }
      });
  };

  const handleDeleteEmployee = async (e: React.MouseEvent, empId: string) => {
      e.stopPropagation();
      if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce collaborateur de la base de données ? Cette action est irréversible.")) return;
      
      try {
          const { error } = await supabase.from('employees').delete().eq('id', empId);
          if (error) throw error;
          setEmployees(prev => prev.filter(emp => emp.id !== empId));
      } catch (error: any) {
          alert("Erreur lors de la suppression : " + error.message);
      }
  };

  const handleEditEmployee = (e: React.MouseEvent, emp: Employee) => {
      e.stopPropagation();
      setEditingEmployeeId(emp.id);
      let civ = 'M', cleanName = emp.name;
      const parts = emp.name.split(' ');
      if (['M', 'Mme', 'Mlle'].includes(parts[0])) {
          civ = parts[0];
          cleanName = parts.slice(1).join(' ');
      }
      setEmployeeFormData({ 
          civility: civ, 
          name: cleanName, 
          assignedName: emp.assignedName || '', 
          role: emp.role, 
          domain: emp.domain || 'Polyvalent', 
          site: emp.site as string, 
          entryDate: emp.entryDate 
      });
      setNewEmployeePhotoPreview(emp.photoUrl || null);
      setNewEmployeePhoto(null);
      let x = 50, y = 50;
      if (emp.photoPosition) {
          const parts = emp.photoPosition.split(' ');
          if (parts.length === 2) {
              x = parseInt(parts[0]);
              y = parseInt(parts[1]);
          }
      }
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
        if (editingEmployeeId) await supabase.from('employees').update(payload).eq('id', editingEmployeeId);
        else await supabase.from('employees').insert([{ id: `EMP-${Date.now()}`, ...payload }]);
        
        setIsAddingEmployee(false);
        setEditingEmployeeId(null);
        setEmployeeFormData({ civility: 'M', name: '', assignedName: '', role: JOB_TITLES[5], domain: 'Polyvalent', site: 'Abidjan', entryDate: new Date().toISOString().split('T')[0] });
        setNewEmployeePhotoPreview(null);
    } catch (error: any) { alert("Erreur : " + error.message); } finally { setIsSaving(false); }
  };

  const totalRev = liveTransactions.filter(t => t.type === 'Recette').reduce((a, t) => a + t.amount, 0);
  const totalExp = liveTransactions.filter(t => t.type === 'Dépense').reduce((a, t) => a + t.amount, 0);

  return (
    <div className="space-y-6 relative pb-24">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Comptabilité & RH</h2>
          <p className="text-gray-500 font-bold text-sm">Gestion Structurelle & Sociale</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
        <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wide">
          <Users size={20} className="text-blue-500"/> Ressources Humaines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button onClick={() => { setShowPayrollModal(true); setPayrollStep(1); }} className="p-6 border-2 border-gray-100 rounded-3xl flex items-center gap-4 hover:bg-orange-50 transition-all group">
                <div className="bg-orange-100 p-4 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                <div className="text-left"><p className="font-black text-gray-900 text-lg">Générer Paie</p><p className="text-xs text-gray-500 font-bold">Bulletin, Calcul, Impression</p></div>
             </button>
             <button onClick={() => { setShowEmployeeModal(true); setIsAddingEmployee(false); }} className="p-6 border-2 border-gray-100 rounded-3xl flex items-center gap-4 hover:bg-blue-50 transition-all group">
                <div className="bg-blue-100 p-4 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform"><Users size={24} /></div>
                <div className="text-left"><p className="font-black text-gray-900 text-lg">Gestion Effectif</p><p className="text-xs text-gray-500 font-bold">Ajouter ou modifier des employés</p></div>
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Entrées Générales</p>
          <h3 className="text-3xl font-black text-gray-900">{totalRev.toLocaleString()} F</h3>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Charges Structure</p>
          <h3 className="text-3xl font-black text-gray-900">{totalExp.toLocaleString()} F</h3>
        </div>
        <div className="bg-gray-900 p-6 rounded-[2rem] shadow-lg text-white">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Solde Opérationnel</p>
          <h3 className={`text-3xl font-black ${totalRev - totalExp >= 0 ? 'text-white' : 'text-red-400'}`}>
            {(totalRev - totalExp).toLocaleString()} F
          </h3>
        </div>
      </div>

      {/* MODAL GESTION EFFECTIF */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up max-h-[90vh]">
             <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="text-2xl font-black text-gray-900">{isAddingEmployee ? 'Configuration Employé' : 'Effectif EBF Technical Center'}</h3>
                <button onClick={() => setShowEmployeeModal(false)} className="p-3 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"><X size={20}/></button>
             </div>
             <div className="p-8 overflow-y-auto bg-white flex-1 custom-scrollbar">
                 {!isAddingEmployee ? (
                   <>
                     <div className="flex justify-between items-center mb-6">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{employees.length} Collaborateurs enregistrés</p>
                        <button onClick={() => setIsAddingEmployee(true)} className="py-3 px-6 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all">
                          <PlusCircle size={18} /> Ajouter
                        </button>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {employees.map(emp => (
                             <div 
                                key={emp.id} 
                                onClick={() => setSelectedEmployeeDetails(emp)}
                                className="p-4 border-2 border-gray-50 rounded-3xl flex justify-between items-center hover:bg-gray-50 hover:border-blue-100 transition-all cursor-pointer group"
                             >
                                 <div className="flex items-center gap-4">
                                     <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0">
                                       {emp.photoUrl ? (
                                         <img src={emp.photoUrl} className="w-full h-full object-cover" style={{ objectPosition: emp.photoPosition }} />
                                       ) : (
                                         <UserIcon size={24} className="text-gray-300"/>
                                       )}
                                     </div>
                                     <div className="min-w-0">
                                       <p className="font-black text-gray-900 truncate uppercase text-sm tracking-tight">{emp.assignedName || emp.name}</p>
                                       <p className="text-[10px] text-gray-500 uppercase font-bold truncate">{emp.role}</p>
                                     </div>
                                 </div>
                                 <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                     <button onClick={(e) => handleEditEmployee(e, emp)} className="p-2.5 bg-white shadow-sm border border-gray-100 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Edit size={16}/></button>
                                     <button onClick={(e) => handleDeleteEmployee(e, emp.id)} className="p-2.5 bg-white shadow-sm border border-gray-100 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                                 </div>
                             </div>
                         ))}
                      </div>
                   </>
                 ) : (
                   <div className="space-y-6 max-w-2xl mx-auto">
                      <div className="flex flex-col items-center gap-4 bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                           <div className="relative">
                               <div 
                                  onClick={() => photoInputRef.current?.click()} 
                                  className="w-40 h-40 rounded-full bg-white border-4 border-white shadow-2xl flex items-center justify-center cursor-pointer overflow-hidden relative group"
                               >
                                  {newEmployeePhotoPreview ? (
                                    <img src={newEmployeePhotoPreview} className="w-full h-full object-cover" style={{ objectPosition: `${photoPos.x}% ${photoPos.y}%` }} />
                                  ) : (
                                    <div className="text-center">
                                      <Camera size={40} className="text-gray-200 mx-auto mb-2"/>
                                      <p className="text-[10px] font-black text-gray-400 uppercase">Photo</p>
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Edit size={24} className="text-white"/>
                                  </div>
                                  <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                               </div>
                               {newEmployeePhotoPreview && (
                                 <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                                     <button onClick={() => movePhoto('up')} className="p-2 bg-gray-900 text-white rounded-xl shadow-lg hover:scale-110 active:scale-90 transition-all"><ArrowUp size={16}/></button>
                                     <button onClick={() => movePhoto('down')} className="p-2 bg-gray-900 text-white rounded-xl shadow-lg hover:scale-110 active:scale-90 transition-all"><ArrowDown size={16}/></button>
                                 </div>
                               )}
                           </div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Ajustez la position du visage</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom complet (Civil)</label>
                              <div className="flex gap-2">
                                <select 
                                    className="p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500"
                                    value={employeeFormData.civility}
                                    onChange={e => setEmployeeFormData({...employeeFormData, civility: e.target.value})}
                                >
                                    <option value="M">M</option>
                                    <option value="Mme">Mme</option>
                                    <option value="Mlle">Mlle</option>
                                </select>
                                <input type="text" placeholder="Ex: Koffi Jean-Marc" className="flex-1 p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500" value={employeeFormData.name} onChange={e => setEmployeeFormData({...employeeFormData, name: e.target.value})}/>
                              </div>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1">Nom Assigné (Affichage TV)</label>
                              <input type="text" placeholder="Ex: Jean-Marc" className="w-full p-4 bg-orange-50 text-orange-900 rounded-2xl font-black outline-none border-2 border-orange-100 focus:border-orange-500" value={employeeFormData.assignedName} onChange={e => setEmployeeFormData({...employeeFormData, assignedName: e.target.value})}/>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fonction / Rôle</label>
                              <select value={employeeFormData.role} onChange={e => setEmployeeFormData({...employeeFormData, role: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500">{JOB_TITLES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Domaine d'Activité</label>
                              <select value={employeeFormData.domain} onChange={e => setEmployeeFormData({...employeeFormData, domain: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500">{ACTIVITY_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Site d'affectation</label>
                              <select value={employeeFormData.site} onChange={e => setEmployeeFormData({...employeeFormData, site: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500">
                                  <option value="Abidjan">📍 Abidjan</option>
                                  <option value="Bouaké">📍 Bouaké</option>
                                  <option value="Korhogo">📍 Korhogo</option>
                              </select>
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date d'embauche</label>
                              <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500" value={employeeFormData.entryDate} onChange={e => setEmployeeFormData({...employeeFormData, entryDate: e.target.value})}/>
                          </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                          <button onClick={() => setIsAddingEmployee(false)} className="flex-1 py-5 bg-gray-100 rounded-[1.5rem] font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors">Annuler</button>
                          <button onClick={handleSaveEmployee} disabled={isSaving} className="flex-1 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-all">
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18}/>}
                            {isSaving ? 'Traitement...' : 'Enregistrer'}
                          </button>
                      </div>
                   </div>
                 )}
             </div>
           </div>
        </div>
      )}

      {/* MODAL FICHE DÉTAILLÉE EMPLOYÉ */}
      {selectedEmployeeDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-scale-in border-b-[12px] border-blue-600">
              <div className="relative h-64 bg-gray-900 overflow-hidden">
                {selectedEmployeeDetails.photoUrl ? (
                  <img src={selectedEmployeeDetails.photoUrl} className="w-full h-full object-cover" style={{ objectPosition: selectedEmployeeDetails.photoPosition }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-950">
                    <UserIcon size={120} className="text-gray-800"/>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent"></div>
                <button 
                  onClick={() => setSelectedEmployeeDetails(null)}
                  className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all"
                >
                  <X size={20}/>
                </button>
                <div className="absolute bottom-8 left-8">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block shadow-lg ${selectedEmployeeDetails.status === 'Actif' ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                    {selectedEmployeeDetails.status}
                  </span>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none italic">{selectedEmployeeDetails.name}</h2>
                  <p className="text-blue-400 font-bold text-xs uppercase tracking-widest mt-2">{selectedEmployeeDetails.role}</p>
                </div>
              </div>

              <div className="p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                   <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center text-center group hover:bg-blue-50 transition-colors">
                      <div className="bg-white p-3 rounded-2xl text-blue-600 shadow-sm mb-3 group-hover:scale-110 transition-transform"><Briefcase size={20}/></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Domaine</p>
                      <p className="text-sm font-black text-gray-900 uppercase italic leading-tight">{selectedEmployeeDetails.domain || 'Polyvalent'}</p>
                   </div>
                   <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center text-center group hover:bg-orange-50 transition-colors">
                      <div className="bg-white p-3 rounded-2xl text-orange-600 shadow-sm mb-3 group-hover:scale-110 transition-transform"><MapPin size={20}/></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Affectation</p>
                      <p className="text-sm font-black text-gray-900 uppercase italic leading-tight">{selectedEmployeeDetails.site}</p>
                   </div>
                </div>

                <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white flex justify-between items-center relative overflow-hidden group">
                   <ShieldCheck size={80} className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform"/>
                   <div className="relative z-10">
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Ancienneté</p>
                      <h4 className="text-xl font-black text-blue-400 uppercase tracking-tighter italic">
                        {calculateSeniority(selectedEmployeeDetails.entryDate)}
                      </h4>
                   </div>
                   <div className="text-right relative z-10">
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Recruté le</p>
                      <p className="font-black text-sm italic">{new Date(selectedEmployeeDetails.entryDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                   </div>
                </div>

                <button 
                  onClick={() => setSelectedEmployeeDetails(null)}
                  className="w-full py-5 bg-gray-100 text-gray-500 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-gray-200 active:scale-95 transition-all"
                >
                  Fermer la fiche
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Accounting;
