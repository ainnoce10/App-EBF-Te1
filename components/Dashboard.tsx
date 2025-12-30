
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
  const [showComparison, setShowComparison] = useState(false);

  // --- TRAITEMENT DES DONNÉES --- (Identique à avant)
  const filteredTransactions = useMemo(() => {
    return liveTransactions.filter(t => {
      if (site !== 'Global' && t.site !== site) return false;
      const tDate = new Date(t.date);
      const now = new Date();
      if (period === 'Jour') return tDate.toDateString() === now.toDateString();
      else if (period === 'Semaine') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return tDate >= oneWeekAgo;
      } else if (period === 'Mois') return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      else if (period === 'Année') return tDate.getFullYear() === now.getFullYear();
      else if (period === 'Personnalisé' && customStartDate && customEndDate) {
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

  const totalTurnover = filteredTransactions.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);
  const totalProfit = totalTurnover - totalExpense;
  const totalInterventionsCount = filteredInterventions.length;

  const chartData = useMemo(() => {
    const map = new Map<string, { period: string; turnover: number; expense: number; profit: number; interventions: number }>();
    const allDates = new Set([...filteredTransactions.map(t => t.date), ...filteredInterventions.map(i => i.date)]);
    const sortedDates = Array.from(allDates).sort();
    if (sortedDates.length === 0) sortedDates.push(new Date().toISOString().split('T')[0]);

    sortedDates.forEach(dateStr => {
      const displayDate = new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      map.set(dateStr, { period: displayDate, turnover: 0, expense: 0, profit: 0, interventions: 0 });
    });

    filteredTransactions.forEach(t => {
      const entry = map.get(t.date);
      if (entry) {
        if (t.type === 'Recette') entry.turnover += t.amount;
        if (t.type === 'Dépense') entry.expense += t.amount;
        entry.profit = entry.turnover - entry.expense;
      }
    });

    filteredInterventions.forEach(i => {
      const entry = map.get(i.date);
      if (entry) entry.interventions += 1;
    });

    return Array.from(map.values());
  }, [filteredTransactions, filteredInterventions]);

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
    <div className="space-y-4 md:space-y-6">
       
       <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-500 mb-2 px-1">
          <div className="flex items-center gap-2">
             <Calendar size={14} />
             <span className="font-bold uppercase tracking-wide">Vue : {site === 'Global' ? 'Tous sites' : site}</span>
          </div>
          <span className="hidden md:inline mx-1">•</span>
          <span className="italic">{periodLabel}</span>
       </div>

      {/* Stats Cards - Vertical Stack on Mobile, Grid on Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-1 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-gray-400 text-xs font-black uppercase tracking-wider mb-1">Interventions</p>
            <h3 className="text-3xl font-black text-gray-800">{totalInterventionsCount}</h3>
          </div>
          <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
            <Activity size={28} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-2">
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-wider mb-1">C.A.</p>
            <h3 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">{(totalTurnover).toLocaleString()} <span className="text-sm text-gray-400">F</span></h3>
          </div>
          <div className="bg-orange-50 p-3 rounded-2xl text-orange-600">
            <DollarSign size={28} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-3">
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-wider mb-1">Dépenses</p>
            <h3 className="text-2xl md:text-3xl font-black text-red-500 tracking-tight">{(totalExpense).toLocaleString()} <span className="text-sm text-red-300">F</span></h3>
          </div>
          <div className="bg-red-50 p-3 rounded-2xl text-red-500">
            <TrendingDown size={28} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-4">
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-wider mb-1">Bénéfices</p>
            <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfit > 0 ? '+' : ''}{(totalProfit).toLocaleString()} <span className="text-sm opacity-50">F</span>
            </h3>
          </div>
          <div className="bg-green-50 p-3 rounded-2xl text-green-600">
            <TrendingUp size={28} />
          </div>
        </div>

      </div>

      {/* Main Histogram Section */}
      <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 hover-lift stagger-2">
        <div className="mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-black text-gray-800 mb-1">Performance Financière</h2>
          <p className="text-xs text-gray-500 font-medium">Evolution journalière ({site === 'Global' ? 'Global' : site})</p>
        </div>
        
        <div className="h-[300px] md:h-[400px] w-full -ml-2">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                data={chartData}
                margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} dy={10} />
                <YAxis orientation="left" stroke="#9ca3af" axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(value) => value >= 1000 ? `${value/1000}k` : value} />
                <Tooltip 
                    cursor={{fill: '#f9fafb'}}
                    formatter={(value: number) => [`${value.toLocaleString()} F`]}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}}/>
                <Bar dataKey="turnover" name="Recettes" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="expense" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
                <Bar dataKey="profit" name="Marge" fill={COLORS.secondary} radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Aucune donnée disponible</div>
          )}
        </div>
      </div>

      {/* Detailed Synthesis Section */}
      <div className="flex flex-col items-center justify-center space-y-4 pt-4">
        <button 
          onClick={() => setShowDetailed(!showDetailed)}
          className={`w-full md:w-auto group flex items-center justify-center gap-2 px-8 py-3.5 border rounded-2xl shadow-sm transition-all duration-300 font-black text-sm uppercase tracking-wide active:scale-95
            ${showDetailed ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:text-orange-600 hover:border-orange-200'}`}
        >
          <span>Synthèse Détaillée</span>
          {showDetailed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showDetailed && (
          <div className="w-full animate-fade-in-up space-y-4 md:space-y-6 mt-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="w-full md:w-auto flex p-1 bg-gray-50 rounded-xl overflow-x-auto no-scrollbar">
                  {['global', 'finance', 'tech'].map((f) => (
                      <button 
                        key={f}
                        onClick={() => setSynthesisFilter(f as any)} 
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap
                        ${synthesisFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                      >
                        {f === 'global' ? 'Vue Globale' : f === 'finance' ? 'Finance' : 'Technique'}
                      </button>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover-lift">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <PieIcon size={16} className="text-orange-500"/> Répartition Dépenses
                </h3>
                <div className="h-[250px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" animationBegin={200}>
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value.toLocaleString()} F`]} contentStyle={{borderRadius: '12px', border: 'none', fontWeight: 'bold'}} />
                      <Legend wrapperStyle={{fontSize: '11px'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover-lift">
                <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Tendances CA</h3>
                <div className="h-[250px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                      <Tooltip formatter={(value: number) => [`${value.toLocaleString()} F`]} contentStyle={{borderRadius: '12px', border: 'none', fontWeight: 'bold'}} />
                      <Line type="monotone" dataKey="turnover" stroke={COLORS.primary} strokeWidth={3} dot={false} activeDot={{r: 6}} animationDuration={1500} />
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
