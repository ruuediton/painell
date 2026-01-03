import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { User, Transaction, TransactionStatus, UserStatus, UserProduct } from '../types';
import { Icons } from '../constants';
import { showToast } from '../components/Toast';

interface UserDetailProps {
  user: User;
  onBack: () => void;
  onLogAction: (action: string, details: string) => void;
  isAdminMaster?: boolean;
}

const UserDetail: React.FC<UserDetailProps> = ({ user, onBack, onLogAction, isAdminMaster }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'products'>('financial');
  const [details, setDetails] = useState<User>(user);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchasedProducts, setPurchasedProducts] = useState<UserProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Detailed Stats
  const [subordinatesCount, setSubordinatesCount] = useState(0);
  const [dailyIncome, setDailyIncome] = useState(0);
  // Bank Account State (managed via bancos_clientes)
  const [bankInfo, setBankInfo] = useState<{ id?: string; bank: string; owner: string; iban: string } | null>(null);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [newBankData, setNewBankData] = useState({ bank: '', owner: '', iban: '' });

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
      // Parallelize fetches for better performance
      const [profileRes, bankRes, subRes, purchaseRes, depositsRes, withdrawalsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('bancos_clientes').select('*').eq('user_id', user.id).single(),
        supabase.from('red_equipe').select('*', { count: 'exact', head: true }).eq('user_id_convidador', user.id),
        supabase.from('user_purchases').select('*, products(name, daily_income)').eq('user_id', user.id),
        supabase.from('depositos_clientes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('retirada_clientes').select('*').eq('user_id', user.id).order('data_de_criacao', { ascending: false })
      ]);

      if (profileRes.data) {
        const p = profileRes.data;
        setDetails(prev => ({
          ...prev,
          name: p.full_name || prev.name,
          phone: p.phone || prev.phone,
          balance: Number(p.balance),
          status: p.state === 'bloqueado' ? UserStatus.BLOCKED : UserStatus.ACTIVE,
          createdAt: p.created_at
        }));
      }

      if (bankRes.data) {
        const bd = bankRes.data;
        const info = { id: bd.id, bank: bd.nome_do_banco, owner: bd.nome_completo, iban: bd.iban };
        setBankInfo(info);
        setNewBankData(info);
      } else {
        setBankInfo(null);
        setNewBankData({ bank: '', owner: '', iban: '' });
      }

      setSubordinatesCount(subRes.count || 0);

      let dailyTotal = 0;
      if (purchaseRes.data) {
        const mappedProducts: UserProduct[] = purchaseRes.data.map((p: any) => {
          const income = p.daily_income_user || p.products?.daily_income || 0;
          dailyTotal += Number(income);
          return {
            id: p.id,
            name: p.products?.name || 'Produção Real',
            purchaseDate: new Date(p.purchase_date).toLocaleDateString(),
            status: 'active',
            dailyIncome: income
          };
        });
        setPurchasedProducts(mappedProducts);
      }
      setDailyIncome(dailyTotal);

      // Map and combine transactions
      const txs: Transaction[] = [];
      const deposits = depositsRes.data || [];
      const withdrawals = withdrawalsRes.data || [];

      deposits.forEach((d: any) => {
        txs.push({
          id: d.id, userId: d.user_id, userName: profileRes.data?.full_name || '', userPhone: profileRes.data?.phone || '',
          amount: Number(d.valor_deposito),
          status: d.estado_de_pagamento === 'recarregado' ? TransactionStatus.RECHARGED :
            d.estado_de_pagamento === 'rejeitado' ? TransactionStatus.REJECTED : TransactionStatus.PENDING,
          date: new Date(d.created_at).toLocaleDateString(), type: 'DEPOSIT', reason: 'Depósito em Produção'
        });
      });

      withdrawals.forEach((w: any) => {
        txs.push({
          id: w.id, userId: w.user_id, userName: w.nome_completo || '', userPhone: w.telefone_do_usuario || '',
          amount: Number(w.valor_solicitado),
          status: (w.estado_da_retirada === 'concluido' || w.estado_da_retirada === 'aprovado') ? TransactionStatus.RECHARGED :
            w.estado_da_retirada === 'rejeitado' ? TransactionStatus.REJECTED : TransactionStatus.PENDING,
          date: new Date(w.data_de_criacao).toLocaleDateString(), type: 'WITHDRAWAL', reason: `Saque (${w.nome_do_banco})`
        });
      });

      setTransactions(txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    } catch (err) {
      console.error('Speed-fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async () => {
    if (!newBalance) return;
    const amount = parseFloat(newBalance);
    if (isNaN(amount)) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('profiles')
        .update({ balance: amount })
        .eq('id', user.id);

      if (error) throw error;

      setDetails(prev => ({ ...prev, balance: amount }));
      setShowBalanceModal(false);
      setNewBalance('');
      onLogAction('Alteração de Saldo', `Admin alterou saldo de ${user.name} para Kz ${amount}`);
      showToast('Saldo atualizado com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao atualizar saldo: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) return;
    try {
      setIsSubmitting(true);
      // We use the custom RPC created in the database to update the selected user's password
      const { error } = await supabase.rpc('admin_update_user_password', {
        target_user_id: user.id,
        new_password: newPassword
      });

      if (error) throw error;

      showToast('Senha do usuário atualizada com sucesso!', 'success');
      setShowPasswordModal(false);
      setNewPassword('');
      onLogAction('Alteração de Senha', `Admin alterou a senha do usuário ${user.id} (${user.name})`);

    } catch (err: any) {
      showToast('Erro ao tentar alterar senha: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockUser = async () => {
    const newStatus = details.status === UserStatus.ACTIVE ? 'bloqueado' : 'ativo';
    const newStatusEnum = details.status === UserStatus.ACTIVE ? UserStatus.BLOCKED : UserStatus.ACTIVE;

    if (window.confirm(`Tem certeza que deseja ${newStatus === 'bloqueado' ? 'bloquear' : 'desbloquear'} este usuário?`)) {
      setIsSubmitting(true);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ state: newStatus })
          .eq('id', user.id);

        if (error) throw error;

        setDetails(prev => ({ ...prev, status: newStatusEnum }));
        onLogAction('Status Usuário', `Admin alterou status para ${newStatusEnum}`);
        showToast(`Usuário ${newStatus === 'bloqueado' ? 'bloqueado' : 'desbloqueado'} com sucesso!`, 'success');
      } catch (err: any) {
        showToast('Erro ao atualizar status: ' + err.message, 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeleteUser = async () => {
    if (window.confirm('⚠️ AVISO CRÍTICO: Você está prestes a deletar PERMANENTEMENTE este usuário e TODOS os seus registros (depósitos, saques, compras, conta bancária, etc). Esta ação não pode ser desfeita. Deseja continuar?')) {
      const confirmText = prompt('Para confirmar a exclusão, digite "DELETAR":');
      if (confirmText !== 'DELETAR') return showToast('Exclusão cancelada.', 'info');

      try {
        setIsSubmitting(true);
        const { error } = await supabase.rpc('admin_delete_user', {
          target_user_id: user.id
        });

        if (error) throw error;

        showToast('Usuário deletado permanentemente!', 'success');
        onLogAction('Deleção de Usuário', `Admin apagou permanentemente o usuário ${user.id} (${user.name})`);

        // Go back after deletion
        setTimeout(() => onBack(), 1500);

      } catch (err: any) {
        showToast('Erro ao deletar usuário: ' + err.message, 'error');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSaveBank = async () => {
    try {
      if (bankInfo?.id) {
        await supabase
          .from('bancos_clientes')
          .update({
            nome_do_banco: newBankData.bank,
            nome_completo: newBankData.owner,
            iban: newBankData.iban
          })
          .eq('id', bankInfo.id);
      } else {
        await supabase
          .from('bancos_clientes')
          .insert({
            user_id: user.id,
            nome_do_banco: newBankData.bank,
            nome_completo: newBankData.owner,
            iban: newBankData.iban
          });
      }
      setIsEditingBank(false);
      fetchUserDetails();
      onLogAction('Dados Bancários', `Admin atualizou dados bancários do usuário ${user.name}`);
      showToast('Dados bancários salvos!', 'success');
    } catch (error: any) {
      showToast('Erro ao salvar dados bancários: ' + error.message, 'error');
    }
  };

  const handleDeleteBank = async () => {
    if (!bankInfo?.id) return;
    if (confirm('Tem certeza que deseja apagar os dados bancários deste usuário?')) {
      const { error } = await supabase.from('bancos_clientes').delete().eq('id', bankInfo.id);
      if (!error) {
        setBankInfo(null);
        setNewBankData({ bank: '', owner: '', iban: '' });
        onLogAction('Dados Bancários', `Admin removeu dados bancários do usuário ${user.name}`);
        showToast('Dados bancários removidos.', 'success');
      } else {
        showToast('Erro ao deletar: ' + error.message, 'error');
      }
    }
  };

  const handleEditProductIncome = async (productId: string, currentIncome: number) => {
    const newIncomeStr = prompt('Nova Renda Diária (Kz):', currentIncome.toString());
    if (newIncomeStr === null) return;
    const newIncome = parseFloat(newIncomeStr);
    if (isNaN(newIncome)) return alert('Valor inválido');

    try {
      // Assuming user_purchases has a 'daily_income_user' override column or similar.
      // If not, we might need to add it or update a specific field. 
      // For this implementations, based on common patterns, let's assume we can update 'daily_income_user' or fail if column missing.
      // NOTE: If the table doesn't have this column, this will fail. Ensure schema supports it.
      // As a fallback/alternative if schema is strict, we might update a 'custom_daily_income' field if available.

      const { error } = await supabase
        .from('user_purchases')
        .update({ daily_income_user: newIncome })
        .eq('id', productId);

      if (error) throw error;

      fetchUserDetails();
      onLogAction('Produto do Usuário', `Admin alterou renda diária do produto no usuário ${user.name} para Kz ${newIncome}`);
      showToast('Renda do produto atualizada!', 'success');
    } catch (err: any) {
      showToast('Erro ao atualizar renda: ' + err.message, 'error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Tem certeza que deseja remover este produto do usuário?')) {
      try {
        const { error } = await supabase
          .from('user_purchases')
          .delete()
          .eq('id', productId);

        if (error) throw error;

        fetchUserDetails();
        onLogAction('Produto do Usuário', `Admin removeu produto ${productId} do usuário ${user.name}`);
        showToast('Produto removido com sucesso!', 'success');
      } catch (err: any) {
        showToast('Erro ao remover produto: ' + err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20 relative">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 md:p-3 bg-white rounded-xl md:rounded-2xl hover:bg-slate-50 border border-slate-100 transition-all text-slate-400 hover:text-sky-500"
          >
            <Icons.ChevronLeft />
          </button>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">{details.name}</h2>
            <p className="text-slate-400 font-mono text-[10px] md:text-xs font-bold flex items-center gap-2">
              ID: {details.id.substring(0, 18)}...
            </p>
          </div>
        </div>
        <div className={`sm:ml-auto px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] font-black uppercase tracking-widest text-center ${details.status === UserStatus.ACTIVE ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {details.status === UserStatus.ACTIVE ? 'Conta Ativa' : 'Conta Bloqueada'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:grid-cols-1">

        {/* Left Column: Quick Stats & Actions */}
        <div className="space-y-6">
          <div className="premium-card p-6 md:p-8 bg-slate-900 text-white border-none shadow-2xl shadow-slate-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-sky-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-[30px] md:blur-[40px]"></div>
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1 md:mb-2">Saldo Disponível</p>
            <h3 className="text-2xl md:text-4xl font-black mb-4 md:mb-6">Kz {details.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>

            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <button onClick={() => setShowBalanceModal(true)} className="py-2.5 md:py-3 bg-sky-500 hover:bg-sky-400 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all">
                Editar Saldo
              </button>
              <button onClick={handleBlockUser} className={`py-2.5 md:py-3 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all ${details.status === UserStatus.ACTIVE ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                {details.status === UserStatus.ACTIVE ? 'Banir Conta' : 'Desbanir Conta'}
              </button>
              <button onClick={() => setShowPasswordModal(true)} className="py-2.5 md:py-3 bg-white/10 hover:bg-white/20 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all border border-white/10">
                Alterar Senha
              </button>
              <button onClick={handleDeleteUser} className="py-2.5 md:py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-rose-600/20">
                Deletar Conta
              </button>
            </div>
          </div>

          <div className="premium-card p-5 md:p-6 space-y-4">
            <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhes do Usuário</h4>
            <div className="space-y-2 md:space-y-3">
              <div className="flex justify-between p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl">
                <span className="text-[10px] md:text-xs font-bold text-slate-500">Telefone</span>
                <span className="text-[10px] md:text-xs font-mono font-black text-slate-900">{details.phone}</span>
              </div>
              <div className="flex justify-between p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl">
                <span className="text-[10px] md:text-xs font-bold text-slate-500">Membro Desde</span>
                <span className="text-[10px] md:text-xs font-black text-slate-900">{new Date(details.createdAt || '').toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between p-2.5 md:p-3 bg-slate-50 rounded-lg md:rounded-xl">
                <span className="text-[10px] md:text-xs font-bold text-slate-500">Subordinados</span>
                <span className="text-[10px] md:text-xs font-black text-slate-900">{subordinatesCount}</span>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 space-y-4 border-l-4 border-sky-500">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Dados Bancários (bancos_clientes)
              </h4>
              <div className="space-x-2">
                {!isEditingBank && (
                  <button onClick={() => setIsEditingBank(true)} className="text-sky-400 hover:text-sky-600">
                    <Icons.Edit />
                  </button>
                )}
                {bankInfo && !isEditingBank && (
                  <button onClick={handleDeleteBank} className="text-rose-400 hover:text-rose-600">
                    <Icons.Trash />
                  </button>
                )}
              </div>
            </div>

            {isEditingBank ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Nome do Banco"
                  className="w-full p-2 bg-slate-50 rounded-lg text-sm border border-slate-200"
                  value={newBankData.bank}
                  onChange={(e) => setNewBankData({ ...newBankData, bank: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Nome do Titular"
                  className="w-full p-2 bg-slate-50 rounded-lg text-sm border border-slate-200"
                  value={newBankData.owner}
                  onChange={(e) => setNewBankData({ ...newBankData, owner: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="IBAN"
                  className="w-full p-2 bg-slate-50 rounded-lg text-sm border border-slate-200"
                  value={newBankData.iban}
                  onChange={(e) => setNewBankData({ ...newBankData, iban: e.target.value })}
                />
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setIsEditingBank(false)} className="flex-1 py-2 text-slate-500 text-xs font-bold uppercase hover:bg-slate-100 rounded-lg">Cancelar</button>
                  <button onClick={handleSaveBank} className="flex-1 py-2 bg-sky-500 text-white text-xs font-bold uppercase rounded-lg hover:bg-sky-600">Salvar</button>
                </div>
              </div>
            ) : bankInfo ? (
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
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400 text-xs mb-3">Nenhuma conta bancária vinculada.</p>
                <button
                  onClick={() => setIsEditingBank(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-black uppercase tracking-widest"
                >
                  Adicionar Conta
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deep Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="premium-card p-4 border-b-4 border-emerald-400">
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Depositado</p>
              <p className="text-lg md:text-xl font-black text-slate-900 mt-1">
                Kz {transactions.filter(t => t.type === 'DEPOSIT' && t.status === TransactionStatus.RECHARGED).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
              </p>
              <span className="text-[8px] md:text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 md:py-1 rounded mt-2 inline-block">Confirmado</span>
            </div>
            <div className="premium-card p-4 border-b-4 border-rose-400">
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Sacado</p>
              <p className="text-lg md:text-xl font-black text-slate-900 mt-1">
                Kz {transactions.filter(t => t.type === 'WITHDRAWAL' && t.status === TransactionStatus.RECHARGED).reduce((acc, t) => acc + t.amount, 0).toLocaleString()}
              </p>
              <span className="text-[8px] md:text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 md:py-1 rounded mt-2 inline-block">Confirmado</span>
            </div>
            <div className="premium-card p-4 border-b-4 border-sky-400">
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Renda Diária</p>
              <p className="text-lg md:text-xl font-black text-slate-900 mt-1">
                Kz {dailyIncome.toLocaleString()}
              </p>
              <span className="text-[8px] md:text-[9px] font-bold text-sky-500 bg-sky-50 px-2 py-0.5 md:py-1 rounded mt-2 inline-block">Ativos</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[300px] md:min-h-[400px]">
            <div className="flex border-b border-slate-100 p-2 md:p-4 gap-1 md:gap-2 overflow-x-auto whitespace-nowrap scrollbar-none">
              {(['overview', 'financial', 'products'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  {tab === 'overview' ? 'Geral' : tab === 'financial' ? 'Finanças' : 'Produtos'}
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
                <div className="p-10 space-y-8 animate-in fade-in duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informações Pessoais</h4>
                      <div className="space-y-3">
                        <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase">Nome Completo</span>
                          <span className="text-sm font-black text-slate-900">{details.name}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase">Telefone</span>
                          <span className="text-sm font-black text-sky-600">{details.phone}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase">ID de Sistema</span>
                          <span className="text-[10px] font-mono font-bold text-slate-400">{details.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atividade & Convites</h4>
                      <div className="space-y-3">
                        <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase">Equipe Registrada</span>
                          <span className="text-sm font-black text-slate-900">{subordinatesCount} Membros</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase">Status Global</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${details.status === UserStatus.ACTIVE ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {details.status}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-500 uppercase">Data de Cadastro</span>
                          <span className="text-sm font-black text-slate-900">{new Date(details.createdAt || '').toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'products' && (
                <div className="p-6 space-y-4">
                  {purchasedProducts.map((p: UserProduct) => (
                    <div key={p.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-sky-500/30 transition-all">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">Data: {p.purchaseDate}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] font-black text-sky-500 bg-sky-50 px-2 py-0.5 rounded uppercase tracking-wide">
                            Renda: {p.dailyIncome ? Number(p.dailyIncome).toLocaleString() : 0} Kz
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); handleEditProductIncome(p.id, p.dailyIncome || 0); }} className="text-slate-300 hover:text-sky-500">
                            <Icons.Edit />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="badge badge-green">ATV</span>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id); }} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                          <Icons.Trash />
                        </button>
                      </div>
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
              <button disabled={isSubmitting} onClick={() => setShowBalanceModal(false)} className="flex-1 py-3 text-slate-500 font-bold uppercase text-xs hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
              <button disabled={isSubmitting} onClick={handleUpdateBalance} className="flex-1 py-3 bg-sky-500 text-white font-bold uppercase text-xs rounded-xl hover:bg-sky-600 shadow-lg shadow-sky-500/20 transition-all disabled:opacity-50">
                {isSubmitting ? 'Atualizando...' : 'Confirmar'}
              </button>
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
              <button disabled={isSubmitting} onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 text-slate-500 font-bold uppercase text-xs hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
              <button disabled={isSubmitting} onClick={handleChangePassword} className="flex-1 py-3 bg-rose-500 text-white font-bold uppercase text-xs rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50">
                {isSubmitting ? 'Alterando...' : 'Confirmar Alteração'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserDetail;
