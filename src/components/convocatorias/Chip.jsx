// Chip para las skills de la etapa 3. Dos variantes:
//  - 'agregada'  -> skill ya incluida, con botón × para quitarla.
//  - 'sugerida'  -> sugerencia del catálogo (tema skill_tecnica); clic para agregar.
export default function Chip({ children, onQuitar, onClick, tipo = 'agregada' }) {
  const base =
    'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors'

  if (tipo === 'sugerida') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} border border-dashed border-sena-azul/40 text-sena-azul hover:bg-sena-cielo/40 dark:border-sena-borde dark:text-sena-texto-suave dark:hover:bg-sena-superficie-alta`}
      >
        + {children}
      </button>
    )
  }

  return (
    <span className={`${base} bg-sena-cielo/50 text-sena-azul dark:bg-sena-superficie-alta dark:text-sena-texto`}>
      {children}
      {onQuitar && (
        <button
          type="button"
          onClick={onQuitar}
          aria-label={`Quitar ${children}`}
          className="rounded-full pl-1 text-sena-azul/70 transition-colors hover:text-peligro dark:text-sena-texto-suave"
        >
          ×
        </button>
      )}
    </span>
  )
}
