import React from 'react';
import { Period, Site, Transaction, Intervention } from '../types';
import { TrendingUp, ArrowRight, ArrowDown, ArrowUp, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  site: Site;
  period: Period;
  customStartDate?: string;
  customEndDate?: string;
  liveTransactions?: Transaction[];
  liveInterventions?: Intervention[];
}

const Dashboard: React.FC<DashboardProps> = ({ period, liveTransactions = [], liveInterventions = [] }) => {
  const turnover = liveTransactions.filter(t => t.type === 'Recette').reduce((acc, t) => acc + t.amount, 0);
  const expenses = liveTransactions.filter(t => t.type === 'Dépense').reduce((acc, t) => acc + t.amount, 0);
  const profit = turnover - expenses;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* KPI Mobile Grid - 2 columns for quick scanning */}
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

      {/* Interventions Highlight - Larger touch targets */}
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

      {/* Simplified Chart for mobile */}
      <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
        <h3 className="text-[10px] font-black uppercase text-gray-800 tracking-widest mb-6">Activité {period}</h3>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{n: 'L', v: 400}, {n: 'M', v: 700}, {n: 'M', v: 500}, {n: 'J', v: 900}, {n: 'V', v: 600}]}>
              <Bar dataKey="v" fill="#f97316" radius={[6, 6, 0, 0]} />
              <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '12px'}} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;