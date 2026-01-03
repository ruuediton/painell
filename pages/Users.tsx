import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { User, UserStatus } from '../types';
import { Icons } from '../constants';
import { showToast } from '../components/Toast';

interface UsersProps {
  onSelectUser: (user: User) => void;
}

const Users: React.FC<UsersProps> = ({ onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  // Modal state for active products
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedUserProducts, setSelectedUserProducts] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*');

    if (searchTerm) {
      // Search primarily by phone number as it is the main identifier for users here
      query = query.ilike('phone', `%${searchTerm}%`);
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

  // Fetch products for a specific user from Supabase
  const fetchUserProducts = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', userId);
    if (error) {
      console.error('Error fetching user products:', error);
      return [];
    }
    return data || [];
  };

  // Open modal showing active products for a user
  const openProducts = async (userId: string) => {
    const products = await fetchUserProducts(userId);
    setSelectedUserId(userId);
    setSelectedUserProducts(products);
    setShowProductsModal(true);
  };

  // Edit daily income of a product (simple prompt for demo)
  const handleEditIncome = (productId: string) => {
    const newIncomeStr = prompt('Nova renda diária (Kz):');
    if (newIncomeStr === null) return;
    const newIncome = Number(newIncomeStr);
    if (isNaN(newIncome)) {
      showToast('Valor inválido', 'error');
      return;
    }
    const updated = selectedUserProducts.map(p =>
      p.id === productId ? { ...p, daily_income: newIncome } : p
    );
    setSelectedUserProducts(updated);
    // Optionally persist change to Supabase here
  };

  // Delete product from user (remove from UI only for demo)
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Deseja remover este produto?')) return;
    const { error } = await supabase
      .from('user_products')
      .delete()
      .eq('id', productId);
    if (error) {
      console.error('Error deleting product:', error);
      return;
    }
    const updated = selectedUserProducts.filter(p => p.id !== productId);
    setSelectedUserProducts(updated);
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
                <th className="text-right p-6">Produtos</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-400">Carregando usuários...</td></tr>
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
                  <td className="text-right p-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openProducts(user.id);
                      }}
                      className="bg-sky-500 hover:bg-sky-600 text-white font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-lg transition-all"
                    >
                      Produtos Ativos
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

  {/* Modal for Active Products */ }
  {
    showProductsModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
        <div className="bg-white rounded-[2rem] p-8 w-full max-w-3xl shadow-2xl relative">
          <button
            onClick={() => setShowProductsModal(false)}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-700"
          >✕</button>
          <h3 className="text-2xl font-black text-slate-900 mb-6">Produtos Ativos</h3>
          {selectedUserProducts.length === 0 ? (
            <p className="text-center text-slate-500">Nenhum produto ativo.</p>
          ) : (
            <table className="w-full premium-table">
              <thead>
                <tr>
                  <th className="p-4 text-left">Nome</th>
                  <th className="p-4 text-left">Renda Diária (Kz)</th>
                  <th className="p-4 text-left">Duração (dias)</th>
                  <th className="p-4 text-left">Data da Compra</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {selectedUserProducts.map((p) => (
                  <tr key={p.id} className="border-b border-slate-200">
                    <td className="p-4">{p.name}</td>
                    <td className="p-4">Kz {Number(p.daily_income).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="p-4">{p.duration_days}</td>
                    <td className="p-4">{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditIncome(p.id)}
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md text-xs"
                      >Editar Renda</button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-md text-xs"
                      >
                        <Icons.Trash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    )
  }

};

export default Users;
