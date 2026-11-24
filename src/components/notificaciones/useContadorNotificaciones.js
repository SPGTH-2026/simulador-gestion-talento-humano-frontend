import { useEffect, useState } from 'react'
import { listaNotificaciones } from '../../api/notificaciones'

// Intervalo de consulta de la campana. Es una comodidad, no un canal en tiempo real: un aviso puede tardar hasta este
// tiempo en aparecer, salvo que la pantalla se vuelva a ver o la propia página avise de un cambio.
const INTERVALO_MS = 60_000
const EVENTO_CAMBIO = 'notificaciones:cambiaron'

// La página de notificaciones llama a esto tras marcar avisos, para que la campana se actualice al momento.
export function avisarCambioNotificaciones() {
  window.dispatchEvent(new Event(EVENTO_CAMBIO))
}

// Número de notificaciones sin leer. Se pide solo mientras 'activo' (el usuario puede verla) y se vuelve a pedir cada
// minuto, al volver a la pestaña y cuando otra parte de la app avisa de un cambio.
export function useContadorNotificaciones(activo) {
  const [noLeidas, setNoLeidas] = useState(0)

  useEffect(() => {
    if (!activo) return undefined

    let vivo = true
    const cargar = () => {
      listaNotificaciones({ per_page: 1 })
        .then((res) => {
          if (vivo) setNoLeidas(res.meta?.no_leidas ?? 0)
        })
        .catch(() => {
          // Sin conexión o sesión caducada: la campana conserva el último número conocido.
        })
    }
    const alVolver = () => {
      if (document.visibilityState === 'visible') cargar()
    }

    cargar()
    const temporizador = setInterval(cargar, INTERVALO_MS)
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener(EVENTO_CAMBIO, cargar)

    return () => {
      vivo = false
      clearInterval(temporizador)
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener(EVENTO_CAMBIO, cargar)
    }
  }, [activo])

  return noLeidas
}
