export default function BotonesToggle({ valor, onChange }) {
  const soloLectura = typeof onChange !== 'function'
  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => onChange?.(true)}
        disabled={soloLectura}
        className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
          valor === true
            ? 'bg-green-600 text-white'
            : 'border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta'
        } ${soloLectura ? 'cursor-default opacity-80' : ''}`}
      >
        ✓ Sí
      </button>
      <button
        type="button"
        onClick={() => onChange?.(false)}
        disabled={soloLectura}
        className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
          valor === false
            ? 'bg-red-600 text-white'
            : 'border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta'
        } ${soloLectura ? 'cursor-default opacity-80' : ''}`}
      >
        ✕ No
      </button>
    </div>
  )
}
