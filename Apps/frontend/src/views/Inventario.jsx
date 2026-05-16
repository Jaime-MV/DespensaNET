import { useState, useEffect } from 'react';
import { inventoryService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Package, Plus, Edit2, Trash2, Search, X, Check, AlertCircle } from 'lucide-react';

export default function Inventario() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    codigo: '', nombre: '', categoria: '', unidad_medida: 'unidad', precio_referencia: '', activo: true
  });
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { products } = await inventoryService.getProducts();
      setProducts(products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    document.title = 'Inventario · DespensaNET';
  }, []);

  const openModal = (product = null) => {
    setError('');
    if (product) {
      setEditingProduct(product);
      setFormData({
        codigo: product.codigo,
        nombre: product.nombre,
        categoria: product.categoria || '',
        unidad_medida: product.unidad_medida || 'unidad',
        precio_referencia: product.precio_referencia,
        activo: product.activo
      });
    } else {
      setEditingProduct(null);
      setFormData({
        codigo: '', nombre: '', categoria: '', unidad_medida: 'unidad', precio_referencia: '', activo: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingProduct) {
        await inventoryService.updateProduct(editingProduct.id_producto, formData);
      } else {
        await inventoryService.createProduct(formData);
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Error al guardar el producto');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas deshabilitar este producto?')) return;
    try {
      await inventoryService.deleteProduct(id);
      fetchProducts();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const filtered = products.filter(p => 
    p.nombre.toLowerCase().includes(search.toLowerCase()) || 
    p.codigo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 h-[calc(100vh-2rem)] w-full flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-600" /> Inventario de Productos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gestión completa del catálogo de productos
          </p>
        </div>
        <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> Nuevo Producto
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-slate-100 flex gap-4 items-center bg-slate-50/50 shrink-0 rounded-t-2xl">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por código o nombre..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 sticky top-0 text-slate-500 uppercase tracking-wider text-[11px] font-semibold z-10 shadow-sm">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-right">Precio Ref.</th>
                {user?.role !== 'Propietario' && <th className="px-6 py-4 text-right">Stock Local</th>}
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">Cargando inventario...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">No se encontraron productos.</td></tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id_producto} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-indigo-600 font-medium">{p.codigo}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{p.nombre}</td>
                    <td className="px-6 py-4 text-slate-500">{p.categoria || '—'}</td>
                    <td className="px-6 py-4 text-right font-medium">$ {parseFloat(p.precio_referencia).toFixed(2)}</td>
                    {user?.role !== 'Propietario' && (
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold tabular-nums ${p.stock <= p.stock_minimo ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {p.stock} {p.unidad_medida}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-center">
                      {p.activo ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openModal(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {p.activo && (
                          <button onClick={() => handleDelete(p.id_producto)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Deshabilitar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" /> <span>{error}</span>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Código</label>
                  <input required autoFocus type="text" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Categoría</label>
                  <input type="text" value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Nombre del Producto</label>
                <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Precio Ref. ($)</label>
                  <input required type="number" step="0.01" min="0" value={formData.precio_referencia} onChange={e => setFormData({...formData, precio_referencia: e.target.value})} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Unidad de Medida</label>
                  <select value={formData.unidad_medida} onChange={e => setFormData({...formData, unidad_medida: e.target.value})} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="litro">Litro (L)</option>
                    <option value="lb">Libra (lb)</option>
                  </select>
                </div>
              </div>

              {editingProduct && (
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input type="checkbox" checked={formData.activo} onChange={e => setFormData({...formData, activo: e.target.checked})} 
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-slate-700">Producto Activo</span>
                </label>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2">
                  <Check className="w-4 h-4" /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
