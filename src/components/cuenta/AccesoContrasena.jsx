import { useState } from 'react'
import { createPortal } from 'react-dom'
import DialogoContrasena from '../../pages/seguridad/DialogoContrasena'

// Abre el diálogo de «Contraseña» desde el menú de usuario. 'boton' recibe la función que lo abre y pinta el control (la barra
// superior y el cajón móvil lo dibujan distinto). El diálogo va en <body>: el cajón móvil tiene transformaciones y puede estar
// oculto, y dentro de él un diálogo fijo quedaría mal colocado. 'antesDeAbrir' deja, por ejemplo, cerrar el cajón.
// 'alCerrar' sirve cuando quien lo abrió ya no está a la vista (el cajón se cerró): ahí se decide a dónde vuelve el foco.
export default function AccesoContrasena({ boton, antesDeAbrir, alCerrar }) {
  const [abierto, setAbierto] = useState(false)
  const abrir = () => {
    antesDeAbrir?.()
    setAbierto(true)
  }
  const cerrar = () => {
    alCerrar?.()
    setAbierto(false)
  }

  return (
    <>
      {boton(abrir)}
      {abierto && createPortal(<DialogoContrasena onCerrar={cerrar} />, document.body)}
    </>
  )
}
