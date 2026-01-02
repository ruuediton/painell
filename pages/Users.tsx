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
      query = query.or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
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
        totalBalance: Number(u.balance) || 0, // Fallback
        status: (u.state === 'bloqueado' ? UserStatus.BLOCKED : UserStatus.ACTIVE),
        totalInvested: 0,
        totalWithdrawn: 0,
        totalDeposited: 0,
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
            placeholder="Buscar por nome ou telefone..."
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500/20 outline-none transition-all font-medium text-slate-600 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Telefone</th>
                <th>Saldo</th>
                <th>Estado</th>
                <th className="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400">Carregando usuários...</td></tr>
              ) : users.map((user) => (
                <tr
                  key={user.id}
                  className="cursor-pointer group"
                  onClick={() => onSelectUser(user)}
                >
                  <td>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-black text-xs border border-sky-100 group-hover:bg-sky-500 group-hover:text-white transition-all">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 group-hover:text-sky-600 transition-colors tracking-tight">{user.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">ID: {user.id.substring(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="font-bold text-slate-600">{user.phone}</span>
                  </td>
                  <td>
                    <span className="font-black text-emerald-600">Kz {user.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </td>
                  <td>
                    <span className={`badge ${user.status === UserStatus.ACTIVE ? 'badge-green' : 'badge-red'}`}>
                      {user.status === UserStatus.ACTIVE ? 'Ativo' : 'Bloqueado'}
                    </span>
                  </td>
                  <td className="text-right">
                    <button className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all">
                      <Icons.ChevronRight />
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
