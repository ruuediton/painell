import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isRegistering, setIsRegistering] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isRegistering) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        setSuccessMessage('Conta criada com sucesso! Verifique seu e-mail para confirmar (se necessário) ou faça login.');
        setIsRegistering(false); // Switch back to login
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;
        onLogin();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">
            {isRegistering ? 'Cadastro de Administrador' : 'Acesso Administrativo Seguro'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800/40 backdrop-blur-2xl p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-5">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold text-center animate-pulse">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-bold text-center animate-pulse">
              {successMessage}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900/60 border-2 border-slate-700/50 px-6 py-4 rounded-2xl text-white outline-none focus:border-sky-500 focus:bg-slate-900 transition-all font-medium"
              placeholder="admin@deebank.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Segurança</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/60 border-2 border-slate-700/50 px-6 py-4 rounded-2xl text-white outline-none focus:border-sky-500 focus:bg-slate-900 transition-all font-medium"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 bg-sky-500 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-sky-500/20 hover:bg-sky-400 active:scale-[0.97] transition-all mt-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Processando...' : (isRegistering ? 'Criar Nova Conta' : 'Entrar no Painel')}
          </button>
        </form>

        <div className="text-center space-y-4">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
              setSuccessMessage(null);
            }}
            className="text-sky-400 text-[11px] font-black uppercase tracking-widest hover:text-sky-300 transition-colors"
          >
            {isRegistering ? 'Já tem conta? Fazer Login' : 'Não tem conta? Cadastrar Admin'}
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
