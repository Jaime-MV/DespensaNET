import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { salesService } from '../services/api';
import { Search, Trash2, ShoppingCart, History, Tag, CreditCard, Banknote, X, CheckCircle, Pause, LogOut } from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   POS — Main Point-of-Sale view for Empleado role
   Tabs: Punto de Venta | Historial | Ofertas
   ════════════════════════════════════════════════════════════ */

const HighlightMatch = ({ text, search }) => {
  if (!search) return <>{text}</>;
  const parts = String(text).split(new RegExp(`(${search})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 text-yellow-900 font-extrabold px-0.5 rounded">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

// ── PDF Invoice Generator ──────────────────────────────────────────────────
async function generateInvoicePDF(saleData, items, user) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  // Header: Company Info
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229); // Indigo 600
  doc.text('DespensaNET', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Distribuidora de Alimentos S.A.', 14, 26);
  doc.text('NIT: 1234567-8', 14, 31);
  doc.text(`Sucursal: ${user?.sucursal || 'Central'}`, 14, 36);
  doc.text('Tel: +502 2222-3333', 14, 41);

  // Invoice Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('FACTURA', 150, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`No. de Venta: #${String(saleData.idVenta).padStart(6, '0')}`, 150, 26);
  doc.text(`Fecha: ${new Date().toLocaleString('es-GT')}`, 150, 31);
  doc.text(`Vendedor: ${user?.nombre || user?.email}`, 150, 36);
  doc.text(`Método: ${saleData.payMethod.toUpperCase()}`, 150, 41);

  // Customer Info (Standard)
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 48, 196, 48);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente: ', 14, 55);
  doc.setFont('helvetica', 'normal');
  doc.text('Consumidor Final', 30, 55);
  doc.setFont('helvetica', 'bold');
  doc.text('NIT/CF: ', 150, 55);
  doc.setFont('helvetica', 'normal');
  doc.text('C/F', 165, 55);
  doc.line(14, 60, 196, 60);

  // Items Table
  autoTable(doc, {
    startY: 65,
    head: [['Cant.', 'Descripción', 'Precio Uni.', 'Subtotal']],
    body: items.map(i => [
      i.cantidad,
      `${i.codigo} - ${i.nombre}`,
      `$ ${i.precioUnitario.toFixed(2)}`,
      `$ ${i.subtotal.toFixed(2)}`
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { cellWidth: 'auto' },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35 },
    },
    alternateRowStyles: { fillColor: [248, 248, 255] },
  });

  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  
  if (saleData.totalDiscount > 0) {
    doc.text('Descuentos aplicados:', 130, finalY);
    doc.text(`-$ ${saleData.totalDiscount.toFixed(2)}`, 180, finalY, { align: 'right' });
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 130, finalY + 8);
  doc.text(`$ ${parseFloat(saleData.total).toFixed(2)}`, 180, finalY + 8, { align: 'right' });

  // Footer Disclaimer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150, 150, 150);
  doc.text('Sujeto a pagos trimestrales ISR.', 105, 275, { align: 'center' });
  doc.text('Este documento es una representación impresa de una factura generada en DespensaNET.', 105, 280, { align: 'center' });

  doc.save(`factura_venta_${saleData.idVenta}.pdf`);
}

const TABS = [
  { id: 'pos', label: 'Punto de Venta', icon: ShoppingCart },
  { id: 'historial', label: 'Historial', icon: History },
  { id: 'ofertas', label: 'Ofertas', icon: Tag },
];

export default function POS() {
  const [activeTab, setActiveTab] = useState('pos');
  const { user, logout } = useAuth();

  useEffect(() => { document.title = 'POS · DespensaNET'; }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* ── Top bar ── */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900">🏪 DespensaNET</h1>
          <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-full">
            {user?.sucursal ?? 'Sucursal'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{user?.nombre ?? user?.email}</span>
          <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors" title="Cerrar sesión">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <nav className="bg-white border-b border-gray-200 px-6 flex gap-1 shrink-0">
        {TABS.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </nav>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'pos' && <TabPOS />}
        {activeTab === 'historial' && <TabHistorial />}
        {activeTab === 'ofertas' && <TabOfertas />}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   TAB 1 — Punto de Venta
   ────────────────────────────────────────── */
function TabPOS() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [searchCode, setSearchCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [payMethod, setPayMethod] = useState('efectivo');
  const [cashGiven, setCashGiven] = useState('');
  const [showReceipt, setShowReceipt] = useState(null);
  const [processing, setProcessing] = useState(false);
  const inputRef = useRef(null);

  const [searchResults, setSearchResults] = useState(null);
  const showReceiptRef = useRef({ items: [] });

  useEffect(() => { inputRef.current?.focus(); }, []);

  const subtotal = items.reduce((s, i) => s + i.precioOriginal * i.cantidad, 0);
  const totalDiscount = items.reduce((s, i) => s + (i.precioOriginal - i.precioUnitario) * i.cantidad, 0);
  const total = subtotal - totalDiscount;
  const change = payMethod === 'efectivo' ? Math.max(0, parseFloat(cashGiven || 0) - total) : 0;

  const addProductToCart = (product) => {
    const existing = items.find(i => i.idProducto === product.id_producto);
    if (existing) {
      setItems(prev => prev.map(i =>
        i.idProducto === product.id_producto
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precioUnitario }
          : i
      ));
    } else {
      const precio = product.precio_oferta ?? product.precio_referencia;
      setItems(prev => [...prev, {
        idProducto: product.id_producto,
        codigo: product.codigo,
        nombre: product.nombre,
        cantidad: 1,
        precioOriginal: parseFloat(product.precio_referencia),
        precioUnitario: parseFloat(precio),
        idOferta: product.id_oferta ?? null,
        subtotal: parseFloat(precio),
        stock: parseInt(product.stock, 10),
      }]);
    }
    setSearchCode('');
    setSearchResults(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  /* Real-time search effect */
  useEffect(() => {
    const code = searchCode.trim();
    if (!code || code.length < 2) {
      setSearchResults(null);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      try {
        const { products } = await salesService.searchProduct(code);
        if (products && products.length > 0) {
          // Si hay exactamente un match de código, NO mostramos el autocomplete (probablemente escáner rápido)
          // El handleSearch lo procesará.
          setSearchResults(products);
        } else {
          setSearchResults(null);
        }
      } catch {
        setSearchResults(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchCode]);

  /* Submit handler (scanner or manual Enter) */
  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    const code = searchCode.trim();
    if (!code) return;
    setSearchError('');
    setSearching(true);
    try {
      const { products } = await salesService.searchProduct(code);
      if (!products || products.length === 0) { setSearchError('Producto no encontrado'); return; }
      
      const exactMatch = products.find(p => p.codigo === code);
      addProductToCart(exactMatch || products[0]);
    } catch { setSearchError('Error al buscar producto'); }
    finally { setSearching(false); }
  }, [searchCode, items]);

  const updateQty = (idx, delta) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const qty = Math.max(1, item.cantidad + delta);
      return { ...item, cantidad: qty, subtotal: qty * item.precioUnitario };
    }));
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));
  const clearAll = () => { setItems([]); setCashGiven(''); setSearchError(''); };

  const finalizeSale = async () => {
    if (items.length === 0) return;
    if (payMethod === 'efectivo' && parseFloat(cashGiven || 0) < total) {
      setSearchError('El monto en efectivo es insuficiente');
      return;
    }
    setProcessing(true);
    try {
      const result = await salesService.createSale({
        metodoPago: payMethod,
        total,
        items: items.map(i => ({
          idProducto: i.idProducto,
          idOferta: i.idOferta,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
          precioOriginal: i.precioOriginal,
          subtotal: i.subtotal,
        })),
      });
      setShowReceipt({ ...result, change, payMethod, total, totalDiscount });
      // Guardar el carrito en el recibo antes de limpiarlo
      showReceiptRef.current = { items: [...items] };
      setItems([]); setCashGiven('');
    } catch (err) {
      setSearchError(err?.response?.data?.message ?? 'Error al procesar venta');
    } finally { setProcessing(false); }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* ── LEFT: Products ── */}
      <div className="flex-1 flex flex-col p-4 gap-4 min-w-0">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input ref={inputRef} value={searchCode} onChange={e => setSearchCode(e.target.value)}
              placeholder="Escanear o buscar código o nombre de producto..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            
            {/* ── Autocomplete Dropdown ── */}
            {searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
                <div className="p-2 grid gap-1">
                  {searchResults.map(p => {
                    const precio = p.precio_oferta ?? p.precio_referencia;
                    return (
                      <div key={p.id_producto} onClick={() => addProductToCart(p)}
                        className="flex items-center justify-between p-3 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-indigo-100">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            <HighlightMatch text={p.nombre} search={searchCode} />
                          </p>
                          <p className="text-xs text-gray-500">
                            Cód: <HighlightMatch text={p.codigo} search={searchCode} /> • Stock: {p.stock} {p.unidad_medida}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-600">$ {parseFloat(precio).toFixed(2)}</p>
                          {p.id_oferta && <p className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded-sm inline-block mt-0.5">Oferta</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <button type="submit" disabled={searching}
            className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 text-sm">
            Buscar
          </button>
        </form>
        {searchError && (
          <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{searchError}</p>
        )}

        {/* Items table */}
        <div className="bg-white rounded-xl border border-gray-200 flex-1 flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-center">Cantidad</th>
                  <th className="px-4 py-3 text-right">Precio</th>
                  <th className="px-4 py-3 text-right">Desc.</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Escanea un producto para comenzar
                  </td></tr>
                ) : items.map((item, idx) => (
                  <tr key={item.idProducto} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.nombre}</p>
                      <p className="text-xs text-gray-400">{item.codigo}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => updateQty(idx, -1)} className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors">−</button>
                        <span className="w-8 text-center font-semibold">{item.cantidad}</span>
                        <button onClick={() => updateQty(idx, 1)} className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors">+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">$ {item.precioOriginal.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-green-600">
                      {item.precioOriginal !== item.precioUnitario
                        ? `- $ ${((item.precioOriginal - item.precioUnitario) * item.cantidad).toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">$ {item.subtotal.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals bar */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>$ {subtotal.toFixed(2)}</span></div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-green-600"><span>Total descuento</span><span>- $ {totalDiscount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-1 border-t border-gray-300">
              <span>Total</span><span>$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Payment panel ── */}
      <div className="w-full lg:w-80 xl:w-96 bg-white border-l border-gray-200 flex flex-col shrink-0">
        {/* Total display */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-center text-white">
          <p className="text-sm font-medium opacity-80 mb-1">Total a pagar</p>
          <p className="text-4xl font-extrabold">$ {total.toFixed(2)}</p>
        </div>

        <div className="p-4 flex-1 flex flex-col gap-4 overflow-auto">
          {/* Payment method */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Método de pago</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'efectivo', label: 'Efectivo', icon: Banknote },
                { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
              ].map(m => {
                const Icon = m.icon;
                const active = payMethod === m.value;
                return (
                  <button key={m.value} onClick={() => setPayMethod(m.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all
                      ${active ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <Icon className="w-5 h-5" /> {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash input */}
          {payMethod === 'efectivo' && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto recibido</label>
              <input type="number" min="0" step="0.01" value={cashGiven} onChange={e => setCashGiven(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-right text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {parseFloat(cashGiven || 0) >= total && total > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-green-600 font-medium">Cambio / Vuelto</p>
                  <p className="text-2xl font-extrabold text-green-700">$ {change.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={clearAll}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
                <Trash2 className="w-4 h-4" /> Limpiar
              </button>
              <button
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 text-sm font-medium transition-colors">
                <Pause className="w-4 h-4" /> Suspender
              </button>
            </div>
            <button onClick={finalizeSale} disabled={items.length === 0 || processing}
              className="w-full py-3.5 rounded-xl bg-green-600 text-white font-bold text-base hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" /> {processing ? 'Procesando...' : 'Finalizar Venta'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Receipt modal ── */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowReceipt(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-1">¡Venta exitosa!</h3>
            <p className="text-gray-500 text-sm mb-4">Venta #{showReceipt.idVenta}</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-500">Total cobrado</span><span className="font-bold">$ {parseFloat(showReceipt.total).toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Método</span><span className="font-medium capitalize">{showReceipt.payMethod}</span></div>
              {showReceipt.payMethod === 'efectivo' && (
                <div className="flex justify-between text-green-600"><span>Cambio entregado</span><span className="font-bold">$ {showReceipt.change.toFixed(2)}</span></div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={async () => {
                try {
                  await generateInvoicePDF(showReceipt, showReceiptRef.current.items, user);
                } catch (err) {
                  alert("Error al generar factura: " + err.message);
                  console.error(err);
                }
              }}
                className="w-1/2 py-3 border border-indigo-600 text-indigo-600 bg-white rounded-xl font-medium hover:bg-indigo-50 transition-colors">
                Descargar Factura
              </button>
              <button onClick={() => setShowReceipt(null)}
                className="w-1/2 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   TAB 2 — Historial de ventas del día
   ────────────────────────────────────────── */
function TabHistorial() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    salesService.getTodaySales()
      .then(data => setSales(data.sales ?? []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const totalDay = sales.reduce((s, v) => s + parseFloat(v.total), 0);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Ventas de hoy</h2>
        <div className="bg-indigo-50 text-indigo-700 font-bold px-4 py-2 rounded-xl text-sm">
          Total del día: $ {totalDay.toFixed(2)}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-16">Cargando historial...</p>
        ) : sales.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No hay ventas registradas hoy</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3"># Venta</th>
                <th className="px-4 py-3">Hora</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3 text-center">Ítems</th>
                <th className="px-4 py-3">Método</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sales.map(s => (
                <tr key={s.id_venta} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-indigo-600 font-medium">#{s.id_venta}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(s.fecha_hora).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-3 text-gray-700">{s.usuario}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium">{s.items}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                      ${s.metodo_pago === 'efectivo' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {s.metodo_pago === 'efectivo' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                      {s.metodo_pago === 'efectivo' ? 'Efectivo' : 'Tarjeta'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">$ {parseFloat(s.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   TAB 3 — Ofertas activas (solo lectura)
   ────────────────────────────────────────── */
function TabOfertas() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    salesService.getActiveOffers()
      .then(data => setOffers(data.offers ?? []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <h2 className="text-lg font-bold text-gray-900">Ofertas vigentes</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <p className="text-center text-gray-400 py-16">Cargando ofertas...</p>
        ) : offers.length === 0 ? (
          <p className="text-center text-gray-400 py-16">No hay ofertas activas en esta sucursal</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Descuento</th>
                <th className="px-4 py-3">Vigencia</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {offers.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-500">#{o.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{o.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{o.tipo}</td>
                  <td className="px-4 py-3 font-semibold text-green-600">{o.descuento}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{o.vigencia}</td>
                  <td className="px-4 py-3">
                    <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                      {o.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
