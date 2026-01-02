
import React, { useState } from 'react';
import { MOCK_USERS } from '../services/mockData';
import { User } from '../types';
import { Icons } from '../constants';

interface UsersProps {
  onSelectUser: (user: User) => void;
}

const Users: React.FC<UsersProps> = ({ onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = MOCK_USERS.filter(user => {
    return user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           user.phone.includes(searchTerm);
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Lista de Usuários</h2>
          <p className="text-slate-500">Exibindo todos os membros cadastrados na plataforma.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icons.Search />
          </span>
          <input 
            type="text" 
            placeholder="Buscar por nome ou número..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 uppercase tracking-wider">Telefone</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-700 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr 
                  key={user.id} 
                  className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  onClick={() => onSelectUser(user)}
                >
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900 group-hover:text-sky-600 transition-colors">{user.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{user.phone}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sky-600 font-bold text-xs uppercase tracking-widest hover:underline">
                      Ver Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-10 text-center text-slate-400">Nenhum usuário encontrado.</div>
        )}
      </div>
    </div>
  );
};

export default Users;
