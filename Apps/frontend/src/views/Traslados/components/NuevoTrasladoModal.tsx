import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CreateTransferPayload } from '../hooks/useTraslados';
import { useAuth } from '../../../hooks/useAuth';
import { ProductWithStock, BranchStock } from '../../../services/transfer.service';

/* ─── Cart item ─── */
interface CartItem {
  id_producto: number;
  producto_nombre: string;
  id_sucursal_origen: number;
  sucursal_origen_nombre: string;
  cantidad: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTransferPayload) => Promise<any>;
  loading: boolean;
  searchProducts: (q: string) => Promise<void>;
  searchResults: ProductWithStock[];
  searching: boolean;
  clearSearch: () => void;
}

export default function NuevoTrasladoModal({
  isOpen, onClose, onSubmit, loading,
  searchProducts, searchResults, searching, clearSearch,
}: Props) {
  const { user } = useAuth() as any;
  const userBranch = user?.idSucursal ?? 0;
  const userBranchName = user?.sucursal ?? 'Tu sucursal';

  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [qtyInput, setQtyInput] = useState<{ branchStock: BranchStock; product: ProductWithStock } | null>(null);
  const [qtyValue, setQtyValue] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Focus quantity input when modal opens
  useEffect(() => {
    if (qtyInput && qtyInputRef.current) qtyInputRef.current.focus();
  }, [qtyInput]);

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setSelectedProduct(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(value), 350);
  }, [searchProducts]);

  // Reset on close
  const handleClose = () => {
    setQuery('');
    setSelectedProduct(null);
    setCart([]);
    setQtyInput(null);
    clearSearch();
    onClose();
  };

  // Select a product from search results
  const selectProduct = (p: ProductWithStock) => {
    setSelectedProduct(p);
    setQuery(p.nombre);
  };

  // Click on a branch card → open qty prompt
  const handleBranchClick = (branchStock: BranchStock, product: ProductWithStock) => {
    if (branchStock.id_sucursal === userBranch) return; // can't transfer from your own branch
    if (branchStock.stock <= 0) return;
    setQtyInput({ branchStock, product });
    setQtyValue(String(Math.min(branchStock.stock, 10)));
  };

  // Confirm qty → add to cart
  const confirmAddToCart = () => {
    if (!qtyInput) return;
    const qty = parseInt(qtyValue);
    if (!qty || qty <= 0 || qty > qtyInput.branchStock.stock) return;

    const existing = cart.findIndex(
      c => c.id_producto === qtyInput.product.id_producto && c.id_sucursal_origen === qtyInput.branchStock.id_sucursal,
    );
    if (existing >= 0) {
      const updated = [...cart];
      updated[existing].cantidad += qty;
      setCart(updated);
    } else {
      setCart([...cart, {
        id_producto: qtyInput.product.id_producto,
        producto_nombre: qtyInput.product.nombre,
        id_sucursal_origen: qtyInput.branchStock.id_sucursal,
        sucursal_origen_nombre: qtyInput.branchStock.nombre,
        cantidad: qty,
      }]);
    }
    setQtyInput(null);
    setQtyValue('');
  };

  // Remove from cart
  const removeFromCart = (index: number) => setCart(cart.filter((_, i) => i !== index));

  // Submit — group cart by origin branch, create one transfer per origin
  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const grouped: Record<number, CartItem[]> = {};
      for (const item of cart) {
        if (!grouped[item.id_sucursal_origen]) grouped[item.id_sucursal_origen] = [];
        grouped[item.id_sucursal_origen].push(item);
      }
      for (const [originId, items] of Object.entries(grouped)) {
        await onSubmit({
          id_sucursal_origen: Number(originId),
          id_sucursal_destino: userBranch,
          items: items.map(i => ({ id_producto: i.id_producto, cantidad: i.cantidad })),
          observaciones: `Solicitud inteligente desde ${userBranchName}`,
        });
      }
      handleClose();
    } catch { /* hook handles error */ } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isOverstocked = (b: BranchStock) => b.stock_minimo > 0 && b.stock > b.stock_minimo * 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 bg-slate-900 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Asistente de Solicitud Inteligente</h2>
              <p className="text-sm text-slate-500">Busca un producto y descubre qué sucursal de la red tiene sobreabastecimiento.</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {/* Step 1 — Search */}
          <div className="mb-5">
            <p className="text-sm font-semibold text-slate-700 mb-2">1. Buscar producto</p>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                type="text"
                placeholder="Nombre o SKU..."
                value={query}
                onChange={e => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 placeholder:text-slate-400"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Search result list (when no product selected yet) */}
            {!selectedProduct && searchResults.length > 0 && (
              <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {searchResults.slice(0, 6).map(p => (
                  <button key={p.id_producto} onClick={() => selectProduct(p)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.nombre}</p>
                      <p className="text-xs text-slate-400">{p.codigo} · {p.categoria}</p>
                    </div>
                    <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2 — Branch stock cards */}
          {selectedProduct && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-slate-700 mb-3">
                2. Stock en la red · <span className="text-slate-900">{selectedProduct.nombre}</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedProduct.sucursales.map(branch => {
                  const isMine  = branch.id_sucursal === userBranch;
                  const isOver  = isOverstocked(branch);
                  const hasStock = branch.stock > 0;
                  const clickable = !isMine && hasStock;

                  return (
                    <button
                      key={branch.id_sucursal}
                      onClick={() => clickable && handleBranchClick(branch, selectedProduct)}
                      disabled={!clickable}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        isMine
                          ? 'border-slate-200 bg-slate-50 cursor-default'
                          : isOver
                            ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-400 hover:shadow-md cursor-pointer'
                            : hasStock
                              ? 'border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer'
                              : 'border-slate-100 bg-slate-50/50 cursor-default opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-slate-800">{branch.nombre}</p>
                        <div className="flex gap-1.5">
                          {isOver && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Sobreabasto</span>
                          )}
                          {isMine && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">Tu sucursal</span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>Stock</span>
                        <span className="text-base font-bold text-slate-900">{branch.stock}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>Stock mínimo</span>
                        <span className="font-medium text-slate-600">{branch.stock_minimo}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity input inline prompt */}
          {qtyInput && (
            <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Cantidad a solicitar de <span className="text-blue-700">{qtyInput.branchStock.nombre}</span>
              </p>
              <p className="text-xs text-slate-500 mb-3">Disponible: {qtyInput.branchStock.stock} unidades</p>
              <div className="flex gap-2">
                <input
                  ref={qtyInputRef}
                  type="number"
                  min="1"
                  max={qtyInput.branchStock.stock}
                  value={qtyValue}
                  onChange={e => setQtyValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmAddToCart()}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <button onClick={confirmAddToCart}
                  className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
                  Agregar
                </button>
                <button onClick={() => { setQtyInput(null); setQtyValue(''); }}
                  className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Cart */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-700 mb-2">
              Carrito de traslado ({cart.length})
            </p>
            {cart.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-sm text-slate-400">Selecciona productos de las sucursales para agregar al carrito.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.producto_nombre}</p>
                      <p className="text-xs text-slate-500">desde {item.sucursal_origen_nombre}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">{item.cantidad}</span>
                      <button onClick={() => removeFromCart(i)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50/50">
          <button onClick={handleClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={cart.length === 0 || submitting}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {submitting ? 'Enviando…' : `Enviar solicitud (${cart.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
