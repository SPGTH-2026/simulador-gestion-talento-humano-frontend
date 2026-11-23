export const CLASE_ESQUELETO =
  'animate-pulse rounded-md bg-sena-hundido motion-reduce:animate-none dark:bg-sena-superficie-alta'

// Botones de la tarjeta: 44 px de alto en pantallas táctiles y 40 px desde 'lg',
// como el resto de la aplicación. Cada acción lleva su icono junto al texto, del
// sistema compartido (components/ui/Icono): el mismo tamaño y trazo en todos.
// El texto puede partirse en dos líneas en un botón angosto, pero nunca se
// comprime ni se corta.

export const CLASE_BOTON_ACCION = 'justify-center'

// Tamaño único de los iconos de los botones.

export const ICONO_BOTON = 'size-5 shrink-0'

// Texto de un botón de acción: como último recurso, en pantallas extremadamente
// estrechas (zoom muy alto) una palabra larga se parte dentro del botón en vez de
// salirse de él.

export const TEXTO_BOTON = 'min-w-0 [overflow-wrap:anywhere]'

// "Editar" y el cierre comparten fila cuando el CONTENIDO de la tarjeta mide al
// menos 320 px. Medido en el navegador: "Editar" con su icono ocupa ~101 px y
// "Cerrar convocatoria" ~196 px; con 8 px de separación son ~305 px, así que 320
// deja un margen sin partir el texto. "Editar" toma su ancho natural y el cierre
// el resto. Por debajo se apilan. Es una consulta de contenedor (la tarjeta es
// '@container'), así que depende del ancho de la tarjeta y no del de la ventana.
// Las clases '@min-[320px]:...' van escritas completas en el JSX: Tailwind no
// genera las que se arman concatenando cadenas.

// Nombre legible de un estado por si el catálogo todavía no ha llegado.

export const NOMBRES_ESTADO = { publicada: 'Publicada', en_proceso: 'En proceso', cerrada: 'Cerrada' }

// Parámetros de la URL que usa este listado (ver useFiltrosUrl). La página va
// con los filtros: así sobrevive a recargar, a "atrás" y al regreso del detalle.

export const CLAVES_FILTRO = ['q', 'estado', 'ficha', 'tipo', 'modalidad', 'orden', 'page']

// Tarjetas por página: 12 llena filas completas con 2 columnas (tablet) y con 3 (escritorio ancho), y acerca la
// paginación al contenido. El servidor admite de 1 a 100.

export const TARJETAS_POR_PAGINA = 12

// Orden de la lista. 'reciente' es el predeterminado y no viaja en la URL ni a
// la API; el backend acepta exactamente estos valores.

export const ORDENES = [
  { valor: 'reciente', texto: 'Más recientes' },
  { valor: 'antigua', texto: 'Más antiguas' },
  { valor: 'nombre', texto: 'Nombre (A-Z)' },
  { valor: 'cierre', texto: 'Próximas a cerrar' },
]

export const movimientoReducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
