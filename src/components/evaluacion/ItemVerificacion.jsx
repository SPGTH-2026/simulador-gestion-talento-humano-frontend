import BotonesToggle from './BotonesToggle'

export default function ItemVerificacion({ icono, titulo, requerido, aspirante, respuesta, onChange, onVerDocumento }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0 dark:border-sena-borde">
      <div className="flex items-center gap-3">
        {icono && <span className="text-xl" aria-hidden="true">{icono}</span>}
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-sena-texto">{titulo}</p>
          <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
            Requerido: {requerido} · Aspirante: {aspirante}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {onVerDocumento && (
          <button
            type="button"
            onClick={onVerDocumento}
            title="Ver documento"
            className="inline-flex items-center justify-center rounded bg-sena-azul px-2 py-1 text-white transition-colors hover:bg-sena-azul/90"
            aria-label="Ver documento"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
              <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <BotonesToggle valor={respuesta} onChange={onChange} />
      </div>
    </div>
  )
}
