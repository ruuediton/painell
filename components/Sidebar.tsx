import { Icons, NAV_ITEMS } from '../constants';
import { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  adminEmail?: string;
  isAdminMaster?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, adminEmail, isAdminMaster }) => {
  return (
    <aside className="flex flex-col w-full lg:w-72 bg-slate-900 h-screen sticky top-0 overflow-y-auto border-r border-slate-800">
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
          {NAV_ITEMS.map((item) => {
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
              <Icons.Dashboard />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em]">Versão Pro</p>
                {isAdminMaster && (
                  <span className="bg-sky-500 text-white text-[7px] font-black px-1 rounded-sm animate-pulse">MASTER</span>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-300 truncate">{adminEmail || 'DeepAdmin Console'}</p>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 font-medium px-1 mb-3">Painel de Administração Master</p>
          <button className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
            <Icons.Logs />
            Documentação
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
