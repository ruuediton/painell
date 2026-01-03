import React, { useState, useEffect } from 'react';
import BottomNavbar from './components/BottomNavbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Transactions from './pages/Transactions';
import Bonus from './pages/Bonus';
import Suporte from './pages/Suporte';
import Dados from './pages/Dados';
import Login from './pages/Login';
import TwoFactorGate from './pages/TwoFactorGate';
import Products from './pages/Products';
import Logs from './pages/Logs';
import { ToastContainer } from './components/Toast';
import { Page, User, AuditLog } from './types';
import { MOCK_LOGS } from './services/mockData';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [is2FAVerified, setIs2FAVerified] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>(MOCK_LOGS);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIs2FAVerified(false);
  };

  const addLogAction = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(),
      adminName: session?.user?.email || 'Admin',
      action,
      date: new Date().toLocaleString(),
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const navigateToUserDetail = (user: User) => {
    setSelectedUser(user);
    setCurrentPage('user-detail');
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={() => { }} />;
  }

  if (is2FAEnabled && !is2FAVerified) {
    return (
      <TwoFactorGate
        onVerify={() => setIs2FAVerified(true)}
        onCancel={handleLogout}
      />
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard setCurrentPage={setCurrentPage} />;
      case 'users': return <Users onSelectUser={navigateToUserDetail} />;
      case 'user-detail': return selectedUser ? (
        <UserDetail
          user={selectedUser}
          onBack={() => setCurrentPage('users')}
          onLogAction={addLogAction}
        />
      ) : <Users onSelectUser={navigateToUserDetail} />;
      case 'deposits': return <Transactions type="DEPOSIT" onLogAction={addLogAction} />;
      case 'withdrawals': return <Transactions type="WITHDRAWAL" onLogAction={addLogAction} />;
      case 'bonus': return <Bonus onLogAction={addLogAction} />;
      case 'logs': return <Logs customLogs={logs} />;
      case 'suporte': return <Suporte />;
      case 'settings': return <Dados />;
      case 'products': return <Products />;
      default: return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="flex bg-slate-50 min-h-screen text-slate-900 font-inter selection:bg-sky-500 selection:text-white">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex h-screen sticky top-0">
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={(p) => { setCurrentPage(p); setIsMobileMenuOpen(false); }}
          adminEmail={session?.user?.email}
        />
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-72 h-full bg-slate-900 animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              currentPage={currentPage}
              setCurrentPage={(p) => { setCurrentPage(p); setIsMobileMenuOpen(false); }}
              adminEmail={session?.user?.email}
            />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative">
        <header className="sticky top-0 z-40 w-full h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="lg:hidden flex items-center space-x-2">
              <div className="bg-sky-500 p-1.5 rounded-lg shadow-lg shadow-sky-500/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">dee<span className="text-sky-500">Bank</span></h1>
            </div>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
              Sistema / <span className="text-slate-900">{currentPage === 'settings' ? 'AJUSTES' : currentPage.toUpperCase()}</span>
            </h2>
          </div>

          <div className="flex items-center space-x-3 md:space-x-6">
            <div className="flex items-center space-x-3 md:space-x-4 pr-3 md:pr-6 border-r border-slate-200">
              <div className="text-right hidden xs:block">
                <p className="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-wide">
                  {session?.user?.email?.split('@')[0] || 'Admin'}
                </p>
                <div className="flex items-center justify-end space-x-1">
                  <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full ${is2FAEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                  <p className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest whitespace-nowrap">
                    {is2FAEnabled ? 'OK' : 'OFF'}
                  </p>
                </div>
              </div>
              <div className="relative shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.email || 'Admin'}`}
                  className={`w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-slate-100 border-2 shadow-sm transition-all ${is2FAEnabled ? 'border-emerald-500' : 'border-white'}`}
                  alt="Profile"
                />
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 sm:p-10 lg:p-12 animate-fade-in-up">
          {renderPage()}
        </main>
      </div>

      <div className="lg:hidden">
        <BottomNavbar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
        />
      </div>
      <ToastContainer />
    </div>
  );
};

export default App;
