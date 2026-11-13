import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import * as authApi from '../../api/auth'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import PantallaCarga from '../../components/ui/PantallaCarga'
import TarjetaAuth from '../../components/ui/TarjetaAuth'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import { MensajeError } from '../../components/ui/Mensaje'
import { CLASE_CAMPO_FICHA } from '../../lib/estilos'
import { mostrarAvisoGlobal, validarFicha } from '../../lib/validacionAcceso'

// Para un Aspirante sin ficha: deja su código y se valida que exista. Asociar la
// ficha NO lo convierte en aprendiz; el instructor le asigna el rol desde Usuarios.
export default function CompletarFicha() {
  const { user, authResolved, refrescar, logout } = useAuth()

  const [codigo, setCodigo] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!authResolved) {
    return <PantallaCarga operacion="sesion" />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Ya tiene ficha o no es aspirante (instructor, super admin): fuera de aquí.
  if (user.role !== 'aspirante' || user.ficha) {
    return <Navigate to="/" replace />
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErrorGlobal('')

    const falta = validarFicha(codigo)
    if (falta) {
      setErrores({ ficha_codigo: falta })
      e.currentTarget.elements.namedItem('ficha_codigo')?.focus()
      return
    }

    setErrores({})
    setEnviando(true)

    try {
      await authApi.guardarFicha(codigo)
      // Recargamos el usuario para que el contexto tenga ficha y el guard deje
      // pasar; si no, ProtectedRoute nos devolvería a esta pantalla.
      await refrescar()
      setCodigo('')
    } catch (err) {
      setErrores(erroresDeCampo(err))
      setErrorGlobal(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <TarjetaAuth>
      <h2 className="text-2xl font-bold text-sena-azul dark:text-sena-texto">
        Asocia tu ficha
      </h2>

      <p className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">
        Escribe el código de la ficha de tu programa (te lo da el instructor).
        El sistema verifica que exista para dejarte entrar como aspirante.
      </p>

      {errorGlobal && mostrarAvisoGlobal(errores, ['ficha_codigo']) && <MensajeError className="mt-4">{errorGlobal}</MensajeError>}

      <form onSubmit={guardar} noValidate className="mt-4 flex flex-col gap-4">
        <Campo etiqueta="Código de ficha" error={errores.ficha_codigo}>
          {({ id, describedby, invalid }) => (
            <input
              id={id}
              type="text"
              name="ficha_codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.slice(0, 50))}
              placeholder="Ej. 3173334"
              autoComplete="off"
              required
            aria-describedby={describedby}
              aria-invalid={invalid || undefined}
              className={CLASE_CAMPO_FICHA}
            />
          )}
        </Campo>

        <Boton type="submit" tamano="flexible" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Guardar y entrar'}
        </Boton>
      </form>

      <div className="mt-4 flex flex-col items-stretch gap-1">
        <Boton variante="enlace" tamano="flexible" onClick={logout}>
          Cerrar sesión
        </Boton>
      </div>
    </TarjetaAuth>
  )
}
