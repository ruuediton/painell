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
        <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Empresa</h2>
                    <p className="text-slate-500 font-medium text-sm md:text-lg mt-1 md:mt-2">Gerencie as contas bancárias.</p>
                </div>
                <button
                    onClick={openNew}
                    className="flex items-center justify-center space-x-2 px-6 py-3.5 md:py-3 bg-sky-600 text-white rounded-xl md:rounded-2xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20 active:scale-95 font-black uppercase text-[10px] md:text-xs tracking-widest w-full md:w-auto"
                >
                    <Icons.Plus />
                    <span>Nova Conta</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-slate-100 shadow-sm"></div>
                    ))
                ) : banks.map((bank) => (
                    <div key={bank.id} className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col relative">
                        <div className={`h-1.5 md:h-2 ${bank.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <div className="p-6 md:p-8 flex-1 flex flex-col space-y-3 md:space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-sky-50 flex items-center justify-center text-sky-500 border border-sky-100">
                                    <Icons.Dashboard />
                                </div>
                                <span className={`text-[8px] md:text-[10px] font-black px-1.5 md:px-2 py-0.5 rounded md:rounded uppercase tracking-wide cursor-pointer select-none ${bank.ativo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`} onClick={() => toggleStatus(bank)}>
                                    {bank.ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>

                            <div>
                                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">Banco</p>
                                <h4 className="text-base md:text-lg font-black text-slate-900 leading-tight">{bank.nome_do_banco}</h4>
                            </div>

                            <div>
                                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">Favorecido</p>
                                <p className="text-sm md:text-base font-bold text-slate-700 line-clamp-1">{bank.nome_favorecido}</p>
                            </div>

                            <div className="bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100">
                                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 md:mb-1">IBAN</p>
                                <p className="font-mono font-bold text-sky-600 text-xs md:text-sm break-all">{bank.iban}</p>
                            </div>

                            <div className="mt-auto flex gap-2 md:gap-3 pt-4 border-t border-slate-50">
                                <button onClick={() => openEdit(bank)} className="flex-1 py-2.5 md:py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all">
                                    Editar
                                </button>
                                <button onClick={() => handleDelete(bank.id)} className="px-3 md:px-4 py-2.5 md:py-3 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 rounded-lg md:rounded-xl transition-all">
                                    <Icons.Trash />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 md:p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl md:rounded-[2rem] p-6 md:p-8 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 w-8 h-8 md:w-10 md:h-10 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 flex items-center justify-center transition-colors text-xs"
                        >
                            ✕
                        </button>
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mb-6 md:mb-8">
                            {isEditing ? 'Editar Conta' : 'Nova Conta Bancária'}
                        </h3>

                        <div className="space-y-4 md:space-y-6 mb-6 md:mb-8">
                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 block">Banco</label>
                                <input
                                    type="text"
                                    className="w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-lg md:rounded-xl font-bold text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 transition-colors"
                                    value={currentBank.nome_do_banco || ''}
                                    onChange={e => setCurrentBank({ ...currentBank, nome_do_banco: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 block">Favorecido</label>
                                <input
                                    type="text"
                                    className="w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-lg md:rounded-xl font-bold text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 transition-colors"
                                    value={currentBank.nome_favorecido || ''}
                                    onChange={e => setCurrentBank({ ...currentBank, nome_favorecido: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 block">IBAN</label>
                                <input
                                    type="text"
                                    className="w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-lg md:rounded-xl font-bold font-mono text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 transition-colors"
                                    value={currentBank.iban || ''}
                                    onChange={e => setCurrentBank({ ...currentBank, iban: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 md:gap-4">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-3 md:py-4 text-slate-500 font-bold uppercase text-[10px] md:text-xs hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
                            <button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-3 md:py-4 bg-sky-600 text-white font-black uppercase text-[10px] md:text-xs rounded-xl hover:bg-sky-700 shadow-xl shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50">
                                {isSubmitting ? '...' : (isEditing ? 'Salvar' : 'Criar')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dados;
