
import React from 'react';
import { Period, Site, Transaction, Intervention } from '../types';
import { 
  TrendingUp, 
  ArrowRight, 
  ArrowDown, 
  ArrowUp, 
  Briefcase, 
  Activity, 
  DollarSign
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface DashboardProps {
  site: Site;
  period: Period;
  customStartDate?: string;
  customEndDate?: string;
  liveTransactions?: Transaction[];
  liveInterventions?: Intervention[];
}

const Dashboard: React.FC<DashboardProps> = ({ period, liveTransactions = [], liveInterventions = [] }) => {
  // Calculs KPI
  const turnover = liveTransactions.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
  const expenses = liveTransactions.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);
  const profit = turnover - expenses;
  const interventionsCount = liveInterventions.length;
  
  // Données Graphique (Simulées pour la démo, à adapter avec vraies dates si besoin)
  const chartData = [
    { name: 'Lun', entree: 4000, sortie: 2400 },
    { name: 'Mar', entree: 3000, sortie: 1398 },
    { name: 'Mer', entree: 2000, sortie: 9800 },
    { name: 'Jeu', entree: 2780, sortie: 3908 },
    { name: 'Ven', entree: 1890, sortie: 4800 },
    { name: 'Sam', entree: 2390, sortie: 3800 },
    { name: 'Dim', entree: 3490, sortie: 4300 },
  ];

  return (
    <div className="animate-fade-in pb-10">
      
      {/* =====================================================================================
          VUE MOBILE (APP STYLE) - Visible uniquement sur petit écran (md:hidden)
         ===================================================================================== */}
      <div className="md:hidden space-y-6">
        {/* KPI Mobile Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm active:scale-95 transition-transform">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">C.A. Total</p>
            <h3 className="text-xl font-black text-blue-600">{turnover.toLocaleString()}</h3>
            <div className="flex items-center gap-1 text-[8px] font-bold text-green-500 mt-1">
              <ArrowUp size={10} /> +12%
            </div>
          </div>
          <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm active:scale-95 transition-transform">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Dépenses</p>
            <h3 className="text-xl font-black text-red-500">{expenses.toLocaleString()}</h3>
            <div className="flex items-center gap-1 text-[8px] font-bold text-red-400 mt-1">
              <ArrowDown size={10} /> -5%
            </div>
          </div>
          <div className="bg-gray-900 p-5 rounded-[1.5rem] shadow-lg text-white col-span-2 relative overflow-hidden active:scale-[0.98] transition-transform">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <TrendingUp size={60} />
            </div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Bénéfice Net</p>
                <h3 className={`text-2xl font-black ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profit.toLocaleString()} <span className="text-xs font-bold text-gray-600">F</span>
                </h3>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl">
                <TrendingUp size={24} className="text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Interventions Mobile Cards */}
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[10px] font-black uppercase text-gray-800 tracking-widest">Missions Récentes</h3>
            <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black">{liveInterventions.length} TOTAL</span>
          </div>
          <div className="space-y-3">
            {liveInterventions.slice(0, 3).map(inter => (
              <div key={inter.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl active:bg-orange-50 transition-colors">
                <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600 shrink-0">
                  <Briefcase size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{inter.client}</p>
                  <p className="text-[10px] font-bold text-gray-500 truncate mt-0.5 uppercase tracking-wide">{inter.status} • {inter.technician}</p>
                </div>
                <ArrowRight size={16} className="text-gray-300" />
              </div>
            ))}
            {liveInterventions.length === 0 && (
               <p className="text-center text-gray-400 text-[10px] font-bold py-4">AUCUNE MISSION EN COURS</p>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================================================
          VUE DESKTOP / TABLETTE (ADMIN STYLE) - Visible uniquement sur grand écran (hidden md:block)
         ===================================================================================== */}
      <div className="hidden md:block space-y-6">
        
        {/* Ligne KPI Classique (4 colonnes) */}
        <div className="grid grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><DollarSign size={24}/></div>
                    <span className="text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">+12.5%</span>
                </div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Chiffre d'Affaires</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{turnover.toLocaleString()} <span className="text-sm text-gray-400">FCFA</span></h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-red-50 p-3 rounded-xl text-red-600"><Activity size={24}/></div>
                    <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded-lg">+4.2%</span>
                </div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Dépenses</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{expenses.toLocaleString()} <span className="text-sm text-gray-400">FCFA</span></h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-green-50 p-3 rounded-xl text-green-600"><TrendingUp size={24}/></div>
                    <span className="text-gray-400 text-xs font-bold px-2 py-1">Net</span>
                </div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Bénéfice Net</p>
                <h3 className={`text-2xl font-black mt-1 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profit.toLocaleString()} <span className="text-sm text-gray-400">FCFA</span>
                </h3>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-orange-50 p-3 rounded-xl text-orange-600"><Briefcase size={24}/></div>
                    <span className="text-orange-500 text-xs font-bold bg-orange-50 px-2 py-1 rounded-lg">Actives</span>
                </div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Interventions</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{interventionsCount}</h3>
            </div>
        </div>

        {/* Section Graphique & Transactions Récentes */}
        <div className="grid grid-cols-3 gap-6">
            {/* Grand Graphique */}
            <div className="col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="text-orange-500" size={20}/>
                        Analyse Financière ({period})
                    </h3>
                    <select className="bg-gray-50 border-none text-xs font-bold text-gray-600 rounded-lg px-3 py-2 outline-none">
                        <option>Cette Semaine</option>
                        <option>Ce Mois</option>
                    </select>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorEntree" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorSortie" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10}/>
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}}/>
                            <Tooltip 
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}}
                                itemStyle={{fontSize: '12px', fontWeight: 'bold'}}
                            />
                            <Area type="monotone" dataKey="entree" name="Recettes" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorEntree)" />
                            <Area type="monotone" dataKey="sortie" name="Dépenses" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorSortie)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Liste Transactions Compacte */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Derniers Mouvements</h3>
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
                    {liveTransactions.slice(0, 6).map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'Recette' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {t.type === 'Recette' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-gray-800 truncate w-24">{t.category}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <span className={`text-xs font-black ${t.type === 'Recette' ? 'text-green-600' : 'text-red-600'}`}>
                                {t.type === 'Recette' ? '+' : '-'}{t.amount.toLocaleString()}
                            </span>
                        </div>
                    ))}
                    {liveTransactions.length === 0 && <p className="text-gray-400 text-xs text-center py-4">Aucune donnée</p>}
                </div>
            </div>
        </div>

        {/* Tableau des Interventions Récentes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Briefcase className="text-orange-500" size={20}/>
                    Suivi des Missions
                </h3>
                <button className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100 transition-colors">
                    Voir tout
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-bold">Client</th>
                            <th className="px-6 py-4 font-bold">Technicien</th>
                            <th className="px-6 py-4 font-bold">Date</th>
                            <th className="px-6 py-4 font-bold">Site</th>
                            <th className="px-6 py-4 font-bold">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {liveInterventions.slice(0, 5).map(inter => (
                            <tr key={inter.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-900">
                                    {inter.client}
                                    <span className="block text-[10px] text-gray-400 font-normal">{inter.interventionType}</span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600">
                                        {inter.technician.charAt(0)}
                                    </div>
                                    {inter.technician}
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-xs font-bold">{new Date(inter.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 uppercase">{inter.site}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide
                                        ${inter.status === 'Terminé' ? 'bg-green-100 text-green-700' : 
                                          inter.status === 'En cours' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {inter.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
