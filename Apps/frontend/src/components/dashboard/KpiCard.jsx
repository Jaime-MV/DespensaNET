/**
 * src/components/dashboard/KpiCard.jsx
 * Tarjeta KPI con estilo corporativo sobrio.
 *
 * Props:
 *   title    {string}      – Etiqueta del KPI
 *   value    {string|num}  – Valor principal
 *   subtitle {string}      – Texto secundario
 *   icon     {ReactNode}   – Icono (emoji o SVG)
 *   accent   {string}      – Clases Tailwind de fondo/texto del badge de icono
 *   trend    {number}      – Opcional: positivo = verde, negativo = rojo
 */
export default function KpiCard({ title, value, subtitle, icon, accent = 'bg-indigo-50 text-indigo-700', trend }) {
  const trendColor = trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-slate-400';
  const trendArrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '–';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-3 hover:border-slate-300 hover:shadow-sm transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <span className={`text-lg w-9 h-9 flex items-center justify-center rounded-lg ${accent}`}>{icon}</span>
      </div>

      {/* Valor principal */}
      <p className="text-3xl font-bold text-slate-900 leading-none tracking-tight tabular-nums">{value}</p>

      {/* Footer */}
      <div className="flex items-center gap-2">
        {trend !== undefined && (
          <span className={`text-xs font-semibold tabular-nums ${trendColor}`}>
            {trendArrow} {Math.abs(trend)}%
          </span>
        )}
        {subtitle && (
          <span className="text-[11px] text-slate-400">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
