// Botón del sistema visual. Conserva los eventos y atributos que reciba; con
// 'as' se puede renderizar como <Link> sin cambiar su apariencia.
// El radio, la transición y la opacidad al deshabilitar van en cada tamaño (no
// en BASE) para que el tamaño 'tactil' pueda tener los suyos sin que dos
// utilidades de la misma propiedad compitan dentro de una clase.
const BASE = 'inline-flex items-center justify-center gap-2 font-semibold disabled:cursor-not-allowed'

const VARIANTES = {
  // Acción principal: verde oscuro institucional. El verde puro (#39A900) no
  // alcanza 4.5:1 con texto blanco; #007832 sí (5.6:1). El hover pasa al azul
  // institucional, que mantiene el contraste.
  primario: 'bg-sena-oscuro text-white hover:bg-sena-azul',
  secundario:
    'border border-sena-azul/25 text-sena-azul hover:bg-sena-cielo/30 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta',
  // Como 'secundario', con el borde de contraste (4.0:1) que exige WCAG para
  // identificar el control. 'secundario' conserva su borde suave por ahora: se
  // revisará junto con los formularios de cada módulo.
  contorno:
    'border border-sena-azul/60 text-sena-azul hover:bg-sena-cielo/30 dark:border-sena-texto-suave/70 dark:text-sena-texto dark:hover:bg-sena-superficie-alta',
  peligro: 'bg-peligro text-white hover:bg-red-700 dark:hover:bg-red-600',
  // Acción destructiva secundaria: se distingue del resto sin llenar la tarjeta
  // de rojo. Se usa para cerrar la recepción o la convocatoria.
  peligroSuave:
    'border border-peligro/30 text-peligro hover:bg-peligro/10 dark:border-peligro/40 dark:hover:bg-peligro/10',
  fantasma:
    'text-sena-azul hover:bg-sena-cielo/30 dark:text-sena-texto dark:hover:bg-sena-superficie-alta',
  // Control secundario con aspecto de enlace: sin fondo ni contorno; al pasar el
  // puntero se subraya. Es el mismo estilo de los enlaces de texto de las
  // pantallas de acceso (verde institucional, acento en oscuro).
  enlace:
    'text-sena-oscuro underline-offset-4 hover:underline disabled:hover:no-underline dark:text-sena-acento',
  // Para controles sobre superficies azules oscuras (topbar y sidebar).
  sobreOscuro: 'text-white hover:bg-white/10',
}

const TAMANOS = {
  sm: 'rounded-md px-3 py-1.5 text-xs transition-colors disabled:opacity-60',
  md: 'rounded-md px-4 py-2 text-sm transition-colors disabled:opacity-60',
  // Para pantallas con controles táctiles: 44 px de alto, sin partir el texto y
  // con una escala breve al presionar (que se anula con movimiento reducido).
  tactil:
    'min-h-11 whitespace-nowrap rounded-lg px-4 text-sm transition-[color,background-color,scale] duration-150 active:scale-[0.96] disabled:opacity-50 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100',
  // Como 'tactil', pero el texto puede partirse en varias líneas: para botones a
  // todo el ancho y enlaces de formularios, donde un texto largo desbordaría en
  // pantallas estrechas o con zoom.
  flexible:
    'min-h-11 rounded-lg px-4 py-2 text-center text-sm transition-[color,background-color,scale] duration-150 active:scale-[0.96] disabled:opacity-50 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100',
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
