import { useEffect, useState } from 'react'
import Icono from '../ui/Icono'

// Botón flotante «Volver arriba» de las páginas informativas. Aparece al desplazarse aproximadamente una pantalla y se desplaza SOLO la
// página (la ventana): no hay contenedores con desplazamiento propio. Vive dentro de la superficie de lectura, sticky al borde inferior de
// la pantalla, así que al llegar al final del documento se detiene sobre él y nunca tapa el pie. Al activarlo sube con desplazamiento suave
// (instantáneo si el usuario prefiere menos movimiento) y lleva el foco al título principal sin otro salto.
// Entra con un pequeño rebote y la flecha sube a su lugar un instante después; al desaparecer se hunde y se desvanece (index.css:
// boton-subir, flecha-subir y boton-baja; sin movimiento si el usuario lo prefiere, y entonces se retira de inmediato).
const reducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function BotonVolverArriba() {
  const [visible, setVisible] = useState(false)
  // 'saliendo': ya no debe verse, pero sigue montado mientras corre su animación de salida.
  const [saliendo, setSaliendo] = useState(false)

  useEffect(() => {
    let visibleAhora = false
    const medir = () => {
      const mostrar = window.scrollY > window.innerHeight * 0.9
      if (mostrar === visibleAhora) return
      visibleAhora = mostrar
      setVisible(mostrar)
      setSaliendo(!mostrar && !reducido())
    }
    window.addEventListener('scroll', medir, { passive: true })
    window.addEventListener('resize', medir)
    return () => {
      window.removeEventListener('scroll', medir)
      window.removeEventListener('resize', medir)
    }
  }, [])

  // Respaldo: si el navegador no emite el fin de la animación (pestaña en segundo plano), se retira igual.
  useEffect(() => {
    if (!saliendo) return undefined
    const temporizador = setTimeout(() => setSaliendo(false), 400)
    return () => clearTimeout(temporizador)
  }, [saliendo])

  const subir = () => {
    window.scrollTo({ top: 0, behavior: reducido() ? 'auto' : 'smooth' })
    // El foco va al título sin provocar un segundo salto: el desplazamiento ya lo hace la acción de arriba.
    const titulo = document.querySelector('main h1')
    if (titulo) {
      if (!titulo.hasAttribute('tabindex')) titulo.setAttribute('tabindex', '-1')
      titulo.focus({ preventScroll: true })
    }
  }

  if (!visible && !saliendo) return null
  return (
    <div className="pointer-events-none sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 h-0 overflow-visible">
      <button
        type="button"
        onClick={subir}
        onAnimationEnd={(e) => {
          if (!visible && e.target === e.currentTarget) setSaliendo(false)
        }}
        aria-label="Volver arriba"
        aria-hidden={visible ? undefined : true}
        tabIndex={visible ? undefined : -1}
        className={`${visible ? 'boton-subir pointer-events-auto' : 'boton-baja pointer-events-none'} group absolute bottom-0 right-0 -mr-3 grid size-11 place-items-center rounded-full border border-sena-linea bg-white text-sena-azul shadow-md transition-[background-color,box-shadow,scale] duration-150 hover:bg-sena-hundido hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/60 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 sm:-mr-5 dark:border-sena-borde dark:bg-sena-superficie dark:text-white dark:hover:bg-sena-superficie-alta`}
      >
        {/* La flecha de la biblioteca, girada: la que apunta a la izquierda, un cuarto de vuelta, apunta arriba. Al pasar el puntero se asoma. */}
        <span className="flecha-subir grid place-items-center transition-transform duration-150 group-hover:-translate-y-0.5 motion-reduce:transition-none">
          <Icono nombre="flechaIzquierda" className="size-5 rotate-90" />
        </span>
      </button>
    </div>
  )
}
