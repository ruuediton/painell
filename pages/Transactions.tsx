import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { TransactionStatus, Transaction } from '../types';
import { Icons } from '../constants';

interface ExtendedTransaction extends Transaction {
  bankName?: string;
  iban?: string;
  netValue?: number;
}

interface TransactionsProps {
  type: 'DEPOSIT' | 'WITHDRAWAL';
  onLogAction: (action: string, details: string) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ type, onLogAction }) => {
  const [phone, setPhone] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [pendingTx, setPendingTx] = useState<ExtendedTransaction | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'aprovado' | 'rejeitado' | 'pendente'>('all');
  const [searchStatus, setSearchStatus] = useState<'pendente' | 'aprovado' | 'rejeitado'>('pendente');
  const [searchDate, setSearchDate] = useState('');

  // Validação para Angola: 9 dígitos começando com 9
  const isValidPhone = /^9\d{8}$/.test(phone);
  const phoneError = phone.length > 0 && !isValidPhone;

  useEffect(() => {
    fetchRecentTransactions();
  }, [type, historyFilter]);

  const fetchRecentTransactions = async () => {
    try {
      let query;

      if (type === 'DEPOSIT') {
        query = supabase
          .from('depositos_clientes')
          .select('*, profiles(full_name, phone)')
          .order('created_at', { ascending: false })
          .limit(20);

        if (historyFilter !== 'all') {
          if (historyFilter === 'aprovado') {
            query = query.in('estado_de_pagamento', ['aprovado', 'recarregado', 'concluido']);
          } else {
            query = query.eq('estado_de_pagamento', historyFilter);
          }
        }
      } else {
        query = supabase
          .from('retirada_clientes')
          .select('*')
          .order('data_de_criacao', { ascending: false })
          .limit(20);

        if (historyFilter !== 'all') {
          if (historyFilter === 'aprovado') {
            query = query.in('estado_da_retirada', ['aprovado', 'concluido']);
          } else {
            query = query.eq('estado_da_retirada', historyFilter);
          }
        }
      }

      const { data } = await query;

      if (data) {
        if (type === 'DEPOSIT') {
          const mapped: Transaction[] = data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            userName: d.profiles?.full_name || 'Desconhecido',
            userPhone: d.profiles?.phone || 'N/A',
            amount: Number(d.valor_deposito),
            status: mapStatus(d.estado_de_pagamento),
            date: new Date(d.created_at).toLocaleDateString('pt-BR'),
            type: 'DEPOSIT'
          }));
          setRecentTransactions(mapped);
        } else {
          const mapped: Transaction[] = data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            userName: d.nome_completo || 'Desconhecido',
            userPhone: d.telefone_do_usuario || 'N/A',
            amount: Number(d.valor_solicitado),
            status: mapStatus(d.estado_da_retirada),
            date: new Date(d.data_de_criacao).toLocaleDateString('pt-BR'),
            type: 'WITHDRAWAL'
          }));
          setRecentTransactions(mapped);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const mapStatus = (status: string): TransactionStatus => {
    const s = status?.toLowerCase() || '';
    if (s === 'aprovado' || s === 'concluido' || s === 'recarregado') return TransactionStatus.RECHARGED;
    if (s === 'rejeitado') return TransactionStatus.REJECTED;
    return TransactionStatus.PENDING;
  };

  const handleSearch = async () => {
    if (!isValidPhone) return;
    setLoading(true);
    setHasSearched(true);
    setPendingTx(null);

    try {
      if (type === 'DEPOSIT') {
        const { data: userData } = await supabase.from('profiles').select('id, full_name').eq('phone', phone).single();

        if (userData) {
          let query = supabase
            .from('depositos_clientes')
            .select('*')
            .eq('user_id', userData.id);

          // Status Filter
          if (searchStatus === 'aprovado') {
            query = query.in('estado_de_pagamento', ['aprovado', 'recarregado', 'concluido']);
          } else {
            query = query.eq('estado_de_pagamento', searchStatus);
          }

          // Date Filter
          if (searchDate) {
            query = query.gte('created_at', `${searchDate}T00:00:00`).lte('created_at', `${searchDate}T23:59:59`);
          }

          const { data: txData } = await query.order('created_at', { ascending: false }).limit(1).single();

          if (txData) {
            setPendingTx({
              id: txData.id,
              userId: txData.user_id,
              userName: userData.full_name,
              userPhone: phone,
              amount: Number(txData.valor_deposito),
              status: mapStatus(txData.estado_de_pagamento),
              date: txData.created_at,
              type: 'DEPOSIT'
            });
          }
        }
      } else {
        // WITHDRAWAL
        let query = supabase
          .from('retirada_clientes')
          .select('*')
          .eq('telefone_do_usuario', phone);

        // Status Filter
        if (searchStatus === 'aprovado') {
          query = query.in('estado_da_retirada', ['aprovado', 'concluido']);
        } else {
          query = query.eq('estado_da_retirada', searchStatus);
        }

        // Date Filter
        if (searchDate) {
          query = query.gte('data_de_criacao', `${searchDate}T00:00:00`).lte('data_de_criacao', `${searchDate}T23:59:59`);
        }

        const { data: txData } = await query.order('data_de_criacao', { ascending: false }).limit(1).single();

        if (txData) {
          const amount = Number(txData.valor_solicitado);
          setPendingTx({
            id: txData.id,
            userId: txData.user_id,
            userName: txData.nome_completo,
            userPhone: phone,
            amount: amount,
            status: mapStatus(txData.estado_da_retirada),
            date: txData.data_de_criacao,
            type: 'WITHDRAWAL',
            bankName: txData.nome_do_banco,
            iban: txData.iban,
            netValue: amount * 0.90 // 10% discount implies 90% payout
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingTx || !selectedStatus) return;

    try {
      // Map UI Status to DB Status Strings (lowercase)
      let dbStatus = 'pendente';
      if (selectedStatus === 'aprovado') dbStatus = 'aprovado';
      else if (selectedStatus === 'rejeitado') dbStatus = 'rejeitado';

      const table = type === 'DEPOSIT' ? 'depositos_clientes' : 'retirada_clientes';
      const statusCol = type === 'DEPOSIT' ? 'estado_de_pagamento' : 'estado_da_retirada';

      const { error } = await supabase
        .from(table)
        .update({ [statusCol]: dbStatus })
        .eq('id', pendingTx.id);

      if (error) throw error;

      onLogAction(
        `Auditoria de ${type === 'DEPOSIT' ? 'Depósito' : 'Saque'}`,
        `Admin alterou status da transação ${pendingTx.id} para ${dbStatus}`
      );

      alert(`Sucesso! Status alterado para ${dbStatus}.`);

      setPhone('');
      setPendingTx(null);
      setSelectedStatus('');
      setHasSearched(false);
      fetchRecentTransactions();

    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

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
        {/* Left Panel: Search & Action */}
        <div className="lg:col-span-5 space-y-6">
          <div className="premium-card p-8 space-y-8 bg-slate-900 text-white border-none shadow-2xl shadow-slate-200">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                Buscar Transação
              </label>
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

              <div className="flex gap-4">
                <div className="flex-1">
                  <select
                    value={searchStatus}
                    onChange={(e) => {
                      setSearchStatus(e.target.value as any);
                      if (hasSearched) setHasSearched(false);
                    }}
                    className="w-full h-[56px] px-4 bg-slate-800 border-2 border-slate-700 rounded-2xl text-white font-bold text-xs uppercase focus:border-sky-500 outline-none appearance-none"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="rejeitado">Rejeitado</option>
                  </select>
                </div>
                <div className="flex-1">
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => {
                      setSearchDate(e.target.value);
                      if (hasSearched) setHasSearched(false);
                    }}
                    className="w-full h-[56px] px-4 bg-slate-800 border-2 border-slate-700 rounded-2xl text-white font-bold text-xs uppercase focus:border-sky-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={!isValidPhone || loading}
              className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isValidPhone ? 'bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
            >
              <div className="flex items-center justify-center space-x-2">
                <Icons.Search />
                <span>Localizar</span>
              </div>
            </button>

            {hasSearched && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                {pendingTx ? (
                  <div className="bg-slate-800/50 rounded-3xl border border-slate-700 p-6 space-y-5">
                    <div className="flex justify-between items-start border-b border-slate-700/50 pb-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Titular da Conta</p>
                        <p className="text-lg font-black">{pendingTx.userName}</p>
                        <p className="text-xs text-slate-400 font-mono">{pendingTx.userPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Valor Solicitado</p>
                        <p className="text-xl font-black text-white">Kz {pendingTx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    {type === 'WITHDRAWAL' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1 bg-slate-900/50 p-3 rounded-xl border border-slate-700/30">
                            <div className="flex justify-between items-center">
                              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Valor Final (90%)</p>
                              <button onClick={() => copyToClipboard(pendingTx.netValue?.toString() || '')} className="text-slate-400 hover:text-white"><Icons.Dashboard /></button>
                            </div>
                            <p className="text-lg font-black text-white">
                              Kz {pendingTx.netValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="space-y-1 bg-slate-900/50 p-3 rounded-xl border border-slate-700/30">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Banco</p>
                            <p className="text-sm font-bold text-white truncate" title={pendingTx.bankName}>
                              {pendingTx.bankName || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1 bg-slate-900/50 p-3 rounded-xl border border-slate-700/30">
                          <div className="flex justify-between items-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IBAN</p>
                            <button onClick={() => copyToClipboard(pendingTx.iban || '')} className="text-slate-400 hover:text-sky-400" title="Copiar IBAN">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                          </div>
                          <p className="text-xs font-mono font-bold text-sky-200 break-all">
                            {pendingTx.iban || 'Não informado'}
                          </p>
                        </div>
                      </>
                    )}

                    <div className="pt-2 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>ID: {pendingTx.id.substring(0, 8)}</span>
                      <span>DATA: {new Date(pendingTx.date).toLocaleDateString('pt-BR')}</span>
                      <span className={`badge ${pendingTx.status === TransactionStatus.RECHARGED ? 'badge-green' : pendingTx.status === TransactionStatus.REJECTED ? 'badge-red' : 'badge-orange'}`}>
                        {pendingTx.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-sky-500/10 border border-sky-500/20 p-6 rounded-3xl text-center">
                    <p className="text-sky-400 font-black text-[10px] uppercase tracking-widest">Nenhuma transação encontrada</p>
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
              Atualizar Transação
            </button>
          </div>
        </div>

        {/* Right Panel: History */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Histórico Recente</h3>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {(['all', 'aprovado', 'rejeitado', 'pendente'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setHistoryFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${historyFilter === filter ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {filter === 'all' ? 'Todos' : filter}
                  </button>
                ))}
              </div>
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
                        <p className="text-[10px] text-slate-400 font-bold">{t.userPhone}</p>
                      </td>
                      <td>
                        <span className="font-black text-slate-700">{t.amount.toLocaleString('pt-BR')} Kz</span>
                      </td>
                      <td>
                        <span className={`badge ${t.status === TransactionStatus.RECHARGED ? 'badge-green' : t.status === TransactionStatus.REJECTED ? 'badge-red' : 'badge-orange'}`}>
                          {t.status === TransactionStatus.RECHARGED ? 'Aprovado' : t.status === TransactionStatus.REJECTED ? 'Rejeitado' : 'Pendente'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-slate-500">{t.date}</span>
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
              <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase">Definir estado final</p>
            </div>
            <div className="p-6 space-y-2">
              {['aprovado', 'rejeitado', 'pendente'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setSelectedStatus(status);
                    setShowModal(false);
                  }}
                  className="w-full py-4 px-6 hover:bg-slate-50 rounded-2xl text-sm font-black text-slate-700 transition-all text-left flex justify-between items-center group"
                >
                  <span className="uppercase tracking-tight group-hover:text-blue-600 transition-colors">{status}</span>
                  {status === 'aprovado' && <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>}
                  {status === 'rejeitado' && <div className="w-2 h-2 bg-rose-500 rounded-full"></div>}
                  {status === 'pendente' && <div className="w-2 h-2 bg-amber-500 rounded-full"></div>}
                </button>
              ))}
            </div>
            <div className="p-4 bg-slate-50">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-4 text-center text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
