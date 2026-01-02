
import React, { useState } from 'react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Validação para Angola: 9 dígitos começando com 9
  const isValidPhone = /^9\d{8}$/.test(phone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone) {
      alert('Por favor, insira um número de telefone de Angola válido (9 dígitos começando com 9).');
      return;
    }
    if (password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (isRegistering && !name) {
      alert('Por favor, informe o seu nome completo.');
      return;
    }

    onLogin();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 9);
    setPhone(val);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-inter overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-block bg-sky-500 p-4 rounded-[24px] shadow-2xl shadow-sky-500/40 mb-4 transform hover:rotate-12 transition-transform cursor-pointer">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter">painel<span className="text-sky-400">DeeBank</span></h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">{isRegistering ? 'Criar Conta Administrativa (Angola)' : 'Acesso Seguro via Telefone (+244)'}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/40 backdrop-blur-2xl p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-5">
          {isRegistering && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900/60 border-2 border-slate-700/50 px-6 py-4 rounded-2xl text-white outline-none focus:border-sky-500 focus:bg-slate-900 transition-all font-medium"
                placeholder="Ex: Manuel dos Santos"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Número de Telefone</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold">+244</span>
              <input 
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                className={`w-full bg-slate-900/60 border-2 px-6 py-4 pl-20 rounded-2xl text-white outline-none transition-all font-mono font-bold text-lg ${phone && !isValidPhone ? 'border-rose-500/50 focus:border-rose-500' : 'border-slate-700/50 focus:border-sky-500'}`}
                placeholder="923xxxxxx"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Segurança</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/60 border-2 border-slate-700/50 px-6 py-4 rounded-2xl text-white outline-none focus:border-sky-500 focus:bg-slate-900 transition-all font-medium"
              placeholder="••••••••"
            />
          </div>

          {isRegistering && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Código de Convite</label>
              <input 
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-900/60 border-2 border-slate-700/50 px-6 py-4 rounded-2xl text-white outline-none focus:border-sky-500 transition-all font-mono font-bold"
                placeholder="AO-XXXX"
              />
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-5 bg-sky-500 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-sky-500/20 hover:bg-sky-400 active:scale-[0.97] transition-all mt-4"
          >
            {isRegistering ? 'Cadastrar em Angola' : 'Entrar no Painel'}
          </button>
        </form>

        <div className="text-center space-y-4">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sky-400 text-[11px] font-black uppercase tracking-widest hover:text-sky-300 transition-colors"
          >
            {isRegistering ? 'Já tem conta? Entrar' : 'Não tem conta? Solicitar Acesso'}
          </button>
          
          <div className="flex items-center justify-center space-x-2 pt-4 opacity-50">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-[0.3em]">
              Servidor Seguro Criptografado (Luanda)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
