/**
 * src/components/dashboard/ChartWrapper.jsx
 * Contenedor visual uniforme para gráficos — estilo corporativo.
 *
 * Props:
 *   title     {string}     – Título de la tarjeta
 *   children  {ReactNode}  – El gráfico (Recharts)
 *   className {string}     – Clases adicionales opcionales
 */
export default function ChartWrapper({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 tracking-wide">{title}</h3>
      </div>
      <div className="p-5 flex-1 min-h-0">{children}</div>
    </div>
  );
}
