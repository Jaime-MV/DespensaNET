import { useState, useEffect } from 'react';
import { reportsService } from '../services/reports.service';
import {
  FileText, Download, Filter, Calendar, Building2,
  TrendingUp, ShoppingCart, DollarSign, BarChart3,
  FileSpreadsheet, AlertCircle, Loader2
} from 'lucide-react';

// ── PDF generator (client-side, no server dependency) ──────────────────────
async function generatePDF(data, filtros) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape' });
  const { resumen, ventas, productos } = data;

  // Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 297, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DespensaNET — Reporte de Ventas', 14, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Período: ${filtros.fechaInicio} al ${filtros.fechaFin}  |  Sucursal: ${filtros.sucursalLabel}  |  Generado: ${new Date().toLocaleString('es-GT')}`,
    14, 20
  );

  // KPI boxes
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  const kpis = [
    { label: 'Total Ventas', value: resumen.total_ventas },
    { label: 'Ingresos Totales', value: `$ ${parseFloat(resumen.ingresos_totales).toFixed(2)}` },
    { label: 'Promedio por Venta', value: `$ ${parseFloat(resumen.promedio_venta).toFixed(2)}` },
    { label: 'Efectivo', value: resumen.ventas_efectivo },
    { label: 'Tarjeta', value: resumen.ventas_tarjeta },
  ];
  kpis.forEach((k, i) => {
    const x = 14 + i * 56;
    doc.setFillColor(245, 245, 255);
    doc.roundedRect(x, 28, 50, 18, 2, 2, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 120);
    doc.text(k.label, x + 25, 34, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text(String(k.value), x + 25, 42, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });

  // Sales table
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Ventas', 14, 56);

  autoTable(doc, {
    startY: 60,
    head: [['# Venta', 'Fecha', 'Sucursal', 'Cajero', 'Método Pago', 'Items', 'Total ($)']],
    body: ventas.map(v => [
      v.id_venta,
      v.fecha,
      v.sucursal,
      v.cajero,
      v.metodo_pago,
      v.num_items,
      parseFloat(v.total).toFixed(2),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 255] },
  });

  // Top products table
  const y2 = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Productos Más Vendidos (Top 20)', 14, y2);

  autoTable(doc, {
    startY: y2 + 4,
    head: [['Código', 'Producto', 'Categoría', 'Cantidad Vendida', 'Ingresos ($)']],
    body: productos.map(p => [
      p.codigo,
      p.nombre,
      p.categoria || '—',
      p.total_vendido,
      parseFloat(p.total_ingresos).toFixed(2),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 253, 244] },
  });

  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${pages} — DespensaNET`, 148, 205, { align: 'center' });
  }

  doc.save(`reporte_ventas_${filtros.fechaInicio}_${filtros.fechaFin}.pdf`);
}

// ── CSV generator ───────────────────────────────────────────────────────────
function generateCSV(data, filtros) {
  const { resumen, ventas, productos } = data;
  const lines = [];

  lines.push(`DespensaNET - Reporte de Ventas`);
  lines.push(`Período,${filtros.fechaInicio},${filtros.fechaFin}`);
  lines.push(`Sucursal,${filtros.sucursalLabel}`);
  lines.push(`Generado,${new Date().toLocaleString('es-GT')}`);
  lines.push('');

  lines.push('=== RESUMEN ===');
  lines.push(`Total Ventas,${resumen.total_ventas}`);
  lines.push(`Ingresos Totales,$ ${parseFloat(resumen.ingresos_totales).toFixed(2)}`);
  lines.push(`Promedio por Venta,$ ${parseFloat(resumen.promedio_venta).toFixed(2)}`);
  lines.push(`Ventas Efectivo,${resumen.ventas_efectivo}`);
  lines.push(`Ventas Tarjeta,${resumen.ventas_tarjeta}`);
  lines.push('');

  lines.push('=== DETALLE DE VENTAS ===');
  lines.push('# Venta,Fecha,Sucursal,Cajero,Método Pago,Items,Total ($)');
  ventas.forEach(v => {
    lines.push(`${v.id_venta},"${v.fecha}","${v.sucursal}","${v.cajero}",${v.metodo_pago},${v.num_items},${parseFloat(v.total).toFixed(2)}`);
  });
  lines.push('');

  lines.push('=== PRODUCTOS MÁS VENDIDOS ===');
  lines.push('Código,Producto,Categoría,Cantidad Vendida,Ingresos ($)');
  productos.forEach(p => {
    lines.push(`${p.codigo},"${p.nombre}","${p.categoria || ''}",${p.total_vendido},${parseFloat(p.total_ingresos).toFixed(2)}`);
  });

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte_ventas_${filtros.fechaInicio}_${filtros.fechaFin}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ───────────────────────────────────────────────────────────────
export default function Reportes() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];

  const [sucursales, setSucursales] = useState([]);
  const [filtros, setFiltros] = useState({
    fechaInicio: firstOfMonth,
    fechaFin: today,
    idSucursal: '',
    formato: 'pdf',
  });

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Reportes · DespensaNET';
    reportsService.getSucursales()
      .then(({ sucursales }) => setSucursales(sucursales))
      .catch(console.error);
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setReportData(null);
    try {
      const params = {
        fechaInicio: filtros.fechaInicio,
        fechaFin: filtros.fechaFin,
        ...(filtros.idSucursal && { idSucursal: filtros.idSucursal }),
      };
      const data = await reportsService.getSalesReport(params);
      setReportData(data);
    } catch (err) {
      setError('Error al consultar los datos. Verifica el rango de fechas.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!reportData) return;
    setGenerating(true);
    const sucursalLabel = filtros.idSucursal
      ? sucursales.find(s => s.id_sucursal === parseInt(filtros.idSucursal))?.nombre ?? 'Sucursal'
      : 'Todas las sucursales';
    const ctx = { ...filtros, sucursalLabel };
    try {
      if (filtros.formato === 'pdf') {
        await generatePDF(reportData, ctx);
      } else {
        generateCSV(reportData, ctx);
      }
    } catch (err) {
      setError('Error al generar el archivo. Intenta de nuevo.');
    } finally {
      setGenerating(false);
    }
  };

  const fmt = (n) => `$ ${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 lg:p-8 w-full flex flex-col gap-6 min-h-screen">
      <header className="flex items-center gap-3 shrink-0">
        <div className="p-2.5 bg-indigo-100 rounded-xl">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reportes de Ventas</h1>
          <p className="text-sm text-slate-500">Genera y descarga reportes en PDF o CSV</p>
        </div>
      </header>

      {/* ── Filtros ── */}
      <form onSubmit={handleGenerate} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" /> Parámetros del Reporte
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Fecha Inicio
            </label>
            <input
              type="date"
              required
              max={filtros.fechaFin}
              value={filtros.fechaInicio}
              onChange={e => setFiltros(f => ({ ...f, fechaInicio: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Fecha Fin
            </label>
            <input
              type="date"
              required
              min={filtros.fechaInicio}
              max={today}
              value={filtros.fechaFin}
              onChange={e => setFiltros(f => ({ ...f, fechaFin: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Sucursal
            </label>
            <select
              value={filtros.idSucursal}
              onChange={e => setFiltros(f => ({ ...f, idSucursal: e.target.value }))}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map(s => (
                <option key={s.id_sucursal} value={s.id_sucursal}>{s.nombre}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Formato de Salida
            </label>
            <div className="flex gap-2">
              {['pdf', 'csv'].map(fmt => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFiltros(f => ({ ...f, formato: fmt }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    filtros.formato === fmt
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {fmt === 'pdf' ? <FileText className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" /> {error}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            {loading ? 'Consultando...' : 'Generar Reporte'}
          </button>
        </div>
      </form>

      {/* ── Preview / Results ── */}
      {reportData && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: ShoppingCart, label: 'Total Ventas',      value: reportData.resumen.total_ventas,      color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { icon: DollarSign,   label: 'Ingresos Totales',  value: fmt(reportData.resumen.ingresos_totales), color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: TrendingUp,   label: 'Promedio / Venta',  value: fmt(reportData.resumen.promedio_venta),   color: 'text-sky-600', bg: 'bg-sky-50' },
              { icon: FileText,     label: 'Ventas Efectivo',   value: reportData.resumen.ventas_efectivo,   color: 'text-amber-600', bg: 'bg-amber-50' },
              { icon: FileText,     label: 'Ventas Tarjeta',    value: reportData.resumen.ventas_tarjeta,    color: 'text-violet-600', bg: 'bg-violet-50' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{label}</p>
                  <p className={`text-xl font-bold ${color} tabular-nums`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sales table preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Detalle de Ventas</h2>
              <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">
                {reportData.ventas.length} registros
              </span>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 sticky top-0 text-[11px] text-slate-500 uppercase font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3"># Venta</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Sucursal</th>
                    <th className="px-4 py-3">Cajero</th>
                    <th className="px-4 py-3">Método</th>
                    <th className="px-4 py-3 text-right">Items</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.ventas.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-slate-400">Sin ventas en el período seleccionado.</td></tr>
                  ) : reportData.ventas.map(v => (
                    <tr key={v.id_venta} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-indigo-600 font-medium">#{v.id_venta}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">{v.fecha}</td>
                      <td className="px-4 py-3 text-slate-700">{v.sucursal}</td>
                      <td className="px-4 py-3 text-slate-700">{v.cajero}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          v.metodo_pago === 'efectivo' ? 'bg-emerald-100 text-emerald-700' :
                          v.metodo_pago === 'tarjeta'  ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{v.metodo_pago}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{v.num_items}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 tabular-nums">$ {parseFloat(v.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top products preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Productos Más Vendidos</h2>
              <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-medium">Top {reportData.productos.length}</span>
            </div>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 sticky top-0 text-[11px] text-slate-500 uppercase font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3 text-right">Uds. Vendidas</th>
                    <th className="px-4 py-3 text-right">Ingresos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.productos.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-slate-400">Sin datos.</td></tr>
                  ) : reportData.productos.map((p, idx) => (
                    <tr key={p.codigo} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-400 tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-indigo-600">{p.codigo}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{p.nombre}</td>
                      <td className="px-4 py-3 text-slate-500">{p.categoria || '—'}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-800">{p.total_vendido}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700 tabular-nums">$ {parseFloat(p.total_ingresos).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Download button */}
          <div className="flex justify-end pb-6">
            <button
              onClick={handleDownload}
              disabled={generating}
              className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-60"
            >
              {generating
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Download className="w-5 h-5" />
              }
              {generating ? 'Generando archivo...' : `Descargar ${filtros.formato.toUpperCase()}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
