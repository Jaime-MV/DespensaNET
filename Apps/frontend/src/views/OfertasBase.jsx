import { useState, useEffect } from 'react';
import { inventoryService } from '../services/api';
import { Tag, Plus, Edit2, Trash2, Search, X, Check, AlertCircle } from 'lucide-react';

export default function OfertasBase({ tipo }) {
  const isDescuento = tipo === 'descuento';
  const title = isDescuento ? 'Descuentos' : 'Promociones';
  const subtitle = isDescuento ? 'Gestión de descuentos por porcentaje' : 'Gestión de promociones por precio fijo';
  
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  
  const [formData, setFormData] = useState({
    id_producto: '',
    precio_oferta: '',
    porcentaje_desc: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
    descripcion: '',
    activa: true
  });
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { offers } = await inventoryService.getOffers(tipo);
      const { products } = await inventoryService.getProducts();
      setOffers(offers);
      setProducts(products.filter(p => p.activo));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    document.title = `${title} · DespensaNET`;
  }, [tipo]);

  const openModal = (offer = null) => {
    setError('');
    if (offer) {
      setEditingOffer(offer);
      setFormData({
        id_producto: offer.id_producto,
        precio_oferta: offer.precio_oferta || '',
        porcentaje_desc: offer.porcentaje_desc || '',
        fecha_inicio: offer.fecha_inicio.split('T')[0],
        fecha_fin: offer.fecha_fin.split('T')[0],
        descripcion: offer.descripcion || '',
        activa: offer.activa
      });
    } else {
      setEditingOffer(null);
      setFormData({
        id_producto: products[0]?.id_producto || '',
        precio_oferta: '',
        porcentaje_desc: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
        descripcion: '',
        activa: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOffer(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    
    if (new Date(formData.fecha_fin) <= new Date(formData.fecha_inicio)) {
      setError('La fecha de fin debe ser posterior a la de inicio.');
      return;
    }

    try {
      const selectedProduct = products.find(p => p.id_producto === parseInt(formData.id_producto));
      let finalPrice = parseFloat(formData.precio_oferta || 0);
      let percentage = parseFloat(formData.porcentaje_desc || 0);

      if (selectedProduct) {
        if (isDescuento) {
          finalPrice = selectedProduct.precio_referencia * (1 - percentage / 100);
        } else {
          percentage = 0;
        }
      }

      const data = {
        ...formData,
        id_producto: parseInt(formData.id_producto),
        precio_oferta: finalPrice,
        porcentaje_desc: percentage > 0 ? percentage : null
      };

      if (editingOffer) {
        await inventoryService.updateOffer(editingOffer.id_oferta, data);
      } else {
        await inventoryService.createOffer(data);
      }
      closeModal();
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`¿Estás seguro de que deseas desactivar est${isDescuento ? 'e descuento' : 'a promoción'}?`)) return;
    try {
      await inventoryService.deleteOffer(id);
      fetchData();
    } catch (err) {
      alert('Error al desactivar');
    }
  };

  const filtered = offers.filter(o => 
    o.producto_nombre.toLowerCase().includes(search.toLowerCase()) || 
    (o.descripcion && o.descripcion.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 lg:p-8 h-[calc(100vh-2rem)] w-full flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Tag className="w-7 h-7 text-indigo-600" /> {title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>
        <button onClick={() => openModal()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> Nuev{isDescuento ? 'o Descuento' : 'a Promoción'}
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b border-slate-100 flex gap-4 items-center bg-slate-50/50 shrink-0 rounded-t-2xl">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por producto..." 
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
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4 text-right">Beneficio</th>
                <th className="px-6 py-4 text-center">Vigencia</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">No se encontraron registros.</td></tr>
              ) : (
                filtered.map(o => (
                  <tr key={o.id_oferta} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{o.producto_nombre}</p>
                      <p className="text-xs text-slate-400 font-mono">{o.producto_codigo}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{o.descripcion || '—'}</td>
                    <td className="px-6 py-4 text-right font-medium text-indigo-600">
                      {o.porcentaje_desc > 0 ? `${o.porcentaje_desc}% DCTO` : `$ ${parseFloat(o.precio_oferta).toFixed(2)}`}
                    </td>
                    <td className="px-6 py-4 text-center tabular-nums text-slate-600 text-xs">
                      {o.fecha_inicio.split('T')[0]}<br/>hasta<br/>{o.fecha_fin.split('T')[0]}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {o.activa && new Date() <= new Date(o.fecha_fin) ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">Activa</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">Inactiva</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openModal(o)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {o.activa && (
                          <button onClick={() => handleDelete(o.id_oferta)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Desactivar">
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
                {editingOffer ? 'Editar' : 'Nuev' + (isDescuento ? 'o Descuento' : 'a Promoción')}
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
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Producto</label>
                <select required value={formData.id_producto} onChange={e => setFormData({...formData, id_producto: e.target.value})} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  disabled={!!editingOffer}>
                  <option value="" disabled>Selecciona un producto</option>
                  {products.map(p => <option key={p.id_producto} value={p.id_producto}>{p.codigo} - {p.nombre}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {isDescuento ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Porcentaje (%)</label>
                    <input required type="number" step="0.01" min="0" max="100" value={formData.porcentaje_desc} onChange={e => setFormData({...formData, porcentaje_desc: e.target.value, precio_oferta: ''})} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Precio Fijo ($)</label>
                    <input required type="number" step="0.01" min="0" value={formData.precio_oferta} onChange={e => setFormData({...formData, precio_oferta: e.target.value, porcentaje_desc: ''})} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                )}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Descripción / Título (Opcional)</label>
                  <input type="text" placeholder="Ej: Especial de Verano" value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Inicio</label>
                  <input required type="date" value={formData.fecha_inicio} onChange={e => setFormData({...formData, fecha_inicio: e.target.value})} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Fin</label>
                  <input required type="date" value={formData.fecha_fin} onChange={e => setFormData({...formData, fecha_fin: e.target.value})} 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
              </div>

              {editingOffer && (
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input type="checkbox" checked={formData.activa} onChange={e => setFormData({...formData, activa: e.target.checked})} 
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                  <span className="text-sm font-medium text-slate-700">Activa</span>
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
