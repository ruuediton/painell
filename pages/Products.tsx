import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Icons } from '../constants';
import { showToast } from '../components/Toast';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);
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
      showToast(isEditing ? 'Produto atualizado!' : 'Produto criado!', 'success');
    } catch (err: any) {
      showToast('Erro ao salvar: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Basic confirmation
    if (confirm('Tem certeza que deseja apagar este produto permanente?')) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
        fetchProducts();
        showToast('Produto deletado com sucesso!', 'success');
      } catch (err: any) {
        showToast('Erro ao deletar: ' + err.message, 'error');
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
    <div className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Produtos</h2>
          <p className="text-slate-500 font-medium text-sm md:text-lg mt-1 md:mt-2">Gerencie os planos de investimento.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center justify-center space-x-2 px-6 py-3.5 md:py-3 bg-sky-600 text-white rounded-xl md:rounded-2xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-600/20 active:scale-95 font-black uppercase text-[10px] md:text-xs tracking-widest w-full md:w-auto"
        >
          <Icons.Plus />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-slate-200 shadow-sm">
        <div className="relative group">
          <span className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors">
            <Icons.Search />
          </span>
          <input
            type="text"
            placeholder="Buscar produtos..."
            className="w-full pl-12 md:pl-14 pr-4 md:pr-6 py-3 md:py-4 bg-slate-50 border-none rounded-xl md:rounded-2xl focus:ring-2 focus:ring-sky-500/20 outline-none transition-all font-medium text-sm md:text-base text-slate-600 placeholder:text-slate-400 shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-3xl animate-pulse border border-slate-100 shadow-sm"></div>
          ))
        ) : products.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
            <div className={`h-1.5 md:h-2 ${product.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
            <div className="p-6 md:p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4 md:mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-xl md:text-2xl shadow-sm shrink-0">
                    {product.emoji || '📦'}
                  </div>
                  <div>
                    <h4 className="text-base md:text-lg font-black text-slate-900 leading-tight truncate max-w-[150px] md:max-w-none">{product.name}</h4>
                    <span className={`text-[8px] md:text-[10px] font-black px-1.5 md:px-2 py-0.5 rounded uppercase tracking-wide ${product.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {product.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 text-xs md:text-sm font-medium mb-6 md:mb-8 line-clamp-2 min-h-[32px] md:min-h-[40px] leading-relaxed">
                {product.description || 'Sem descrição.'}
              </p>

              <div className="space-y-2 md:space-y-3 mb-6 md:mb-8 bg-slate-50 p-4 rounded-xl md:rounded-2xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-black uppercase text-[8px] md:text-[10px] tracking-widest">Preço</span>
                  <span className="font-black text-slate-900 text-xs md:text-sm">Kz {product.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-black uppercase text-[8px] md:text-[10px] tracking-widest">Renda Diária</span>
                  <span className="font-black text-emerald-600 text-xs md:text-sm">Kz {product.daily_income.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-auto flex gap-2 md:gap-3 pt-4 border-t border-slate-50">
                <button onClick={() => openEdit(product)} className="flex-1 py-2.5 md:py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all">
                  Editar
                </button>
                <button onClick={() => handleDelete(product.id)} className="px-3 md:px-4 py-2.5 md:py-3 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 rounded-lg md:rounded-xl transition-all">
                  <Icons.Trash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 md:p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl md:rounded-[2rem] p-6 md:p-8 w-full max-w-2xl shadow-2xl my-4 md:my-10 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 md:w-10 md:h-10 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 flex items-center justify-center transition-colors text-xs"
            >
              ✕
            </button>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight mb-6 md:mb-8">
              {isEditing ? 'Editar Produto' : 'Novo Produto'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="md:col-span-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 block">Nome</label>
                <input
                  type="text"
                  className="w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-lg md:rounded-xl font-bold text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 transition-colors"
                  value={currentProduct.name || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                  placeholder="Nome do plano"
                />
              </div>

              <div>
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 block">Preço (Kz)</label>
                <input
                  type="number"
                  className="w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-lg md:rounded-xl font-bold text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 transition-colors"
                  value={currentProduct.price || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 block">Renda (Kz)</label>
                <input
                  type="number"
                  className="w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-lg md:rounded-xl font-bold text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 transition-colors"
                  value={currentProduct.daily_income || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, daily_income: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 block">Duração (D)</label>
                <input
                  type="number"
                  className="w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-lg md:rounded-xl font-bold text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 transition-colors"
                  value={currentProduct.duration_days || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, duration_days: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 block">Emoji</label>
                <input
                  type="text"
                  className="w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-lg md:rounded-xl font-bold text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 transition-colors"
                  value={currentProduct.emoji || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, emoji: e.target.value })}
                  placeholder="📦"
                />
              </div>
              <div>
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 block">Limite de Compra</label>
                <input
                  type="number"
                  className="w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-lg md:rounded-xl font-bold text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 transition-colors"
                  value={currentProduct.purchase_limit || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, purchase_limit: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 block">Status</label>
                <select
                  className="w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-lg md:rounded-xl font-bold text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 transition-colors appearance-none"
                  value={currentProduct.status || 'active'}
                  onChange={e => setCurrentProduct({ ...currentProduct, status: e.target.value })}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 block">URL da Imagem (Opcional)</label>
                <div className="flex gap-4 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      className="w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-lg md:rounded-xl font-bold text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 transition-colors"
                      value={currentProduct.image_url || ''}
                      onChange={e => setCurrentProduct({ ...currentProduct, image_url: e.target.value })}
                      placeholder="https://exemplo.com/imagem.png"
                    />
                  </div>
                  {currentProduct.image_url && (
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                      <img src={currentProduct.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')} />
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2 block">Descrição</label>
                <textarea
                  className="w-full p-3 md:p-4 bg-slate-50 border-2 border-slate-100 rounded-lg md:rounded-xl font-bold text-sm md:text-base text-slate-900 outline-none focus:border-sky-500 transition-colors min-h-[80px]"
                  value={currentProduct.description || ''}
                  onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                  placeholder="Descreva os benefícios deste plano..."
                />
              </div>
            </div>

            <div className="flex gap-3 md:gap-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 md:py-4 text-slate-500 font-bold uppercase text-[10px] md:text-xs hover:bg-slate-50 rounded-xl transition-all">Cancelar</button>
              <button onClick={handleSave} disabled={isSubmitting} className="flex-1 py-3 md:py-4 bg-sky-600 text-white font-black uppercase text-[10px] md:text-xs rounded-xl hover:bg-sky-700 shadow-xl shadow-sky-600/20 active:scale-95 transition-all disabled:opacity-50">
                {isSubmitting ? '...' : (isEditing ? 'Salvar' : 'Criar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
