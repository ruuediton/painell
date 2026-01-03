import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Icons } from '../constants';
import { showToast } from '../components/Toast';

interface CompanyBank {
    id: string;
    nome_do_banco: string;
    iban: string;
    nome_favorecido: string;
    ativo: boolean;
    created_at?: string;
}

const Dados: React.FC = () => {
    const [banks, setBanks] = useState<CompanyBank[]>([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentBank, setCurrentBank] = useState<Partial<CompanyBank>>({});

    useEffect(() => {
        fetchBanks();
    }, []);

    const fetchBanks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bancos_empresa')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setBanks(data);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const bankData = {
                nome_do_banco: currentBank.nome_do_banco,
                iban: currentBank.iban,
                nome_favorecido: currentBank.nome_favorecido || 'DEEPBANK LDA',
                ativo: currentBank.ativo !== undefined ? currentBank.ativo : true
            };

            if (isEditing && currentBank.id) {
                const { error } = await supabase
                    .from('bancos_empresa')
                    .update(bankData)
                    .eq('id', currentBank.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('bancos_empresa')
                    .insert([bankData]);
                if (error) throw error;
            }

            setShowModal(false);
            setCurrentBank({});
            fetchBanks();
            showToast('Dados bancários salvos!', 'success');
        } catch (err: any) {
            showToast('Erro ao salvar: ' + err.message, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja apagar esta conta da empresa?')) {
            try {
                const { error } = await supabase.from('bancos_empresa').delete().eq('id', id);
                if (error) throw error;
                fetchBanks();
                showToast('Conta removida com sucesso!', 'success');
            } catch (err: any) {
                showToast('Erro ao deletar: ' + err.message, 'error');
            }
        }
    };

    const openEdit = (bank: CompanyBank) => {
        setCurrentBank(bank);
        setIsEditing(true);
        setShowModal(true);
    };

    const openNew = () => {
        setCurrentBank({ ativo: true, nome_favorecido: 'DEEPBANK LDA' });
        setIsEditing(false);
        setShowModal(true);
    };

    const toggleStatus = async (bank: CompanyBank) => {
        try {
            const { error } = await supabase
                .from('bancos_empresa')
                .update({ ativo: !bank.ativo })
                .eq('id', bank.id);
            if (error) throw error;
            fetchBanks();
            showToast(`Status atualizado para ${!bank.ativo ? 'Ativo' : 'Inativo'}`, 'info');
        } catch (err: any) {
            showToast('Erro ao atualizar status: ' + err.message, 'error');
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Dados da Empresa</h2>
                    <p className="text-slate-500 font-medium text-lg">Gerencie as contas bancárias para recebimentos.</p>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center space-x-2 px-6 py-3 bg-sky-600 text-white rounded-2xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20 active:scale-95 font-black uppercase text-xs tracking-widest"
                >
                    <Icons.Plus />
                    <span>Nova Conta</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <p className="col-span-3 text-center text-slate-400 font-bold uppercase py-20">Carregando contas...</p>
                ) : banks.map((bank) => (
                    <div key={bank.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col relative">
                        <div className={`h-2 ${bank.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <div className="p-8 flex-1 flex flex-col space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500">
                                    <Icons.Dashboard />
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide cursor-pointer select-none ${bank.ativo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`} onClick={() => toggleStatus(bank)}>
                                    {bank.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Banco</p>
                                <h4 className="text-lg font-black text-slate-900 leading-tight">{bank.nome_do_banco}</h4>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Favorecido</p>
                                <p className="font-bold text-slate-700">{bank.nome_favorecido}</p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">IBAN</p>
                                <p className="font-mono font-bold text-sky-600 text-sm break-all">{bank.iban}</p>
                            </div>

                            <div className="mt-auto flex gap-3 pt-4 border-t border-slate-50">
                                <button onClick={() => openEdit(bank)} className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                                    Editar
                                </button>
                                <button onClick={() => handleDelete(bank.id)} className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 rounded-xl transition-all">
                                    <Icons.Trash />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-8 w-full max-w-lg shadow-2xl relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                        >
                            ✕
                        </button>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">
                            {isEditing ? 'Editar Conta' : 'Nova Conta Bancária'}
                        </h3>

                        <div className="space-y-6 mb-8">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome do Banco</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-500 transition-colors"
                                    value={currentBank.nome_do_banco || ''}
                                    onChange={e => setCurrentBank({ ...currentBank, nome_do_banco: e.target.value })}
                                    placeholder="Ex: Banco BAI"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome do Favorecido</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-500 transition-colors"
                                    value={currentBank.nome_favorecido || ''}
                                    onChange={e => setCurrentBank({ ...currentBank, nome_favorecido: e.target.value })}
                                    placeholder="DEEPBANK LDA"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">IBAN</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-500 transition-colors"
                                    value={currentBank.iban || ''}
                                    onChange={e => setCurrentBank({ ...currentBank, iban: e.target.value })}
                                    placeholder="AO06..."
                                />
                            </div>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="activeCheck"
                                    checked={currentBank.ativo ?? true}
                                    onChange={e => setCurrentBank({ ...currentBank, ativo: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                <label htmlFor="activeCheck" className="text-sm font-bold text-slate-700 select-none cursor-pointer">Conta Ativa para Depósitos</label>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                            <button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-4 bg-sky-600 text-white font-black uppercase text-xs rounded-xl hover:bg-sky-700 shadow-xl shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Conta')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dados;
