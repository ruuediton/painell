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
    userTrend: 0,
    vipTrend: 0,
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
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const isoToday = startOfToday.toISOString();

      const yesterday = new Date(startOfToday);
      yesterday.setDate(yesterday.getDate() - 1);
      const isoYesterday = yesterday.toISOString();

      // 1. Total Users & Trend
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: usersYesterday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', isoToday);

      const userDiff = (totalUsers || 0) - (usersYesterday || 0);

      // 2. VIP Users & Trend
      const { data: vips } = await supabase
        .from('user_purchases')
        .select('user_id, purchase_date');

      const uniqueVips = new Set(vips?.map(v => v.user_id)).size;
      const vipsYesterday = new Set(vips?.filter(v => new Date(v.purchase_date) < startOfToday).map(v => v.user_id)).size;
      const vipDiff = uniqueVips - vipsYesterday;

      // 3. Withdrawals Today
      const { data: withdrawals } = await supabase
        .from('retirada_clientes')
        .select('valor_solicitado')
        .gte('data_de_criacao', isoToday)
        .or('estado_da_retirada.eq.aprovado,estado_da_retirada.eq.concluido');

      const totalWithdrawalsToday = withdrawals?.reduce((sum, w) => sum + Number(w.valor_solicitado), 0) || 0;

      // 4. Deposits Today
      const { data: deposits } = await supabase
        .from('depositos_clientes')
        .select('valor_deposito')
        .gte('created_at', isoToday)
        .eq('estado_de_pagamento', 'recarregado');

      const totalDepositsToday = deposits?.reduce((sum, d) => sum + Number(d.valor_deposito), 0) || 0;

      setStats({
        totalUsers: totalUsers || 0,
        withdrawalsToday: totalWithdrawalsToday,
        totalDeposits: totalDepositsToday,
        totalVipUsers: uniqueVips,
        userTrend: userDiff,
        vipTrend: vipDiff,
        loading: false
      });

      // 5. User Growth (Last 5 Months)
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const growthData = [];
      for (let i = 4; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = months[d.getMonth()];
        const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .lte('created_at', lastDay);

        growthData.push({ name: monthName, users: count || 0 });
      }

      // 6. Finance Flow (Last 7 Days)
      const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
      const financeData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = weekDays[d.getDay()];
        const dayStart = new Date(d.setHours(0, 0, 0, 0)).toISOString();
        const dayEnd = new Date(d.setHours(23, 59, 59, 999)).toISOString();

        const { data: dayDep } = await supabase
          .from('depositos_clientes')
          .select('valor_deposito')
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd)
          .eq('estado_de_pagamento', 'recarregado');

        const { data: dayWit } = await supabase
          .from('retirada_clientes')
          .select('valor_solicitado')
          .gte('data_de_criacao', dayStart)
          .lte('data_de_criacao', dayEnd)
          .or('estado_da_retirada.eq.aprovado,estado_da_retirada.eq.concluido');

        financeData.push({
          name: dayName,
          deposits: dayDep?.reduce((sum, item) => sum + Number(item.valor_deposito), 0) || 0,
          withdrawals: dayWit?.reduce((sum, item) => sum + Number(item.valor_solicitado), 0) || 0
        });
      }

      setChartData({
        userGrowth: growthData,
        financeData: financeData
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
              trend={{ value: `${stats.userTrend > 0 ? '+' : ''}${stats.userTrend} Tempo Real`, positive: stats.userTrend >= 0 }}
              onClick={() => setCurrentPage('users')}
            />
            <StatCard
              title="Usuários VIP"
              value={stats.totalVipUsers}
              icon={<Icons.Bonus />}
              trend={{ value: `${stats.vipTrend > 0 ? '+' : ''}${stats.vipTrend} desde ontem`, positive: stats.vipTrend >= 0 }}
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

      <div className="bg-slate-900 px-8 py-6 rounded-[2rem] shadow-2xl shadow-sky-900/10 border border-slate-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[60px] group-hover:bg-sky-500/10 transition-all duration-700"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-white font-black uppercase tracking-[0.2em] text-[10px]">deeBank Ecosystem</h3>
            <p className="text-slate-400 text-xs font-medium max-w-md">
              Produção Ativa. Tenha cuidado ao manipular registros sensíveis.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setCurrentPage('logs')} className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95">
              Auditoria
            </button>
            <button onClick={() => setCurrentPage('products')} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-slate-700 active:scale-95">
              Produtos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
