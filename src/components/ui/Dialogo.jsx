import { useEffect, useRef, useState } from 'react'

const FOCALIZABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Diálogo modal: fondo oscuro, caja centrada y el comportamiento que un modal
// debe tener con teclado y lector de pantalla.
//  - Al abrirse, el foco entra en la caja (salvo que un hijo ya lo haya pedido
//    con autoFocus) y al cerrarse vuelve al elemento que lo tenía.
//  - Tab y Shift+Tab giran dentro de la caja; no alcanzan la página de atrás.
//  - Escape y el clic en el fondo llaman a 'onCerrar'.
// Quien lo usa pone el contenido, 'idTitulo' (y 'idDescripcion' si hay texto de
// apoyo) y el rol: 'alertdialog' para confirmaciones, 'dialog' para el resto.
export default function Dialogo({
  rol = 'dialog',
  idTitulo,
  idDescripcion,
  onCerrar,
  className = '',
  children,
}) {
  const caja = useRef(null)
  // Se anota al renderizar, antes de que un hijo con autoFocus tome el foco al
  // montarse: es a quien hay que devolvérselo.
  const [quienTeniaElFoco] = useState(() => document.activeElement)
  const focoInicial = useRef(null)

  useEffect(() => {
    // Con autoFocus en un hijo, ese es el foco inicial; si no, la propia caja.
    // Se recuerda para que React en desarrollo (que monta dos veces) no lo pierda.
    focoInicial.current ??= caja.current.contains(document.activeElement)
      ? document.activeElement
      : caja.current
    focoInicial.current.focus()
    return () => quienTeniaElFoco?.focus?.()
  }, [quienTeniaElFoco])

  useEffect(() => {
    const alPulsar = (evento) => {
      if (evento.key === 'Escape') {
        onCerrar()
        return
      }
      if (evento.key !== 'Tab') return

      const enfocables = caja.current.querySelectorAll(FOCALIZABLES)
      if (enfocables.length === 0) {
        evento.preventDefault()
        return
      }
      const primero = enfocables[0]
      const ultimo = enfocables[enfocables.length - 1]
      const dentro = caja.current.contains(document.activeElement)

      if (evento.shiftKey && (document.activeElement === primero || !dentro)) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && (document.activeElement === ultimo || !dentro)) {
        evento.preventDefault()
        primero.focus()
      }
    }
    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [onCerrar])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onCerrar()
      }}
    >
      <div
        ref={caja}
        role={rol}
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idDescripcion}
        tabIndex={-1}
        className={`max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-xl border border-sena-linea bg-white shadow-xl focus:outline-none dark:border-sena-borde dark:bg-sena-superficie ${className}`.trim()}
      >
        {children}
      </div>
    </div>
  )
}
