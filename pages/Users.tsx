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
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Usuários</h2>
          <p className="text-slate-500 font-medium text-sm md:text-lg">Gerencie a base de clientes do Supabase.</p>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="relative group">
          <span className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors">
            <Icons.Search />
          </span>
          <input
            type="text"
            placeholder="Buscar por telefone ou nome..."
            className="w-full pl-12 md:pl-14 pr-4 md:pr-6 py-3 md:py-4 bg-slate-50 border-none rounded-xl md:rounded-2xl focus:ring-2 focus:ring-sky-500/20 outline-none transition-all font-medium text-sm md:text-base text-slate-600 placeholder:text-slate-400 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="premium-table w-full min-w-[600px] md:min-w-full">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="text-left p-4 md:p-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente</th>
                <th className="text-left p-4 md:p-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Saldo</th>
                <th className="text-left p-4 md:p-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registro</th>
                <th className="text-right p-4 md:p-6 text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-6"><div className="h-10 bg-slate-100 rounded-xl w-32"></div></td>
                    <td className="p-6"><div className="h-6 bg-slate-50 rounded-lg w-24"></div></td>
                    <td className="p-6"><div className="h-4 bg-slate-50 rounded-md w-28"></div></td>
                    <td className="p-6 text-right"><div className="h-10 bg-slate-100 rounded-xl w-32 ml-auto"></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Icons.Search />
                    </div>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nenhum usuário encontrado</p>
                  </td>
                </tr>
              ) : users.map((user) => (
                <tr
                  key={user.id}
                  className="group hover:bg-sky-50/30 transition-all duration-300 cursor-pointer"
                  onClick={() => onSelectUser(user)}
                >
                  <td className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-sky-100 group-hover:text-sky-600 transition-colors text-sm md:text-base">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 leading-none mb-1 text-xs md:text-sm">{user.phone}</p>
                        <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-tighter truncate max-w-[100px] md:max-w-none">{user.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 md:p-6">
                    <span className="font-black text-emerald-600 bg-emerald-50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[10px] md:text-sm border border-emerald-100/50 whitespace-nowrap">
                      Kz {user.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="p-4 md:p-6">
                    <span className="font-bold text-slate-500 text-[9px] md:text-[10px] uppercase tracking-wider block">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="p-4 md:p-6 text-right">
                    <div className="flex items-center justify-end gap-2 md:gap-3 md:opacity-0 md:group-hover:opacity-100 md:translate-x-4 md:group-hover:translate-x-0 transition-all duration-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openProducts(user.id);
                        }}
                        className="px-4 py-2.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap"
                      >
                        Produtos
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectUser(user);
                        }}
                        className="p-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                        title="Ver Perfil"
                      >
                        <Icons.Dashboard />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Active Products */}
      {showProductsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 w-full max-w-4xl shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowProductsModal(false)}
              className="absolute top-4 md:top-6 right-4 md:right-6 w-8 h-8 md:w-10 md:h-10 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 flex items-center justify-center transition-colors text-xs"
            >✕</button>
            <div className="mb-6 md:mb-10">
              <h3 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight uppercase">Produtos</h3>
              <p className="text-slate-500 font-medium text-xs md:text-base mt-1">Lista de investimentos ativos.</p>
            </div>

            {selectedUserProducts.length === 0 ? (
              <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Nenhum produto contratado.</p>
              </div>
            ) : (
              <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {selectedUserProducts.map((p) => (
                  <div key={p.id} className="bg-white border border-slate-100 p-6 rounded-3xl hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl border border-emerald-100">
                        💰
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg leading-tight uppercase tracking-tight">{p.name || 'Investimento'}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">
                            {p.duration_days} Dias
                          </span>
                          <span className="text-[10px] font-black text-slate-300 uppercase">
                            Comprado em {new Date(p.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Renda Diária</p>
                        <p className="text-xl font-black text-emerald-600">Kz {Number(p.daily_income).toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={() => handleEditIncome(p.id)}
                          className="w-10 h-10 bg-slate-100 hover:bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center transition-all"
                          title="Editar Renda"
                        >
                          <Icons.Edit />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="w-10 h-10 bg-slate-100 hover:bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center transition-all"
                          title="Remover"
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
