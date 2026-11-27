import { useSyncExternalStore } from 'react'
import {
  listaNotificaciones,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
  ocultarNotificacion,
  restaurarNotificacion,
} from '../../api/notificaciones'
import { mensajeError } from '../../api/mensajeError'

// Estado COMPARTIDO de la campana: contadores (pendientes y ocultas), las recientes del panel según su filtro y los cambios hechos desde
// cualquier parte. Una sola petición alimenta contador y panel; la página pide su propio historial paginado pero comparte contadores y
// cambios (`cambios`: el último estado conocido de cada aviso tocado), así que leer, ocultar o restaurar se ve en los tres al instante.
// Es del usuario de la sesión: se vacía al desmontarse la campana (cerrar sesión o cambiar de cuenta) y una respuesta tardía de una
// consulta anterior (otro filtro u otra cuenta) se descarta.

export const POR_PAGINA_PANEL = 10

// Vista predeterminada: «No leídas» (lo pendiente). El resto del historial está a un filtro de distancia.
export const FILTRO_PREDETERMINADO = 'no_leidas'
const VACIO = { filtro: FILTRO_PREDETERMINADO, items: [], total: 0, filtroItems: null, fase: 'inicial', error: '', actualizando: false, noLeidas: 0, ocultas: 0, cambios: {} }
let estado = VACIO
let token = 0
let enVuelo = null
let filtroEnVuelo = null
const enCurso = new Set() // avisos que se están ocultando (ver más abajo)
const oyentes = new Set()

const emitir = (parche) => {
  estado = { ...estado, ...parche }
  oyentes.forEach((f) => f())
}

/** Vacía el estado (cierre de sesión o cambio de cuenta) e invalida lo que esté en vuelo. */
export function reiniciarAlmacen() {
  token += 1
  enVuelo = null
  estado = VACIO
  oyentes.forEach((f) => f())
}

/**
 * Pide las recientes del panel con su filtro. Si ya hay una petición en curso para ese filtro la reutiliza (no se duplican); si es otro
 * filtro, la nueva reemplaza a la anterior y la tardía se descarta. Al refrescar el MISMO filtro se conserva lo que ya se ve; al cambiar de
 * filtro se muestra la carga. Si falla, queda el error para reintentar.
 */
export function refrescarNotificaciones(filtro = estado.filtro) {
  if (enVuelo && filtroEnVuelo === filtro) return enVuelo
  const mio = ++token
  filtroEnVuelo = filtro
  const otroFiltro = filtro !== estado.filtroItems
  emitir(
    otroFiltro
      ? { filtro, items: [], total: 0, filtroItems: null, fase: 'cargando', error: '', actualizando: true }
      : { filtro, actualizando: true },
  )
  const p = listaNotificaciones({ per_page: POR_PAGINA_PANEL, estado: filtro })
    .then((res) => {
      if (token !== mio) return
      emitir({
        items: (res.data ?? []).filter((n) => !enCurso.has(n.id)),
        total: res.meta?.total ?? 0,
        filtroItems: filtro,
        noLeidas: res.meta?.no_leidas ?? 0,
        ocultas: res.meta?.ocultas ?? 0,
        fase: 'listo',
        error: '',
        actualizando: false,
      })
    })
    .catch((e) => {
      if (token !== mio) return
      emitir({ fase: estado.filtroItems === filtro ? 'listo' : 'error', error: mensajeError(e), actualizando: false })
    })
    .finally(() => {
      if (enVuelo === p) enVuelo = null
    })
  enVuelo = p
  return p
}

/** La página informa los contadores que recibió de su propia consulta. */
export const alinearContadores = ({ noLeidas, ocultas }) => {
  if (noLeidas !== estado.noLeidas || ocultas !== estado.ocultas) emitir({ noLeidas, ocultas })
}

const actual = (item) => estado.cambios[item.id] ?? item
const guardarCambio = (nuevo, extra = {}) =>
  emitir({ cambios: { ...estado.cambios, [nuevo.id]: nuevo }, items: estado.items.map((n) => (n.id === nuevo.id ? nuevo : n)), ...extra })
const menos = (n) => Math.max(0, n - 1)

/** Marca UN aviso como leído (idempotente). Lo conserva en la lista del panel (ya leído) hasta el siguiente refresco. Lanza si falla. */
export async function marcarLeida(item) {
  const previo = actual(item)
  if (previo.leida) return
  const nuevo = await marcarNotificacionLeida(item.id)
  guardarCambio(nuevo, { noLeidas: previo.oculta ? estado.noLeidas : menos(estado.noLeidas) })
}

// Ocultar y restaurar son OPTIMISTAS: el cambio se ve al instante (la fila sale o vuelve, el contador se ajusta) y la petición sigue en
// segundo plano; si falla se deshace exactamente y se lanza el error. `enCurso` evita que un refresco que llegue a medias reponga un aviso
// que se acaba de ocultar.

/** Oculta un aviso: no cambia su lectura, sale del panel y del contador de pendientes y pasa a «Ocultas». Lanza si falla (y se deshace). */
export async function ocultar(item) {
  const previo = actual(item)
  if (previo.oculta) return
  const antes = { items: estado.items, total: estado.total, noLeidas: estado.noLeidas, ocultas: estado.ocultas, cambios: estado.cambios }
  enCurso.add(item.id)
  emitir({
    cambios: { ...estado.cambios, [item.id]: { ...previo, oculta: true } },
    items: estado.items.filter((n) => n.id !== item.id),
    total: menos(estado.total),
    noLeidas: previo.leida ? estado.noLeidas : menos(estado.noLeidas),
    ocultas: estado.ocultas + 1,
  })
  try {
    const nuevo = await ocultarNotificacion(item.id)
    emitir({ cambios: { ...estado.cambios, [nuevo.id]: nuevo } })
  } catch (e) {
    emitir({ ...antes, cambios: { ...estado.cambios, [item.id]: previo } })
    throw e
  } finally {
    enCurso.delete(item.id)
  }
  refrescarNotificaciones() // rellena el panel con el siguiente aviso
}

/** Devuelve un aviso oculto a la lista normal; vuelve a contar como pendiente si seguía sin leer. Optimista; lanza si falla (y se deshace). */
export async function restaurar(item) {
  const previo = actual(item)
  if (!previo.oculta) return
  const antes = { noLeidas: estado.noLeidas, ocultas: estado.ocultas }
  emitir({
    cambios: { ...estado.cambios, [item.id]: { ...previo, oculta: false } },
    noLeidas: previo.leida ? estado.noLeidas : estado.noLeidas + 1,
    ocultas: menos(estado.ocultas),
  })
  try {
    const nuevo = await restaurarNotificacion(item.id)
    emitir({ cambios: { ...estado.cambios, [nuevo.id]: nuevo } })
  } catch (e) {
    emitir({ ...antes, cambios: { ...estado.cambios, [item.id]: previo } })
    throw e
  }
  refrescarNotificaciones()
}

/** Marca como leídas solo las visibles sin leer (las ocultas no cambian). */
export async function marcarTodasLeidas() {
  await marcarTodasNotificacionesLeidas()
  emitir({ items: estado.items.map((n) => ({ ...n, leida: true })), noLeidas: 0, cambios: {} })
}

const suscribir = (f) => {
  oyentes.add(f)
  return () => oyentes.delete(f)
}
const instantanea = () => estado

/** Estado compartido: { filtro, items, total, filtroItems, fase ('inicial'|'cargando'|'listo'|'error'), error, actualizando, noLeidas, ocultas, cambios }. */
export const useAlmacenNotificaciones = () => useSyncExternalStore(suscribir, instantanea, instantanea)
