import React, { useState } from 'react';
import { AuditLog } from '../types';
import { Icons } from '../constants';

interface LogsProps {
  customLogs: AuditLog[];
}

const Logs: React.FC<LogsProps> = ({ customLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = customLogs.filter(log =>
    log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Logs de Auditoria</h2>
          <p className="text-slate-500 font-medium text-lg">Histórico completo de ações administrativas.</p>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-xl">
          <span className="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em]">Registro Master</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="relative group max-w-md">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors">
            <Icons.Search />
          </span>
          <input
            type="text"
            placeholder="Buscar por admin, ação ou detalhes..."
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500/20 outline-none transition-all font-medium text-slate-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Administrador</th>
                <th>Ação Executada</th>
                <th>Descrição Detalhada</th>
                <th className="text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="group">
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                        <Icons.Users />
                      </div>
                      <span className="font-black text-slate-900">{log.adminName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-blue">
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <p className="text-slate-600 font-medium max-w-md truncate group-hover:whitespace-normal group-hover:transition-all">
                      {log.details}
                    </p>
                  </td>
                  <td className="text-right">
                    <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">{log.date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum log encontrado para esta busca</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;
