
import React from 'react';
import { Page } from '../types';
import { Icons } from '../constants';

interface BottomNavbarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'dashboard' as Page, label: 'Início', icon: Icons.Dashboard },
    { id: 'deposits' as Page, label: 'Depósitos', icon: Icons.Deposits },
    { id: 'withdrawals' as Page, label: 'Saques', icon: Icons.Withdrawals },
    { id: 'users' as Page, label: 'Usuários', icon: Icons.Users },
    { id: 'logs' as Page, label: 'Logs', icon: Icons.Logs },
    { id: 'settings' as Page, label: 'Ajustes', icon: () => (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
    ) },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 h-20 flex items-center justify-around px-2 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id || (item.id === 'users' && currentPage === 'user-detail');
        return (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 flex-1 py-1 rounded-xl h-16 ${
              isActive ? 'text-sky-400 bg-slate-800/50 scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className={`p-1 transition-colors`}>
              <Icon />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {item.label}
            </span>
            {isActive && <div className="w-1 h-1 bg-sky-400 rounded-full"></div>}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavbar;
