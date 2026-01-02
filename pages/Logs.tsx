
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
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">Auditoria do Sistema</h2>
        <p className="text-slate-500">Rastreamento de todas as ações administrativas realizadas.</p>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icons.Search />
          </span>
          <input 
            type="text" 
            placeholder="Filtrar auditoria..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-sky-400 uppercase tracking-widest">Admin</th>
                <th className="px-6 py-4 text-xs font-bold text-sky-400 uppercase tracking-widest">Ação</th>
                <th className="px-6 py-4 text-xs font-bold text-sky-400 uppercase tracking-widest">Detalhes</th>
                <th className="px-6 py-4 text-xs font-bold text-sky-400 uppercase tracking-widest text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{log.adminName}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-sky-50 text-sky-700 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-sm">{log.details}</td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-[10px] text-right">{log.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Logs;
