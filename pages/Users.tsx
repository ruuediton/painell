import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { User, UserStatus } from '../types';
import { Icons } from '../constants';

interface UsersProps {
  onSelectUser: (user: User) => void;
}

const Users: React.FC<UsersProps> = ({ onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*');

    if (searchTerm) {
      query = query.or(`phone.ilike.%${searchTerm}%,id.eq.${searchTerm}`);
    }

    const { data, error } = await query.limit(50);

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      const mappedUsers: User[] = (data || []).map(u => ({
        id: u.id,
        name: u.full_name || 'Sem Nome',
        phone: u.phone || 'Sem Telefone',
        inviteCode: u.invite_code || '',
        balance: Number(u.balance) || 0,
        totalBalance: Number(u.balance) || 0,
        status: (u.state === 'bloqueado' ? UserStatus.BLOCKED : UserStatus.ACTIVE),
        totalInvested: 0,
        totalWithdrawn: 0,
        totalDeposited: Number(u.reloaded_amount) || 0, // Using reloaded_amount as Total Deposito
        dailyIncome: 0,
        createdAt: u.created_at,
        canWithdraw: u.state !== 'bloqueado',
        canDeposit: true,
        products: []
      }));
      setUsers(mappedUsers);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-fade-in-up duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Usuários</h2>
          <p className="text-slate-500 font-medium text-lg">Gerencie a base de clientes sincronizada com o Supabase.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="relative group">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors">
            <Icons.Search />
          </span>
          <input
            type="text"
            placeholder="Buscar por telefone ou ID..."
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500/20 outline-none transition-all font-medium text-slate-600 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="premium-table w-full">
            <thead>
              <tr>
                <th className="text-left p-6">Número</th>
                <th className="text-left p-6">Saldo (Kz)</th>
                <th className="text-left p-6">Data/Hora de Registro</th>
                <th className="text-right p-6">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-400">Carregando usuários...</td></tr>
              ) : users.map((user) => (
                <tr
                  key={user.id}
                  className="cursor-pointer group hover:bg-slate-50/50 transition-colors"
                  onClick={() => onSelectUser(user)}
                >
                  <td className="p-6">
                    <span className="font-black text-slate-700 text-sm">{user.phone}</span>
                  </td>
                  <td className="p-6">
                    <span className="font-black text-emerald-600">Kz {user.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </td>
                  <td className="p-6">
                    <span className="font-bold text-slate-500 text-xs uppercase">
                      {new Date(user.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td className="text-right p-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectUser(user);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && users.length === 0 && (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Icons.Search />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum usuário encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
