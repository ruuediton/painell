import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { BonusCode } from '../types';
import { Icons } from '../constants';
import { showToast } from '../components/Toast';

interface BonusProps {
  onLogAction: (action: string, details: string) => void;
  isAdminMaster?: boolean;
}

const Bonus: React.FC<BonusProps> = ({ onLogAction, isAdminMaster }) => {
  const [code, setCode] = useState('');
  const [bonusValue, setBonusValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [bonusCodes, setBonusCodes] = useState<BonusCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateSafeCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let result = '';

    // 5 letters
    for (let i = 0; i < 5; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    // 4 numbers
    for (let i = 0; i < 4; i++) {
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    // Shuffle the result
    return result.split('').sort(() => Math.random() - 0.5).join('');
  };

  useEffect(() => {
    fetchBonusCodes();
    // Pre-fill expiry date with +30 days
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    setExpiryDate(defaultExpiry.toISOString().split('T')[0]);
  }, []);

  const handleValueChange = (val: string) => {
    setBonusValue(val);
    if (val && !code) {
      setCode(generateSafeCode());
    }
  };

  const fetchBonusCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('codigos_presente')
      .select('*')
      .order('data_expiracao', { ascending: false });

    if (error) {
      console.error('Error fetching bonuses:', error);
    } else if (data) {
      const mapped: BonusCode[] = data.map((item: any) => ({
        id: item.id,
        code: item.codigo_presente,
        value: Number(item.valor_presente),
        expiryDate: item.data_expiracao,
        createdAt: item.data_inicio || new Date().toISOString()
      }));
      setBonusCodes(mapped);
    }
    setLoading(false);
  };

  const handleAddCode = async () => {
    if (!code || !bonusValue || !expiryDate) {
      alert('Por favor, preencha todos os campos do código.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newCodeStr = code.trim().toUpperCase();
      const newVal = parseFloat(bonusValue);

      const { data, error } = await supabase
        .from('codigos_presente')
        .insert([
          {
            codigo_presente: newCodeStr,
            valor_presente: newVal,
            data_expiracao: expiryDate,
            data_inicio: new Date().toISOString(),
            ativo: true
          }
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setBonusCodes(prev => [
          {
            id: data.id,
            code: data.codigo_presente,
            value: Number(data.valor_presente),
            expiryDate: data.data_expiracao,
            createdAt: data.data_inicio
          },
          ...prev
        ]);

        onLogAction(
          'Criação de Código de Recompensa',
          `Admin gerou o código ${data.codigo_presente} com benefício de Kz ${data.valor_presente}`
        );

        setCode('');
        setBonusValue('');
        // Keep the expiry date for next use
        showToast(`Código ${data.codigo_presente} registrado com sucesso!`, 'success');
      }
    } catch (err: any) {
      showToast('Erro ao criar bônus: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCode = async (id: string) => {
    const codeToDelete = bonusCodes.find(c => c.id === id);
    if (!codeToDelete) return;

    if (window.confirm(`Confirmar exclusão definitiva do código ${codeToDelete.code}?`)) {
      try {
        const { error } = await supabase
          .from('codigos_presente')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setBonusCodes(bonusCodes.filter(c => c.id !== id));
        onLogAction(
          'Exclusão de Código de Recompensa',
          `Admin removeu o código ${codeToDelete.code} da plataforma.`
        );
      } catch (err: any) {
        showToast('Erro ao deletar: ' + err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Bônus & Recompensas</h2>
          <p className="text-slate-500 font-medium text-lg">Crie códigos promocionais para impulsionar o engajamento.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Creator - Modern Glassmorphism Style */}
        <div className="lg:col-span-5">
          <div className="relative p-10 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-500/20 group h-fit lg:sticky lg:top-24">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 transition-all duration-500 group-hover:scale-105"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

            <div className="relative z-10 space-y-8 text-white">
              <div className="space-y-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md border border-white/20">
                    <Icons.Bonus />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100">Gerador Premium</h4>
                </div>
                <p className="text-3xl font-black tracking-tight">Novo Código</p>
                <p className="text-indigo-100 text-sm font-medium opacity-80">Configure os parâmetros da nova recompensa.</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest ml-1">Valor (Kz)</label>
                  <input
                    type="number"
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:bg-white/20 focus:border-white/40 outline-none font-bold text-white placeholder:text-indigo-300/50 transition-all"
                    placeholder="0.00"
                    value={bonusValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest ml-1">Código Promocional</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full pl-12 pr-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:bg-white/20 focus:border-white/40 outline-none uppercase font-mono font-bold text-white placeholder:text-indigo-300/50 transition-all"
                      placeholder="EX: WELCOME2024"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300">#</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-indigo-200 uppercase tracking-widest ml-1">Data de Expiração</label>
                  <input
                    type="date"
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl focus:bg-white/20 focus:border-white/40 outline-none font-bold text-white/90 placeholder:text-indigo-300/50 transition-all [color-scheme:dark]"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={handleAddCode}
                disabled={isSubmitting}
                className="w-full py-5 bg-white text-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg shadow-black/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? 'Registrando...' : 'Criar Recompensa'}</span>
                {!isSubmitting && <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: List - Clean & Airy */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-slate-400 uppercase text-xs tracking-widest">Códigos Ativos ({bonusCodes.length})</h3>
          </div>

          <div className="grid gap-4">
            {loading ? (
              <div className="p-20 text-center text-slate-400 font-bold animate-pulse">Carregando códigos...</div>
            ) : bonusCodes.length === 0 ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Icons.Bonus />
                </div>
                <p className="text-slate-500 font-bold">Nenhum código ativo no momento.</p>
                <p className="text-slate-400 text-sm mt-1">Crie o primeiro para começar.</p>
              </div>
            ) : (
              bonusCodes.map((item) => (
                <div key={item.id} className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                      <span className="text-2xl">🎁</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900 font-mono tracking-tight group-hover:text-indigo-600 transition-colors uppercase">
                        {item.code}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Expira: {new Date(item.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</p>
                      <p className="text-xl font-black text-emerald-500">Kz {item.value.toLocaleString('pt-BR')}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCode(item.id)}
                      className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all active:scale-95"
                      title="Deletar Código"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bonus;
