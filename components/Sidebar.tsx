import React from 'react';
import { Icons } from '../constants';
import { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'users', label: 'Usuários', icon: Icons.Users },
    { id: 'deposits', label: 'Depósitos', icon: Icons.Deposits },
    { id: 'withdrawals', label: 'Saques', icon: Icons.Withdrawals },
    { id: 'bonus', label: 'Bônus', icon: Icons.Bonus },
    { id: 'logs', label: 'Suporte', icon: Icons.Logs },
    { id: 'settings', label: 'Dados', icon: Icons.Dashboard }, // Replaced 'Ajustes' with 'Dados'
    { id: 'products', label: 'Produtos', icon: Icons.Products },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-72 bg-slate-900 h-screen sticky top-0 overflow-y-auto border-r border-slate-800">
      <div className="p-8">
        <div className="flex items-center space-x-3 mb-10">
          <div className="bg-sky-500 p-2 rounded-xl shadow-lg shadow-sky-500/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter">
            dee<span className="text-sky-400">Bank</span>
          </h1>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id || (item.id === 'users' && currentPage === 'user-detail');

            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as Page)}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all group ${isActive
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
              >
                <div className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-sky-400'} transition-colors`}>
                  <Icon />
                </div>
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="bg-slate-800/50 rounded-[2rem] p-5 border border-slate-700/50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
              <Icons.Bonus />
            </div>
            <div>
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em]">Versão Pro</p>
              <p className="text-xs font-bold text-white">deeBank Admin</p>
            </div>
          </div>
          <button className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
            Documentação
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
