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
  ComposedChart,
  Line
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

  // --- 1. FILTRAGE GLOBAL PAR DATE ET SITE ---
  const dateFilteredTransactions = useMemo(() => {
    return liveTransactions.filter(t => {
      const tDate = new Date(t.date);
      const now = new Date();
      
      // Filtre Période
      let matchPeriod = true;
      if (period === 'Jour') matchPeriod = tDate.toDateString() === now.toDateString();
      else if (period === 'Semaine') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        matchPeriod = tDate >= oneWeekAgo;
      } else if (period === 'Mois') matchPeriod = tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      else if (period === 'Année') matchPeriod = tDate.getFullYear() === now.getFullYear();
      else if (period === 'Personnalisé' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        matchPeriod = tDate >= start && tDate <= end;
      }

      // Filtre Site (Uniquement si on est dans la vue Summary ou si on filtre par site globalement)
      const matchSite = site === 'Global' ? true : t.site === site;

      return matchPeriod && matchSite;
    });
  }, [liveTransactions, site, period, customStartDate, customEndDate]);

  // --- 2. LOGIQUE DE CATÉGORISATION (SOURCE) ---
  const getTransactionSource = (t: Transaction): 'hardware' | 'secretariat' | 'accounting' => {
      const cat = t.category.toLowerCase();
      if (cat.includes('magasin') || cat.includes('stock') || cat.includes('vente comptoir') || cat.includes('outillage')) return 'hardware';
      if (cat.includes('prestation') || cat.includes('caisse') || cat.includes('acompte') || cat.includes('service')) return 'secretariat';
      return 'accounting';
  };

  // --- 3. DATA POUR VUE DÉTAILLÉE ---
  const detailedData = useMemo(() => {
    let data = dateFilteredTransactions;

    // Filtre par Onglet (Source)
    if (detailFilter !== 'all') {
        data = data.filter(t => getTransactionSource(t) === detailFilter);
    }

    const income = data.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
    const expense = data.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);
    const profit = income - expense;

    // Répartition par Site pour le graphe comparatif
    const bySite = [
        { name: 'Abidjan', income: 0, expense: 0, profit: 0 },
        { name: 'Bouaké', income: 0, expense: 0, profit: 0 }
    ];

    data.forEach(t => {
        const siteIndex = t.site === 'Bouaké' ? 1 : 0;
        if (t.type === 'Recette') bySite[siteIndex].income += t.amount;
        else bySite[siteIndex].expense += t.amount;
    });

    // Calcul du bénéfice par site
    bySite.forEach(item => {
        item.profit = item.income - item.expense;
    });

    // Répartition par Catégorie (Pie Chart)
    const byCategoryMap = new Map<string, number>();
    data.forEach(t => {
        const val = t.amount;
        const current = byCategoryMap.get(t.category) || 0;
        byCategoryMap.set(t.category, current + val);
    });
    const byCategory = Array.from(byCategoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6); // Top 6

    return { income, expense, profit, bySite, byCategory, transactions: data };
  }, [dateFilteredTransactions, detailFilter]);


  // --- 4. DATA POUR VUE SOMMAIRE (GLOBAL) ---
  const summaryData = useMemo(() => {
    const totalTurnover = dateFilteredTransactions.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = dateFilteredTransactions.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);
    const totalProfit = totalTurnover - totalExpense;
    
    // Graphique évolution
    const map = new Map<string, { period: string; turnover: number; expense: number; profit: number }>();
    const dates = (Array.from(new Set(dateFilteredTransactions.map(t => t.date))) as string[]).sort();
    if (dates.length === 0) dates.push(new Date().toISOString().split('T')[0]);

    dates.forEach(dateStr => {
        const d = new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        map.set(dateStr, { period: d, turnover: 0, expense: 0, profit: 0 });
    });

    dateFilteredTransactions.forEach(t => {
        const entry = map.get(t.date);
        if (entry) {
            if (t.type === 'Recette') entry.turnover += t.amount;
            else entry.expense += t.amount;
            entry.profit = entry.turnover - entry.expense;
        }
    });

    return {
        turnover: totalTurnover,
        expense: totalExpense,
        profit: totalProfit,
        chart: Array.from(map.values())
    };
  }, [dateFilteredTransactions]);

  // Palette Pie Chart
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  
  const periodLabel = period === 'Personnalisé' 
    ? `Du ${new Date(customStartDate || '').toLocaleDateString('fr-FR')} au ${new Date(customEndDate || '').toLocaleDateString('fr-FR')}`
    : `${period} en cours`;


  // ================= RENDER : VUE DÉTAILLÉE =================
  if (viewMode === 'detailed') {
      return (
          <div className="space-y-6 animate-fade-in pb-10">
              {/* Header Navigation */}
              <div className="flex items-center gap-4 mb-6">
                  <button 
                    onClick={() => setViewMode('summary')}
                    className="p-3 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors shadow-sm group"
                  >
                      <ArrowLeft className="text-gray-600 group-hover:text-orange-600" />
                  </button>
                  <div>
                      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Synthèse Détaillée</h2>
                      <p className="text-sm text-gray-500 font-bold">Analyse approfondie par département</p>
                  </div>
                  <div className="ml-auto bg-orange-100 text-orange-700 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest hidden md:block">
                      {periodLabel}
                  </div>
              </div>

              {/* Filtres Onglets */}
              <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap gap-2">
                  <button 
                    onClick={() => setDetailFilter('all')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all
                    ${detailFilter === 'all' ? 'bg-gray-900 text-white shadow-lg' : 'bg-transparent text-gray-500 hover:bg-gray-50'}`}
                  >
                      <LayoutGrid size={16}/> Vue Ensemble
                  </button>
                  <button 
                    onClick={() => setDetailFilter('hardware')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all
                    ${detailFilter === 'hardware' ? 'bg-orange-500 text-white shadow-lg' : 'bg-transparent text-gray-500 hover:bg-orange-50'}`}
                  >
                      <Store size={16}/> Quincaillerie
                  </button>
                  <button 
                    onClick={() => setDetailFilter('secretariat')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all
                    ${detailFilter === 'secretariat' ? 'bg-green-600 text-white shadow-lg' : 'bg-transparent text-gray-500 hover:bg-green-50'}`}
                  >
                      <Briefcase size={16}/> Secrétariat
                  </button>
                  <button 
                    onClick={() => setDetailFilter('accounting')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all
                    ${detailFilter === 'accounting' ? 'bg-blue-600 text-white shadow-lg' : 'bg-transparent text-gray-500 hover:bg-blue-50'}`}
                  >
                      <Calculator size={16}/> Comptabilité
                  </button>
              </div>

              {/* KPIs Détaillés */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Entrées</p>
                      <h3 className="text-3xl font-black text-gray-800">{detailedData.income.toLocaleString()} <span className="text-sm text-gray-400">F</span></h3>
                      <div className="mt-2 text-xs font-bold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded-lg">Recettes {detailFilter === 'all' ? 'Globales' : detailFilter}</div>
                  </div>
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Sorties</p>
                      <h3 className="text-3xl font-black text-red-500">{detailedData.expense.toLocaleString()} <span className="text-sm text-gray-400">F</span></h3>
                      <div className="mt-2 text-xs font-bold text-red-600 bg-red-50 inline-block px-2 py-1 rounded-lg">Dépenses {detailFilter === 'all' ? 'Globales' : detailFilter}</div>
                  </div>
                  <div className="bg-gray-900 p-6 rounded-[2rem] shadow-lg text-white">
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Résultat Net</p>
                      <h3 className={`text-3xl font-black ${detailedData.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {detailedData.profit > 0 ? '+' : ''}{detailedData.profit.toLocaleString()} <span className="text-sm text-gray-600">F</span>
                      </h3>
                      <div className="mt-2 text-xs font-bold text-gray-400">Marge sur la période</div>
                  </div>
              </div>

              {/* Graphiques Comparatifs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Comparaison Sites */}
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <MapPin size={18} className="text-orange-500"/> Performance par Site
                      </h3>
                      <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={detailedData.bySite} barSize={30}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12, fontWeight: 'bold'}} />
                                  <Tooltip 
                                    cursor={{fill: '#f9fafb'}}
                                    formatter={(value: number) => [`${value.toLocaleString()} F`]}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px', fontWeight: 'bold' }}
                                  />
                                  <Legend wrapperStyle={{paddingTop: '20px'}}/>
                                  <Bar dataKey="income" name="Recettes" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                  <Bar dataKey="expense" name="Dépenses" fill="#ef4444" radius={[6, 6, 0, 0]} />
                                  <Bar dataKey="profit" name="Bénéfice" fill="#22c55e" radius={[6, 6, 0, 0]} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Top Catégories */}
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                      <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wide">
                          <PieIcon size={18} className="text-blue-500"/> Répartition des Flux
                      </h3>
                      <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie 
                                    data={detailedData.byCategory} 
                                    cx="50%" cy="50%" 
                                    innerRadius={80} 
                                    outerRadius={100} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                  >
                                      {detailedData.byCategory.map((_, index) => (
                                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                                      ))}
                                  </Pie>
                                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()} F`]} contentStyle={{borderRadius: '12px', border: 'none', fontWeight: 'bold'}} />
                                  <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}} />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>

               {/* Liste des dernières transactions filtrées */}
               <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">Historique Filtré ({detailFilter === 'all' ? 'Tout' : detailFilter})</h3>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left whitespace-nowrap">
                          <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase tracking-widest">
                              <tr>
                                  <th className="px-6 py-4">Date</th>
                                  <th className="px-6 py-4">Description</th>
                                  <th className="px-6 py-4">Catégorie</th>
                                  <th className="px-6 py-4">Site</th>
                                  <th className="px-6 py-4 text-right">Montant</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-600">
                              {detailedData.transactions.slice(0, 10).map(t => (
                                  <tr key={t.id} className="hover:bg-gray-50">
                                      <td className="px-6 py-4">{new Date(t.date).toLocaleDateString()}</td>
                                      <td className="px-6 py-4 text-gray-900">{t.description}</td>
                                      <td className="px-6 py-4"><span className="bg-gray-100 px-2 py-1 rounded-md">{t.category}</span></td>
                                      <td className="px-6 py-4">{t.site}</td>
                                      <td className={`px-6 py-4 text-right ${t.type === 'Recette' ? 'text-green-600' : 'text-red-500'}`}>
                                          {t.type === 'Recette' ? '+' : '-'}{t.amount.toLocaleString()} F
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
               </div>
          </div>
      );
  }

  // ================= RENDER : VUE SOMMAIRE (DEFAULT) =================
  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
       
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                <span className="font-bold uppercase tracking-wide">Vue : {site === 'Global' ? 'Tous sites' : site}</span>
              </div>
              <span className="hidden md:inline mx-1">•</span>
              <span className="italic">{periodLabel}</span>
          </div>
          
          <button 
             onClick={() => setViewMode('detailed')}
             className="group flex items-center justify-center gap-2 bg-gray-900 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95"
          >
              Synthèse Détaillée <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
          </button>
       </div>

      {/* Stats Cards - Global Synthesis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-1 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-gray-400 text-xs font-black uppercase tracking-wider mb-1">Interventions Tech</p>
            <h3 className="text-3xl font-black text-gray-800">{liveInterventions.length}</h3>
          </div>
          <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
            <Activity size={28} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-2">
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-wider mb-1">C.A. Global</p>
            <h3 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">{(summaryData.turnover).toLocaleString()} <span className="text-sm text-gray-400">F</span></h3>
          </div>
          {/* UPDATE COULEUR: ICONE BLEUE */}
          <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
            <DollarSign size={28} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-3">
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-wider mb-1">Dépenses Globales</p>
            <h3 className="text-2xl md:text-3xl font-black text-red-500 tracking-tight">{(summaryData.expense).toLocaleString()} <span className="text-sm text-red-300">F</span></h3>
          </div>
          <div className="bg-red-50 p-3 rounded-2xl text-red-500">
            <TrendingDown size={28} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-4">
          <div>
            <p className="text-gray-400 text-xs font-black uppercase tracking-wider mb-1">Marge Nette</p>
            <h3 className={`text-2xl md:text-3xl font-black tracking-tight ${summaryData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summaryData.profit > 0 ? '+' : ''}{(summaryData.profit).toLocaleString()} <span className="text-sm opacity-50">F</span>
            </h3>
          </div>
          <div className="bg-green-50 p-3 rounded-2xl text-green-600">
            <TrendingUp size={28} />
          </div>
        </div>

      </div>

      {/* Main Histogram Section */}
      <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 hover-lift stagger-2">
        <div className="mb-4 md:mb-6 flex justify-between items-center">
            <div>
                <h2 className="text-lg md:text-xl font-black text-gray-800 mb-1">Performance Financière</h2>
                <p className="text-xs text-gray-500 font-medium">Evolution journalière (CA, Dépenses et Bénéfices)</p>
            </div>
        </div>
        
        <div className="h-[300px] md:h-[400px] w-full -ml-2">
          {summaryData.chart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={summaryData.chart}
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
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}}/>
                    
                    {/* Barres pour CA, Dépenses et Bénéfices */}
                    <Bar dataKey="turnover" name="Chiffre d'Affaires" fill="#3b82f6" barSize={15} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Dépenses" fill="#ef4444" barSize={15} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Bénéfice Net" fill="#22c55e" barSize={15} radius={[4, 4, 0, 0]} />
                </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Aucune donnée disponible</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;