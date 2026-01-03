import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Icons } from '../constants';
// Removed unused ProductStatus import

interface ProductDB {
  id: string;
  name: string;
  duration_days: number;
  price: number;
  daily_income: number;
  total_income: number;
  purchase_limit: number;
  image_url: string | null;
  emoji: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<ProductDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<ProductDB>>({});

  useEffect(() => {
    fetchProducts();
  }, [searchTerm]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    try {
      const productData = {
        name: currentProduct.name,
        duration_days: Number(currentProduct.duration_days),
        price: Number(currentProduct.price),
        daily_income: Number(currentProduct.daily_income),
        total_income: Number(currentProduct.duration_days) * Number(currentProduct.daily_income),
        purchase_limit: Number(currentProduct.purchase_limit) || 1,
        image_url: currentProduct.image_url,
        emoji: currentProduct.emoji,
        description: currentProduct.description,
        status: currentProduct.status || 'active'
      };

      if (isEditing && currentProduct.id) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', currentProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        if (error) throw error;
      }

      setShowModal(false);
      setCurrentProduct({});
      fetchProducts();
      alert(isEditing ? 'Produto atualizado!' : 'Produto criado!');
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    // Basic confirmation
    if (confirm('Tem certeza que deseja apagar este produto permanente?')) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        fetchProducts();
      } catch (err: any) {
        alert('Erro ao deletar: ' + err.message);
      }
    }
  };

  const openEdit = (prod: ProductDB) => {
    setCurrentProduct(prod);
    setIsEditing(true);
    setShowModal(true);
  };

  const openNew = () => {
    setCurrentProduct({ status: 'active', purchase_limit: 1 });
    setIsEditing(false);
    setShowModal(true);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Produtos</h2>
          <p className="text-slate-500 font-medium text-lg">Gerencie os planos de investimento.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center space-x-2 px-6 py-3 bg-sky-600 text-white rounded-2xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20 active:scale-95 font-black uppercase text-xs tracking-widest"
        >
          <Icons.Plus />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="relative group">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors">
            <Icons.Search />
          </span>
          <input
            type="text"
            placeholder="Buscar produtos..."
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500/20 outline-none transition-all font-medium text-slate-600 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-3 text-center text-slate-400 font-bold uppercase py-20">Carregando produtos...</p>
        ) : products.map((product) => (
          <div key={product.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
            <div className={`h-2 ${product.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 from-sky-50 to-white border border-sky-100 flex items-center justify-center text-2xl shadow-sm">
                    {product.emoji || '📦'}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 leading-tight">{product.name}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${product.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {product.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 text-sm font-medium mb-8 line-clamp-2 min-h-[40px] leading-relaxed">
                {product.description || 'Sem descrição.'}
              </p>

              <div className="space-y-3 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Preço</span>
                  <span className="font-black text-slate-900">Kz {product.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Renda Diária</span>
                  <span className="font-black text-emerald-600">+ Kz {product.daily_income.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Lucro Total ({product.duration_days}d)</span>
                  <span className="font-black text-sky-600">Kz {(product.daily_income * product.duration_days).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-auto flex gap-3 pt-4 border-t border-slate-50">
                <button onClick={() => openEdit(product)} className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                  Editar
                </button>
                <button onClick={() => handleDelete(product.id)} className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 rounded-xl transition-all">
                  <Icons.Trash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-2xl shadow-2xl my-10 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
            >
              ✕
            </button>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-8">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome do Produto</label>
                <input
                  type="text"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-500 transition-colors"
                  value={currentProduct.name || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  placeholder="Ex: Plano VIP Gold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Preço (Kz)</label>
                <input
                  type="number"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-500 transition-colors"
                  value={currentProduct.price || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Renda Diária (Kz)</label>
                <input
                  type="number"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-500 transition-colors"
                  value={currentProduct.daily_income || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, daily_income: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Duração (Dias)</label>
                <input
                  type="number"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-500 transition-colors"
                  value={currentProduct.duration_days || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, duration_days: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Limite de Compra</label>
                <input
                  type="number"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-500 transition-colors"
                  value={currentProduct.purchase_limit || 1}
                  onChange={e => setCurrentProduct({ ...currentProduct, purchase_limit: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Emoji/Ícone</label>
                <input
                  type="text"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-500 transition-colors"
                  value={currentProduct.emoji || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, emoji: e.target.value })}
                  placeholder="📦"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Status</label>
                <select
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-500 transition-colors"
                  value={currentProduct.status || 'active'}
                  onChange={e => setCurrentProduct({ ...currentProduct, status: e.target.value })}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descrição</label>
                <textarea
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-500 transition-colors min-h-[100px]"
                  value={currentProduct.description || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                  placeholder="Descrição detalhada do plano..."
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">URL da Imagem</label>
                <input
                  type="text"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 outline-none focus:border-sky-500 transition-colors"
                  value={currentProduct.image_url || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-sky-600 text-white font-black uppercase text-xs rounded-xl hover:bg-sky-700 shadow-xl shadow-sky-600/20 active:scale-95 transition-all">
                {isEditing ? 'Salvar Alterações' : 'Criar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
