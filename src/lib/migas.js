import { menu } from '../config/menu'

// Ruta de navegación ("Evaluación / Evaluar aspirantes") para la barra
// superior. Se deduce del menú: no hay una segunda lista que mantener.
//
// Cada tramo es { texto, to }; el último es la página actual y no lleva 'to'.
// Una dirección con parámetros toma el destino más largo del menú que la
// contiene y añade un tramo propio si es una pantalla distinta del destino
// (detalle, edición, evaluar). Esas pantallas no están en el menú, por eso
// sus nombres viven aquí, aparte del router. Una dirección que no pertenece
// a ningún destino (por ejemplo /notificaciones) no tiene ruta.
const DESTINOS = menu.flatMap((item) => {
  if (item.children) {
    return item.children.map((hijo) => ({
      to: hijo.to,
      tramos: [{ texto: item.label }, { texto: hijo.label, to: hijo.to }],
    }))
  }
  return item.to ? [{ to: item.to, tramos: [{ texto: item.label, to: item.to }] }] : []
})

// 'soloRegreso': no repite el nombre del módulo (en Evaluación sería
// "Evaluación / Evaluar aspirantes / Evaluar…"): queda el enlace de regreso al
// listado y la pantalla actual.
const SUBPANTALLAS = [
  { patron: /^\/evaluacion\/evaluar(\/[^/]+)?$/, texto: 'Evaluación individual', soloRegreso: true },
  { patron: /\/editar$/, texto: 'Edición' },
  { patron: /^\/(convocatorias|documentos)\/[^/]+$/, texto: 'Detalle' },
]

export function migasDe(pathname) {
  let mejor = null
  for (const d of DESTINOS) {
    const coincide = d.to === '/' ? pathname === '/' : pathname === d.to || pathname.startsWith(`${d.to}/`)
    if (coincide && (!mejor || d.to.length > mejor.to.length)) mejor = d
  }
  if (!mejor) return []

  // El tramo del menú es la página actual solo si estamos exactamente en su
  // destino; si hay una subpantalla, pasa a ser un enlace de regreso.
  const sub = pathname === mejor.to ? null : SUBPANTALLAS.find(({ patron }) => patron.test(pathname))
  if (sub) return [...(sub.soloRegreso ? mejor.tramos.slice(-1) : mejor.tramos), { texto: sub.texto }]
  return mejor.tramos.map(({ texto, to }, i) => (i === mejor.tramos.length - 1 ? { texto } : { texto, to }))
}
