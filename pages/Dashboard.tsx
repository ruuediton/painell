
import React from 'react';
import StatCard from '../components/StatCard';
import { Icons, COLORS } from '../constants';
import { MOCK_USERS, MOCK_TRANSACTIONS, MOCK_PRODUCTS, DASHBOARD_CHARTS } from '../services/mockData';
import { Page, TransactionStatus } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

interface DashboardProps {
  setCurrentPage: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setCurrentPage }) => {
  const totalUsers = MOCK_USERS.length;
  const totalDepositsCount = MOCK_TRANSACTIONS.filter(t => t.type === 'DEPOSIT').length;
  const activeProductsCount = MOCK_PRODUCTS.filter(p => p.status === 'ACTIVE').length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const withdrawalsToday = MOCK_TRANSACTIONS
    .filter(t => t.type === 'WITHDRAWAL' && t.date.includes(todayStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaidDeposits = MOCK_TRANSACTIONS
    .filter(t => t.type === 'DEPOSIT' && t.status === TransactionStatus.RECHARGED)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Visão Geral</h2>
          <p className="text-slate-500 font-medium">Métricas de desempenho do ecossistema painelDeeBank.</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-sky-500 bg-sky-50 px-3 py-1 rounded-full uppercase tracking-widest border border-sky-100">
            Atualizado agora
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total de Usuários" 
          value={totalUsers} 
          icon={<Icons.Users />} 
          trend={{ value: '12%', positive: true }}
          onClick={() => setCurrentPage('users')}
        />
        <StatCard 
          title="Saques Hoje" 
          value={`R$ ${withdrawalsToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={<Icons.Withdrawals />} 
          trend={{ value: '5%', positive: false }}
          onClick={() => setCurrentPage('withdrawals')}
        />
        <StatCard 
          title="Volume de Depósitos" 
          value={`R$ ${totalPaidDeposits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={<Icons.Deposits />} 
          onClick={() => setCurrentPage('deposits')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Crescimento de Usuários</h4>
            <Icons.Dashboard />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DASHBOARD_CHARTS.userGrowth}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '700'}}
                />
                <Area type="monotone" dataKey="users" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Fluxo Financeiro Semanal</h4>
            <Icons.Deposits />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DASHBOARD_CHARTS.financeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '700'}}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}} />
                <Bar dataKey="deposits" name="Depósitos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="withdrawals" name="Saques" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-10 rounded-[40px] shadow-2xl shadow-slate-200 border border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icons.Dashboard />
        </div>
        <div className="relative z-10 space-y-4">
            <h3 className="text-sky-400 font-black uppercase tracking-[0.3em] text-sm">Central de Controle v1.0</h3>
            <p className="text-slate-300 max-w-2xl text-lg font-medium leading-relaxed">
              O painelDeeBank permite a gestão granular de todas as operações financeiras via telefone. Monitore transações pendentes e audite ações administrativas em tempo real.
            </p>
            <div className="flex gap-4 pt-4">
                <button onClick={() => setCurrentPage('logs')} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">
                    Ver Logs de Auditoria
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
