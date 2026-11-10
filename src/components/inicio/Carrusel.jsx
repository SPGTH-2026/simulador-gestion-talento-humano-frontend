import { useCallback, useEffect, useRef, useState } from 'react'
import { CLASE_TARJETA } from '../../lib/estilos'
import Icono from '../ui/Icono'
import edificio640 from '../../assets/inicio/inicio-edificio-640.webp'
import edificio1280 from '../../assets/inicio/inicio-edificio-1280.webp'
import personal640 from '../../assets/inicio/inicio-personal-640.webp'
import personal1280 from '../../assets/inicio/inicio-personal-1280.webp'
import personas640 from '../../assets/inicio/inicio-personas-640.webp'
import personas1280 from '../../assets/inicio/inicio-personas-1280.webp'

// Fotografías institucionales. Los textos alternativos describen solo lo que se
// ve: no se atribuyen nombres, eventos ni lugares. Cada una es un recorte 5:2
// de la foto original (los originales no se tocan); 'posicion' decide qué parte
// se conserva cuando el contenedor es más ancho o más alto que ese recorte, para
// no cortar rostros ni el letrero.
const FOTOS = [
  {
    id: 'edificio',
    alt: 'Fachada de un edificio con el letrero «Servicio Nacional de Aprendizaje» y el logosímbolo del SENA.',
    pequena: edificio640,
    grande: edificio1280,
    posicion: 'object-center',
  },
  {
    id: 'personas',
    alt: 'Personas con uniforme blanco sentadas en fila, con la mirada al frente.',
    pequena: personas640,
    grande: personas1280,
    posicion: 'object-center',
  },
  {
    id: 'personal',
    alt: 'Personas con bata blanca y gorro desechable junto a un escáner y un monitor, en un espacio de trabajo.',
    pequena: personal640,
    grande: personal1280,
    posicion: 'object-right-top',
  },
]

// Tiempo que se ve cada foto antes de pasar a la siguiente.
const INTERVALO_MS = 6000

const movimientoReducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Carrusel compacto de avance automático. Para que no moleste ni excluya a
// nadie (WCAG 2.2.2) se detiene solo cuando:
//  - la persona pulsa el botón de pausa (queda pausado hasta que lo reanude);
//  - el puntero (ratón) está encima;
//  - la pestaña no está visible o el carrusel está fuera de pantalla;
//  - el sistema pide movimiento reducido: entonces empieza en pausa.
// El botón de pausa es el único control enfocable; con el foco en él, las flechas
// del teclado cambian de foto. También se puede deslizar con el dedo (scroll
// snap). Las fotos fuera de vista son inertes: no las lee un
// lector de pantalla ni reciben el foco. El contenedor tiene proporción fija,
// así que cargar una imagen no mueve nada de la página.
export default function Carrusel() {
  const seccion = useRef(null)
  const pista = useRef(null)
  const [actual, setActual] = useState(0)
  const [pausadoPorUsuario, setPausadoPorUsuario] = useState(movimientoReducido)
  const [encima, setEncima] = useState(false)
  const [pestanaVisible, setPestanaVisible] = useState(() => !document.hidden)
  const [enPantalla, setEnPantalla] = useState(true)

  const reproduciendo = !pausadoPorUsuario && !encima && pestanaVisible && enPantalla

  // Qué foto está a la vista cuando la persona desliza con el dedo.
  useEffect(() => {
    const raiz = pista.current
    if (!raiz) return undefined

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) setActual(Number(entrada.target.dataset.indice))
        })
      },
      { root: raiz, threshold: 0.6 },
    )
    raiz.querySelectorAll('[data-indice]').forEach((diapositiva) => observador.observe(diapositiva))
    return () => observador.disconnect()
  }, [])

  // Fuera de pantalla no hay razón para seguir avanzando.
  useEffect(() => {
    const raiz = seccion.current
    if (!raiz) return undefined
    const observador = new IntersectionObserver(([entrada]) => setEnPantalla(entrada.isIntersecting), {
      threshold: 0.25,
    })
    observador.observe(raiz)
    return () => observador.disconnect()
  }, [])

  useEffect(() => {
    const alCambiar = () => setPestanaVisible(!document.hidden)
    document.addEventListener('visibilitychange', alCambiar)
    return () => document.removeEventListener('visibilitychange', alCambiar)
  }, [])

  // 'instantaneo' sirve para volver de la última foto a la primera sin rebobinar
  // todo el recorrido a la vista.
  const irA = useCallback((indice, instantaneo = false) => {
    const destino = ((indice % FOTOS.length) + FOTOS.length) % FOTOS.length
    const sinAnimar = instantaneo || movimientoReducido()
    pista.current?.scrollTo({
      left: destino * pista.current.clientWidth,
      behavior: sinAnimar ? 'auto' : 'smooth',
    })
    setActual(destino)
  }, [])

  // Un temporizador por foto: al cambiar de foto (sola, con el dedo o con el
  // teclado) o al reanudar, la cuenta empieza de nuevo.
  useEffect(() => {
    if (!reproduciendo) return undefined
    const temporizador = setTimeout(
      () => irA(actual + 1, actual === FOTOS.length - 1),
      INTERVALO_MS,
    )
    return () => clearTimeout(temporizador)
  }, [reproduciendo, actual, irA])

  const alTeclear = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      irA(actual - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      irA(actual + 1)
    }
  }

  return (
    <section
      ref={seccion}
      aria-roledescription="carrusel"
      aria-label="Fotografías institucionales"
      // En pantallas táctiles el 'pointerenter' del dedo no debe dejarlo
      // detenido: solo el ratón cuenta como "estar encima".
      onPointerEnter={(e) => e.pointerType === 'mouse' && setEncima(true)}
      onPointerLeave={() => setEncima(false)}
      onKeyDown={alTeclear}
      className={`${CLASE_TARJETA} relative overflow-hidden`}
    >
      {/* tabIndex -1: la pista no entra al orden de Tab. En pausa, el cambio de
          foto se anuncia; reproduciéndose solo no, para no interrumpir. */}
      <ul
        ref={pista}
        tabIndex={-1}
        aria-live={reproduciendo ? 'off' : 'polite'}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {FOTOS.map((foto, i) => (
          <li
            key={foto.id}
            data-indice={i}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} de ${FOTOS.length}`}
            inert={i !== actual}
            className="aspect-[2/1] w-full min-w-full max-w-full shrink-0 basis-full snap-center bg-sena-hundido sm:aspect-[5/2] lg:aspect-[3/1] dark:bg-sena-superficie-alta"
          >
            <img
              src={foto.grande}
              srcSet={`${foto.pequena} 640w, ${foto.grande} 1280w`}
              sizes="(min-width: 1024px) 60vw, 100vw"
              width="1280"
              height="512"
              alt={foto.alt}
              // La primera foto es lo que se ve al entrar; las demás esperan.
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              decoding="async"
              className={`size-full object-cover ${foto.posicion}`}
            />
          </li>
        ))}
      </ul>

      {/* Difuminado del borde inferior: solo da contraste a los controles que
          van encima. Sin texto sobre las fotos. No intercepta el deslizamiento
          (pointer-events-none); solo el botón recibe el puntero. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-linear-to-t from-sena-noche/70 to-transparent px-3 pb-1 pt-10">
        <div aria-hidden="true" className="mb-3 flex items-center gap-1.5">
          {FOTOS.map((foto, i) => (
            <span
              key={foto.id}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${
                i === actual ? 'w-5 bg-white' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPausadoPorUsuario((p) => !p)}
          aria-label={pausadoPorUsuario ? 'Reanudar carrusel' : 'Pausar carrusel'}
          className="pointer-events-auto grid size-11 place-items-center rounded-full text-white focus-visible:outline-white"
        >
          <span className="grid size-8 place-items-center rounded-full bg-sena-noche/60 ring-1 ring-white/30">
            <Icono nombre={pausadoPorUsuario ? 'reproducir' : 'pausa'} className="size-4" />
          </span>
        </button>
      </div>
    </section>
  )
}
