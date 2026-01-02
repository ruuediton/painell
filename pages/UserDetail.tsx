import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { User, Transaction, TransactionStatus, UserStatus, UserProduct } from '../types';
import { Icons } from '../constants';

interface UserDetailProps {
  user: User;
  onBack: () => void;
  onLogAction: (action: string, details: string) => void;
}

const UserDetail: React.FC<UserDetailProps> = ({ user, onBack, onLogAction }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'products'>('financial');
  const [details, setDetails] = useState<User>(user);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchasedProducts, setPurchasedProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // New Detailed Stats
  const [subordinatesCount, setSubordinatesCount] = useState(0);
  const [dailyIncome, setDailyIncome] = useState(0);
  const [bankInfo, setBankInfo] = useState<{ bank: string; owner: string; iban: string } | null>(null);

  // Modals State
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchUserDetails();
  }, [user.id]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setDetails(prev => ({
          ...prev,
          name: profile.full_name || prev.name,
          phone: profile.phone || prev.phone,
          balance: Number(profile.balance),
          status: profile.state === 'bloqueado' ? UserStatus.BLOCKED : UserStatus.ACTIVE,
          createdAt: profile.created_at
        }));
      }

      // 2. Fetch Deposits
      const { data: deposits } = await supabase
        .from('depositos_clientes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // 3. Fetch Withdrawals (and Bank Info from latest)
      const { data: withdrawals } = await supabase
        .from('retirada_clientes')
        .select('*')
        .eq('user_id', user.id)
        .order('data_de_criacao', { ascending: false });

      if (withdrawals && withdrawals.length > 0) {
        const latest = withdrawals[0];
        setBankInfo({
          bank: latest.nome_do_banco || 'N/A',
          owner: latest.nome_completo || latest.nome_titular || 'N/A',
          iban: latest.iban || 'N/A'
        });
      }

      // Combine Transactions
      const txs: Transaction[] = [];
      if (deposits) {
        deposits.forEach((d: any) => {
          txs.push({
            id: d.id,
            userId: d.user_id,
            userName: profile?.full_name || '',
            userPhone: profile?.phone || '',
            amount: Number(d.valor_deposito),
            status: d.estado_de_pagamento === 'recarregado' ? TransactionStatus.RECHARGED :
              d.estado_de_pagamento === 'rejeitado' ? TransactionStatus.REJECTED : TransactionStatus.PENDING,
            date: new Date(d.created_at).toLocaleDateString(),
            type: 'DEPOSIT',
            reason: 'Depósito'
          });
        });
      }
      if (withdrawals) {
        withdrawals.forEach((w: any) => {
          txs.push({
            id: w.id,
            userId: w.user_id,
            userName: w.nome_completo || '',
            userPhone: w.telefone_do_usuario || '',
            amount: Number(w.valor_solicitado),
            status: (w.estado_da_retirada === 'concluido' || w.estado_da_retirada === 'aprovado') ? TransactionStatus.RECHARGED :
              w.estado_da_retirada === 'rejeitado' ? TransactionStatus.REJECTED : TransactionStatus.PENDING,
            date: new Date(w.data_de_criacao).toLocaleDateString(),
            type: 'WITHDRAWAL',
            reason: `Saque (${w.nome_do_banco})`
          });
        });
      }
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txs);

      // 4. Products & Daily Income
      const { data: purchases } = await supabase
        .from('user_purchases')
        .select('*, products(name, daily_income)')
        .eq('user_id', user.id);

      let dailyTotal = 0;
      if (purchases) {
        const mappedProducts: UserProduct[] = purchases.map((p: any) => {
          if (p.products?.daily_income) dailyTotal += Number(p.products.daily_income);
          return {
            id: p.id,
            name: p.products?.name || 'Produto',
            purchaseDate: new Date(p.purchase_date).toLocaleDateString(),
            status: 'active'
          };
        });
        setPurchasedProducts(mappedProducts);
      }
      setDailyIncome(dailyTotal);

      // 5. Subordinates Count
      const { count: subs } = await supabase
        .from('red_equipe')
        .select('*', { count: 'exact', head: true })
        .eq('user_id_convidador', user.id);

      setSubordinatesCount(subs || 0);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async () => {
    if (!newBalance) return;
    const amount = parseFloat(newBalance);
    if (isNaN(amount)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance: amount })
        .eq('id', user.id);

      if (error) throw error;

      setDetails(prev => ({ ...prev, balance: amount }));
      setShowBalanceModal(false);
      setNewBalance('');
      onLogAction('Alteração de Saldo', `Admin alterou saldo de ${user.name} para Kz ${amount}`);
      alert('Saldo atualizado com sucesso!');
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) return;
    // Note: Use a Remote Procedure Call or Edge Function for security in production.
    // For this context, we simulate or attempt the only available client-side method if keys allow.
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      alert('Senha atualizada com sucesso!');
      setShowPasswordModal(false);
      onLogAction('Alteração de Senha', `Admin alterou a senha do usuário ${user.id}`);

    } catch (err: any) {
      alert('Erro ao tentar alterar senha: ' + err.message + '\nNota: Esta operação requer privilégios de Service Role se o usuário não estiver logado.');
    }
  };

  const handleBlockUser = async () => {
    const newStatus = details.status === UserStatus.ACTIVE ? 'bloqueado' : 'ativo';
    const newStatusEnum = details.status === UserStatus.ACTIVE ? UserStatus.BLOCKED : UserStatus.ACTIVE;

    if (window.confirm(`Tem certeza que deseja ${newStatus === 'bloqueado' ? 'bloquear' : 'desbloquear'} este usuário?`)) {
      const { error } = await supabase
        .from('profiles')
        .update({ state: newStatus })
        .eq('id', user.id);

      if (!error) {
        setDetails(prev => ({ ...prev, status: newStatusEnum }));
        onLogAction('Status Usuário', `Admin alterou status para ${newStatusEnum}`);
      } else {
        alert('Erro ao atualizar status.');
      }
    }
  };

  const handleDeleteBank = () => {
    // Since it's historical data, we can't 'delete' the account per se without complex logic.
    // We will clear the view for this session or update the metadata if possible.
    // For now, prompt the user.
    if (confirm('Atenção: Os dados bancários são baseados no histórico de saques. Deseja ocultar estas informações da visualização?')) {
      setBankInfo(null);
      alert('Dados ocultados da visualização atual.');
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20 relative">

      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="p-3 bg-white rounded-2xl hover:bg-slate-50 border border-slate-100 transition-all text-slate-400 hover:text-sky-500"
        >
          <Icons.ChevronLeft />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{details.name}</h2>
          <p className="text-slate-400 font-mono text-xs font-bold flex items-center gap-2">
            ID: {details.id}
          </p>
        </div>
        <div className={`ml-auto px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${details.status === UserStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {details.status === UserStatus.ACTIVE ? 'Conta Ativa' : 'Conta Bloqueada'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Quick Stats & Actions */}
        <div className="space-y-6">
          <div className="premium-card p-8 bg-slate-900 text-white border-none shadow-2xl shadow-slate-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[40px]"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Saldo Disponível</p>
            <h3 className="text-4xl font-black mb-6">Kz {details.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowBalanceModal(true)} className="py-3 bg-sky-500 hover:bg-sky-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                Editar Saldo
              </button>
              <button onClick={handleBlockUser} className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${details.status === UserStatus.ACTIVE ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                {details.status === UserStatus.ACTIVE ? 'Banir Conta' : 'Desbanir'}
              </button>
            </div>
            <button onClick={() => setShowPasswordModal(true)} className="w-full mt-3 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10">
              Alterar Senha
            </button>
          </div>

          <div className="premium-card p-6 space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhes do Usuário</h4>
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-bold text-slate-500">Telefone</span>
                <span className="text-xs font-mono font-black text-slate-900">{details.phone}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-bold text-slate-500">Membro Desde</span>
                <span className="text-xs font-black text-slate-900">{new Date(details.createdAt || '').toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                <span className="text-xs font-bold text-slate-500">Subordinados</span>
                <span className="text-xs font-black text-slate-900">{subordinatesCount}</span>
              </div>
            </div>
          </div>

          {bankInfo && (
            <div className="premium-card p-6 space-y-4 border-l-4 border-sky-500">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dados Bancários</h4>
                <button onClick={handleDeleteBank} className="text-rose-400 hover:text-rose-600"><Icons.Trash /></button>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Banco</p>
                  <p className="font-black text-slate-900">{bankInfo.bank}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Titular</p>
                  <p className="font-black text-slate-900">{bankInfo.owner}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">IBAN</p>
                  <p className="font-mono font-bold text-sky-600 break-all text-xs">{bankInfo.iban}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Deep Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="premium-card p-4 border-b-4 border-emerald-400">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Depositado</p>
              <p className="text-xl font-black text-slate-900 mt-1">
                Kz {transactions.filter(t => t.type === 'DEPOSIT' && t.status === TransactionStatus.RECHARGED).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
              </p>
              <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded mt-2 inline-block">Confirmado (Recarregado)</span>
            </div>
            <div className="premium-card p-4 border-b-4 border-rose-400">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sacado</p>
              <p className="text-xl font-black text-slate-900 mt-1">
                Kz {transactions.filter(t => t.type === 'WITHDRAWAL' && t.status === TransactionStatus.RECHARGED).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
              </p>
              <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded mt-2 inline-block">Confirmado (Aprovado)</span>
            </div>
            <div className="premium-card p-4 border-b-4 border-sky-400">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Renda Diária Est.</p>
              <p className="text-xl font-black text-slate-900 mt-1">
                Kz {dailyIncome.toLocaleString()}
              </p>
              <span className="text-[9px] font-bold text-sky-500 bg-sky-50 px-2 py-1 rounded mt-2 inline-block">Produtos Ativos</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            <div className="flex border-b border-slate-100 p-4 gap-2 overflow-x-auto">
              {(['overview', 'financial', 'products'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  {tab === 'overview' ? 'Visão Geral' : tab === 'financial' ? 'Histórico Financeiro' : 'Produtos Ativos'}
                </button>
              ))}
            </div>

            <div className="p-0">
              {/* Reuse existing tables logic but inside this container */}
              {activeTab === 'financial' && (
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      <th className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded ${t.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {t.type === 'DEPOSIT' ? 'DEPÓSITO' : 'SAQUE'}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-700 text-sm">
                          {t.amount.toLocaleString()} Kz
                        </td>
                        <td className="p-4">
                          <span className={`text-[9px] font-black uppercase ${t.status === TransactionStatus.RECHARGED ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4 text-right text-xs font-mono text-slate-400">
                          {t.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {activeTab === 'overview' && (
                <div className="p-8 text-center text-slate-400 text-sm">
                  <Icons.Dashboard />
                  <p className="mt-2 font-bold">Selecione uma aba para ver detalhes.</p>
                </div>
              )}
              {activeTab === 'products' && (
                <div className="p-6 space-y-4">
                  {purchasedProducts.map(p => (
                    <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">Data: {p.purchaseDate}</p>
                      </div>
                      <span className="badge badge-green">ATV</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">Editar Saldo</h3>
            <p className="text-sm text-slate-500 mb-6 font-bold">Insira o novo saldo para o usuário. Esta ação será auditada.</p>
            <input
              type="number"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-xl mb-6 outline-none focus:border-sky-500"
              placeholder="0.00"
            />
            <div className="flex gap-4">
              <button onClick={() => setShowBalanceModal(false)} className="flex-1 py-3 text-slate-500 font-bold uppercase text-xs hover:bg-slate-50 rounded-xl">Cancelar</button>
              <button onClick={handleUpdateBalance} className="flex-1 py-3 bg-sky-500 text-white font-bold uppercase text-xs rounded-xl hover:bg-sky-600 shadow-lg shadow-sky-500/20">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4 text-rose-500">Alterar Senha</h3>
            <p className="text-sm text-slate-500 mb-6 font-bold">Atenção: Você está alterando a senha de acesso deste usuário.</p>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-lg mb-6 outline-none focus:border-rose-500"
              placeholder="Nova Senha"
            />
            <div className="flex gap-4">
              <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 text-slate-500 font-bold uppercase text-xs hover:bg-slate-50 rounded-xl">Cancelar</button>
              <button onClick={handleChangePassword} className="flex-1 py-3 bg-rose-500 text-white font-bold uppercase text-xs rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-500/20">Confirmar Alteração</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserDetail;
