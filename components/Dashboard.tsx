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
  ComposedChart
} from 'recharts';
import { Period, Site, Transaction, Intervention } from '../types';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart as PieIcon, 
  Calendar,
  ArrowRight,
  ArrowLeft,
  Store,
  Briefcase,
  Calculator,
  LayoutGrid,
  MapPin
} from 'lucide-react';

interface DashboardProps {
  site: Site;
  period: Period;
  customStartDate?: string;
  customEndDate?: string;
  liveTransactions?: Transaction[];
  liveInterventions?: Intervention[];
}

const Dashboard: React.FC<DashboardProps> = ({ site, period, customStartDate, customEndDate, liveTransactions = [], liveInterventions = [] }) => {
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [detailFilter, setDetailFilter] = useState<'all' | 'hardware' | 'secretariat' | 'accounting'>('all');

  // Helper pour obtenir le numéro de semaine ISO
  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
  };

  // --- 1. FILTRAGE GLOBAL PAR DATE ET SITE ---
  const dateFilteredTransactions = useMemo(() => {
    return liveTransactions.filter(t => {
      const tDate = new Date(t.date);
      const now = new Date();
      
      let matchPeriod = true;
      if (period === 'Jour') matchPeriod = tDate.toDateString() === now.toDateString();
      else if (period === 'Semaine') {
        const startOfWeek = new Date();
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Lundi
        startOfWeek.setHours(0,0,0,0);
        matchPeriod = tDate >= startOfWeek;
      } else if (period === 'Mois') {
        matchPeriod = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      } else if (period === 'Année') {
        matchPeriod = tDate.getFullYear() === now.getFullYear();
      } else if (period === 'Personnalisé' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        matchPeriod = tDate >= start && tDate <= end;
      }

      const matchSite = site === 'Global' ? true : t.site === site;
      return matchPeriod && matchSite;
    });
  }, [liveTransactions, site, period, customStartDate, customEndDate]);

  const getTransactionSource = (t: Transaction): 'hardware' | 'secretariat' | 'accounting' => {
      const cat = t.category.toLowerCase();
      if (cat.includes('magasin') || cat.includes('stock') || cat.includes('vente comptoir') || cat.includes('outillage')) return 'hardware';
      if (cat.includes('prestation') || cat.includes('caisse') || cat.includes('acompte') || cat.includes('service')) return 'secretariat';
      return 'accounting';
  };

  // --- 2. DATA POUR VUE DÉTAILLÉE (AVEC DÉCOMPOSITION) ---
  const detailedData = useMemo(() => {
    let baseData = dateFilteredTransactions;
    if (detailFilter !== 'all') {
        baseData = baseData.filter(t => getTransactionSource(t) === detailFilter);
    }

    const income = baseData.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
    const expense = baseData.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);
    const profit = income - expense;

    // Agrégation temporelle pour le graphique de la vue détaillée
    const timeMap = new Map<string, { label: string; turnover: number; expense: number; profit: number }>();

    baseData.forEach(t => {
        const d = new Date(t.date);
        let key = "";
        let label = "";

        if (period === 'Année') {
            key = `${d.getFullYear()}-${d.getMonth()}`;
            label = d.toLocaleDateString('fr-FR', { month: 'short' });
        } else if (period === 'Mois') {
            const week = getWeekNumber(d);
            key = `W${week}`;
            label = `Sem. ${week}`;
        } else if (period === 'Semaine') {
            key = t.date;
            label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
        } else {
            key = t.date;
            label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        }

        if (!timeMap.has(key)) {
            timeMap.set(key, { label, turnover: 0, expense: 0, profit: 0 });
        }
        const entry = timeMap.get(key)!;
        if (t.type === 'Recette') entry.turnover += t.amount;
        else entry.expense += t.amount;
        entry.profit = entry.turnover - entry.expense;
    });

    const chartData = Array.from(timeMap.values());

    // Répartition par Site
    const bySiteMap = new Map<string, { name: string; income: number; expense: number; profit: number }>();
    const sites = ['Abidjan', 'Bouaké', 'Korhogo'];
    sites.forEach(s => bySiteMap.set(s, { name: s, income: 0, expense: 0, profit: 0 }));

    baseData.forEach(t => {
        const entry = bySiteMap.get(t.site);
        if (entry) {
            if (t.type === 'Recette') entry.income += t.amount;
            else entry.expense += t.amount;
            entry.profit = entry.income - entry.expense;
        }
    });

    // Répartition par Catégorie
    const byCategoryMap = new Map<string, number>();
    baseData.forEach(t => {
        const val = t.amount;
        const current = byCategoryMap.get(t.category) || 0;
        byCategoryMap.set(t.category, current + val);
    });
    const byCategory = Array.from(byCategoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

    return { income, expense, profit, bySite: Array.from(bySiteMap.values()), byCategory, transactions: baseData, chartData };
  }, [dateFilteredTransactions, detailFilter, period]);


  // --- 3. DATA POUR VUE SOMMAIRE (CUMUL UNIQUE) ---
  const summaryData = useMemo(() => {
    const totalTurnover = dateFilteredTransactions.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = dateFilteredTransactions.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);
    const totalProfit = totalTurnover - totalExpense;
    
    // Pour la vue sommaire, on n'affiche qu'une barre globale représentant le total de la période
    const chart = [{
        period: period === 'Personnalisé' ? 'Période' : period,
        turnover: totalTurnover,
        expense: totalExpense,
        profit: totalProfit
    }];

    return {
        turnover: totalTurnover,
        expense: totalExpense,
        profit: totalProfit,
        chart
    };
  }, [dateFilteredTransactions, period]);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const periodLabel = period === 'Personnalisé' 
    ? `Du ${new Date(customStartDate || '').toLocaleDateString('fr-FR')} au ${new Date(customEndDate || '').toLocaleDateString('fr-FR')}`
    : `${period} en cours`;

  // ================= RENDER : VUE DÉTAILLÉE =================
  if (viewMode === 'detailed') {
      return (
          <div className="space-y-6 animate-fade-in pb-10">
              <div className="flex items-center gap-4 mb-6">
                  <button 
                    onClick={() => setViewMode('summary')}
                    className="p-3 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors shadow-sm group"
                  >
                      <ArrowLeft className="text-gray-600 group-hover:text-orange-600" />
                  </button>
                  <div>
                      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Analyse Granulaire</h2>
                      <p className="text-sm text-gray-500 font-bold">Décomposition temporelle du {periodLabel}</p>
                  </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Recettes</p>
                      <h3 className="text-3xl font-black text-blue-600">{detailedData.income.toLocaleString()} F</h3>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Dépenses</p>
                      <h3 className="text-3xl font-black text-red-500">{detailedData.expense.toLocaleString()} F</h3>
                  </div>
                  <div className="bg-gray-900 p-6 rounded-[2rem] shadow-lg text-white">
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Marge Net</p>
                      <h3 className={`text-3xl font-black ${detailedData.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {detailedData.profit.toLocaleString()} F
                      </h3>
                  </div>
              </div>

              {/* Graphe de décomposition temporelle (Spécificité demandée) */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wide">
                      <TrendingUp size={18} className="text-orange-500"/> Décomposition par {period === 'Année' ? 'Mois' : period === 'Mois' ? 'Semaines' : 'Jours'}
                  </h3>
                  <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={detailedData.chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12, fontWeight: 'bold'}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v} />
                              <Tooltip 
                                cursor={{fill: '#f9fafb'}}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                              />
                              <Legend />
                              <Bar dataKey="turnover" name="C.A." fill="#3b82f6" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="expense" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="profit" name="Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-6 text-sm uppercase">Performance Sites</h3>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={detailedData.bySite} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontWeight: 'bold', fontSize: 12}} />
                                <Tooltip />
                                <Bar dataKey="profit" name="Marge" fill="#22c55e" radius={[0, 10, 10, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-6 text-sm uppercase">Top Catégories</h3>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={detailedData.byCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                                    {detailedData.byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // ================= RENDER : VUE SOMMAIRE (CUMUL GLOBAL) =================
  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
       
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span className="font-bold uppercase tracking-wide">Période : {period}</span>
              </div>
              <span className="hidden md:inline mx-1">•</span>
              <span className="italic">{periodLabel}</span>
          </div>
          
          <button 
             onClick={() => setViewMode('detailed')}
             className="group flex items-center justify-center gap-2 bg-gray-900 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95"
          >
              Analyse détaillée <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
          </button>
       </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-black uppercase mb-1">Interventions</p>
          <h3 className="text-3xl font-black text-gray-800">{liveInterventions.length}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-black uppercase mb-1">C.A. Total</p>
          <h3 className="text-3xl font-black text-blue-600">{summaryData.turnover.toLocaleString()} F</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-xs font-black uppercase mb-1">Dépenses</p>
          <h3 className="text-3xl font-black text-red-500">{summaryData.expense.toLocaleString()} F</h3>
        </div>
        <div className="bg-gray-900 p-6 rounded-2xl shadow-lg text-white">
          <p className="text-gray-500 text-xs font-black uppercase mb-1">Bénéfice Net</p>
          <h3 className={`text-3xl font-black ${summaryData.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {summaryData.profit.toLocaleString()} F
          </h3>
        </div>
      </div>

      {/* Global Histogram (Unique bar for selected period) */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="mb-6">
            <h2 className="text-xl font-black text-gray-800">Synthèse de Période</h2>
            <p className="text-xs text-gray-500 font-bold uppercase">Résultat cumulé pour : {periodLabel}</p>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryData.chart} barGap={20}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(v) => v >= 1000 ? `${v/1000}k` : v} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '15px' }}
                    formatter={(v: number) => [`${v.toLocaleString()} F`]}
                  />
                  <Legend verticalAlign="top" height={40}/>
                  <Bar dataKey="turnover" name="C.A. Global" fill="#3b82f6" barSize={60} radius={[10, 10, 0, 0]} />
                  <Bar dataKey="expense" name="Dépenses" fill="#ef4444" barSize={60} radius={[10, 10, 0, 0]} />
                  <Bar dataKey="profit" name="Profit Net" fill="#22c55e" barSize={60} radius={[10, 10, 0, 0]} />
              </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;