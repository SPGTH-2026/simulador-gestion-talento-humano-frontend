export default function BarraProgreso({ valor, max = 100, color = 'bg-green-500', mostrarValor = true, valorTexto }) {
  const pct = max > 0 ? Math.min(100, Math.round((valor / max) * 100)) : 0
  const texto = valorTexto ?? `${valor}/${max}`
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-sena-borde">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {mostrarValor && <span className="text-xs font-medium text-slate-600 dark:text-sena-texto-suave">{texto}</span>}
    </div>
  )
}
