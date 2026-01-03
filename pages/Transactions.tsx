import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { TransactionStatus, Transaction } from '../types';
import { Icons } from '../constants';
import { jsPDF } from 'jspdf';
import { showToast } from '../components/Toast';

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
  // Determine specific terms for this transaction type
  const successTerm = type === 'DEPOSIT' ? 'recarregado' : 'aprovado';
  const successLabel = type === 'DEPOSIT' ? 'Recarregado' : 'Aprovado';

  const [phone, setPhone] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [pendingTx, setPendingTx] = useState<ExtendedTransaction | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // States with dynamic types
  const [historyFilter, setHistoryFilter] = useState<'all' | string>('all');
  const [searchStatus, setSearchStatus] = useState<'pendente' | string>('pendente');
  const [searchDate, setSearchDate] = useState('');

  // Validação para Angola: 9 dígitos começando com 9
  const isValidPhone = /^9\d{8}$/.test(phone);
  const phoneError = phone.length > 0 && !isValidPhone;

  useEffect(() => {
    fetchRecentTransactions();

    // Set up realtime subscription
    const table = type === 'DEPOSIT' ? 'depositos_clientes' : 'retirada_clientes';
    const channel = supabase
      .channel(`recent_tx_${type}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          fetchRecentTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type, historyFilter]);

  // Reset filters when type changes
  useEffect(() => {
    setHistoryFilter('all');
    setSearchStatus('pendente');
    setPhone('');
    setPendingTx(null);
    setHasSearched(false);
    setSelectedStatus('');
    setSearchDate('');
    setRecentTransactions([]);
  }, [type]);

  const fetchRecentTransactions = async () => {
    try {
      let query;

      if (type === 'DEPOSIT') {
        // Using explicit join via user_id relationship
        query = supabase
          .from('depositos_clientes')
          .select('*, profiles:user_id(full_name, phone)')
          .order('created_at', { ascending: false })
          .limit(20);

        if (historyFilter !== 'all') {
          query = query.eq('estado_de_pagamento', historyFilter);
        }
      } else {
        query = supabase
          .from('retirada_clientes')
          .select('*')
          .order('data_de_criacao', { ascending: false })
          .limit(20);

        if (historyFilter !== 'all') {
          query = query.eq('estado_da_retirada', historyFilter);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error(`Error fetching ${type}:`, error);
        showToast(`Erro ao carregar ${type === 'DEPOSIT' ? 'depósitos' : 'saques'}`, 'error');
        return;
      }

      if (data) {
        if (type === 'DEPOSIT') {
          const mapped: Transaction[] = data.map((d: any) => {
            // Check both possible structures due to relationship mapping
            const profile = d.profiles;
            return {
              id: d.id,
              userId: d.user_id,
              userName: profile?.full_name || 'Desconhecido',
              userPhone: profile?.phone || 'N/A',
              amount: Number(d.valor_deposito),
              status: mapStatus(d.estado_de_pagamento),
              date: new Date(d.created_at).toLocaleDateString('pt-BR'),
              type: 'DEPOSIT'
            };
          });
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
      console.error('Unexpected error:', err);
    }
  };

  const mapStatus = (status: string): TransactionStatus => {
    const s = status?.toLowerCase() || '';
    if (s === successTerm || s === 'aprovado' || s === 'concluido' || s === 'recarregado') return TransactionStatus.RECHARGED;
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

          // Status Filter (Exact match now since we use correct Terms)
          query = query.eq('estado_de_pagamento', searchStatus);

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
              type: 'DEPOSIT',
              bankName: txData.nome_do_banco
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
        query = query.eq('estado_da_retirada', searchStatus);

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
    setIsSubmitting(true);

    try {
      // Use logic status directly
      const dbStatus = selectedStatus;

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

      showToast(`Sucesso! Status alterado para ${dbStatus}.`, 'success');

      setPhone('');
      setPendingTx(null);
      setSelectedStatus('');
      setHasSearched(false);
      fetchRecentTransactions();

    } catch (err: any) {
      showToast('Erro ao atualizar: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copiado para a área de transferência!', 'success');
  };

  const generatePDF = (tx: ExtendedTransaction) => {
    const doc = new jsPDF();
    const title = type === 'DEPOSIT' ? 'RECEIPT OF DEPOSIT' : 'RECEIPT OF WITHDRAWAL';

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(title, 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");

    let y = 40;
    const lineHeight = 10;

    const addLine = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, 80, y);
      y += lineHeight;
    };

    addLine("Transaction ID:", tx.id);
    addLine("Date:", new Date(tx.date).toLocaleString());
    addLine("User Name:", tx.userName || "N/A");
    addLine("Phone:", tx.userPhone || "N/A");
    addLine("Amount:", `Kz ${tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    addLine("Status:", tx.status);

    if (tx.bankName) addLine("Bank:", tx.bankName);
    if (tx.iban) addLine("IBAN:", tx.iban);
    if (tx.netValue) addLine("Net Value:", `Kz ${tx.netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFontSize(10);
    doc.text("deeBank System Audit Log", 105, y, { align: 'center' });

    doc.save(`transaction_${tx.id}.pdf`);
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-6 duration-700 pb-24">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-1 lg:space-y-2">
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl ${type === 'DEPOSIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {type === 'DEPOSIT' ? <Icons.Deposits /> : <Icons.Withdrawals />}
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight uppercase">
              {type === 'DEPOSIT' ? 'Depósitos' : 'Saques'}
            </h2>
          </div>
          <p className="text-slate-500 font-medium text-sm md:text-lg ml-11 md:ml-14">
            Auditoria inteligente e gestão de {type === 'DEPOSIT' ? 'recargas' : 'pagamentos'}.
          </p>
        </div>

        <div className="flex items-center gap-3 md:gap-4 bg-white p-1.5 md:p-2 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm pr-4 md:pr-6">
          <div className="flex -space-x-2 md:-space-x-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + (type === 'DEPOSIT' ? 10 : 20)}`} alt="User" />
              </div>
            ))}
          </div>
          <div className="text-right">
            <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status da Rede</p>
            <p className="text-[10px] md:text-xs font-bold text-slate-900">Operando 100%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* ACTION COLUMN */}
        <div className="xl:col-span-5 space-y-6 md:space-y-8">
          <div className="bg-white rounded-3xl md:rounded-[3rem] p-6 md:p-10 border border-slate-200 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
            {/* Search Decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-sky-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700"></div>

            <div className="relative z-10 space-y-6 md:space-y-8">
              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Localizador</h3>
                <p className="text-slate-400 font-medium text-xs md:text-sm">Insira os dados para encontrar a transação.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telefone do Cliente</label>
                  <div className="relative">
                    <span className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-300 font-black text-base md:text-lg">+244</span>
                    <input
                      type="text"
                      maxLength={9}
                      placeholder="9xx xxx xxx"
                      className={`w-full pl-16 md:pl-20 pr-5 md:pr-6 py-4 md:py-5 bg-slate-50 border-2 rounded-xl md:rounded-[1.5rem] focus:ring-4 focus:ring-sky-500/10 outline-none transition-all font-black text-lg md:text-xl tracking-widest ${phoneError ? 'border-rose-200 text-rose-500' : 'border-slate-100 text-slate-700 focus:border-sky-500/30 shadow-inner'}`}
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPhone(val);
                        if (hasSearched) setHasSearched(false);
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                    <select
                      value={searchStatus}
                      onChange={(e) => {
                        setSearchStatus(e.target.value);
                        if (hasSearched) setHasSearched(false);
                      }}
                      className="w-full h-[60px] px-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold text-xs uppercase focus:border-sky-500/30 outline-none appearance-none shadow-sm cursor-pointer"
                    >
                      <option value="pendente">Pendente</option>
                      <option value={successTerm}>{successLabel}</option>
                      <option value="rejeitado">Rejeitado</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                    <input
                      type="date"
                      value={searchDate}
                      onChange={(e) => {
                        setSearchDate(e.target.value);
                        if (hasSearched) setHasSearched(false);
                      }}
                      className="w-full h-[60px] px-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-700 font-bold text-xs uppercase focus:border-sky-500/30 outline-none shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={!isValidPhone || loading}
                className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${isValidPhone && !loading ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Icons.Search />
                    <span>Localizar Transação</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SEARCH RESULT CARD */}
          {hasSearched && (
            <div className="animate-in zoom-in-95 duration-500">
              {pendingTx ? (
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
                  <div className={`p-8 ${type === 'DEPOSIT' ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Comprovante de Auditoria</p>
                        <h4 className="text-3xl font-black tracking-tight leading-none">
                          Kz {pendingTx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h4>
                      </div>
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/20">
                        {type === 'DEPOSIT' ? <Icons.Deposits /> : <Icons.Withdrawals />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/30 ${pendingTx.status === TransactionStatus.RECHARGED ? 'bg-white text-emerald-600' : pendingTx.status === TransactionStatus.REJECTED ? 'bg-white text-rose-600' : 'bg-white/20 text-white'}`}>
                        {pendingTx.status === TransactionStatus.RECHARGED ? successLabel : pendingTx.status === TransactionStatus.REJECTED ? 'Rejeitado' : 'Aguardando'}
                      </span>
                      <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">ID: {pendingTx.id.substring(0, 12)}</span>
                    </div>
                  </div>

                  <div className="p-10 space-y-8 bg-slate-50/50">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Titular</p>
                        <p className="text-sm font-black text-slate-800">{pendingTx.userName}</p>
                        <p className="text-xs font-bold text-slate-400">{pendingTx.userPhone}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data do Pedido</p>
                        <p className="text-sm font-black text-slate-800">{new Date(pendingTx.date).toLocaleDateString('pt-BR')}</p>
                        <p className="text-xs font-bold text-slate-400">{new Date(pendingTx.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-5 bg-white rounded-[1.5rem] border border-slate-100 flex justify-between items-center group/item transition-all hover:border-sky-200">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Instituição</p>
                          <p className="text-sm font-black text-slate-800">{pendingTx.bankName || 'Não especificado'}</p>
                        </div>
                        {pendingTx.bankName && (
                          <button onClick={() => copyToClipboard(pendingTx.bankName || '')} className="p-2 text-slate-300 hover:text-sky-500 transition-colors opacity-0 group-hover/item:opacity-100">
                            <Icons.Dashboard />
                          </button>
                        )}
                      </div>

                      {type === 'WITHDRAWAL' && (
                        <>
                          <div className="p-5 bg-white rounded-[1.5rem] border border-slate-100 group/item transition-all hover:border-sky-200">
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IBAN de Destino</p>
                              <button onClick={() => copyToClipboard(pendingTx.iban || '')} className="p-2 text-slate-300 hover:text-sky-500 transition-colors opacity-0 group-hover/item:opacity-100">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                              </button>
                            </div>
                            <p className="text-xs font-mono font-black text-sky-600 break-all">{pendingTx.iban || 'N/A'}</p>
                          </div>

                          <div className="p-6 bg-slate-900 rounded-[1.5rem] text-white flex justify-between items-center shadow-lg shadow-slate-900/10">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pagamento Líquido (Taxa 10%)</p>
                              <p className="text-2xl font-black text-emerald-400">Kz {pendingTx.netValue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <button onClick={() => copyToClipboard(pendingTx.netValue?.toString() || '')} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                              <Icons.Dashboard />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-200/50 space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Executar Ação</label>
                        <button
                          onClick={() => setShowModal(true)}
                          disabled={isSubmitting}
                          className="w-full px-6 py-5 bg-white border-2 border-slate-100 hover:border-sky-500/30 rounded-2xl flex justify-between items-center group transition-all"
                        >
                          <span className={`font-black text-xs uppercase tracking-widest ${selectedStatus ? 'text-slate-900' : 'text-slate-400'}`}>
                            {selectedStatus ? selectedStatus : 'Selecione o estado final...'}
                          </span>
                          <div className="p-1 bg-slate-50 rounded-lg group-hover:bg-sky-50 transition-colors">
                            <Icons.ChevronRight />
                          </div>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => generatePDF(pendingTx)}
                          className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                        >
                          Baixar PDF
                        </button>
                        <button
                          disabled={!selectedStatus || isSubmitting}
                          onClick={handleConfirm}
                          className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${!selectedStatus || isSubmitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'}`}
                        >
                          {isSubmitting ? 'Sincronizando...' : 'Confirmar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 p-16 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                    <Icons.Search />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Vazio por aqui</h4>
                  <p className="text-slate-500 text-sm font-medium mt-1">Não encontramos nada com esses filtros.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* HISTORY COLUMN */}
        <div className="xl:col-span-7">
          <div className="bg-white rounded-3xl md:rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
            <div className="p-6 md:p-10 border-b border-slate-100 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">Fluxo Recente</h3>
                  <p className="text-slate-400 font-medium text-xs md:text-sm">Últimas 20 transações em tempo real.</p>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-[1.25rem] border border-slate-200/50 overflow-x-auto max-w-full">
                  {[
                    { id: 'all', label: 'Tudo' },
                    { id: 'pendente', label: 'Pendente' },
                    { id: successTerm, label: successLabel },
                    { id: 'rejeitado', label: 'Falhou' }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setHistoryFilter(filter.id)}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${historyFilter === filter.id ? (filter.id === successTerm ? 'bg-emerald-500 text-white' : filter.id === 'rejeitado' ? 'bg-rose-500 text-white' : 'bg-white shadow-lg text-slate-900') : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 md:p-10">
              <div className="grid gap-4">
                {loading && recentTransactions.length === 0 ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-slate-50 rounded-3xl animate-pulse border border-slate-100"></div>
                  ))
                ) : recentTransactions.length === 0 ? (
                  <div className="py-20 text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200 border-2 border-dashed border-slate-100">
                      <Icons.History />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Sem atividades recentes</h4>
                      <p className="text-slate-400 font-medium text-sm max-w-xs mx-auto">Não encontramos registros para o filtro selecionado no momento.</p>
                    </div>
                  </div>
                ) : (
                  recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => { setPhone(tx.userPhone); handleSearch(); }}
                      className="group bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-sky-100 transition-all duration-300 flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-inner ${tx.status === TransactionStatus.RECHARGED ? 'bg-emerald-50 text-emerald-500' : tx.status === TransactionStatus.REJECTED ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                          {tx.type === 'DEPOSIT' ? '💰' : '💸'}
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900 group-hover:text-sky-600 transition-colors uppercase leading-tight">
                            {tx.userName}
                          </h4>
                          <p className="text-xs font-bold text-slate-400 mt-0.5 font-mono">{tx.userPhone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Valor</p>
                          <p className={`text-lg font-black ${tx.status === TransactionStatus.RECHARGED ? 'text-emerald-500' : tx.status === TransactionStatus.REJECTED ? 'text-rose-500' : 'text-amber-500'}`}>
                            Kz {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-widest ${tx.status === TransactionStatus.RECHARGED ? 'bg-emerald-50 text-emerald-600' : tx.status === TransactionStatus.REJECTED ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                            {tx.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300 font-mono italic">{tx.date}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base de Dados Sincronizada em Produção</p>
            </div>
          </div>
        </div>

        {/* STATUS SELECTION MODAL */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="p-10 text-center bg-slate-900 text-white relative">
                <div className="absolute top-0 right-0 p-4 opacity-20"><Icons.Dashboard /></div>
                <h3 className="font-black uppercase text-xs tracking-[0.3em] mb-2">Auditoria deeBank</h3>
                <p className="text-slate-400 text-sm font-medium">Defina o estado final da transação para liberação de fundos.</p>
              </div>

              <div className="p-8 space-y-3 bg-slate-50/30">
                {[
                  { id: successTerm, label: successLabel, color: 'emerald', icon: '✅' },
                  { id: 'rejeitado', label: 'Rejeitado', color: 'rose', icon: '❌' },
                  { id: 'pendente', label: 'Pendente', color: 'amber', icon: '⏳' }
                ].map((status) => (
                  <button
                    key={status.id}
                    onClick={() => {
                      setSelectedStatus(status.id);
                      setShowModal(false);
                    }}
                    className={`w-full py-5 px-6 bg-white hover:bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-${status.color}-200 flex items-center justify-between group transition-all duration-300 active:scale-95`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xl">{status.icon}</span>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-900">
                        {status.label}
                      </span>
                    </div>
                    <div className={`w-2 h-2 rounded-full transform group-hover:scale-150 transition-transform ${status.id === successTerm ? 'bg-emerald-500' : status.id === 'rejeitado' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                  </button>
                ))}
              </div>

              <div className="p-6 bg-white flex justify-center border-t border-slate-100">
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[10px] font-black text-slate-300 hover:text-slate-500 uppercase tracking-[0.3em] transition-colors"
                >
                  Descartar Ação
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
