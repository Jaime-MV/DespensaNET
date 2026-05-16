/**
 * src/components/dashboard/ChartWrapper.jsx
 * Contenedor visual uniforme para todos los gráficos del dashboard.
 *
 * Props:
 *   title    {string}    – Título de la tarjeta
 *   children {ReactNode} – El gráfico (Recharts u otro)
 *   className {string}   – Clases adicionales opcionales
 */
export default function ChartWrapper({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
