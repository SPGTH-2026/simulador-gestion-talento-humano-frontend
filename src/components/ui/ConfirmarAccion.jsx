import { useEffect } from 'react'
import Boton from './Boton'

// Diálogo de confirmación con el estilo del sistema. Lo controla
// ConfirmacionProvider (ver hooks/useConfirmacion.jsx): no se usa directamente.
//
// Escape y clic fuera cancelan. El foco va al botón de cancelar para que una
// pulsación accidental de Enter no ejecute la acción destructiva.
export default function ConfirmarAccion({
  titulo,
  mensaje,
  textoConfirmar,
  textoCancelar,
  peligro = false,
  onConfirmar,
  onCancelar,
}) {
  useEffect(() => {
    const alPulsarEscape = (evento) => {
      if (evento.key === 'Escape') onCancelar()
    }
    window.addEventListener('keydown', alPulsarEscape)
    return () => window.removeEventListener('keydown', alPulsarEscape)
  }, [onCancelar])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCancelar()
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-titulo"
        aria-describedby="confirmar-mensaje"
        className="w-full max-w-md rounded-xl border border-sena-linea bg-white p-6 shadow-xl dark:border-sena-borde dark:bg-sena-superficie"
      >
        <div className="flex items-start gap-3">
          {peligro && (
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-peligro dark:bg-red-950/50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
            </span>
          )}
          <div className="min-w-0">
            <h2 id="confirmar-titulo" className="text-lg font-bold text-slate-900 dark:text-sena-texto">
              {titulo}
            </h2>
            <p id="confirmar-mensaje" className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">
              {mensaje}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton autoFocus variante="secundario" onClick={onCancelar}>
            {textoCancelar}
          </Boton>
          <Boton variante={peligro ? 'peligro' : 'primario'} onClick={onConfirmar}>
            {textoConfirmar}
          </Boton>
        </div>
      </div>
    </div>
  )
}
