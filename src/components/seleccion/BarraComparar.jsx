import { useEffect, useId, useRef, useState } from 'react'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { MAXIMO_COMPARAR, MINIMO_COMPARAR } from '../../lib/seleccion'
import CasillaSeleccion from './CasillaSeleccion'

// Casilla «Comparar» de una fila. Solo existe en el modo comparación, que no tiene las casillas de «Elegir»: no conviven.
// Con el máximo alcanzado las casillas sin marcar se desactivan; la barra explica por qué.
export function CasillaComparar({ comparacion, id, aspirante }) {
  const marcada = comparacion.marcas.has(id)
  const lleno = comparacion.marcas.size >= MAXIMO_COMPARAR
  return (
    <CasillaSeleccion
      marcada={marcada}
      desactivada={!marcada && lleno}
      onCambiar={() => comparacion.alternar(id, aspirante)}
      etiqueta={`Marcar a ${aspirante} para comparar`}
      title={!marcada && lleno ? `Ya hay ${MAXIMO_COMPARAR} candidatos para comparar: quita uno para marcar otro.` : undefined}
    />
  )
}

// «Comparar candidatos» (CU-SEL-017) en Ranking y Finalistas. Vista normal: solo la acción secundaria sobre la tabla.
// Modo comparación: contador desplegable («N de 5 marcados») con los nombres, su «quitar» —también de candidatos que
// no están en la página o pestaña a la vista— y «Limpiar marcas»; «Comparar (N)» y «Salir de comparación» siempre a la
// vista. Salir conserva las marcas. El foco nunca se pierde: al entrar pasa al contador (o a «Salir» si no hay marcas),
// al salir vuelve a «Comparar candidatos» y al quitar o limpiar se queda en un control visible de la barra.
export default function BarraComparar({ comparacion, total, singular = 'candidato', plural = 'candidatos' }) {
  const { modo, marcas, entrar, salir, abrir, limpiar, quitar } = comparacion
  const n = marcas.size
  const valido = n >= MINIMO_COMPARAR && n <= MAXIMO_COMPARAR
  const lleno = n >= MAXIMO_COMPARAR
  const [desplegado, setDesplegado] = useState(false)
  // Sin marcas no hay nada que desplegar: se pliega durante el render, sin un instante con la lista vacía.
  if (desplegado && n === 0) setDesplegado(false)
  const idPanel = useId()
  const idAyuda = useId()
  const raiz = useRef(null)
  const botonEntrar = useRef(null)
  const botonContador = useRef(null)
  const botonSalir = useRef(null)
  const modoPrevio = useRef(modo)

  // Ranking y Finalistas montan cada uno su barra: solo la de la pestaña a la vista (visible) recibe el foco.
  useEffect(() => {
    if (modoPrevio.current === modo) return
    modoPrevio.current = modo
    const destino = modo ? (botonContador.current && !botonContador.current.disabled ? botonContador.current : botonSalir.current) : botonEntrar.current
    if (destino && destino.offsetParent !== null) destino.focus()
  }, [modo])

  // Cabecera de la tabla: el total a la izquierda y la acción secundaria a la derecha (como «3 convocatorias» en el
  // listado de Convocatorias), en una sola fila. En pantallas estrechas el botón baja, a todo el ancho. Con menos de dos
  // candidatos no hay nada que comparar: el botón queda desactivado y una línea breve lo explica.
  const pocos = total < MINIMO_COMPARAR
  const cabecera = (
    <div className="flex flex-col gap-2 @min-[420px]:flex-row @min-[420px]:items-center @min-[420px]:justify-between">
      <p className={`text-sm ${CLASE_TEXTO_SUAVE}`} aria-live="polite">
        <span className="tabular-nums">{total}</span> {total === 1 ? singular : plural}
      </p>
      {!modo && (
        <Boton
          ref={botonEntrar}
          variante="contorno"
          disabled={pocos}
          aria-describedby={pocos ? idAyuda : undefined}
          className="w-full @min-[420px]:w-auto"
          onClick={entrar}
        >
          Comparar candidatos{n > 0 ? ` (${n})` : ''}
        </Boton>
      )}
    </div>
  )

  if (!modo) {
    return (
      <div className="flex flex-col gap-1.5">
        {cabecera}
        {pocos && (
          <p id={idAyuda} className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
            Necesitas al menos {MINIMO_COMPARAR} {plural} para comparar.
          </p>
        )}
      </div>
    )
  }

  const ayuda =
    n < MINIMO_COMPARAR
      ? n === 0
        ? `Marca de ${MINIMO_COMPARAR} a ${MAXIMO_COMPARAR} candidatos en la tabla.`
        : `Marca al menos ${MINIMO_COMPARAR - n} más.`
      : lleno
        ? `Es el máximo (${MAXIMO_COMPARAR}): quita uno para marcar otro.`
        : ''

  const quitarMarca = (id) => {
    // El foco pasa a la marca vecina (o a «Salir» si era la última) antes de que la quitada desaparezca.
    const botones = [...(raiz.current?.querySelectorAll('[data-quitar]') ?? [])]
    const i = botones.findIndex((b) => b.dataset.quitar === String(id))
    const vecino = botones[i + 1] ?? botones[i - 1] ?? botonSalir.current
    vecino?.focus()
    quitar(id)
  }
  const limpiarMarcas = () => {
    botonSalir.current?.focus()
    limpiar()
  }

  return (
    <div className="flex flex-col gap-3">
      {cabecera}
    <section
      ref={raiz}
      aria-label="Comparar candidatos"
      className="flex flex-col gap-2 rounded-xl border border-sena-azul/50 bg-sena-cielo/15 p-3 dark:border-sena-texto-suave/50 dark:bg-sena-superficie-alta/40"
    >
      <div className="flex flex-col gap-2 @min-[560px]:flex-row @min-[560px]:items-center @min-[560px]:justify-between">
        <button
          ref={botonContador}
          type="button"
          disabled={n === 0}
          aria-expanded={desplegado}
          aria-controls={desplegado ? idPanel : undefined}
          onClick={() => setDesplegado((d) => !d)}
          className="-ml-2 inline-flex min-h-11 items-center gap-1.5 self-start rounded-lg px-2 text-sm font-semibold text-sena-azul transition-colors hover:bg-sena-cielo/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena disabled:cursor-default disabled:hover:bg-transparent dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
        >
          <span className="tabular-nums">
            {n} de {MAXIMO_COMPARAR} marcados
          </span>
          {n > 0 && (
            <Icono
              nombre="chevron"
              className={`size-4 shrink-0 transition-transform duration-150 motion-reduce:transition-none ${desplegado ? 'rotate-180' : ''}`}
            />
          )}
        </button>
        <div className="grid grid-cols-1 gap-2 @min-[420px]:grid-cols-2 @min-[560px]:flex @min-[560px]:flex-wrap @min-[560px]:items-center">
          <Boton disabled={!valido} onClick={abrir}>
            Comparar ({n})
          </Boton>
          <Boton ref={botonSalir} variante="contorno" onClick={salir}>
            Salir de comparación
          </Boton>
        </div>
      </div>

      <div aria-live="polite" className="empty:hidden">
        {ayuda && <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>{ayuda}</p>}
      </div>

      {desplegado && n > 0 && (
        <div id={idPanel} className="flex flex-col items-start gap-1 border-t border-sena-azul/20 pt-2 dark:border-sena-borde/50">
          <ul aria-label="Candidatos marcados para comparar" className="flex flex-wrap gap-2">
            {[...marcas].map(([id, m]) => (
              <li key={id}>
                <button
                  type="button"
                  data-quitar={id}
                  onClick={() => quitarMarca(id)}
                  aria-label={`Quitar a ${m.aspirante} de la comparación`}
                  className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border border-sena-azul/40 bg-sena-cielo/20 px-3 text-sm font-medium text-sena-azul hover:bg-sena-cielo/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena dark:border-sena-borde dark:bg-sena-superficie-alta dark:text-sena-texto dark:hover:bg-sena-superficie"
                >
                  <span className="min-w-0 max-w-48 truncate">{m.aspirante}</span>
                  <Icono nombre="cerrar" className="size-4 shrink-0" />
                </button>
              </li>
            ))}
          </ul>
          <Boton variante="enlace" onClick={limpiarMarcas}>
            Limpiar marcas
          </Boton>
        </div>
      )}
    </section>
    </div>
  )
}
