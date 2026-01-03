import React, { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import { Icons } from '../constants';
import { Page, TransactionStatus } from '../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { supabase } from '../services/supabase';

interface DashboardProps {
  setCurrentPage: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setCurrentPage }) => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    withdrawalsToday: 0,
    totalDeposits: 0,
    totalVipUsers: 0,
    loading: true
  });

  const [chartData, setChartData] = useState({
    userGrowth: [] as any[],
    financeData: [] as any[]
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Total Users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 2. Withdrawals Today
      const today = new Date().toISOString().split('T')[0];
      const { data: withdrawals } = await supabase
        .from('retirada_clientes')
        .select('valor_solicitado')
        .eq('data_da_retirada', today)
        .eq('estado_da_retirada', 'concluido'); // Assuming 'concluido' is the success status

      const totalWithdrawals = withdrawals?.reduce((sum, w) => sum + Number(w.valor_solicitado), 0) || 0;

      // 3. Volume of Deposits (Paid)
      const { data: deposits } = await supabase
        .from('depositos_clientes')
        .select('valor_deposito')
        .eq('estado_de_pagamento', 'recarregado'); // Based on TransactionStatus.RECHARGED equivalent

      const totalDepositsVolume = deposits?.reduce((sum, d) => sum + Number(d.valor_deposito), 0) || 0;

      // 4. VIP Users (Amount Paid >= 9000)
      const { data: vipPurchases } = await supabase
        .from('user_purchases')
        .select('user_id')
        .gte('amount_paid', 9000);

      const uniqueVips = new Set(vipPurchases?.map(p => p.user_id)).size;

      setStats({
        totalUsers: usersCount || 0,
        withdrawalsToday: totalWithdrawals,
        totalDeposits: totalDepositsVolume,
        totalVipUsers: uniqueVips,
        loading: false
      });

      // Simple mock growth data for now, or fetch if needed
      setChartData({
        userGrowth: [
          { name: 'Jan', users: 100 },
          { name: 'Fev', users: 150 },
          { name: 'Mar', users: 300 },
          { name: 'Abr', users: 500 },
          { name: 'Mai', users: usersCount || 0 },
        ],
        financeData: [
          { name: 'Seg', deposits: 4000, withdrawals: 2400 },
          { name: 'Ter', deposits: 3000, withdrawals: 1398 },
          { name: 'Qua', deposits: 2000, withdrawals: 9800 },
          { name: 'Qui', deposits: 2780, withdrawals: 3908 },
          { name: 'Sex', deposits: 1890, withdrawals: 4800 },
          { name: 'Sab', deposits: 2390, withdrawals: 3800 },
          { name: 'Dom', deposits: 3490, withdrawals: 4300 },
        ]
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1 md:space-y-2">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight uppercase">Visão Geral</h2>
          <p className="text-slate-500 font-medium text-sm md:text-lg">Bem-vindo ao centro de comando do deeBank.</p>
        </div>
        <div className="flex items-center space-x-2 md:space-x-3 bg-white p-1.5 md:p-2 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 w-fit">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse mx-1 md:mx-2"></div>
          <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none pr-1 md:pr-2">
            Dados do Banco Sincronizados
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
        {stats.loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-28 md:h-32 bg-white rounded-2xl md:rounded-3xl animate-pulse border border-slate-100 shadow-sm"></div>
          ))
        ) : (
          <>
            <StatCard
              title="Total de Usuários"
              value={stats.totalUsers}
              icon={<Icons.Users />}
              trend={{ value: 'Tempo Real', positive: true }}
              onClick={() => setCurrentPage('users')}
            />
            <StatCard
              title="Usuários VIP"
              value={stats.totalVipUsers}
              icon={<Icons.Bonus />}
              trend={{ value: 'Ativos agora', positive: true }}
              onClick={() => setCurrentPage('users')}
            />
            <StatCard
              title="Saques Hoje"
              value={`Kz ${stats.withdrawalsToday.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={<Icons.Withdrawals />}
              onClick={() => setCurrentPage('withdrawals')}
            />
            <StatCard
              title="Volume de Depósitos"
              value={`Kz ${stats.totalDeposits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={<Icons.Deposits />}
              onClick={() => setCurrentPage('deposits')}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-10">
        <div className="premium-card p-6 md:p-10 space-y-6 relative overflow-hidden">
          {stats.loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculando métricas...</p>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Crescimento</h4>
              <p className="text-lg md:text-xl font-black text-slate-900">Novos Usuários</p>
            </div>
            <div className="p-2 md:p-3 bg-sky-50 text-sky-500 rounded-xl md:rounded-2xl">
              <Icons.Dashboard />
            </div>
          </div>
          <div className="h-[240px] md:h-[320px] w-full mt-4 md:mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.userGrowth}>
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

        <div className="premium-card p-10 space-y-6 relative overflow-hidden">
          {stats.loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processando fluxo...</p>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Performance</h4>
              <p className="text-lg md:text-xl font-black text-slate-900">Fluxo de Caixa (Kz)</p>
            </div>
            <div className="p-2 md:p-3 bg-emerald-50 text-emerald-500 rounded-xl md:rounded-2xl">
              <Icons.Deposits />
            </div>
          </div>
          <div className="h-[240px] md:h-[320px] w-full mt-4 md:mt-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.financeData}>
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

      <div className="bg-slate-900 p-8 md:p-12 rounded-3xl md:rounded-[3rem] shadow-2xl shadow-sky-900/10 border border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-sky-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[60px] md:blur-[100px] group-hover:bg-sky-500/20 transition-all duration-700"></div>
        <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:gap-10">
          <div className="space-y-3 md:space-y-4 text-center md:text-left">
            <h3 className="text-white font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-sm">deeBank Ecosystem</h3>
            <p className="text-slate-400 max-w-xl text-sm md:text-lg font-medium leading-relaxed">
              Conectado diretamente em produção. Tenha cuidado ao manipular registros.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-4 md:pt-6 justify-center md:justify-start">
              <button onClick={() => setCurrentPage('logs')} className="px-6 md:px-8 py-3 md:py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95">
                Auditoria Real
              </button>
              <button onClick={() => setCurrentPage('products')} className="px-6 md:px-8 py-3 md:py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-900/20 active:scale-95 border border-slate-700">
                Produtos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
