// Filtros del historial (Todas, No leídas, Leídas y, en la página, Ocultas). Son botones con estado (aria-pressed) de 44 px; el activo se
// distingue por fondo, borde y peso, no solo por color. Se usan igual en el panel y en la página.
export default function FiltrosNotificaciones({ opciones, valor, onCambiar, className = '' }) {
  return (
    <div role="group" aria-label="Filtrar notificaciones" className={`flex flex-wrap gap-1.5 ${className}`.trim()}>
      {opciones.map((o) => {
        const activo = o.id === valor
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={activo}
            onClick={() => !activo && onCambiar(o.id)}
            className={`min-h-11 rounded-full border px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/60 ${
              activo
                ? 'border-sena-azul/60 bg-sena-cielo/40 font-semibold text-sena-azul dark:border-sena-texto-suave/70 dark:bg-white/10 dark:text-sena-texto'
                : 'border-transparent font-medium text-slate-600 hover:bg-sena-hundido/70 dark:text-sena-texto-suave dark:hover:bg-white/10'
            }`}
          >
            {o.etiqueta}
          </button>
        )
      })}
    </div>
  )
}
