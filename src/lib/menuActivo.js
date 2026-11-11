import { menu } from '../config/menu'

// Qué opción del menú corresponde a la dirección actual, para marcarla como la
// activa en el menú lateral. Se deduce del propio menú (no hay una segunda lista
// de rutas): gana el destino más específico que contiene la dirección, de modo
// que /convocatorias/12/editar marca "Listado" y /convocatorias/nueva marca
// "Nueva convocatoria", no las dos.

// Pantallas que pertenecen a una opción del menú aunque su dirección no empiece
// como ella. Por ejemplo, "Gestionar documentos" vive en
// /postulaciones/:id/documentos pero es parte de "Mis documentos"; sin este
// alias el menú no marcaba ninguna opción y la persona perdía el contexto. Lo
// usa también la ruta de navegación de la barra superior (lib/migas.js).
export const ALIAS_DE_PANTALLA = [
  {
    patron: /^\/postulaciones\/[^/]+\/documentos$/,
    destino: '/mis-documentos',
    texto: 'Documentos de la postulación',
  },
]

const DESTINOS = menu.flatMap((item) => {
  if (item.children) return item.children.map((hijo) => hijo.to)
  return item.to ? [item.to] : []
})

// Devuelve el 'to' del menú que corresponde a la dirección, o null si ninguna
// opción la contiene (por ejemplo /notificaciones, que se abre desde la campana).
export function destinoDeMenu(pathname) {
  const alias = ALIAS_DE_PANTALLA.find(({ patron }) => patron.test(pathname))
  if (alias) return alias.destino

  let mejor = null
  for (const to of DESTINOS) {
    const coincide = to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`)
    if (coincide && (mejor === null || to.length > mejor.length)) mejor = to
  }
  return mejor
}
