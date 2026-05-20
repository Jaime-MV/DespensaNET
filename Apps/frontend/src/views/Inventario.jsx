import { useState, useEffect } from 'react';
import { inventoryService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Package, Plus, Edit2, Trash2, Search, X, Check, AlertCircle, Filter, ArrowUpDown, Layers } from 'lucide-react';

export default function Inventario() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priceSort, setPriceSort] = useState('');
  
  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [formData, setFormData] = useState({
    codigo: '', nombre: '', categoria: '', unidad_medida: 'unidad', precio_referencia: '', activo: true, fecha_caducidad: ''
  });
  const [error, setError] = useState('');

  // stock modal state
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState(null);
  const [stockFormData, setStockFormData] = useState({ cantidad: 0, stock_minimo: 0, id_sucursal: '' });

  // sucursales (para Propietario)
  const [sucursales, setSucursales] = useState([]);

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

  const fetchSucursales = async () => {
    try {
      const { sucursales } = await inventoryService.getSucursales();
      setSucursales(sucursales || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (user?.role === 'Propietario') fetchSucursales();
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
        activo: product.activo,
        fecha_caducidad: product.fecha_caducidad ? product.fecha_caducidad.split('T')[0] : ''
      });
    } else {
      setEditingProduct(null);
      setFormData({
        codigo: '', nombre: '', categoria: '', unidad_medida: 'unidad', precio_referencia: '', activo: true, fecha_caducidad: ''
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

  const openStockModal = (product) => {
    setError('');
    setStockProduct(product);
    setStockFormData({
      cantidad: product.stock || 0,
      stock_minimo: product.stock_minimo || 0,
      id_sucursal: '',
    });
    setIsStockModalOpen(true);
  };

  const closeStockModal = () => {
    setIsStockModalOpen(false);
    setStockProduct(null);
  };

  const handleStockSave = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await inventoryService.updateStock(stockProduct.id_producto, stockFormData);
      closeStockModal();
      fetchProducts();
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Error al actualizar el stock');
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

  const uniqueCategories = [...new Set(products.map(p => p.categoria).filter(Boolean))];

  let filtered = products.filter(p => 
    (p.nombre.toLowerCase().includes(search.toLowerCase()) || 
     p.codigo.toLowerCase().includes(search.toLowerCase())) &&
    (categoryFilter === '' || p.categoria === categoryFilter)
  );

  if (priceSort === 'asc') {
    filtered.sort((a, b) => parseFloat(a.precio_referencia) - parseFloat(b.precio_referencia));
  } else if (priceSort === 'desc') {
    filtered.sort((a, b) => parseFloat(b.precio_referencia) - parseFloat(a.precio_referencia));
  }

  // Helper: expiry status  
  const getExpiryStatus = (fecha) => {
    if (!fecha) return null;
    const today = new Date();
    const exp = new Date(fecha);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Vencido', cls: 'bg-red-100 text-red-700' };
    if (diffDays <= 30) return { label: `Vence en ${diffDays}d`, cls: 'bg-amber-100 text-amber-700' };
    return { label: exp.toLocaleDateString('es-GT'), cls: 'bg-slate-100 text-slate-600' };
  };

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
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center bg-slate-50/50 shrink-0 rounded-t-2xl">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por código o nombre..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select 
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none cursor-pointer text-slate-700 font-medium"
              >
                <option value="">Todas las categorías</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select 
                value={priceSort}
                onChange={e => setPriceSort(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none cursor-pointer text-slate-700 font-medium"
              >
                <option value="">Ordenar por precio</option>
                <option value="desc">Mayor a Menor</option>
                <option value="asc">Menor a Mayor</option>
              </select>
            </div>
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
                <th className="px-6 py-4 text-center">Caducidad</th>
                <th className="px-6 py-4 text-right">{user?.role === 'Propietario' ? 'Stock Total' : 'Stock Local'}</th>
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
                    <td className="px-6 py-4 text-center">
                      {(() => {
                        const status = getExpiryStatus(p.fecha_caducidad);
                        return status ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold ${status.cls}`}>{status.label}</span>
                        ) : <span className="text-slate-300 text-xs">—</span>;
                      })()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold tabular-nums ${p.stock <= p.stock_minimo ? 'bg-red-100 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {p.stock} {p.unidad_medida}
                      </span>
                    </td>
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
                        <button onClick={() => openStockModal(p)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Ajustar Stock">
                          <Layers className="w-4 h-4" />
                        </button>
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Fecha de Caducidad <span className="normal-case text-slate-400">(Opcional)</span></label>
                <input type="date" value={formData.fecha_caducidad} onChange={e => setFormData({...formData, fecha_caducidad: e.target.value})} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                <p className="text-[11px] text-slate-400">Los productos con caducidad próxima (menos de 30 días) aparecerán en alerta.</p>
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

      {/* Stock Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={closeStockModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Ajustar Stock Local</h2>
              <button onClick={closeStockModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockSave} className="p-5 flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" /> <span>{error}</span>
                </div>
              )}
              
              <div className="mb-2">
                <p className="text-sm text-slate-500">Producto:</p>
                <p className="font-semibold text-slate-900">{stockProduct?.nombre}</p>
                <p className="text-xs text-slate-400">Código: {stockProduct?.codigo}</p>
              </div>

              {user?.role === 'Propietario' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Sucursal</label>
                  <select required value={stockFormData.id_sucursal} onChange={e => setStockFormData({...stockFormData, id_sucursal: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
                    <option value="">Selecciona una sucursal</option>
                    {sucursales.map(s => (
                      <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Cantidad Actual en Existencia</label>
                <div className="relative">
                  <input required type="number" step="0.01" min="0" value={stockFormData.cantidad} onChange={e => setStockFormData({...stockFormData, cantidad: e.target.value})} 
                    className="w-full pl-3 pr-12 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium uppercase">{stockProduct?.unidad_medida}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Stock Mínimo (Umbral de Alerta)</label>
                <input required type="number" step="0.01" min="0" value={stockFormData.stock_minimo} onChange={e => setStockFormData({...stockFormData, stock_minimo: e.target.value})} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-2">
                <button type="button" onClick={closeStockModal} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2">
                  <Check className="w-4 h-4" /> Actualizar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
