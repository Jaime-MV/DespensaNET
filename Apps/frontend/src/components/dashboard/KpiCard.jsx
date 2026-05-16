/**
 * src/components/dashboard/KpiCard.jsx
 * Tarjeta de KPI con icono, valor principal, subtexto y color de acento.
 *
 * Props:
 *   title      {string}  – Etiqueta del KPI
 *   value      {string|number} – Valor principal
 *   subtitle   {string}  – Texto secundario (ej: "transacciones hoy")
 *   icon       {ReactNode} – Icono (emoji o SVG)
 *   accent     {string}  – Clase Tailwind de color de fondo del icono
 *   trend      {number}  – Opcional. Positivo = verde, negativo = rojo
 */
export default function KpiCard({ title, value, subtitle, icon, accent = 'bg-indigo-100 text-indigo-600', trend }) {
  const trendColor = trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-gray-400';
  const trendArrow = trend > 0 ? '↑' : trend < 0 ? '↓' : '–';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
        <span className={`text-xl p-2 rounded-xl ${accent}`}>{icon}</span>
      </div>

      {/* Valor principal */}
      <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>

      {/* Footer */}
      <div className="flex items-center gap-2">
        {trend !== undefined && (
          <span className={`text-sm font-semibold ${trendColor}`}>
            {trendArrow} {Math.abs(trend)}%
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-gray-400">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
