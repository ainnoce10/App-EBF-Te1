import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { COLORS } from '../constants';
import { Period, Site, Transaction, Intervention } from '../types';
import { Activity, TrendingUp, TrendingDown, DollarSign, ChevronDown, ChevronUp, Layers, Target, PieChart as PieIcon, Calendar } from 'lucide-react';

interface DashboardProps {
  site: Site;
  period: Period;
  customStartDate?: string;
  customEndDate?: string;
  liveTransactions?: Transaction[];
  liveInterventions?: Intervention[];
}

const Dashboard: React.FC<DashboardProps> = ({ site, period, customStartDate, customEndDate, liveTransactions = [], liveInterventions = [] }) => {
  const [showDetailed, setShowDetailed] = useState(false);
  const [synthesisFilter, setSynthesisFilter] = useState<'global' | 'finance' | 'tech'>('global');
  const [showComparison, setShowComparison] = useState(false); // Désactivé par défaut car pas de données historiques N-1 dans cet exemple

  // --- TRAITEMENT DES DONNÉES RÉELLES ---

  // 1. Filtrage par Site et Période
  const filteredTransactions = useMemo(() => {
    return liveTransactions.filter(t => {
      // Filtre Site
      if (site !== 'Global' && t.site !== site) return false;
      
      // Filtre Période (Simplifié sur la date exacte ou plage)
      const tDate = new Date(t.date);
      const now = new Date();
      
      if (period === 'Jour') {
        return tDate.toDateString() === now.toDateString();
      } else if (period === 'Semaine') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return tDate >= oneWeekAgo;
      } else if (period === 'Mois') {
        return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      } else if (period === 'Année') {
        return tDate.getFullYear() === now.getFullYear();
      } else if (period === 'Personnalisé' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        return tDate >= start && tDate <= end;
      }
      return true;
    });
  }, [liveTransactions, site, period, customStartDate, customEndDate]);

  const filteredInterventions = useMemo(() => {
    return liveInterventions.filter(i => {
      if (site !== 'Global' && i.site !== site) return false;
      
      const iDate = new Date(i.date);
      const now = new Date();

      if (period === 'Jour') return iDate.toDateString() === now.toDateString();
      if (period === 'Semaine') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return iDate >= oneWeekAgo;
      }
      if (period === 'Mois') return iDate.getMonth() === now.getMonth() && iDate.getFullYear() === now.getFullYear();
      if (period === 'Année') return iDate.getFullYear() === now.getFullYear();
      if (period === 'Personnalisé' && customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          return iDate >= start && iDate <= end;
      }
      return true;
    });
  }, [liveInterventions, site, period, customStartDate, customEndDate]);

  // 2. Calcul des Totaux KPI
  const totalTurnover = filteredTransactions.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);
  const totalProfit = totalTurnover - totalExpense;
  const totalInterventionsCount = filteredInterventions.length;

  // 3. Préparation des données pour le Graphique (Agrégation par date)
  const chartData = useMemo(() => {
    const map = new Map<string, { period: string; turnover: number; expense: number; profit: number; interventions: number }>();

    // Initialiser les dates basées sur les transactions trouvées (ou interventions)
    const allDates = new Set([...filteredTransactions.map(t => t.date), ...filteredInterventions.map(i => i.date)]);
    
    // Trier les dates
    const sortedDates = Array.from(allDates).sort();

    // S'il n'y a aucune donnée, on met au moins aujourd'hui
    if (sortedDates.length === 0) {
        sortedDates.push(new Date().toISOString().split('T')[0]);
    }

    sortedDates.forEach(dateStr => {
      const displayDate = new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      map.set(dateStr, { period: displayDate, turnover: 0, expense: 0, profit: 0, interventions: 0 });
    });

    // Remplir transactions
    filteredTransactions.forEach(t => {
      const entry = map.get(t.date);
      if (entry) {
        if (t.type === 'Recette') entry.turnover += t.amount;
        if (t.type === 'Dépense') entry.expense += t.amount;
        entry.profit = entry.turnover - entry.expense;
      }
    });

    // Remplir interventions
    filteredInterventions.forEach(i => {
      const entry = map.get(i.date);
      if (entry) {
        entry.interventions += 1;
      }
    });

    return Array.from(map.values());
  }, [filteredTransactions, filteredInterventions]);

  // 4. Données Camembert (Répartition Dépenses par Catégorie)
  const pieData = useMemo(() => {
    const expensesByCategory = new Map<string, number>();
    
    filteredTransactions.filter(t => t.type === 'Dépense').forEach(t => {
       const current = expensesByCategory.get(t.category) || 0;
       expensesByCategory.set(t.category, current + t.amount);
    });

    if (expensesByCategory.size === 0) return [{ name: 'Aucune donnée', value: 1 }];

    return Array.from(expensesByCategory.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const PIE_COLORS = [COLORS.primary, COLORS.secondary, '#eab308', '#3b82f6', '#ef4444', '#8b5cf6'];
  const periodLabel = period === 'Personnalisé' 
    ? `Du ${new Date(customStartDate || '').toLocaleDateString('fr-FR')} au ${new Date(customEndDate || '').toLocaleDateString('fr-FR')}`
    : `${period} en cours`;

  return (
    <div className="space-y-6">
       
       <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Calendar size={16} />
          <span>Données réelles filtrées : <strong className="text-gray-700">{site === 'Global' ? 'Tous les sites' : site}</strong> — {periodLabel}</span>
       </div>

      {/* Header Stats Cards with Sequential Animation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* 1. Interventions */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-1">
          <div>
            <p className="text-gray-500 text-sm">Interventions</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalInterventionsCount}</h3>
          </div>
          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
            <Activity size={24} />
          </div>
        </div>

        {/* 2. Chiffre d'Affaires */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-2">
          <div>
            <p className="text-gray-500 text-sm">Chiffre d'affaires</p>
            <h3 className="text-2xl font-bold text-gray-800">{(totalTurnover).toLocaleString()} F</h3>
          </div>
          <div className="bg-orange-100 p-2 rounded-full text-orange-600">
            <DollarSign size={24} />
          </div>
        </div>

        {/* 3. Dépenses */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-3">
          <div>
            <p className="text-gray-500 text-sm">Dépenses</p>
            <h3 className="text-2xl font-bold text-red-500">{(totalExpense).toLocaleString()} F</h3>
          </div>
          <div className="bg-red-100 p-2 rounded-full text-red-600">
            <TrendingDown size={24} />
          </div>
        </div>

        {/* 4. Bénéfices */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-4">
          <div>
            <p className="text-gray-500 text-sm">Bénéfices</p>
            <h3 className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfit > 0 ? '+' : ''}{(totalProfit).toLocaleString()} F
            </h3>
          </div>
          <div className="bg-green-100 p-2 rounded-full text-green-600">
            <TrendingUp size={24} />
          </div>
        </div>

      </div>

      {/* Main Histogram Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover-lift stagger-2">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Performance Financière</h2>
          <p className="text-sm text-gray-500">Evolution journalière ({site === 'Global' ? 'Global' : site})</p>
        </div>
        
        <div className="h-[400px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
                <YAxis orientation="left" stroke="#6b7280" axisLine={false} tickLine={false} />
                <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} FCFA`]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="turnover" name="Chiffre d'Affaires" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expense" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="profit" name="Bénéfices" fill={COLORS.secondary} radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">Aucune donnée sur cette période</div>
          )}
        </div>
      </div>

      {/* Detailed Synthesis Section */}
      <div className="flex flex-col items-center justify-center space-y-4 pt-4">
        <button 
          onClick={() => setShowDetailed(!showDetailed)}
          className={`group flex items-center gap-2 px-10 py-3 border rounded-full shadow-lg transition-all duration-300 font-bold active:scale-95
            ${showDetailed ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:text-orange-600 hover:border-orange-300'}`}
        >
          <span>Synthèse Détaillée</span>
          {showDetailed ? <ChevronUp size={20} className="animate-bounce" /> : <ChevronDown size={20} />}
        </button>

        {showDetailed && (
          <div className="w-full animate-fade-in-up space-y-6 mt-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl">
                  <button onClick={() => setSynthesisFilter('global')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${synthesisFilter === 'global' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Layers size={16} className="inline mr-2"/>Vue Globale
                  </button>
                  <button onClick={() => setSynthesisFilter('finance')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${synthesisFilter === 'finance' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <DollarSign size={16} className="inline mr-2"/>Finance
                  </button>
                  <button onClick={() => setSynthesisFilter('tech')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${synthesisFilter === 'tech' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Target size={16} className="inline mr-2"/>Technique
                  </button>
               </div>
               <div className="flex items-center gap-3">
                   <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                      <div className={`w-12 h-7 rounded-full p-1 transition-colors ${showComparison ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => setShowComparison(!showComparison)}>
                          <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${showComparison ? 'translate-x-5' : ''}`}></div>
                      </div>
                      Comparer avec N-1 (Simulé)
                   </label>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover-lift">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><PieIcon size={18} className="text-gray-400"/>Répartition des Dépenses</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" animationBegin={200}>
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value.toLocaleString()} FCFA`]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover-lift">
                <h3 className="font-bold text-gray-700 mb-4">Tendances CA</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="period" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value: number) => [`${value.toLocaleString()} FCFA`]} />
                      <Legend />
                      <Line type="monotone" dataKey="turnover" name="Activité (N)" stroke={COLORS.primary} strokeWidth={4} dot={{r: 6, fill: COLORS.primary, strokeWidth: 2, stroke: '#fff'}} animationDuration={1500} />
                      {showComparison && <Line type="monotone" dataKey="profit" name="Activité (N-1)" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;