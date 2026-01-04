import { Page } from '../types';
import { NAV_ITEMS } from '../constants';

interface BottomNavbarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  onOpenMenu: () => void;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ currentPage, setCurrentPage, onOpenMenu }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 h-20 z-50 overflow-x-auto scrollbar-none">
      <div className="flex items-center h-full px-4 min-w-max bg-slate-900">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id || (item.id === 'users' && currentPage === 'user-detail');
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 px-6 py-1 rounded-xl h-14 ${isActive ? 'text-sky-400 bg-slate-800/80' : 'text-slate-500 hover:text-slate-300'
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
      </div>
    </nav>
  );
};

export default BottomNavbar;
