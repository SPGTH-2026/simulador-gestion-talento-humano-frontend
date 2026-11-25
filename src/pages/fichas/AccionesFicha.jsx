import { useState } from 'react'
import Boton from '../../components/ui/Boton'
import BotonIconoFicha from './BotonIconoFicha'

// Acciones de una ficha según los permisos de quien mira (el backend los vuelve a exigir): Instructores (gestionar si es super
// admin, consultar si no) y Editar, como iconos de 44 px con ayuda visible, y Eliminar con texto y en peligro. Los nombres accesibles
// nombran la ficha porque en una tabla hay muchos botones iguales. Solo una ayuda a la vez: la del último control tocado o enfocado.
export default function AccionesFicha({ ficha, esSuperAdmin, eliminando, ocupado, onEditar, onEliminar, onInstructores }) {
  const [ayuda, setAyuda] = useState(null)
  const puedeVerInstructores = esSuperAdmin || ficha.instructores.length > 0
  const control = (id) => ({
    visible: ayuda === id,
    onMostrar: () => setAyuda(id),
    onOcultar: () => setAyuda((actual) => (actual === id ? null : actual)),
  })
  return (
    <div className="flex items-center justify-center gap-2">
      {puedeVerInstructores && (
        <BotonIconoFicha
          icono="usuarios"
          ayuda={esSuperAdmin ? 'Instructores' : 'Ver instructores'}
          etiqueta={esSuperAdmin ? `Instructores de la ficha ${ficha.codigo}` : `Ver instructores de la ficha ${ficha.codigo}`}
          onClick={onInstructores}
          disabled={eliminando}
          {...control('instructores')}
        />
      )}
      {ficha.puede_gestionar && (
        <>
          <BotonIconoFicha icono="lapiz" ayuda="Editar" etiqueta={`Editar la ficha ${ficha.codigo}`} onClick={onEditar} disabled={ocupado} {...control('editar')} />
          <Boton
            variante="peligro"
            onClick={onEliminar}
            ocupado={eliminando}
            disabled={ocupado && !eliminando}
            aria-label={eliminando ? `Eliminando la ficha ${ficha.codigo}` : `Eliminar la ficha ${ficha.codigo}`}
          >
            {eliminando ? 'Eliminando…' : 'Eliminar'}
          </Boton>
        </>
      )}
    </div>
  )
}
