
import React, { useState, useEffect } from 'react';
import { MOCK_EMPLOYEES } from '../constants';
import { Transaction, Employee } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Download, 
  FileText, 
  Users, 
  X, 
  Loader2
} from 'lucide-react';

interface AccountingProps {
  liveTransactions?: Transaction[];
  liveEmployees?: Employee[];
}

const Accounting: React.FC<AccountingProps> = ({ liveTransactions = [], liveEmployees = [] }) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  const [newEmployeeData, setNewEmployeeData] = useState({ name: '', role: '', site: 'Abidjan', entryDate: new Date().toISOString().split('T')[0] });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (liveEmployees.length > 0) setEmployees(liveEmployees);
    else if (employees.length === 0) setEmployees(MOCK_EMPLOYEES);
  }, [liveEmployees, employees.length]);

  const handleExport = () => {
    alert("Export simulé.");
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

  const handleSaveEmployee = async () => {
    if (!newEmployeeData.name) return;
    const newId = `EMP-${Math.floor(Math.random() * 10000)}`;
    const newEmp: Employee = { id: newId, name: newEmployeeData.name, role: newEmployeeData.role, site: newEmployeeData.site, status: 'Actif', entryDate: newEmployeeData.entryDate };
    try {
        const { error } = await supabase.from('employees').insert([newEmp]);
        if (error) throw error;
        setIsAddingEmployee(false);
        setNewEmployeeData({ name: '', role: '', site: 'Abidjan', entryDate: new Date().toISOString().split('T')[0] });
    } catch (error) { console.error(error); }
  };

  const handleGeneratePaie = () => {
    setIsGenerating(true);
    setTimeout(() => { setIsGenerating(false); setShowPayrollModal(false); alert('Paie générée.'); }, 2000);
  };

  const displayedTransactions = showAllTransactions ? liveTransactions : liveTransactions.slice(0, 5);
  const totalRevenue = liveTransactions.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = liveTransactions.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);
  const netMargin = totalRevenue - totalExpense;
  const marginPercent = totalRevenue > 0 ? ((netMargin / totalRevenue) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6 relative pb-20">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Comptabilité & RH</h2>
          <p className="text-gray-500 text-sm">Finances et personnel</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => handleExport()} className="flex-1 md:flex-none justify-center bg-green-600 text-white px-4 py-3 rounded-xl flex items-center gap-2 shadow-sm text-sm font-bold">
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-green-500">
          <p className="text-gray-500 text-xs font-bold uppercase">Recettes</p>
          <h3 className="text-2xl font-black text-gray-800">{totalRevenue.toLocaleString()} F</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-red-500">
          <p className="text-gray-500 text-xs font-bold uppercase">Dépenses</p>
          <h3 className="text-2xl font-black text-gray-800">{totalExpense.toLocaleString()} F</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-orange-500">
          <p className="text-gray-500 text-xs font-bold uppercase">Marge Nette ({marginPercent}%)</p>
          <h3 className="text-2xl font-black text-gray-800">{netMargin.toLocaleString()} F</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Transactions</h3>
          <button onClick={() => setShowAllTransactions(!showAllTransactions)} className="text-orange-600 text-xs font-bold uppercase">
            {showAllTransactions ? 'Réduire' : 'Voir tout'}
          </button>
        </div>
        
        {/* Mobile Scrollable Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[600px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Libellé</th>
                <th className="px-6 py-4 font-bold">Catégorie</th>
                <th className="px-6 py-4 font-bold text-right">Montant</th>
                <th className="px-6 py-4 font-bold text-center">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {displayedTransactions.length > 0 ? displayedTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-500">{new Date(trx.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">{trx.description}</td>
                  <td className="px-6 py-4 text-gray-500"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{trx.category}</span></td>
                  <td className="px-6 py-4 font-black text-right">{trx.amount.toLocaleString()} F</td>
                  <td className="px-6 py-4 text-center">
                    {trx.type === 'Recette' 
                        ? <span className="text-green-600 bg-green-100 px-2 py-1 rounded-md text-xs font-bold">Entrée</span>
                        : <span className="text-red-600 bg-red-100 px-2 py-1 rounded-md text-xs font-bold">Sortie</span>}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Aucune donnée</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4">Actions RH</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
             <button onClick={() => setShowPayrollModal(true)} className="p-4 border border-gray-200 rounded-xl flex items-center gap-3 hover:bg-gray-50">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><FileText size={20} /></div>
                <div className="text-left"><p className="font-bold text-gray-800 text-sm">Fiches de Paie</p></div>
             </button>
             <button onClick={() => { setShowEmployeeModal(true); setIsAddingEmployee(false); }} className="p-4 border border-gray-200 rounded-xl flex items-center gap-3 hover:bg-gray-50">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Users size={20} /></div>
                <div className="text-left"><p className="font-bold text-gray-800 text-sm">Gérer Effectif</p></div>
             </button>
        </div>
      </div>

      {/* --- MODAL PAIE (Mobile optimized) --- */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden animate-slide-up">
            <div className="p-5 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                <h3 className="font-black text-gray-800">Paie Mensuelle</h3>
                <button onClick={() => setShowPayrollModal(false)}><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
               <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 font-medium">Prêt à générer pour ce mois.</div>
               <button onClick={handleGeneratePaie} disabled={isGenerating} className="w-full py-3 bg-orange-600 text-white font-bold rounded-xl flex justify-center gap-2">
                   {isGenerating ? <Loader2 className="animate-spin"/> : 'Lancer Traitement'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EMPLOYES (Mobile optimized) --- */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
           <div className="bg-white w-full h-[90vh] md:h-auto md:max-h-[85vh] md:max-w-3xl rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="text-xl font-black text-gray-900">{isAddingEmployee ? 'Nouveau' : 'Effectif'}</h3>
                <button onClick={() => setShowEmployeeModal(false)} className="p-2 bg-gray-100 rounded-full"><X size={20}/></button>
             </div>

             <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-white">
                 {!isAddingEmployee ? (
                   <>
                     <button onClick={() => setIsAddingEmployee(true)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mb-4">+ Ajouter Employé</button>
                     <div className="space-y-3">
                         {employees.map(emp => (
                             <div key={emp.id} className="p-4 border border-gray-100 rounded-2xl flex justify-between items-center bg-gray-50">
                                 <div>
                                     <p className="font-bold text-gray-900">{emp.name}</p>
                                     <p className="text-xs text-gray-500">{emp.role} • {emp.site}</p>
                                 </div>
                                 <button onClick={() => handleToggleStatus(emp.id)} className={`text-xs font-bold px-3 py-1 rounded-full ${emp.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                     {emp.status}
                                 </button>
                             </div>
                         ))}
                     </div>
                   </>
                 ) : (
                   <div className="space-y-4">
                      <input type="text" placeholder="Nom complet" className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none" value={newEmployeeData.name} onChange={e => setNewEmployeeData({...newEmployeeData, name: e.target.value})}/>
                      <input type="text" placeholder="Poste" className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none" value={newEmployeeData.role} onChange={e => setNewEmployeeData({...newEmployeeData, role: e.target.value})}/>
                      <div className="flex gap-2">
                         <button onClick={() => setIsAddingEmployee(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl">Annuler</button>
                         <button onClick={handleSaveEmployee} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl">Enregistrer</button>
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
