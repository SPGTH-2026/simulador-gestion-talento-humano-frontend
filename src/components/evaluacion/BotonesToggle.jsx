export default function BotonesToggle({ valor, onChange }) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
          valor === true
            ? 'bg-green-600 text-white'
            : 'border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta'
        }`}
      >
        ✓ Sí
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
          valor === false
            ? 'bg-red-600 text-white'
            : 'border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta'
        }`}
      >
        ✕ No
      </button>
    </div>
  )
}
