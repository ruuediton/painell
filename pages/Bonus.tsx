
import React, { useState } from 'react';
import { BonusCode } from '../types';
import { Icons } from '../constants';

interface BonusProps {
  onLogAction: (action: string, details: string) => void;
}

const Bonus: React.FC<BonusProps> = ({ onLogAction }) => {
  const [code, setCode] = useState('');
  const [bonusValue, setBonusValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [bonusCodes, setBonusCodes] = useState<BonusCode[]>([
    { id: '1', code: 'BEMVINDO50', value: 50.00, expiryDate: '2024-12-31', createdAt: '2024-05-01' },
    { id: '2', code: 'VIPDEEP100', value: 100.00, expiryDate: '2024-06-15', createdAt: '2024-05-10' },
  ]);

  const handleAddCode = () => {
    if (!code || !bonusValue || !expiryDate) {
      alert('Por favor, preencha todos os campos do código.');
      return;
    }

    const newBonus: BonusCode = {
      id: Math.random().toString(36).substr(2, 9),
      code: code.trim().toUpperCase(),
      value: parseFloat(bonusValue),
      expiryDate,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setBonusCodes([newBonus, ...bonusCodes]);
    onLogAction(
      'Criação de Código de Recompensa',
      `Admin gerou o código ${newBonus.code} com benefício de R$ ${newBonus.value.toFixed(2)}`
    );

    // Reset formulário
    setCode('');
    setBonusValue('');
    setExpiryDate('');
    alert(`Código ${newBonus.code} registrado com sucesso!`);
  };

  const handleDeleteCode = (id: string) => {
    const codeToDelete = bonusCodes.find(c => c.id === id);
    if (!codeToDelete) return;

    if (window.confirm(`Confirmar exclusão definitiva do código ${codeToDelete.code}?`)) {
      setBonusCodes(bonusCodes.filter(c => c.id !== id));
      onLogAction(
        'Exclusão de Código de Recompensa',
        `Admin removeu o código ${codeToDelete.code} da plataforma.`
      );
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto pb-20">
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Gerador de Recompensas</h2>
        <p className="text-slate-500 text-xs font-medium">Crie códigos globais que podem ser resgatados pelos usuários.</p>
      </div>

      {/* Formulário de Criação */}
      <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código de Recompensa</label>
            <input 
              type="text" 
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:ring-4 focus:ring-sky-500/10 outline-none uppercase font-mono font-bold text-slate-900 focus:border-sky-500 transition-all placeholder:text-slate-300"
              placeholder="EX: DEEP2024"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor do Benefício (R$)</label>
            <input 
              type="number" 
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:ring-4 focus:ring-sky-500/10 outline-none font-mono font-bold text-slate-900 focus:border-sky-500 transition-all placeholder:text-slate-300"
              placeholder="0.00"
              value={bonusValue}
              onChange={(e) => setBonusValue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Limite de Resgate</label>
            <input 
              type="date" 
              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:ring-4 focus:ring-sky-500/10 outline-none font-bold text-slate-900 focus:border-sky-500 transition-all"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </div>

        <button 
          onClick={handleAddCode}
          className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 active:scale-[0.98] transition-all"
        >
          Adicionar Código à Tabela
        </button>
      </div>

      {/* Listagem em Tabela */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Códigos de Recompensa Ativos</h3>
            <span className="text-[10px] font-bold text-sky-500 bg-sky-50 px-2 py-1 rounded-full">{bonusCodes.length} ativos</span>
        </div>
        
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Código</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bonusCodes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <span className="font-mono font-black text-slate-900 group-hover:text-sky-600 transition-colors bg-slate-100 px-3 py-1.5 rounded-lg text-sm">{item.code}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-emerald-600 font-black text-sm">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-slate-500 text-xs font-bold">{new Date(item.expiryDate).toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => handleDeleteCode(item.id)}
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                        title="Deletar código"
                      >
                        <Icons.Trash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bonusCodes.length === 0 && (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                <Icons.Bonus />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhum código promocional ativo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bonus;
