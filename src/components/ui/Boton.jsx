// Botón del sistema visual. Conserva los eventos y atributos que reciba; con
// 'as' se puede renderizar como <Link> sin cambiar su apariencia.
// El radio, la transición y la opacidad al deshabilitar van en cada tamaño (no
// en BASE) para que el tamaño 'tactil' pueda tener los suyos sin que dos
// utilidades de la misma propiedad compitan dentro de una clase.
//
// Cursor de un botón deshabilitado: "no permitido" (🚫) cuando la acción no está
// disponible; "en curso" cuando el botón está trabajando ('ocupado'). Un 🚫 sobre
// algo que solo está esperando una respuesta diría "no puedes" cuando en realidad
// significa "espera".
import Rueda from './Rueda'

const BASE =
  'inline-flex items-center justify-center gap-2 font-semibold disabled:cursor-not-allowed aria-busy:disabled:cursor-progress'

const VARIANTES = {
  // Acción principal: verde oscuro institucional. El verde puro (#39A900) no
  // alcanza 4.5:1 con texto blanco; #007832 sí (5.6:1). El hover pasa al azul
  // institucional, que mantiene el contraste.
  // En oscuro el azul institucional casi no se distingue del fondo: el hover mantiene el verde y lo aclara.
  primario: 'bg-sena-oscuro text-white libre:hover:bg-sena-azul dark:libre:hover:bg-sena-oscuro dark:libre:hover:brightness-125',
  // Botón neutro del sistema, con el borde de contraste (4.0:1) que exige WCAG para identificar el control.
  contorno:
    'border border-sena-azul/60 text-sena-azul libre:hover:bg-sena-cielo/30 dark:border-sena-texto-suave/70 dark:text-sena-texto dark:libre:hover:bg-sena-superficie-alta',
  // El token 'peligro' es un rojo CLARO en oscuro (sirve para texto): como relleno con texto blanco se veía rosado y sin
  // contraste. Aquí se usan rojos fijos y sobrios por tema (800 en claro, 900 en oscuro): el rojo vivo cansaba la vista.
  peligro: 'bg-red-800 text-white libre:hover:bg-red-900 dark:bg-red-900 dark:libre:hover:bg-red-800',
  // Acción destructiva secundaria: se distingue del resto sin llenar la tarjeta
  // de rojo. Se usa para cerrar la recepción o la convocatoria.
  peligroSuave:
    'border border-peligro/30 text-peligro libre:hover:bg-peligro/10 dark:border-peligro/40 dark:libre:hover:bg-peligro/10',
  fantasma:
    'text-sena-azul libre:hover:bg-sena-cielo/30 dark:text-sena-texto dark:libre:hover:bg-sena-superficie-alta',
  // Control secundario con aspecto de enlace: sin fondo ni contorno; al pasar el
  // puntero se subraya. Es el mismo estilo de los enlaces de texto de las
  // pantallas de acceso (verde institucional, acento en oscuro).
  enlace:
    'text-sena-oscuro underline-offset-4 libre:hover:underline disabled:hover:no-underline dark:text-sena-acento',
  // Para controles sobre superficies azules oscuras (topbar y sidebar).
  sobreOscuro: 'text-white libre:hover:bg-white/10',
}

const TAMANOS = {
  // 'sm' y 'md' son los tamaños compactos (30 y 36 px de alto, sin mínimo táctil). Antes solo animaban el color; ahora
  // tienen el mismo efecto al presionar que 'tactil' y 'flexible'. Quedan para controles dentro de texto o filas muy
  // densas; las acciones normales usan 'tactil' (44 px).
  sm: 'rounded-md px-3 py-1.5 text-xs transition-[color,background-color,scale] duration-150 active:scale-[0.96] disabled:opacity-60 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100',
  md: 'rounded-md px-4 py-2 text-sm transition-[color,background-color,scale] duration-150 active:scale-[0.96] disabled:opacity-60 disabled:active:scale-100 motion-reduce:transition-none motion-reduce:active:scale-100',
  // Para pantallas con controles táctiles: 44 px de alto (la única altura de las acciones del sistema, también en escritorio), sin partir el texto y
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
  // Por defecto 'tactil' (44 px), el estándar del sistema; 'sm' y 'md' son compactos y hoy no se usan.
  tamano = 'tactil',
  as: Componente = 'button',
  // 'ocupado': la acción está en curso. Bloquea el botón (un <button>), lo marca
  // con aria-busy para lectores de pantalla y muestra la rueda junto al texto.
  ocupado = false,
  className = '',
  children,
  ...props
}) {
  const esBoton = Componente === 'button'
  // Un <button> sin type explícito dentro de un formulario enviaría sin querer.
  const atributos = esBoton && props.type == null ? { type: 'button' } : {}
  if (ocupado) {
    atributos['aria-busy'] = true
    if (esBoton) atributos.disabled = true
  }

  return (
    <Componente
      {...atributos}
      {...props}
      {...(ocupado && esBoton ? { disabled: true } : {})}
      className={`${BASE} ${VARIANTES[variante] ?? VARIANTES.primario} ${
        TAMANOS[tamano] ?? TAMANOS.md
      } ${className}`.trim()}
    >
      {ocupado && <Rueda />}
      {children}
    </Componente>
  )
}
