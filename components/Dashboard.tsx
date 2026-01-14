
import React from 'react';
import { Period, Site, Transaction, Intervention } from '../types';
import { TrendingUp, ArrowRight, ArrowDown, ArrowUp, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  site: Site;
  period: Period;
  liveTransactions?: Transaction[];
  liveInterventions?: Intervention[];
}

const Dashboard: React.FC<DashboardProps> = ({ site, period, liveTransactions = [], liveInterventions = [] }) => {
  const turnover = liveTransactions.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
  const expenses = liveTransactions.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);
  const profit = turnover - expenses;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* KPI Mobile Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">C.A. Total</p>
          <h3 className="text-xl font-black text-blue-600">{turnover.toLocaleString()}</h3>
          <div className="flex items-center gap-1 text-[8px] font-bold text-green-500 mt-1">
            <ArrowUp size={10} /> +12%
          </div>
        </div>
        <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Dépenses</p>
          <h3 className="text-xl font-black text-red-500">{expenses.toLocaleString()}</h3>
          <div className="flex items-center gap-1 text-[8px] font-bold text-red-400 mt-1">
            <ArrowDown size={10} /> -5%
          </div>
        </div>
        <div className="bg-gray-900 p-4 rounded-[1.5rem] shadow-lg text-white col-span-2">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Marge Bénéficiaire</p>
              <h3 className={`text-2xl font-black ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profit.toLocaleString()} <span className="text-xs font-bold text-gray-600">F</span>
              </h3>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl">
              <TrendingUp size={20} className="text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Interventions Highlight */}
      <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black uppercase text-gray-800 tracking-widest">Dernières Missions</h3>
          <span className="bg-orange-50 text-orange-600 px-2 py-1 rounded-lg text-[10px] font-bold">{liveInterventions.length} au total</span>
        </div>
        <div className="space-y-3">
          {liveInterventions.slice(0, 3).map(inter => (
            <div key={inter.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                <Briefcase size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">{inter.client}</p>
                <p className="text-[10px] font-bold text-gray-500 truncate">{inter.description}</p>
              </div>
              <ArrowRight size={14} className="text-gray-300" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
        <h3 className="text-xs font-black uppercase text-gray-800 tracking-widest mb-4">Activité du {period}</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{n: 'Lun', v: 400}, {n: 'Mar', v: 700}, {n: 'Mer', v: 500}, {n: 'Jeu', v: 900}, {n: 'Ven', v: 600}]}>
              <Bar dataKey="v" fill="#f97316" radius={[6, 6, 0, 0]} />
              <XAxis dataKey="n" hide />
              <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)'}} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
