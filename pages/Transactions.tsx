import React, { useState } from 'react';
import { MOCK_TRANSACTIONS } from '../services/mockData';
import { TransactionStatus, Transaction } from '../types';
import { Icons } from '../constants';

interface TransactionsProps {
  type: 'DEPOSIT' | 'WITHDRAWAL';
  onLogAction: (action: string, details: string) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ type, onLogAction }) => {
  const [phone, setPhone] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatus | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [pendingTx, setPendingTx] = useState<Transaction | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Validação para Angola: 9 dígitos começando com 9
  const isValidPhone = /^9\d{8}$/.test(phone);
  const phoneError = phone.length > 0 && !isValidPhone;

  const handleSearch = () => {
    if (!isValidPhone) return;

    const tx = MOCK_TRANSACTIONS.find(t =>
      t.userPhone === phone &&
      t.type === type &&
      t.status === TransactionStatus.PENDING
    );

    setPendingTx(tx || null);
    setHasSearched(true);
    setSelectedStatus('');
  };

  const handleConfirm = () => {
    if (!pendingTx || !selectedStatus) return;

    onLogAction(
      `Aprovação de ${type === 'DEPOSIT' ? 'Depósito' : 'Saque'}`,
      `Admin alterou status da transação ${pendingTx.id} do telefone (+244) ${pendingTx.userPhone} para ${selectedStatus}`
    );

    alert(`Sucesso! Status da solicitação ${pendingTx.id} alterado para ${selectedStatus}.`);

    setPhone('');
    setPendingTx(null);
    setSelectedStatus('');
    setHasSearched(false);
  };

  const recentTransactions = MOCK_TRANSACTIONS
    .filter(t => t.type === type)
    .slice(0, 5);

  return (
    <div className="space-y-10 animate-fade-in-up pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
            {type === 'DEPOSIT' ? 'Depósitos' : 'Saques'}
          </h2>
          <p className="text-slate-500 font-medium text-lg">Central de auditoria e liberação de fundos.</p>
        </div>
        <div className="bg-sky-50 px-4 py-2 rounded-xl border border-sky-100 hidden md:block">
          <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Região: Angola (+244)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5 space-y-6">
          <div className="premium-card p-8 space-y-8 bg-slate-900 text-white border-none shadow-2xl shadow-slate-200">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Buscar Transação Pendente
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">+244</span>
                  <input
                    type="text"
                    maxLength={9}
                    placeholder="9xx xxx xxx"
                    className={`w-full pl-14 pr-4 py-4 bg-slate-800 border-2 rounded-2xl focus:ring-4 focus:ring-sky-500/20 outline-none transition-all font-mono font-bold text-lg ${phoneError ? 'border-rose-500 text-rose-500' : 'border-slate-700 text-white focus:border-sky-500'}`}
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPhone(val);
                      if (hasSearched) setHasSearched(false);
                    }}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!isValidPhone}
                  className={`px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isValidPhone ? 'bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                >
                  <Icons.Search />
                </button>
              </div>
              {phoneError && (
                <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest mt-2 ml-1">Número inválido</p>
              )}
            </div>

            {hasSearched && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                {pendingTx ? (
                  <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest mb-1">Beneficiário</p>
                        <p className="text-lg font-black">{pendingTx.userName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Valor</p>
                        <p className="text-xl font-black">{pendingTx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} Kz</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-700/50 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>ID: {pendingTx.id}</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl text-center">
                    <p className="text-rose-400 font-black text-[10px] uppercase tracking-widest">Sem operações pendentes</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Ação de Auditoria
              </label>
              <button
                disabled={!pendingTx}
                onClick={() => setShowModal(true)}
                className={`w-full px-5 py-4 border-2 rounded-2xl text-left flex justify-between items-center transition-all ${!pendingTx ? 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed' : 'bg-slate-800 border-slate-700 hover:border-sky-500'}`}
              >
                <span className={`font-bold text-sm ${selectedStatus ? 'text-white' : 'text-slate-500'}`}>
                  {selectedStatus ? selectedStatus.toUpperCase() : 'Selecionar Novo Status...'}
                </span>
                <Icons.ChevronRight />
              </button>
            </div>

            <button
              disabled={!pendingTx || !selectedStatus}
              onClick={handleConfirm}
              className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${(!pendingTx || !selectedStatus)
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-white text-slate-900 hover:bg-slate-100 shadow-xl shadow-white/5 active:scale-95'
                }`}
            >
              Confirmar Transação
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Histórico Recente</h3>
              <button className="text-[10px] font-black text-sky-500 uppercase tracking-widest hover:underline">Ver Tudo</button>
            </div>
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <p className="font-bold text-slate-900">{t.userName}</p>
                        <p className="text-[10px] text-slate-400 font-bold">+244 {t.userPhone}</p>
                      </td>
                      <td>
                        <span className="font-black text-slate-700">{t.amount.toLocaleString('pt-BR')} Kz</span>
                      </td>
                      <td>
                        <span className={`badge ${t.status === TransactionStatus.RECHARGED ? 'badge-green' : t.status === TransactionStatus.REJECTED ? 'badge-red' : 'badge-orange'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-slate-500">{new Date().toLocaleDateString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-8 text-center bg-slate-900">
              <h3 className="font-black text-white uppercase text-xs tracking-[0.2em]">Auditar Transação</h3>
              <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase">Escolha o novo estado</p>
            </div>
            <div className="p-6 space-y-2">
              {[TransactionStatus.RECHARGED, TransactionStatus.REJECTED, TransactionStatus.PENDING].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus(status);
                    setShowModal(false);
                  }}
                  className="w-full py-4 px-6 hover:bg-slate-50 rounded-2xl text-sm font-black text-slate-700 transition-all text-left flex justify-between items-center"
                >
                  <span className="uppercase tracking-tight">{status}</span>
                  {status === TransactionStatus.RECHARGED ? <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> : null}
                  {status === TransactionStatus.REJECTED ? <div className="w-2 h-2 bg-rose-500 rounded-full"></div> : null}
                </button>
              ))}
            </div>
            <div className="p-4 bg-slate-50">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-4 text-center text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
