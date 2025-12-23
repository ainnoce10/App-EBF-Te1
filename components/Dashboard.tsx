import React, { useState } from 'react';
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
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { MOCK_DASHBOARD_DATA, COLORS } from '../constants';
import { Period, Site } from '../types';
import { Activity, TrendingUp, TrendingDown, DollarSign, ChevronDown, ChevronUp, Filter, Layers, Target, PieChart as PieIcon, Calendar } from 'lucide-react';

interface DashboardProps {
  site: Site;
  period: Period;
  customStartDate?: string;
  customEndDate?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ site, period, customStartDate, customEndDate }) => {
  const [showDetailed, setShowDetailed] = useState(false);
  
  // États filtres synthèse
  const [synthesisFilter, setSynthesisFilter] = useState<'global' | 'finance' | 'tech'>('global');
  const [showComparison, setShowComparison] = useState(true);

  // LOGIQUE DE SIMULATION DES DONNÉES
  const data = MOCK_DASHBOARD_DATA.map(d => {
    let multiplier = 1;
    if (site === 'Global') multiplier = 1.8;
    else if (site === 'Bouaké') multiplier = 0.8;
    const turnover = d.turnover * multiplier;
    const profit = d.profit * (site === 'Global' ? 1.7 : multiplier * 0.9); 
    const expense = turnover - profit;
    return { ...d, turnover, profit, expense, interventions: Math.round(d.interventions * multiplier) };
  });

  const totalTurnover = data.reduce((acc, curr) => acc + curr.turnover, 0);
  const totalExpense = data.reduce((acc, curr) => acc + curr.expense, 0);
  const totalProfit = data.reduce((acc, curr) => acc + curr.profit, 0);
  const totalInterventions = data.reduce((acc, curr) => acc + curr.interventions, 0);

  const periodLabel = period === 'Personnalisé' 
    ? `Du ${new Date(customStartDate || '').toLocaleDateString('fr-FR')} au ${new Date(customEndDate || '').toLocaleDateString('fr-FR')}`
    : `${period} en cours`;

  const getPieData = () => {
    if (synthesisFilter === 'finance') return [{ name: 'Matériel', value: 400 }, { name: 'Main d\'œuvre', value: 300 }, { name: 'Transport', value: 300 }, { name: 'Frais Généraux', value: 200 }];
    if (synthesisFilter === 'tech') return [{ name: 'Électricité', value: 45 }, { name: 'Plomberie', value: 30 }, { name: 'Climatisation', value: 15 }, { name: 'Réseau', value: 10 }];
    return [{ name: 'Opérations', value: 60 }, { name: 'Administration', value: 20 }, { name: 'Commercial', value: 20 }];
  };

  const getRadarData = () => {
    if (synthesisFilter === 'finance') return [{ subject: 'Rentabilité', A: 120, B: 110, fullMark: 150 }, { subject: 'Trésorerie', A: 98, B: 130, fullMark: 150 }, { subject: 'Recouvrement', A: 86, B: 130, fullMark: 150 }, { subject: 'Marges', A: 99, B: 100, fullMark: 150 }, { subject: 'Invest.', A: 85, B: 90, fullMark: 150 }];
    if (synthesisFilter === 'tech') return [{ subject: 'Vitesse', A: 130, B: 100, fullMark: 150 }, { subject: 'Qualité', A: 110, B: 130, fullMark: 150 }, { subject: 'Sécurité', A: 140, B: 110, fullMark: 150 }, { subject: 'Satisfaction', A: 100, B: 90, fullMark: 150 }, { subject: 'Respect Délais', A: 95, B: 85, fullMark: 150 }];
    return [{ subject: 'Vitesse', A: 120, B: 110, fullMark: 150 }, { subject: 'Qualité', A: 98, B: 130, fullMark: 150 }, { subject: 'Coût', A: 86, B: 130, fullMark: 150 }, { subject: 'Client', A: 99, B: 100, fullMark: 150 }, { subject: 'Sécurité', A: 85, B: 90, fullMark: 150 }, { subject: 'Rentabilité', A: 65, B: 85, fullMark: 150 }];
  };

  const pieData = getPieData();
  const radarData = getRadarData();
  const PIE_COLORS = [COLORS.primary, COLORS.secondary, '#eab308', '#3b82f6'];

  return (
    <div className="space-y-6">
       
       <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Calendar size={16} />
          <span>Données filtrées : <strong className="text-gray-700">{site === 'Global' ? 'Tous les sites' : site}</strong> — {periodLabel}</span>
       </div>

      {/* Header Stats Cards with Sequential Animation */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* 1. Interventions */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-1">
          <div>
            <p className="text-gray-500 text-sm">Interventions</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalInterventions}</h3>
          </div>
          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
            <Activity size={24} />
          </div>
        </div>

        {/* 2. Chiffre d'Affaires */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-2">
          <div>
            <p className="text-gray-500 text-sm">Chiffre d'affaires</p>
            <h3 className="text-2xl font-bold text-gray-800">{(totalTurnover / 1000000).toFixed(2)}M FCFA</h3>
          </div>
          <div className="bg-orange-100 p-2 rounded-full text-orange-600">
            <DollarSign size={24} />
          </div>
        </div>

        {/* 3. Dépenses */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-3">
          <div>
            <p className="text-gray-500 text-sm">Dépenses</p>
            <h3 className="text-2xl font-bold text-red-500">{(totalExpense / 1000000).toFixed(2)}M FCFA</h3>
          </div>
          <div className="bg-red-100 p-2 rounded-full text-red-600">
            <TrendingDown size={24} />
          </div>
        </div>

        {/* 4. Bénéfices */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover-lift stagger-4">
          <div>
            <p className="text-gray-500 text-sm">Bénéfices</p>
            <h3 className="text-2xl font-bold text-green-600">+{(totalProfit / 1000).toFixed(0)}k FCFA</h3>
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
          <p className="text-sm text-gray-500">Comparatif CA, Dépenses et Bénéfices ({site === 'Global' ? 'Global' : site} - {period === 'Personnalisé' ? 'Période personnalisée' : period})</p>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
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
                      Comparer avec N-1
                   </label>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover-lift">
                <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><PieIcon size={18} className="text-gray-400"/>Répartition</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" animationBegin={200}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover-lift">
                <h3 className="font-bold text-gray-700 mb-4">Tendances Hebdomadaires</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="period" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
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