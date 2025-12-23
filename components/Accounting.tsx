import React, { useState, useEffect } from 'react';
import { MOCK_EMPLOYEES } from '../constants';
import { Transaction, Employee } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Download, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  Printer, 
  Users, 
  CheckCircle,
  X, 
  Loader2,
  Calendar,
  Briefcase,
  Clock,
  Plus,
  ArrowLeft,
  Save,
  MapPin
} from 'lucide-react';

interface AccountingProps {
  liveTransactions?: Transaction[];
  liveEmployees?: Employee[];
}

const Accounting: React.FC<AccountingProps> = ({ liveTransactions = [], liveEmployees = [] }) => {
  // --- STATES ---
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  
  // RH States
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    // Priorité aux données live, sinon mock si vide au premier rendu
    if (liveEmployees.length > 0) {
      setEmployees(liveEmployees);
    } else if (employees.length === 0) {
        // Optionnel: garder vide ou charger MOCK_EMPLOYEES si on veut une démo sans backend
        setEmployees(MOCK_EMPLOYEES);
    }
  }, [liveEmployees]);
  
  // New Employee State
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployeeData, setNewEmployeeData] = useState({
    name: '',
    role: '',
    site: 'Abidjan',
    entryDate: new Date().toISOString().split('T')[0]
  });
  
  // Payroll Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [payrollMonth, setPayrollMonth] = useState('Octobre');

  // --- HANDLERS ---

  const handleExport = (type: 'PDF' | 'Excel') => {
    // Simulation d'export
    const msg = type === 'PDF' ? "Génération du rapport PDF..." : "Préparation du fichier Excel...";
    alert(msg + "\n(Le téléchargement démarrerait ici dans une version connectée)");
  };

  const handleToggleStatus = async (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    const newStatus = emp.status === 'Actif' ? 'Congés' : 'Actif';
    
    // Optimistic update
    setEmployees(employees.map(e => e.id === empId ? { ...e, status: newStatus } : e));

    // Update Supabase
    const { error } = await supabase.from('employees').update({ status: newStatus }).eq('id', empId);
    
    if (error) {
        console.error("Erreur mise à jour statut", error);
        alert("Erreur lors de la mise à jour du statut");
        // Rollback
        setEmployees(employees.map(e => e.id === empId ? { ...e, status: emp.status } : e));
    }
  };

  const handleSaveEmployee = async () => {
    if (!newEmployeeData.name || !newEmployeeData.role) {
      alert("Veuillez remplir le nom et le poste de l'employé.");
      return;
    }

    const newEmp: Employee = {
      id: `EMP-${Math.floor(Math.random() * 10000).toString().padStart(3, '0')}`,
      name: newEmployeeData.name,
      role: newEmployeeData.role,
      site: newEmployeeData.site,
      status: 'Actif',
      entryDate: newEmployeeData.entryDate
    };

    const { error } = await supabase.from('employees').insert([newEmp]);

    if (!error) {
        setIsAddingEmployee(false);
        setNewEmployeeData({
        name: '',
        role: '',
        site: 'Abidjan',
        entryDate: new Date().toISOString().split('T')[0]
        });
    } else {
        alert("Erreur lors de l'enregistrement");
        console.error(error);
    }
  };

  const handleGeneratePaie = () => {
    setIsGenerating(true);
    // Simulation d'un traitement serveur (2 secondes)
    setTimeout(() => {
      setIsGenerating(false);
      setShowPayrollModal(false);
      alert(`Les fiches de paie pour ${payrollMonth} ont été générées et envoyées par email.`);
    }, 2000);
  };

  const calculateSeniority = (entryDate: string) => {
    const start = new Date(entryDate);
    const now = new Date();
    
    // Calcul simple en mois
    const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    
    if (totalMonths < 0) return "Nouveau"; // Cas de date future (rare)

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    if (years > 0) {
      return `${years} an${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mois` : ''}`;
    }
    return `${months} mois`;
  };

  // Filtrage visuel des transactions (limité ou complet)
  const displayedTransactions = showAllTransactions 
    ? liveTransactions 
    : liveTransactions.slice(0, 5);

  const totalRevenue = liveTransactions.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = liveTransactions.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);
  const netMargin = totalRevenue - totalExpense;
  const marginPercent = totalRevenue > 0 ? ((netMargin / totalRevenue) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6 relative">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Comptabilité & RH</h2>
          <p className="text-gray-500">Analyse financière et gestion des salaires</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => handleExport('PDF')}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Printer size={18} />
            Rapport PDF
          </button>
          <button 
            onClick={() => handleExport('Excel')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <p className="text-gray-500 text-sm font-medium">Recettes Totales</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalRevenue.toLocaleString()} FCFA</h3>
          <p className="text-green-600 text-xs flex items-center gap-1 mt-2">
            <ArrowUpRight size={14} /> Global
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
          <p className="text-gray-500 text-sm font-medium">Dépenses Totales</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalExpense.toLocaleString()} FCFA</h3>
          <p className="text-red-500 text-xs flex items-center gap-1 mt-2">
            <ArrowDownRight size={14} /> Global
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
          <p className="text-gray-500 text-sm font-medium">Marge Nette</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{netMargin.toLocaleString()} FCFA</h3>
          <p className="text-orange-500 text-xs flex items-center gap-1 mt-2">
            Marge: {marginPercent}%
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Dernières Opérations</h3>
          <button 
            onClick={() => setShowAllTransactions(!showAllTransactions)}
            className="text-orange-600 text-sm font-medium hover:underline"
          >
            {showAllTransactions ? 'Réduire la liste' : 'Voir tout'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Catégorie</th>
                <th className="px-6 py-4 font-medium">Site</th>
                <th className="px-6 py-4 font-medium text-right">Montant</th>
                <th className="px-6 py-4 font-medium text-center">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedTransactions.length > 0 ? displayedTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{trx.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{trx.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{trx.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{trx.site}</td>
                  <td className="px-6 py-4 text-sm font-bold text-right text-gray-800">
                    {trx.amount.toLocaleString()} FCFA
                  </td>
                  <td className="px-6 py-4 text-center">
                    {trx.type === 'Recette' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <ArrowUpRight size={12} className="mr-1" /> Entrée
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <ArrowDownRight size={12} className="mr-1" /> Sortie
                      </span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Aucune transaction enregistrée</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Payroll Section (Visual only) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4">Gestion Paie & RH</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button 
               onClick={() => setShowPayrollModal(true)}
               className="p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-50 group transition-colors"
             >
                <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-lg text-orange-600 group-hover:bg-orange-200">
                        <FileText size={20} />
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-gray-800">Générer Fiches de Paie</p>
                        <p className="text-xs text-gray-500">Lancer la paie mensuelle</p>
                    </div>
                </div>
                <ArrowUpRight size={18} className="text-gray-400" />
             </button>
             <button 
               onClick={() => {
                 setShowEmployeeModal(true);
                 setIsAddingEmployee(false);
               }}
               className="p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-50 group transition-colors"
             >
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-200">
                        <Users size={20} />
                    </div>
                    <div className="text-left">
                        <p className="font-semibold text-gray-800">Liste Employés</p>
                        <p className="text-xs text-gray-500">Gérer congés et absences</p>
                    </div>
                </div>
                <ArrowUpRight size={18} className="text-gray-400" />
             </button>
        </div>
      </div>

      {/* --- MODAL: GENERATION PAIE --- */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                   <FileText className="text-orange-600"/> Paie Mensuelle
                </h3>
                <button onClick={() => setShowPayrollModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-4">
               <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                   <div className="mt-1"><CheckCircle size={16} className="text-blue-600"/></div>
                   <div>
                       <p className="text-sm font-bold text-blue-800">Prêt à générer</p>
                       <p className="text-xs text-blue-600 mt-1">Tous les pointages du mois ont été validés.</p>
                   </div>
               </div>

               <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Mois de référence</label>
                   <select 
                     value={payrollMonth}
                     onChange={(e) => setPayrollMonth(e.target.value)}
                     className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                   >
                       <option value="Septembre">Septembre 2023</option>
                       <option value="Octobre">Octobre 2023</option>
                       <option value="Novembre">Novembre 2023</option>
                   </select>
               </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button 
                  onClick={() => setShowPayrollModal(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={isGenerating}
                >
                    Annuler
                </button>
                <button 
                   onClick={handleGeneratePaie}
                   disabled={isGenerating}
                   className="px-6 py-2 bg-orange-600 text-white font-bold rounded-lg shadow-sm hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                   {isGenerating ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle size={18}/>}
                   {isGenerating ? 'Traitement...' : 'Générer & Envoyer'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: GESTION EMPLOYES --- */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50">
                <div className="flex items-center gap-3">
                  {isAddingEmployee && (
                    <button 
                      onClick={() => setIsAddingEmployee(false)}
                      className="p-1 rounded-full hover:bg-blue-100 text-blue-700"
                    >
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                     <Users className="text-blue-600"/> 
                     {isAddingEmployee ? 'Nouvel Employé' : 'Effectif & RH'}
                  </h3>
                </div>
                <button onClick={() => setShowEmployeeModal(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-600 shadow-sm"><X size={20}/></button>
             </div>

             <div className="p-6 flex-1 overflow-y-auto">
                 {!isAddingEmployee ? (
                   <>
                     <div className="mb-4 flex items-center justify-between">
                         <p className="text-sm text-gray-500">Effectif total: <strong className="text-gray-800">{employees.length} collaborateurs</strong></p>
                         <button 
                           onClick={() => setIsAddingEmployee(true)}
                           className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm transition-colors"
                         >
                             <Plus size={14} /> Nouvel Employé
                         </button>
                     </div>

                     <div className="border border-gray-200 rounded-lg overflow-hidden">
                         <table className="w-full text-left text-sm">
                             <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                                 <tr>
                                     <th className="px-4 py-3 font-medium">Nom</th>
                                     <th className="px-4 py-3 font-medium">Rôle</th>
                                     <th className="px-4 py-3 font-medium">Site</th>
                                     <th className="px-4 py-3 font-medium text-center">Statut</th>
                                     <th className="px-4 py-3 font-medium">Ancienneté</th>
                                     <th className="px-4 py-3 font-medium text-right">Action</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-50">
                                 {employees.map(emp => (
                                     <tr key={emp.id} className="hover:bg-gray-50">
                                         <td className="px-4 py-3 font-bold text-gray-800">{emp.name}</td>
                                         <td className="px-4 py-3 text-gray-600">
                                             <div className="flex items-center gap-1.5">
                                                 <Briefcase size={12} className="text-gray-400"/>
                                                 {emp.role}
                                             </div>
                                         </td>
                                         <td className="px-4 py-3 text-gray-600">{emp.site}</td>
                                         <td className="px-4 py-3 text-center">
                                             {emp.status === 'Actif' ? (
                                                 <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                                                     <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Actif
                                                 </span>
                                             ) : (
                                                 <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                                                     <Calendar size={10}/> Congés
                                                 </span>
                                             )}
                                         </td>
                                         <td className="px-4 py-3 text-gray-600 font-medium">
                                            <div className="flex items-center gap-1.5 text-xs bg-gray-100 px-2 py-1 rounded w-fit">
                                                <Clock size={12} className="text-orange-500" />
                                                {calculateSeniority(emp.entryDate)}
                                            </div>
                                         </td>
                                         <td className="px-4 py-3 text-right">
                                             <button 
                                                onClick={() => handleToggleStatus(emp.id)}
                                                className="text-xs font-medium text-blue-600 hover:underline"
                                             >
                                                 {emp.status === 'Actif' ? 'Mettre en congés' : 'Rappeler'}
                                             </button>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                         {employees.length === 0 && (
                             <div className="p-8 text-center text-gray-500">Aucun employé trouvé.</div>
                         )}
                     </div>
                   </>
                 ) : (
                   <div className="space-y-4 max-w-lg mx-auto">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Kouamé Richard"
                          value={newEmployeeData.name}
                          onChange={(e) => setNewEmployeeData({...newEmployeeData, name: e.target.value})}
                          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Poste / Rôle</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Technicien Senior"
                          value={newEmployeeData.role}
                          onChange={(e) => setNewEmployeeData({...newEmployeeData, role: e.target.value})}
                          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site d'affectation</label>
                            <div className="relative">
                              <select 
                                value={newEmployeeData.site}
                                onChange={(e) => setNewEmployeeData({...newEmployeeData, site: e.target.value})}
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                              >
                                <option value="Abidjan">Abidjan</option>
                                <option value="Bouaké">Bouaké</option>
                              </select>
                              <MapPin className="absolute right-3 top-3.5 text-gray-400" size={18} />
                            </div>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date d'embauche</label>
                            <input 
                              type="date" 
                              value={newEmployeeData.entryDate}
                              onChange={(e) => setNewEmployeeData({...newEmployeeData, entryDate: e.target.value})}
                              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                         </div>
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                        <button 
                          onClick={() => setIsAddingEmployee(false)}
                          className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={handleSaveEmployee}
                          className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <Save size={18} /> Enregistrer
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