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
    <div className="space-y-10 animate-fade-in-up pb-20 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Configurações</h2>
          <p className="text-slate-500 font-medium text-lg">Personalize sua experiência administrativa.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="premium-card p-10 space-y-8">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em]">Segurança</h4>
            <p className="text-xl font-black text-slate-900">Proteção de Conta</p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
            <div className="space-y-1">
              <h5 className="font-black text-slate-900 text-sm">Autenticação 2FA</h5>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Token de Segurança</p>
            </div>
            <button
              onClick={handleToggle}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${is2FAEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${is2FAEnabled ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-50">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informações Adicionais</h5>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">IP de Acesso</span>
              <span className="font-bold text-slate-900">197.231.242.102</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Localização</span>
              <span className="font-bold text-slate-900">Luanda, AO</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Device</span>
              <span className="font-bold text-slate-900">Chrome (Windows 11)</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="premium-card p-10 bg-slate-900 text-white border-none shadow-2xl shadow-sky-900/10">
            <div className="flex items-start space-x-4 mb-6">
              <div className="p-3 bg-sky-500/20 text-sky-400 rounded-2xl">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em] mb-1">Performance</h4>
                <p className="text-lg font-black">Servidor Premium</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Sua conta de administrador está conectada ao cluster de alta disponibilidade. O tempo de resposta atual é de <strong>12ms</strong>.
            </p>
            <div className="mt-8 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-[98%] bg-sky-500"></div>
            </div>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-2">Health Status: 98.4%</p>
          </div>

          <div className="premium-card p-10 border-sky-100 bg-sky-50/20">
            <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] mb-4">Exportar Dados</h4>
            <p className="text-slate-600 text-sm font-medium mb-6">Baixe o relatório detalhado de todas as transações em formato PDF ou Excel.</p>
            <button className="w-full py-4 bg-white border border-sky-100 text-sky-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-sky-50 transition-all">
              Gerar Relatório (PDF)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
