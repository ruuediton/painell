
import React from 'react';
import { Page } from '../types';
import { Icons } from '../constants';

interface BottomNavbarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onOpenMenu: () => void;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ currentPage, setCurrentPage, onOpenMenu }) => {
  const navItems = [
    { id: 'dashboard' as Page, label: 'Início', icon: Icons.Dashboard },
    { id: 'deposits' as Page, label: 'Depósitos', icon: Icons.Deposits },
    { id: 'withdrawals' as Page, label: 'Saques', icon: Icons.Withdrawals },
    { id: 'users' as Page, label: 'Usuários', icon: Icons.Users },
    {
      id: 'menu' as any, label: 'Menu', icon: () => (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      ), isMenu: true
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 h-20 flex items-center justify-around px-2 z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id || (item.id === 'users' && currentPage === 'user-detail');
        return (
          <button
            key={item.id}
            onClick={() => item.isMenu ? onOpenMenu() : setCurrentPage(item.id)}
            className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 flex-1 py-1 rounded-xl h-14 ${isActive ? 'text-sky-400 bg-slate-800/80' : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <div className={`transition-all duration-300 ${isActive ? 'scale-110' : ''}`}>
              <Icon />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavbar;
