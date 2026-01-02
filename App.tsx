
import React, { useState } from 'react';
import BottomNavbar from './components/BottomNavbar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Transactions from './pages/Transactions';
import Bonus from './pages/Bonus';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Login from './pages/Login';
import TwoFactorGate from './pages/TwoFactorGate';
import { Page, User, AuditLog, Notification } from './types';
import { MOCK_LOGS } from './services/mockData';

const App: React.FC = () => {
  // Estados de Autenticação
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>(MOCK_LOGS);

  const addLogAction = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: Math.random().toString(),
      adminName: 'Admin Master',
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

  // Redirecionamento de Auth
  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  if (is2FAEnabled && !is2FAVerified) {
    return (
      <TwoFactorGate 
        onVerify={() => setIs2FAVerified(true)} 
        onCancel={() => setIsAuthenticated(false)} 
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
      case 'settings': return (
        <Settings 
          is2FAEnabled={is2FAEnabled} 
          onToggle2FA={() => setIs2FAEnabled(!is2FAEnabled)} 
          onLogAction={addLogAction}
        />
      );
      default: return <Dashboard setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-20 font-inter">
      <header className="sticky top-0 z-40 w-full h-16 bg-slate-900 text-white shadow-md px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-sky-500 p-1.5 rounded-lg shadow-lg shadow-sky-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight">painel<span className="text-sky-400">DeeBank</span></h1>
          <div className="h-4 w-[1px] bg-slate-700 mx-2 hidden sm:block"></div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest hidden sm:block">
            {currentPage === 'settings' ? 'Ajustes' : currentPage}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white uppercase">Admin Master</p>
              <div className="flex items-center justify-end space-x-1">
                {is2FAEnabled && <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>}
                <p className="text-[10px] text-sky-400 font-semibold tracking-widest uppercase">
                    {is2FAEnabled ? 'Protegido' : 'Conectado'}
                </p>
              </div>
            </div>
            <img 
              src="https://picsum.photos/seed/admin/40" 
              className={`w-9 h-9 rounded-full border-2 shadow-md ${is2FAEnabled ? 'border-emerald-500' : 'border-slate-700'}`} 
              alt="Profile" 
            />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8">
        {renderPage()}
      </main>

      <BottomNavbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  );
};

export default App;
