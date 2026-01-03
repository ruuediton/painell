import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Icons } from '../constants';
import { showToast } from '../components/Toast';

interface SupportLink {
    id: string;
    whatsapp_gerente_url: string;
    whatsapp_grupo_vendas_url: string;
    telegram_canal_url: string;
}

const Suporte: React.FC = () => {
    const [links, setLinks] = useState<SupportLink | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formState, setFormState] = useState({
        whatsapp_gerente_url: '',
        whatsapp_grupo_vendas_url: '',
        telegram_canal_url: ''
    });

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('atendimento_links')
                .select('*')
                .limit(1)
                .single();

            if (data) {
                setLinks(data);
                setFormState({
                    whatsapp_gerente_url: data.whatsapp_gerente_url || '',
                    whatsapp_grupo_vendas_url: data.whatsapp_grupo_vendas_url || '',
                    telegram_canal_url: data.telegram_canal_url || ''
                });
            } else if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
                console.error('Error fetching support links:', error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (links?.id) {
                const { error } = await supabase
                    .from('atendimento_links')
                    .update(formState)
                    .eq('id', links.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('atendimento_links')
                    .insert([formState]);
                if (error) throw error;
            }

            await fetchLinks();
            setIsEditing(false);
            showToast('Links de suporte atualizados com sucesso!', 'success');
        } catch (err: any) {
            showToast('Erro ao salvar: ' + err.message, 'error');
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Suporte</h2>
                    <p className="text-slate-500 font-medium text-lg">Gerencie os links de atendimento da plataforma.</p>
                </div>
            </div>

            <div className="premium-card p-10 space-y-8 bg-white shadow-xl shadow-slate-200/50">
                <div className="flex justify-between items-center border-b border-slate-100 pb-6">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Canais de Atendimento</h3>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center space-x-2 text-sky-500 hover:text-sky-600 font-bold uppercase text-xs tracking-widest transition-colors"
                        >
                            <Icons.Edit />
                            <span>Editar Links</span>
                        </button>
                    ) : (
                        <div className="flex space-x-4">
                            <button
                                onClick={() => { setIsEditing(false); fetchLinks(); }}
                                className="text-slate-400 hover:text-slate-600 font-bold uppercase text-xs tracking-widest transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="text-emerald-500 hover:text-emerald-600 font-bold uppercase text-xs tracking-widest transition-colors"
                            >
                                Salvar
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid gap-8">
                    {/* WhatsApp Gerente */}
                    <div className="group">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 text-xl shadow-sm">
                                💬
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900">WhatsApp Gerente</h4>
                                <p className="text-xs text-slate-500 font-medium">Link direto para atendimento prioritário</p>
                            </div>
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                                value={formState.whatsapp_gerente_url}
                                onChange={e => setFormState({ ...formState, whatsapp_gerente_url: e.target.value })}
                                placeholder="https://wa.me/..."
                            />
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-mono text-sm text-slate-600 truncate">
                                {links?.whatsapp_gerente_url || 'Não configurado'}
                            </div>
                        )}
                    </div>

                    {/* WhatsApp Vendas */}
                    <div className="group">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 text-xl shadow-sm">
                                👥
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900">Grupo de Vendas</h4>
                                <p className="text-xs text-slate-500 font-medium">Link de convite para o grupo oficial</p>
                            </div>
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:border-emerald-500 transition-colors"
                                value={formState.whatsapp_grupo_vendas_url}
                                onChange={e => setFormState({ ...formState, whatsapp_grupo_vendas_url: e.target.value })}
                                placeholder="https://chat.whatsapp.com/..."
                            />
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-mono text-sm text-slate-600 truncate">
                                {links?.whatsapp_grupo_vendas_url || 'Não configurado'}
                            </div>
                        )}
                    </div>

                    {/* Telegram */}
                    <div className="group">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500 text-xl shadow-sm">
                                ✈️
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900">Canal Telegram</h4>
                                <p className="text-xs text-slate-500 font-medium">Link para o canal de informativos</p>
                            </div>
                        </div>
                        {isEditing ? (
                            <input
                                type="text"
                                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none focus:border-sky-500 transition-colors"
                                value={formState.telegram_canal_url}
                                onChange={e => setFormState({ ...formState, telegram_canal_url: e.target.value })}
                                placeholder="https://t.me/..."
                            />
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-mono text-sm text-slate-600 truncate">
                                {links?.telegram_canal_url || 'Não configurado'}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Suporte;
