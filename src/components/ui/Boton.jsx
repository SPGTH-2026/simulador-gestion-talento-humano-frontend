// Botón del sistema visual. Conserva los eventos y atributos que reciba; con
// 'as' se puede renderizar como <Link> sin cambiar su apariencia.
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const VARIANTES = {
  // Acción principal: el único lugar donde se usa el verde institucional puro.
  primario: 'bg-sena text-white hover:bg-sena-oscuro',
  secundario:
    'border border-sena-azul/25 text-sena-azul hover:bg-sena-cielo/30 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta',
  peligro: 'bg-peligro text-white hover:bg-red-700 dark:hover:bg-red-600',
  fantasma:
    'text-sena-azul hover:bg-sena-cielo/30 dark:text-sena-texto dark:hover:bg-sena-superficie-alta',
}

const TAMANOS = {
  sm: 'px-3 py-1.5 text-xs font-semibold',
  md: 'px-4 py-2 text-sm font-semibold',
}

export default function Boton({
  variante = 'primario',
  tamano = 'md',
  as: Componente = 'button',
  className = '',
  children,
  ...props
}) {
  // Un <button> sin type explícito dentro de un formulario enviaría sin querer.
  const atributos = Componente === 'button' && props.type == null ? { type: 'button' } : {}

  return (
    <Componente
      {...atributos}
      {...props}
      className={`${BASE} ${VARIANTES[variante] ?? VARIANTES.primario} ${
        TAMANOS[tamano] ?? TAMANOS.md
      } ${className}`.trim()}
    >
      {children}
    </Componente>
  )
}
