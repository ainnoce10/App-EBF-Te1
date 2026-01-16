
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

// Listes prédéfinies selon le cahier des charges
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
  
  // Modals States
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Data States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddingEmployee, setIsAddingEmployee] = useState(false);
  
  // State pour le formulaire Employé (Ajout ou Edition)
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [employeeFormData, setEmployeeFormData] = useState({ 
      civility: 'M',
      name: '', 
      assignedName: '', 
      role: JOB_TITLES[5], // Default: Technicien polyvalent
      domain: 'Polyvalent',
      site: 'Abidjan', 
      entryDate: new Date().toISOString().split('T')[0] 
  });
  
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

  // --- ETATS PAIE ---
  const [payrollStep, setPayrollStep] = useState<1 | 2>(1); // 1: Saisie, 2: Confirmation
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
      
      if (now.getDate() < start.getDate()) {
          months--;
      }

      if (years > 0) return `${years} an(s)${months > 0 ? ` et ${months} mois` : ''}`;
      if (months > 0) return `${months} mois`;
      return "Moins d'un mois";
  };

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

  // Réinitialise complètement le formulaire
  const resetEmployeeForm = () => {
      setEmployeeFormData({
          civility: 'M',
          name: '',
          assignedName: '',
          role: JOB_TITLES[5],
          domain: 'Polyvalent',
          site: 'Abidjan',
          entryDate: new Date().toISOString().split('T')[0]
      });
      setNewEmployeePhoto(null);
      setNewEmployeePhotoPreview(null);
      setPhotoPos({ x: 50, y: 50 });
      setEditingEmployeeId(null);
  };

  const handleAddNewEmployee = () => {
      resetEmployeeForm();
      setIsAddingEmployee(true);
  };

  const handleEditEmployee = (emp: Employee) => {
      resetEmployeeForm(); // Reset first to clear any potential trash
      setEditingEmployeeId(emp.id);
      
      // Extraction civilité
      let civ = 'M';
      let cleanName = emp.name;
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
      
      setIsAddingEmployee(true);
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

        const fullName = `${employeeFormData.civility} ${employeeFormData.name}`.trim();

        const employeePayload = { 
            name: fullName, 
            assignedName: employeeFormData.assignedName, 
            role: employeeFormData.role, 
            domain: employeeFormData.domain,
            site: employeeFormData.site, 
            status: 'Actif', 
            entryDate: employeeFormData.entryDate,
            photoUrl: photoUrl || null,
            photoPosition: `${photoPos.x}% ${photoPos.y}%`
        };

        if (editingEmployeeId) {
            // UPDATE
            const { error } = await supabase.from('employees').update(employeePayload).eq('id', editingEmployeeId);
            if (error) throw error;
        } else {
            // INSERT
            const newId = `EMP-${Date.now()}`; // Utilisation Date.now() pour éviter doublons
            const { error } = await supabase.from('employees').insert([{ id: newId, ...employeePayload }]);
            if (error) throw error;
        }

        // Reset and close
        setIsAddingEmployee(false);
        setEditingEmployeeId(null);
        resetEmployeeForm();

    } catch (error: any) { 
        let msg = error.message;
        if (msg.includes('domain') || msg.includes('column')) {
            msg += "\n\nAstuce : Allez dans 'Paramètres > Base SQL' et copiez le script pour mettre à jour la base de données.";
        }
        alert("Erreur sauvegarde employé: " + msg);
    } finally {
        setIsSaving(false);
    }
  };

  // --- CALCUL PAIE ---
  const calculatePayroll = () => {
      const grossSalary = (payrollForm.baseSalary || 0) + (payrollForm.transport || 0) + (payrollForm.housing || 0) + (payrollForm.overtime || 0) + (payrollForm.bonus || 0);
      const totalDeductions = (payrollForm.advance || 0) + (payrollForm.cnps || 0) + (payrollForm.tax || 0);
      const netSalary = grossSalary - totalDeductions;
      return { grossSalary, totalDeductions, netSalary };
  };

  const handleGenerateAndSavePayslip = async () => {
    if (!selectedEmployeeForPay) return;
    setIsGenerating(true);

    const { netSalary } = calculatePayroll();

    try {
        // 1. Enregistrement comptable automatique
        const newId = `TRX-PAY-${Math.floor(Math.random() * 100000)}`;
        const trx: Transaction = {
            id: newId,
            type: 'Dépense',
            amount: netSalary,
            category: 'Salaire',
            description: `Paie ${payrollForm.period} - ${selectedEmployeeForPay.name}`,
            site: selectedEmployeeForPay.site,
            date: new Date().toISOString().split('T')[0]
        };

        const { error } = await supabase.from('accounting_transactions').insert([trx]);
        if (error) throw error;

        // 2. Génération HTML Impression
        const printWindow = window.open('', '', 'width=800,height=900');
        if (printWindow) {
            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Fiche de Paie - ${selectedEmployeeForPay.name}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 4px solid #f97316; padding-bottom: 20px; }
                    .company-info h1 { margin: 0; color: #f97316; font-size: 24px; text-transform: uppercase; }
                    .company-info p { margin: 2px 0; font-size: 12px; color: #666; }
                    .doc-title { text-align: right; }
                    .doc-title h2 { margin: 0; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; }
                    .doc-title p { margin: 5px 0 0; font-size: 14px; font-weight: bold; color: #f97316; }
                    
                    .employee-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 30px; display: flex; justify-content: space-between; }
                    .emp-col h3 { font-size: 10px; text-transform: uppercase; color: #94a3b8; margin: 0 0 5px 0; }
                    .emp-col p { font-size: 16px; font-weight: bold; margin: 0; }

                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { text-align: left; padding: 12px; background: #1e293b; color: white; font-size: 12px; text-transform: uppercase; }
                    td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
                    tr:last-child td { border-bottom: none; }
                    .amount { text-align: right; font-family: 'Courier New', Courier, monospace; font-weight: bold; }
                    .subtotal { background: #f1f5f9; font-weight: bold; }
                    
                    .total-box { display: flex; justify-content: flex-end; }
                    .net-pay { background: #f97316; color: white; padding: 20px 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
                    .net-pay span { display: block; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; opacity: 0.9; }
                    .net-pay strong { font-size: 32px; letter-spacing: -1px; }

                    .footer { margin-top: 60px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                    .signatures { display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid; }
                    .sig-box { width: 40%; border-top: 2px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 12px; font-weight: bold; color: #64748b; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-info">
                        <h1>EBF Technical</h1>
                        <p>Services Techniques & Quincaillerie</p>
                        <p>Abidjan / Bouaké / Korhogo</p>
                        <p>Tel: +225 XX XX XX XX</p>
                    </div>
                    <div class="doc-title">
                        <h2>Bulletin de Paie</h2>
                        <p>${payrollForm.period.toUpperCase()}</p>
                    </div>
                </div>

                <div class="employee-box">
                    <div class="emp-col">
                        <h3>Employé</h3>
                        <p>${selectedEmployeeForPay.name}</p>
                    </div>
                    <div class="emp-col">
                        <h3>Fonction</h3>
                        <p>${selectedEmployeeForPay.role}</p>
                    </div>
                    <div class="emp-col">
                        <h3>Matricule</h3>
                        <p>${selectedEmployeeForPay.id}</p>
                    </div>
                    <div class="emp-col">
                        <h3>Site</h3>
                        <p>${selectedEmployeeForPay.site}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Désignation</th>
                            <th style="text-align:right">Gains (+)</th>
                            <th style="text-align:right">Retenues (-)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Salaire de Base</td>
                            <td class="amount">${(payrollForm.baseSalary || 0).toLocaleString()}</td>
                            <td class="amount"></td>
                        </tr>
                        ${payrollForm.transport > 0 ? `<tr><td>Prime Transport</td><td class="amount">${payrollForm.transport.toLocaleString()}</td><td></td></tr>` : ''}
                        ${payrollForm.housing > 0 ? `<tr><td>Indemnité Logement</td><td class="amount">${payrollForm.housing.toLocaleString()}</td><td></td></tr>` : ''}
                        ${payrollForm.overtime > 0 ? `<tr><td>Heures Supplémentaires</td><td class="amount">${payrollForm.overtime.toLocaleString()}</td><td></td></tr>` : ''}
                        ${payrollForm.bonus > 0 ? `<tr><td>Primes & Bonus</td><td class="amount">${payrollForm.bonus.toLocaleString()}</td><td></td></tr>` : ''}
                        ${payrollForm.advance > 0 ? `<tr><td>Acompte sur salaire</td><td></td><td class="amount">${payrollForm.advance.toLocaleString()}</td></tr>` : ''}
                        ${payrollForm.cnps > 0 ? `<tr><td>Cotisation CNPS/CMU</td><td></td><td class="amount">${payrollForm.cnps.toLocaleString()}</td></tr>` : ''}
                        ${payrollForm.tax > 0 ? `<tr><td>Impôt sur Salaire (IGR)</td><td></td><td class="amount">${payrollForm.tax.toLocaleString()}</td></tr>` : ''}
                        <tr class="subtotal">
                            <td>TOTAUX</td>
                            <td class="amount">${calculatePayroll().grossSalary.toLocaleString()}</td>
                            <td class="amount">${calculatePayroll().totalDeductions.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="total-box">
                    <div class="net-pay">
                        <span>Net à Payer</span>
                        <strong>${calculatePayroll().netSalary.toLocaleString()} FCFA</strong>
                    </div>
                </div>

                <div class="signatures">
                    <div class="sig-box">Signature Employé</div>
                    <div class="sig-box">Signature Direction</div>
                </div>

                <div class="footer">
                    <p>Ce bulletin de paie est généré électroniquement par le système EBF Management Suite.</p>
                    <p>Document confidentiel - ${new Date().toLocaleString()}</p>
                </div>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
            `;
            printWindow.document.write(htmlContent);
            printWindow.document.close();
        }

        // Reset
        setShowPayrollModal(false);
        setPayrollStep(1);
        setSelectedEmployeeForPay(null);

    } catch (err: any) {
        alert("Erreur: " + err.message);
    } finally {
        setIsGenerating(false);
    }
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
             <button onClick={() => { setShowPayrollModal(true); setPayrollStep(1); }} className="p-6 border-2 border-gray-100 rounded-3xl flex items-center gap-4 hover:border-orange-200 hover:bg-orange-50 transition-all group">
                <div className="bg-orange-100 p-4 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                <div className="text-left">
                    <p className="font-black text-gray-900 text-lg">Générer Paie</p>
                    <p className="text-xs text-gray-500 font-bold">Bulletin, Calcul, Impression</p>
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
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 md:pt-24 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 animate-scale-in shadow-2xl relative mb-10">
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

      {/* --- MODAL PAIE COMPLETE (Calcul & Impression) --- */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 md:pt-24 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up max-h-[90vh] relative mb-10">
            
            {/* Header Modal */}
            <div className="p-8 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                <div>
                    <h3 className="font-black text-gray-900 text-2xl uppercase tracking-tighter">Générateur de Paie</h3>
                    <p className="text-xs text-orange-600 font-bold mt-1">Édition Bulletins & Enregistrement Comptable</p>
                </div>
                <button onClick={() => setShowPayrollModal(false)} className="p-3 bg-white rounded-full text-gray-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               {payrollStep === 1 ? (
                   <div className="space-y-8">
                       {/* 1. Sélection Employé & Période */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Période Concernée</label>
                               <input 
                                 type="text" 
                                 className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-900 border-2 border-transparent focus:border-orange-500 outline-none"
                                 value={payrollForm.period}
                                 onChange={(e) => setPayrollForm({...payrollForm, period: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Employé</label>
                               <select 
                                 className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-900 border-2 border-transparent focus:border-orange-500 outline-none cursor-pointer"
                                 value={selectedEmployeeForPay?.id || ''}
                                 onChange={(e) => setSelectedEmployeeForPay(employees.find(emp => emp.id === e.target.value) || null)}
                               >
                                   <option value="">Sélectionner un employé...</option>
                                   {employees.filter(e => e.status === 'Actif').map(emp => (
                                       <option key={emp.id} value={emp.id}>{emp.name}</option>
                                   ))}
                               </select>
                           </div>
                       </div>

                       {/* 2. Saisie Données Financières */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {/* GAINS */}
                           <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                               <h4 className="font-black text-green-800 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
                                   <ArrowUpCircle size={16}/> Gains (Brut)
                               </h4>
                               <div className="space-y-3">
                                   <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-green-100">
                                       <span className="text-xs font-bold text-gray-500">Salaire Base</span>
                                       <input type="number" className="w-32 text-right font-black outline-none text-gray-900" placeholder="0" value={payrollForm.baseSalary} onChange={(e) => setPayrollForm({...payrollForm, baseSalary: parseInt(e.target.value) || 0})} />
                                   </div>
                                   <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-green-100">
                                       <span className="text-xs font-bold text-gray-500">Transports</span>
                                       <input type="number" className="w-32 text-right font-black outline-none text-gray-900" placeholder="0" value={payrollForm.transport} onChange={(e) => setPayrollForm({...payrollForm, transport: parseInt(e.target.value) || 0})} />
                                   </div>
                                   <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-green-100">
                                       <span className="text-xs font-bold text-gray-500">Logement</span>
                                       <input type="number" className="w-32 text-right font-black outline-none text-gray-900" placeholder="0" value={payrollForm.housing} onChange={(e) => setPayrollForm({...payrollForm, housing: parseInt(e.target.value) || 0})} />
                                   </div>
                                   <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-green-100">
                                       <span className="text-xs font-bold text-gray-500">Heures Sup</span>
                                       <input type="number" className="w-32 text-right font-black outline-none text-gray-900" placeholder="0" value={payrollForm.overtime} onChange={(e) => setPayrollForm({...payrollForm, overtime: parseInt(e.target.value) || 0})} />
                                   </div>
                                   <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-green-100">
                                       <span className="text-xs font-bold text-gray-500">Primes/Bonus</span>
                                       <input type="number" className="w-32 text-right font-black outline-none text-gray-900" placeholder="0" value={payrollForm.bonus} onChange={(e) => setPayrollForm({...payrollForm, bonus: parseInt(e.target.value) || 0})} />
                                   </div>
                               </div>
                           </div>

                           {/* RETENUES */}
                           <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                               <h4 className="font-black text-red-800 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
                                   <ArrowDownCircle size={16}/> Retenues
                               </h4>
                               <div className="space-y-3">
                                   <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-red-100">
                                       <span className="text-xs font-bold text-gray-500">Acomptes reçus</span>
                                       <input type="number" className="w-32 text-right font-black outline-none text-gray-900" placeholder="0" value={payrollForm.advance} onChange={(e) => setPayrollForm({...payrollForm, advance: parseInt(e.target.value) || 0})} />
                                   </div>
                                   <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-red-100">
                                       <span className="text-xs font-bold text-gray-500">CNPS / CMU</span>
                                       <input type="number" className="w-32 text-right font-black outline-none text-gray-900" placeholder="0" value={payrollForm.cnps} onChange={(e) => setPayrollForm({...payrollForm, cnps: parseInt(e.target.value) || 0})} />
                                   </div>
                                   <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-red-100">
                                       <span className="text-xs font-bold text-gray-500">Impôts (IGR)</span>
                                       <input type="number" className="w-32 text-right font-black outline-none text-gray-900" placeholder="0" value={payrollForm.tax} onChange={(e) => setPayrollForm({...payrollForm, tax: parseInt(e.target.value) || 0})} />
                                   </div>
                               </div>
                           </div>
                       </div>
                   </div>
               ) : (
                   <div className="flex flex-col items-center justify-center py-8">
                       <CheckCircle2 size={64} className="text-green-500 mb-6" />
                       <h3 className="text-2xl font-black text-gray-900 mb-2">Prêt à générer</h3>
                       <p className="text-gray-500 text-center max-w-md mb-8">
                           Vous allez générer le bulletin pour <strong>{selectedEmployeeForPay?.name}</strong>. 
                           Cela enregistrera une dépense de <strong>{calculatePayroll().netSalary.toLocaleString()} FCFA</strong> dans la comptabilité.
                       </p>
                       
                       <div className="bg-gray-50 p-6 rounded-3xl w-full max-w-md border border-gray-100">
                           <div className="flex justify-between mb-2">
                               <span className="text-gray-500 font-bold">Total Brut</span>
                               <span className="font-black">{calculatePayroll().grossSalary.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between mb-4 pb-4 border-b border-gray-200">
                               <span className="text-gray-500 font-bold">Total Retenues</span>
                               <span className="font-black text-red-500">-{calculatePayroll().totalDeductions.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center">
                               <span className="text-gray-800 font-black uppercase text-lg">Net à Payer</span>
                               <span className="font-black text-2xl text-orange-600">{calculatePayroll().netSalary.toLocaleString()} F</span>
                           </div>
                       </div>
                   </div>
               )}
            </div>

            <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                {payrollStep === 2 && (
                    <button onClick={() => setPayrollStep(1)} className="text-gray-500 font-bold uppercase text-xs hover:text-gray-800">Retour</button>
                )}
                {payrollStep === 1 ? (
                    <div className="ml-auto">
                         <div className="text-right mb-2">
                             <span className="text-[10px] font-black uppercase text-gray-400 block tracking-widest">Net Estimé</span>
                             <span className="text-2xl font-black text-gray-900">{calculatePayroll().netSalary.toLocaleString()} F</span>
                         </div>
                         <button 
                            disabled={!selectedEmployeeForPay}
                            onClick={() => setPayrollStep(2)} 
                            className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                             Suivant
                         </button>
                    </div>
                ) : (
                    <button 
                        onClick={handleGenerateAndSavePayslip} 
                        disabled={isGenerating}
                        className="ml-auto bg-orange-600 text-white px-8 py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Printer size={18}/>}
                        {isGenerating ? 'Traitement...' : 'Imprimer & Enregistrer'}
                    </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EMPLOYES --- */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 md:pt-24 bg-black/50 backdrop-blur-sm overflow-y-auto">
           <div className="bg-white w-full max-h-[90vh] md:max-w-3xl rounded-[2.5rem] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-slide-up relative mb-10">
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
                     <button onClick={handleAddNewEmployee} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs mb-6 shadow-lg flex items-center justify-center gap-2 transition-all">
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

                      {/* Champs Nom distincts avec Civilité */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom Complet (Administratif)</label>
                              <div className="flex gap-2">
                                  <select 
                                      value={employeeFormData.civility} 
                                      onChange={e => setEmployeeFormData({...employeeFormData, civility: e.target.value})}
                                      className="bg-white rounded-xl font-bold text-xs px-2 outline-none border-2 border-transparent focus:border-blue-500"
                                  >
                                      <option value="M">M</option>
                                      <option value="Mme">Mme</option>
                                      <option value="Mlle">Mlle</option>
                                  </select>
                                  <input type="text" placeholder="Ex: KOUASSI Jean-Pierre" className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all text-sm" value={employeeFormData.name} onChange={e => setEmployeeFormData({...employeeFormData, name: e.target.value})}/>
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-1 flex items-center gap-1"><Users size={12}/> Nom Assigné (Planning TV)</label>
                              <input type="text" placeholder="Ex: Jean K." className="w-full p-4 bg-orange-50 text-orange-900 rounded-2xl font-black outline-none border-2 border-orange-100 focus:border-orange-500 transition-all text-sm" value={employeeFormData.assignedName} onChange={e => setEmployeeFormData({...employeeFormData, assignedName: e.target.value})}/>
                              <p className="text-[9px] text-gray-400 font-bold ml-1">C'est ce nom qui apparaîtra dans les fiches missions.</p>
                          </div>
                      </div>
                      
                      {/* Ligne POSTE et DOMAINE */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Poste Occupé</label>
                              <select 
                                value={employeeFormData.role} 
                                onChange={e => setEmployeeFormData({...employeeFormData, role: e.target.value})}
                                className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all appearance-none cursor-pointer"
                              >
                                  {JOB_TITLES.map(title => (
                                      <option key={title} value={title}>{title}</option>
                                  ))}
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Domaine d'activité</label>
                              <select 
                                value={employeeFormData.domain} 
                                onChange={e => setEmployeeFormData({...employeeFormData, domain: e.target.value})}
                                className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all appearance-none cursor-pointer"
                              >
                                  {ACTIVITY_DOMAINS.map(domain => (
                                      <option key={domain} value={domain}>{domain}</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      {/* Ligne SITE et DATE */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Site</label>
                              <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all appearance-none" value={employeeFormData.site} onChange={e => setEmployeeFormData({...employeeFormData, site: e.target.value})}>
                                  <option value="Abidjan">Abidjan</option>
                                  <option value="Bouaké">Bouaké</option>
                                  <option value="Korhogo">Korhogo</option>
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date d'entrée</label>
                              <div className="relative">
                                  <input 
                                    type="date" 
                                    className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" 
                                    value={employeeFormData.entryDate} 
                                    onChange={e => setEmployeeFormData({...employeeFormData, entryDate: e.target.value})}
                                  />
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                                      <Clock size={12}/> {calculateSeniority(employeeFormData.entryDate)}
                                  </div>
                              </div>
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
