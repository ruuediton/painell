
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

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto pb-20">
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
          Gerenciar {type === 'DEPOSIT' ? 'Depósitos' : 'Retiradas'}
        </h2>
        <p className="text-slate-500 text-xs font-medium">Controle de solicitações para clientes de Angola (+244).</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Número do Cliente (+244)
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              maxLength={9}
              placeholder="9xxxxxxxx" 
              className={`flex-1 px-5 py-4 bg-slate-50 border-2 rounded-2xl focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-mono font-bold text-lg ${phoneError ? 'border-rose-200 text-rose-600 bg-rose-50' : 'border-slate-100 text-slate-900 focus:border-sky-500'}`}
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ''); 
                setPhone(val);
                if (hasSearched) {
                    setHasSearched(false);
                    setPendingTx(null);
                }
              }}
            />
            <button 
              onClick={handleSearch}
              disabled={!isValidPhone}
              className={`px-8 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isValidPhone ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200 active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
            >
              Buscar
            </button>
          </div>
          {phoneError && (
            <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest mt-1 ml-1 animate-pulse">
              Formato inválido. Use 9 dígitos (ex: 923xxxxxx)
            </p>
          )}
        </div>

        {hasSearched && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            {pendingTx ? (
              <div className="bg-sky-50/50 border-2 border-sky-100 rounded-3xl overflow-hidden">
                <div className="bg-sky-500 px-4 py-2 flex justify-between items-center">
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">Pendente Encontrado</span>
                  <span className="text-[9px] font-mono text-sky-100">TX: {pendingTx.id}</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Beneficiário</p>
                      <p className="text-sm font-bold text-slate-900">{pendingTx.userName}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Montante</p>
                      <p className="text-lg font-black text-emerald-600 font-mono">{pendingTx.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})} Kz</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">Terminal</p>
                      <p className="text-xs font-bold text-slate-700 font-mono">+244 {pendingTx.userPhone}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-3xl text-center">
                <p className="text-rose-600 font-black text-xs uppercase tracking-widest">Nenhuma operação pendente para este terminal.</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Status da Operação
          </label>
          <button 
            disabled={!pendingTx}
            onClick={() => setShowModal(true)}
            className={`w-full px-5 py-4 border-2 rounded-2xl text-left flex justify-between items-center transition-all ${!pendingTx ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed' : 'bg-white border-slate-100 hover:border-sky-300 shadow-sm'}`}
          >
            <span className={`font-bold text-sm lowercase ${selectedStatus ? 'text-slate-900' : 'text-slate-300'}`}>
              {selectedStatus ? selectedStatus : 'Selecione a ação...'}
            </span>
            <Icons.ChevronRight />
          </button>

          {showModal && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-xs rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-90 duration-200">
                <div className="p-6 text-center border-b border-slate-50">
                  <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Auditar Status</h3>
                </div>
                <div className="p-4 space-y-2">
                  {[TransactionStatus.PENDING, TransactionStatus.RECHARGED, TransactionStatus.REJECTED].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setSelectedStatus(status);
                        setShowModal(false);
                      }}
                      className="w-full py-4 px-4 hover:bg-slate-50 rounded-2xl text-sm font-black text-slate-700 transition-colors lowercase tracking-tight border border-transparent hover:border-slate-100"
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="w-full p-6 text-center text-[10px] font-black text-rose-500 hover:bg-rose-50 uppercase tracking-widest border-t border-slate-50 transition-colors"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          )}
        </div>

        <button 
          disabled={!pendingTx || !selectedStatus}
          onClick={handleConfirm}
          className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all ${
            (!pendingTx || !selectedStatus) 
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
            : 'bg-sky-600 text-white hover:bg-sky-700 active:scale-95 shadow-sky-200'
          }`}
        >
          Executar Auditoria
        </button>
      </div>
    </div>
  );
};

export default Transactions;
