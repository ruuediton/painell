import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Icons } from '../constants';
import { showToast } from '../components/Toast';

interface UserPhone {
    id: string;
    phone: string;
    created_at: string;
}

const Metadados: React.FC = () => {
    const [users, setUsers] = useState<UserPhone[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    // Selection Mode
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchUsers();
    }, [searchTerm, dateFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        let query = supabase.from('profiles').select('id, phone, created_at').order('created_at', { ascending: false });

        if (searchTerm) {
            query = query.ilike('phone', `%${searchTerm}%`);
        }

        if (dateFilter) {
            // Assuming dateFilter is YYYY-MM-DD
            const startOfDay = new Date(dateFilter);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(dateFilter);
            endOfDay.setHours(23, 59, 59, 999);

            query = query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString());
        }

        const { data, error } = await query;
        if (!error && data) {
            setUsers(data);
        }
        setLoading(false);
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            if (newSelected.size >= 100) {
                showToast('Limite de 100 contatos atingido!', 'error');
                return;
            }
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleExportVCF = () => {
        if (selectedIds.size === 0) return;

        const selectedUsers = users.filter(u => selectedIds.has(u.id));
        let vcfContent = '';

        selectedUsers.forEach((user, index) => {
            vcfContent += `BEGIN:VCARD\n`;
            vcfContent += `VERSION:3.0\n`;
            vcfContent += `FN:Contato ${index + 1}\n`;
            vcfContent += `TEL;TYPE=CELL:${user.phone}\n`;
            vcfContent += `END:VCARD\n`;
        });

        const blob = new Blob([vcfContent], { type: 'text/vcard' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contatos_deebank_${new Date().getTime()}.vcf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast(`${selectedUsers.length} contatos exportados!`, 'success');
        setIsSelectionMode(false);
        setSelectedIds(new Set());
    };

    const clearFilters = () => {
        setSearchTerm('');
        setDateFilter('');
    };

    const openWhatsApp = (phone: string) => {
        // Clean phone number (remove non-digits)
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/${cleanPhone}`, '_blank');
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Metadados</h2>
                    <p className="text-slate-500 font-medium text-sm md:text-lg mt-1 md:mt-2">Extração e gestão de contatos para marketing.</p>
                </div>
                <div className="flex gap-3">
                    {isSelectionMode ? (
                        <>
                            <button
                                onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }}
                                className="flex items-center justify-center px-6 py-3.5 md:py-3 bg-slate-200 text-slate-600 rounded-xl md:rounded-2xl hover:bg-slate-300 transition-all font-black uppercase text-[10px] md:text-xs tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleExportVCF}
                                disabled={selectedIds.size === 0}
                                className="flex items-center justify-center space-x-2 px-6 py-3.5 md:py-3 bg-emerald-600 text-white rounded-xl md:rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 font-black uppercase text-[10px] md:text-xs tracking-widest disabled:opacity-50"
                            >
                                <Icons.Save />
                                <span>Exportar ({selectedIds.size})</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsSelectionMode(true)}
                            className="flex items-center justify-center space-x-2 px-6 py-3.5 md:py-3 bg-sky-600 text-white rounded-xl md:rounded-2xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20 active:scale-95 font-black uppercase text-[10px] md:text-xs tracking-widest w-full md:w-auto"
                        >
                            <Icons.Plus />
                            <span>Gerar Contatos</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors">
                            <Icons.Search />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por telefone..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none transition-all font-medium text-sm text-slate-600 placeholder:text-slate-400 shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative">
                        <input
                            type="date"
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-sky-500/20 outline-none transition-all font-medium text-sm text-slate-600 shadow-inner"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={clearFilters}
                        className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                {isSelectionMode && (
                                    <th className="p-4 md:p-6 w-10">
                                        <div className="flex items-center justify-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase">Sel</span>
                                        </div>
                                    </th>
                                )}
                                <th className="p-4 md:p-6 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Telefone</th>
                                <th className="p-4 md:p-6 text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {isSelectionMode && <td className="p-4 md:p-6"><div className="w-5 h-5 bg-slate-100 rounded mx-auto"></div></td>}
                                        <td className="p-4 md:p-6"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                        <td className="p-4 md:p-6"><div className="h-8 bg-slate-100 rounded w-24 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                                        {isSelectionMode && (
                                            <td className="p-4 md:p-6">
                                                <div className="flex items-center justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(user.id)}
                                                        onChange={() => toggleSelection(user.id)}
                                                        className="w-5 h-5 rounded-lg border-2 border-slate-200 text-sky-500 focus:ring-sky-500/20 cursor-pointer transition-all"
                                                    />
                                                </div>
                                            </td>
                                        )}
                                        <td className="p-4 md:p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-500 transition-colors">
                                                    <Icons.Users />
                                                </div>
                                                <span className="text-sm md:text-base font-black text-slate-700 tracking-tight">{user.phone}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 md:p-6 text-right">
                                            <button
                                                onClick={() => openWhatsApp(user.phone)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                </svg>
                                                WhatsApp
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={isSelectionMode ? 3 : 2} className="p-12 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                                                <Icons.Search />
                                            </div>
                                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum usuário encontrado</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Metadados;
