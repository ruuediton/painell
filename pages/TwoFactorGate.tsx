
import React, { useState } from 'react';

interface TwoFactorGateProps {
  onVerify: () => void;
  onCancel: () => void;
}

const TwoFactorGate: React.FC<TwoFactorGateProps> = ({ onVerify, onCancel }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);

  const handleChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`digit-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleVerify = () => {
    const fullCode = code.join('');
    if (fullCode === '123456') { // Código simulado
      onVerify();
    } else {
      alert('Código incorreto. Use 123456 para este teste.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-inter">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500 text-center">
        <div className="space-y-2">
          <div className="inline-block bg-emerald-500 p-3 rounded-2xl shadow-2xl shadow-emerald-500/20 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Verificação de Segurança</h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            Um código de 6 dígitos foi solicitado para<br/>autenticar sua sessão administrativa.
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl p-10 rounded-3xl border border-slate-700 shadow-2xl space-y-8">
          <div className="flex justify-between gap-2">
            {code.map((digit, idx) => (
              <input
                key={idx}
                id={`digit-${idx}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                className="w-full h-16 bg-slate-900 border-2 border-slate-700 rounded-2xl text-center text-2xl font-black text-sky-400 focus:border-sky-500 outline-none transition-all"
              />
            ))}
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleVerify}
              className="w-full py-5 bg-sky-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-sky-500/10 hover:bg-sky-400 transition-all"
            >
              Verificar Identidade
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-3 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:text-slate-300 transition-all"
            >
              Cancelar e Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorGate;
