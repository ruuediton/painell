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
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'products'>('overview');
  const [details, setDetails] = useState<User>(user);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchasedProducts, setPurchasedProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetails();
  }, [user.id]);

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch Profile (Refresh)
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
          status: profile.state === 'bloqueado' ? UserStatus.BLOCKED : UserStatus.ACTIVE
        }));
      }

      // 2. Fetch Deposits
      const { data: deposits } = await supabase
        .from('depositos_clientes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // 3. Fetch Withdrawals
      const { data: withdrawals } = await supabase
        .from('retirada_clientes')
        .select('*')
        .eq('user_id', user.id)
        .order('data_de_criacao', { ascending: false });

      // Combine and Map Transactions
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
            reason: 'Depósito via ' + (d.nome_do_banco || 'Bancário')
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
            status: w.estado_da_retirada === 'concluido' ? TransactionStatus.RECHARGED :
              w.estado_da_retirada === 'rejeitado' ? TransactionStatus.REJECTED : TransactionStatus.PENDING,
            date: new Date(w.data_de_criacao).toLocaleDateString(),
            type: 'WITHDRAWAL',
            reason: `Saque para ${w.nome_do_banco} (${w.iban})`
          });
        });
      }

      // Sort combined
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txs);

      // 4. Fetch Products (Purchases)
      const { data: purchases } = await supabase
        .from('user_purchases')
        .select('*, products(name)')
        .eq('user_id', user.id);

      if (purchases) {
        const mappedProducts: UserProduct[] = purchases.map((p: any) => ({
          id: p.id,
          name: p.products?.name || 'Produto Desconhecido',
          purchaseDate: new Date(p.purchase_date).toLocaleDateString(),
          status: 'active' // Simplified for now
        }));
        setPurchasedProducts(mappedProducts);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async () => {
    const newStatus = details.status === UserStatus.ACTIVE ? 'bloqueado' : 'ativo'; // Assuming 'ativo' is the opposite
    const newStatusEnum = details.status === UserStatus.ACTIVE ? UserStatus.BLOCKED : UserStatus.ACTIVE;

    if (window.confirm(`Tem certeza que deseja ${newStatus === 'bloqueado' ? 'bloquear' : 'desbloquear'} este usuário?`)) {
      const { error } = await supabase
        .from('profiles')
        .update({ state: newStatus })
        .eq('id', user.id);

      if (!error) {
        setDetails(prev => ({ ...prev, status: newStatusEnum }));
        onLogAction(
          'Alteração de Status de Usuário',
          `Admin alterou o status do usuário ${user.name} para ${newStatusEnum}`
        );
      } else {
        alert('Erro ao atualizar status.');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={onBack}
          className="p-3 bg-white rounded-2xl hover:bg-slate-50 border border-slate-100 transition-all text-slate-400 hover:text-sky-500"
        >
          <Icons.ChevronLeft />
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{details.name}</h2>
          <p className="text-slate-400 font-mono text-xs font-bold">{details.phone}</p>
        </div>
        <div className={`ml-auto px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${details.status === UserStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {details.status === UserStatus.ACTIVE ? 'Conta Ativa' : 'Conta Bloqueada'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Actions */}
        <div className="space-y-8">
          <div className="premium-card p-8 bg-sky-500 text-white border-none shadow-2xl shadow-sky-500/20">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Saldo Atual</p>
            <h3 className="text-4xl font-black mb-6">Kz {details.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <button
              onClick={handleBlockUser}
              className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-xs uppercase tracking-widest backdrop-blur-sm transition-all text-white border border-white/10"
            >
              {details.status === UserStatus.ACTIVE ? 'Bloquear Acesso' : 'Desbloquear Acesso'}
            </button>
          </div>

          <div className="premium-card p-6 space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhes da Conta</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">ID do Usuário</span>
                <span className="text-slate-900 font-mono text-xs">{details.id.substring(0, 12)}...</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Data de Registro</span>
                <span className="text-slate-900">{new Date(details.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500">Código Convite</span>
                <span className="text-slate-900 font-black">{details.inviteCode || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex space-x-2 bg-white p-2 rounded-[20px] border border-slate-100 w-fit">
            {(['overview', 'financial', 'products'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {tab === 'overview' ? 'Visão Geral' : tab === 'financial' ? 'Transações' : 'Produtos'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando dados...</div>
          ) : (
            <div className="min-h-[400px]">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="premium-card p-6">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Investido</p>
                    <p className="text-2xl font-black text-slate-900">Kz {transactions.filter(t => t.type === 'DEPOSIT' && t.status === TransactionStatus.RECHARGED).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</p>
                  </div>
                  <div className="premium-card p-6">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Total Sacado</p>
                    <p className="text-2xl font-black text-slate-900">Kz {transactions.filter(t => t.type === 'WITHDRAWAL' && t.status === TransactionStatus.RECHARGED).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {activeTab === 'financial' && (
                <div className="premium-card p-0 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                        <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                          <td className="p-6">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg ${t.type === 'DEPOSIT' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                {t.type === 'DEPOSIT' ? <Icons.Deposits /> : <Icons.Withdrawals />}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{t.type === 'DEPOSIT' ? 'Depósito' : 'Saque'}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{t.status}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-6 font-black text-slate-700">
                            {t.type === 'WITHDRAWAL' ? '-' : '+'} Kz {t.amount.toLocaleString()}
                          </td>
                          <td className="p-6 text-right text-xs font-bold text-slate-400">
                            {t.date}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr><td colSpan={3} className="p-10 text-center text-slate-400 text-xs font-bold uppercase">Sem histórico</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'products' && (
                <div className="space-y-4">
                  {purchasedProducts.map(p => (
                    <div key={p.id} className="premium-card p-5 flex justify-between items-center">
                      <div>
                        <h4 className="font-black text-slate-900">{p.name}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">Comprado em {p.purchaseDate}</p>
                      </div>
                      <span className="badge badge-green">Ativo</span>
                    </div>
                  ))}
                  {purchasedProducts.length === 0 && (
                    <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase border-2 border-dashed border-slate-200 rounded-3xl">
                      Nenhum produto adquirido
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
