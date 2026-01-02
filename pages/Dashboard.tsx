import React from 'react';
import StatCard from '../components/StatCard';
import { Icons } from '../constants';
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

  const todayStr = new Date().toISOString().split('T')[0];
  const withdrawalsToday = MOCK_TRANSACTIONS
    .filter(t => t.type === 'WITHDRAWAL' && t.date.includes(todayStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaidDeposits = MOCK_TRANSACTIONS
    .filter(t => t.type === 'DEPOSIT' && t.status === TransactionStatus.RECHARGED)
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-12 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Visão Geral</h2>
          <p className="text-slate-500 font-medium text-lg mt-2">Bem-vindo ao centro de comando do deeBank.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mx-2"></div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pr-2">
            Dados em Tempo Real
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <div className="premium-card p-10 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Crescimento</h4>
              <p className="text-xl font-black text-slate-900">Novos Usuários</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-500 rounded-2xl">
              <Icons.Dashboard />
            </div>
          </div>
          <div className="h-[320px] w-full mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DASHBOARD_CHARTS.userGrowth}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '800', padding: '15px' }}
                />
                <Area type="monotone" dataKey="users" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card p-10 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Performance</h4>
              <p className="text-xl font-black text-slate-900">Fluxo de Caixa</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
              <Icons.Deposits />
            </div>
          </div>
          <div className="h-[320px] w-full mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DASHBOARD_CHARTS.financeData}>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '800', padding: '15px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '30px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }} />
                <Bar dataKey="deposits" name="Depósitos" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="withdrawals" name="Saques" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-12 rounded-[3rem] shadow-2xl shadow-sky-900/10 border border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] group-hover:bg-sky-500/20 transition-all duration-700"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 text-center md:text-left">
            <h3 className="text-white font-black uppercase tracking-[0.3em] text-sm">deeBank Ecosystem v2.0</h3>
            <p className="text-slate-400 max-w-xl text-lg font-medium leading-relaxed">
              Gerencie transações, audite usuários e monitore o crescimento da sua plataforma financeira em um só lugar.
            </p>
            <div className="flex flex-wrap gap-4 pt-6 justify-center md:justify-start">
              <button onClick={() => setCurrentPage('logs')} className="px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95">
                Ver Logs do Sistema
              </button>
              <button onClick={() => setCurrentPage('settings')} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10">
                Configurações Pro
              </button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-48 h-48 bg-sky-500/10 rounded-[3rem] border border-sky-500/20 flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-700">
              <div className="w-24 h-24 text-sky-500">
                <Icons.Dashboard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
