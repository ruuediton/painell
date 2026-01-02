
import React, { useState } from 'react';
import { User, UserStatus, UserProduct, BankAccount } from '../types';
import { Icons } from '../constants';

interface UserDetailProps {
  user: User;
  onBack: () => void;
  onLogAction: (action: string, details: string) => void;
}

const UserDetail: React.FC<UserDetailProps> = ({ user, onBack, onLogAction }) => {
  const [balance, setBalance] = useState(user.balance.toString());
  const [totalDeposited, setTotalDeposited] = useState(user.totalDeposited.toString());
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isWithdrawEnabled, setIsWithdrawEnabled] = useState(user.canWithdraw);
  const [userProducts, setUserProducts] = useState<UserProduct[]>(user.products);
  const [bankAccount, setBankAccount] = useState<BankAccount | undefined>(user.bankAccount);

  const saveBalance = () => {
    const val = parseFloat(balance);
    if (isNaN(val)) return alert('Valor de saldo inválido');
    if (window.confirm(`Confirmar alteração de saldo para R$ ${val.toFixed(2)}?`)) {
      onLogAction('Ajuste de Saldo', `Admin alterou saldo do usuário ${user.phone} para R$ ${val.toFixed(2)}`);
      alert('Saldo atualizado com sucesso!');
    }
  };

  const saveDeposits = () => {
    const val = parseFloat(totalDeposited);
    if (isNaN(val)) return alert('Valor de depósitos inválido');
    if (window.confirm(`Confirmar alteração de depósitos totais para R$ ${val.toFixed(2)}?`)) {
      onLogAction('Ajuste de Depósitos', `Admin alterou depósitos do usuário ${user.phone} para R$ ${val.toFixed(2)}`);
      alert('Total de depósitos atualizado!');
    }
  };

  const updatePassword = () => {
    if (!newPassword || newPassword !== confirmPassword) {
      alert('As senhas não coincidem!');
      return;
    }
    if (window.confirm('Deseja atualizar a senha deste usuário?')) {
      onLogAction('Alteração de Senha', `Admin atualizou senha do usuário ${user.phone}`);
      setNewPassword('');
      setConfirmPassword('');
      alert('Senha atualizada com sucesso!');
    }
  };

  const toggleWithdraw = () => {
    const nextState = !isWithdrawEnabled;
    const actionLabel = nextState ? 'Habilitar Saque' : 'Bloquear Saque';
    if (window.confirm(`Deseja confirmar a ação: ${actionLabel}?`)) {
      setIsWithdrawEnabled(nextState);
      onLogAction(
        actionLabel, 
        `Admin alterou permissão de saque do usuário ${user.phone} para ${nextState ? 'Habilitado' : 'Bloqueado'}`
      );
    }
  };

  const deleteBankAccount = () => {
    if (window.confirm('Deseja excluir definitivamente os dados bancários deste usuário?')) {
      setBankAccount(undefined);
      onLogAction('Exclusão de Conta Bancária', `Admin removeu os dados bancários do usuário ${user.phone}`);
      alert('Dados bancários removidos.');
    }
  };

  const handleProductAction = (productId: string, action: 'edit' | 'delete') => {
    const product = userProducts.find(p => p.id === productId);
    if (!product) return;

    if (action === 'delete') {
      if (window.confirm(`Excluir produto: ${product.name}?`)) {
        setUserProducts(prev => prev.filter(p => p.id !== productId));
        onLogAction('Exclusão de Produto', `Admin removeu o produto ${product.name} do usuário ${user.phone}`);
      }
    } else {
      const newName = window.prompt('Editar nome do produto:', product.name);
      if (newName) {
        setUserProducts(prev => prev.map(p => p.id === productId ? { ...p, name: newName } : p));
        onLogAction('Edição de Produto', `Admin renomeou produto do usuário ${user.phone}`);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700 pb-32 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <button onClick={onBack} className="group flex items-center space-x-3 text-slate-500 bg-white border border-slate-200 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15 19l-7-7 7-7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span>Voltar para Lista</span>
        </button>
        <div className="text-center sm:text-right">
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{user.name}</h2>
          <p className="text-[10px] text-sky-500 font-black uppercase tracking-[0.4em] mt-2">Perfil do Cliente #{user.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Telefone', value: user.phone, icon: 'phone', mono: true },
          { label: 'Renda Diária', value: `R$ ${user.dailyIncome.toFixed(2)}`, icon: 'trending', color: 'text-emerald-600' },
          { label: 'Saldo Atual', value: `R$ ${parseFloat(balance).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, icon: 'wallet' },
          { label: 'Total Investido', value: `R$ ${user.totalInvested.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, icon: 'invest' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-lg font-black ${stat.color || 'text-slate-900'} ${stat.mono ? 'font-mono tracking-tighter' : ''}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center space-x-4 mb-2">
                <div className="w-2 h-8 bg-sky-500 rounded-full"></div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Ações Financeiras Diretas</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Saldo em Conta</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">R$</span>
                            <input 
                                type="number" 
                                value={balance} 
                                onChange={(e) => setBalance(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-50 px-10 py-4 rounded-2xl font-black text-slate-900 font-mono focus:border-sky-500 focus:bg-white outline-none transition-all"
                            />
                        </div>
                        <button onClick={saveBalance} className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all">
                            <Icons.Save />
                        </button>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Depositado</label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">R$</span>
                            <input 
                                type="number" 
                                value={totalDeposited} 
                                onChange={(e) => setTotalDeposited(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-50 px-10 py-4 rounded-2xl font-black text-slate-900 font-mono focus:border-sky-500 focus:bg-white outline-none transition-all"
                            />
                        </div>
                        <button onClick={saveDeposits} className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all">
                            <Icons.Save />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mb-1">Total de Entradas</p>
                        <p className="text-2xl font-black text-emerald-700 font-mono">R$ {user.totalDeposited.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-emerald-200"><Icons.Deposits /></div>
                </div>
                <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] text-rose-600 font-black uppercase tracking-widest mb-1">Total de Saídas</p>
                        <p className="text-2xl font-black text-rose-700 font-mono">R$ {user.totalWithdrawn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-rose-200"><Icons.Withdrawals /></div>
                </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <div className="w-2 h-8 bg-slate-900 rounded-full"></div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Informações de Saque</h4>
                </div>
                {bankAccount && (
                    <button onClick={deleteBankAccount} className="text-[9px] font-black text-rose-500 bg-rose-50 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100">
                        Remover Dados Bancários
                    </button>
                )}
            </div>

            {bankAccount ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 p-8 rounded-[32px] border border-slate-100 relative">
                    <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Instituição</p>
                        <p className="text-md font-black text-slate-900 uppercase">{bankAccount.bankName}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Titular da Conta</p>
                        <p className="text-md font-black text-slate-900 uppercase">{bankAccount.holderName}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Número da Conta</p>
                        <p className="text-md font-black text-slate-900 font-mono">{bankAccount.accountNumber}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Chave PIX</p>
                        <p className="text-md font-black text-sky-600 font-mono break-all">{bankAccount.pixKey || 'Não vinculada'}</p>
                    </div>
                </div>
            ) : (
                <div className="py-16 text-center border-4 border-dashed border-slate-50 rounded-[40px] flex flex-col items-center">
                    <div className="bg-slate-100 p-4 rounded-full mb-4 text-slate-300">
                        <Icons.Bonus />
                    </div>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Usuário não possui conta cadastrada para recebimentos.</p>
                </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/40 text-center space-y-6">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Permissões Operacionais</h4>
            <div className="p-2 bg-slate-50 rounded-[32px]">
                <button 
                    onClick={toggleWithdraw}
                    className={`w-full py-6 rounded-[28px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${isWithdrawEnabled ? 'bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600' : 'bg-rose-500 text-white shadow-rose-200 hover:bg-rose-600'}`}
                >
                    {isWithdrawEnabled ? 'Bloquear Saques' : 'Habilitar Saques'}
                </button>
            </div>
            <div className="flex items-center justify-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isWithdrawEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                   Status: <span className={isWithdrawEnabled ? 'text-emerald-500' : 'text-rose-500'}>
                     {isWithdrawEnabled ? 'Transacionando' : 'Bloqueado'}
                   </span>
                </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] text-center">Segurança da Conta</h4>
            <div className="space-y-4">
                <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova Senha"
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-mono focus:border-slate-900 focus:bg-white outline-none transition-all text-sm"
                />
                <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmar Nova Senha"
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-mono focus:border-slate-900 focus:bg-white outline-none transition-all text-sm"
                />
                <button 
                    onClick={updatePassword}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                    Redefinir Acesso
                </button>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-6 relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-sky-500/10 blur-[60px] rounded-full"></div>
            <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest text-center border-b border-white/10 pb-4">Metadados de Auditoria</p>
            <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Código Convite</span>
                    <span className="text-[11px] font-black font-mono text-sky-400">{user.inviteCode}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Data Cadastro</span>
                    <span className="text-[11px] font-black">{user.createdAt}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ID Global</span>
                    <span className="text-[11px] font-black font-mono">UID_{user.id}</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
