
import React from 'react';

interface SettingsProps {
  is2FAEnabled: boolean;
  onToggle2FA: () => void;
  onLogAction: (action: string, details: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ is2FAEnabled, onToggle2FA, onLogAction }) => {
  const handleToggle = () => {
    onToggle2FA();
    onLogAction(
      'Segurança Alterada',
      `Admin ${is2FAEnabled ? 'desativou' : 'ativou'} a autenticação de dois fatores.`
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto pb-20">
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Configurações do Painel</h2>
        <p className="text-slate-500 text-xs font-medium">Gerencie as preferências de segurança e visual do admin.</p>
      </div>

      <div className="bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Autenticação 2FA</h4>
            <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase">
              Exigir código de segurança adicional<br/>em todos os logins administrativos.
            </p>
          </div>
          <button 
            onClick={handleToggle}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${is2FAEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${is2FAEnabled ? 'left-9' : 'left-1'}`}></div>
          </button>
        </div>

        <div className="pt-8 border-t border-slate-50">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Informações de Sessão</h4>
            <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-slate-400">IP de Acesso</span>
                    <span className="text-slate-900">192.168.1.1</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-slate-400">Último Login</span>
                    <span className="text-slate-900">Hoje, 10:45 AM</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-slate-400">Status 2FA</span>
                    <span className={is2FAEnabled ? 'text-emerald-500' : 'text-rose-500'}>{is2FAEnabled ? 'Ativado' : 'Desativado'}</span>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 flex items-start space-x-4">
        <div className="text-sky-500 mt-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <div className="space-y-1">
            <h5 className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Conselho de Segurança</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Mantenha o 2FA ativado para proteger o saldo de seus usuários e dados bancários contra acessos não autorizados.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
