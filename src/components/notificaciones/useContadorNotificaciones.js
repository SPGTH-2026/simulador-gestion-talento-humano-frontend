import { useEffect } from 'react'
import { refrescarNotificaciones, reiniciarAlmacen, useAlmacenNotificaciones } from './almacenNotificaciones'

// Intervalo de consulta de la campana. Es una comodidad, no un canal en tiempo real: un aviso puede tardar hasta este
// tiempo en aparecer, salvo que la pantalla se vuelva a ver. Los cambios hechos aquí (leer un aviso) no esperan: pasan por el
// almacén compartido y se ven al instante en la campana, el panel y la página.
const INTERVALO_MS = 60_000

// Número de notificaciones sin leer. Mientras 'activo' mantiene al día las recientes (una sola petición para contador y panel) cada
// minuto y al volver a la pestaña. Al desmontarse (cerrar sesión) vacía el almacén.
export function useContadorNotificaciones(activo) {
  const { noLeidas } = useAlmacenNotificaciones()

  useEffect(() => {
    if (!activo) return undefined
    const alVolver = () => {
      if (document.visibilityState === 'visible') refrescarNotificaciones()
    }
    refrescarNotificaciones()
    const temporizador = setInterval(refrescarNotificaciones, INTERVALO_MS)
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearInterval(temporizador)
      document.removeEventListener('visibilitychange', alVolver)
      reiniciarAlmacen()
    }
  }, [activo])

  return noLeidas
}
