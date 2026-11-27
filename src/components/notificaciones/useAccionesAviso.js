import { useState } from 'react'
import { mensajeError } from '../../api/mensajeError'
import { marcarLeida, ocultar, restaurar } from './almacenNotificaciones'

// Acciones de UNA fila de notificación (leer, abrir, ocultar, restaurar), iguales en el panel y en la página. Solo una a la vez
// (`ocupadoId`): un doble clic no repite la petición. Un fallo se muestra en `errorAccion` y conserva lo que ya se ve.
// 'alAbrir' se llama tras navegar al destino (el panel se cierra); 'alCambiarVisibilidad' tras ocultar o restaurar (la página vuelve a
// pedir su lista).
export function useAccionesAviso({ alAbrir, alCambiarVisibilidad } = {}) {
  const [ocupadoId, setOcupadoId] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')

  // 'libre': no espera a otra acción en curso (ocultar es optimista e inmediato; no debe bloquearse por una lectura lenta).
  const ejecutar = async (item, accion, libre = false) => {
    if (!libre && ocupadoId != null) return false
    if (!libre) setOcupadoId(item.id)
    setErrorAccion('')
    try {
      await accion(item)
      return true
    } catch (e) {
      setErrorAccion(mensajeError(e))
      return false
    } finally {
      if (!libre) setOcupadoId(null)
    }
  }

  const marcar = (item) => ejecutar(item, marcarLeida)
  // «Ver …» es un enlace real: navega al instante y la lectura se registra en paralelo (si falla, se reintentará la próxima vez).
  const abrir = (item) => {
    if (!item.leida) marcarLeida(item).catch(() => {})
    alAbrir?.()
  }
  const alOcultar = async (item) => {
    if (await ejecutar(item, ocultar, true)) alCambiarVisibilidad?.()
  }
  const alRestaurar = async (item) => {
    if (await ejecutar(item, restaurar)) alCambiarVisibilidad?.()
  }

  return { abrir, errorAccion, limpiarError: () => setErrorAccion(''), marcar, ocultar: alOcultar, ocupadoId, restaurar: alRestaurar }
}
