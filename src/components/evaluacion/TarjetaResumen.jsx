export default function TarjetaResumen({ cumplidos, total }) {
  const pct = total > 0 ? Math.round((cumplidos / total) * 100) : 0
  const pasa = pct >= 60
  return (
    <div
      className={`rounded-lg border p-3 text-sm font-semibold ${
        pasa
          ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300'
          : 'border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span>
          {pasa ? '✓ Cumple perfil — ' : ''}{cumplidos} de {total} requisitos cumplidos
        </span>
        <span className="text-base">{pct}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/60 dark:bg-sena-borde">
        <div
          className={`h-full rounded-full transition-all ${pasa ? 'bg-green-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={`mt-2 text-xs font-bold ${pasa ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
        {pasa ? '✓ Pasa a selección (≥ 60%)' : '✕ No pasa a selección (< 60%)'}
      </div>
    </div>
  )
}
