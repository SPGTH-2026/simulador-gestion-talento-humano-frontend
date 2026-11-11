import { useEffect, useState } from 'react'
import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import Boton from './Boton'
import LogoSena from './LogoSena'

// Pantalla de espera de SPGTH. Cada espera es una OPERACIÓN distinta y cuenta
// su propio tiempo:
//  - 'sesion': se comprueba quién es el usuario (GET /auth/me).
//  - 'codigo': llega el código de una pantalla de acceso, antes de que exista
//    el marco de la aplicación.
//  - 'pantalla': dentro del marco (menú y barra ya visibles), llega el código
//    de la pantalla que se abrió.
//  - con 'error': algo falló. Nunca se oculta detrás de la animación.
//
// Es honesta a propósito: no muestra porcentajes ni etapas (no se conocen) ni
// atribuye la demora a una causa (servidor, inactividad, red): desde el
// navegador no se puede saber. Solo dice qué se espera y cuánto llevamos
// esperando esa operación, no cuánto lleva abierta la pestaña.
//
// Lectores de pantalla: se anuncia el estado (mensaje inicial y avisos de
// demora, que cambian en los umbrales). El contador es solo visual: anunciarlo
// cada segundo estorbaría.
const SEGUNDOS_LARGA = 8
// Antes de este umbral recargar no acelera nada y puede encimar otra petición
// sobre la que ya va en camino (una primera respuesta llegó a tardar ~43 s).
const SEGUNDOS_MUY_LARGA = 60
const GRACIA_MS = 1000

const OPERACIONES = {
  sesion: {
    completa: true,
    texto: 'Comprobando tu sesión...',
    larga: 'Comprobar tu sesión está tardando más de lo habitual.',
  },
  codigo: {
    completa: true,
    texto: 'Cargando la aplicación...',
    larga: 'Cargar la aplicación está tardando más de lo habitual.',
  },
  pantalla: {
    completa: false,
    texto: 'Cargando pantalla...',
    larga: 'Cargar esta pantalla está tardando más de lo habitual.',
  },
}

// Esperas recientes: clave -> { inicio, visto }. Vive fuera de los componentes
// porque el router desmonta y vuelve a montar la pantalla de carga aunque la
// operación sea la misma. Solo se escribe desde efectos, nunca al renderizar, y
// cada entrada se borra GRACIA_MS después de que deja de mostrarse.
const esperas = new Map()

// Una espera vista hace menos de GRACIA_MS es la misma y conserva su inicio.
// Solo lee: al renderizar no se modifica nada fuera del componente.
function inicioDe(clave) {
  const ahora = performance.now()
  const previa = esperas.get(clave)
  return previa && ahora - previa.visto <= GRACIA_MS ? previa.inicio : ahora
}

function useSegundosEsperando(clave) {
  const [espera, setEspera] = useState(() => ({ clave, inicio: inicioDe(clave) }))
  const [ahora, setAhora] = useState(() => performance.now())

  // Si la clave cambia sin desmontar (el router puede reutilizar el componente
  // al pasar de una pantalla a otra), la espera se recalcula en ese mismo render.
  let actual = espera
  if (espera.clave !== clave) {
    actual = { clave, inicio: inicioDe(clave) }
    setEspera(actual)
  }
  const { inicio } = actual

  useEffect(() => {
    const marcar = () => {
      const t = performance.now()
      esperas.set(clave, { inicio, visto: t })
      return t
    }
    marcar()
    const id = setInterval(() => setAhora(marcar()), 1000)
    return () => {
      clearInterval(id)
      const visto = marcar()
      // Si nadie la retoma en el plazo, la espera terminó y se olvida.
      setTimeout(() => {
        if (esperas.get(clave)?.visto === visto) esperas.delete(clave)
      }, GRACIA_MS)
    }
  }, [clave, inicio])

  return Math.max(0, Math.floor((ahora - inicio) / 1000))
}

// 'id' distingue esperas de una misma operación que no son la misma (por
// ejemplo, dos pantallas distintas): se usa junto al nombre de la operación.
export default function PantallaCarga({ operacion = 'sesion', id = '', error = '' }) {
  const config = OPERACIONES[operacion] ?? OPERACIONES.sesion
  const segundos = useSegundosEsperando(`${operacion}:${id}`)
  const larga = !error && segundos >= SEGUNDOS_LARGA
  const muyLarga = !error && segundos >= SEGUNDOS_MUY_LARGA

  const contenedor = config.completa
    ? 'min-h-screen bg-sena-lienzo dark:bg-sena-noche'
    : 'min-h-[50vh]'

  return (
    <div className={`grid place-items-center px-6 py-10 text-center [@media(max-height:480px)]:py-6 ${contenedor}`}>
      <div className="flex max-w-sm flex-col items-center gap-5 [@media(max-height:480px)]:max-w-xl [@media(max-height:480px)]:flex-row [@media(max-height:480px)]:gap-8 [@media(max-height:480px)]:text-left">
        <div className="relative grid size-24 shrink-0 place-items-center">
          <span
            className="absolute inset-0 rounded-full border-2 border-sena-linea dark:border-sena-borde/60"
            aria-hidden="true"
          />
          {/* El arco solo existe mientras se espera y solo si el sistema permite
              movimiento. Con movimiento reducido no se dibuja: un arco quieto
              parecería un porcentaje de avance, y no hay ninguno. */}
          {!error && (
            <span
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-sena [animation-duration:1.6s] motion-safe:animate-spin motion-reduce:hidden dark:border-t-sena-acento"
              aria-hidden="true"
            />
          )}
          <LogoSena className="size-14 text-sena dark:text-white" />
        </div>

        {/* En un teléfono horizontal (poca altura) el logo queda a la izquierda
            y el texto a la derecha, para que el aviso y el botón de recarga
            quepan sin desplazarse. */}
        <div className="flex flex-col items-center gap-5 [@media(max-height:480px)]:items-start">
          <div>
            <p className="text-base font-bold text-sena-azul dark:text-sena-texto">SPGTH</p>

            {/* Región viva: contiene solo el estado. Su texto cambia en los
                umbrales (nunca por segundo), así que el lector anuncia el
                mensaje inicial y, más tarde, cada aviso una sola vez. */}
            <div
              role={error ? 'alert' : 'status'}
              aria-live={error ? 'assertive' : 'polite'}
              aria-atomic="false"
              className={`mt-1 text-sm ${CLASE_TEXTO_SUAVE}`}
            >
              <p>{error || config.texto}</p>
              {larga && <p className="mt-3">{config.larga}</p>}
              {muyLarga && (
                <p className="mt-1">
                  Sigue sin completarse. Puedes recargar la página o intentarlo de nuevo en unos minutos.
                </p>
              )}
            </div>
          </div>

          {larga && (
            <p className={`text-xs tabular-nums ${CLASE_TEXTO_SUAVE}`} aria-hidden="true">
              Llevamos {segundos} s esperando.
            </p>
          )}

          {(muyLarga || error) && (
            <Boton variante="contorno" tamano="tactil" onClick={() => window.location.reload()}>
              {error ? 'Reintentar' : 'Recargar la página'}
            </Boton>
          )}
        </div>
      </div>
    </div>
  )
}
