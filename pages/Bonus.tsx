import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { BonusCode } from '../types';
import { Icons } from '../constants';

interface BonusProps {
  onLogAction: (action: string, details: string) => void;
}

const Bonus: React.FC<BonusProps> = ({ onLogAction }) => {
  const [code, setCode] = useState('');
  const [bonusValue, setBonusValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [bonusCodes, setBonusCodes] = useState<BonusCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBonusCodes();
  }, []);

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
        setExpiryDate('');
        alert(`Código ${data.codigo_presente} registrado com sucesso!`);
      }
    } catch (err: any) {
      alert('Erro ao criar bônus: ' + err.message);
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
        alert('Erro ao deletar: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-12 animate-fade-in-up pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Bônus & Recompensas</h2>
          <p className="text-slate-500 font-medium text-lg">Crie códigos promocionais para impulsionar o engajamento.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-5">
          <div className="premium-card p-10 space-y-8 h-fit lg:sticky lg:top-24">
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em]">Gerador</h4>
              <p className="text-2xl font-black text-slate-900">Novo Código</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificador</label>
                <input
                  type="text"
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500/20 outline-none uppercase font-mono font-bold text-slate-900"
                  placeholder="EX: VERÃO2024"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor do Bônus (Kz)</label>
                <input
                  type="number"
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-slate-900"
                  placeholder="0.00"
                  value={bonusValue}
                  onChange={(e) => setBonusValue(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Expiração</label>
                <input
                  type="date"
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500/20 outline-none font-bold text-slate-900"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={handleAddCode}
              className="w-full py-5 btn-primary font-black text-xs uppercase tracking-widest"
            >
              Registrar Código
            </button>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Códigos Ativos</h3>
              <div className="badge badge-blue">{bonusCodes.length} ativos</div>
            </div>
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Valor</th>
                    <th>Vencimento</th>
                    <th className="text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} className="p-10 text-center">Carregando...</td></tr>
                  ) : bonusCodes.map((item) => (
                    <tr key={item.id} className="group">
                      <td>
                        <span className="font-mono font-black text-sky-600 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-100 group-hover:bg-sky-500 group-hover:text-white transition-all">
                          {item.code}
                        </span>
                      </td>
                      <td>
                        <span className="font-black text-emerald-600">Kz {item.value.toLocaleString('pt-BR')}</span>
                      </td>
                      <td>
                        <span className="text-xs font-bold text-slate-400">{new Date(item.expiryDate).toLocaleDateString()}</span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDeleteCode(item.id)}
                          className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                        >
                          <Icons.Trash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && bonusCodes.length === 0 && (
              <div className="p-20 text-center">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum bônus configurado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bonus;
