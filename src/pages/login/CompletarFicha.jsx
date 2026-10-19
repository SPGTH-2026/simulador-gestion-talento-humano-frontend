import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import * as authApi from '../../api/auth'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import TarjetaAuth from '../../components/ui/TarjetaAuth'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import { MensajeError } from '../../components/ui/Mensaje'
import { CLASE_INPUT_FICHA } from '../../lib/estilos'

// Para un Aspirante sin ficha: deja su código y se valida que exista. Asociar la
// ficha NO lo convierte en aprendiz; el instructor le asigna el rol desde Usuarios.
export default function CompletarFicha() {
  const { user, authResolved, refrescar, logout } = useAuth()

  const [codigo, setCodigo] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (!authResolved) {
    return <p className="p-6 text-center">Cargando...</p>
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
    setErrores({})
    setErrorGlobal('')
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
      <h2 className="text-xl font-semibold text-sena-azul dark:text-sena-texto">
        Asocia tu ficha
      </h2>

      <p className="mt-2 text-sm text-sena-azul/80 dark:text-sena-texto-suave">
        Escribe el código de la ficha de tu programa (te lo da el instructor).
        El sistema verifica que exista para dejarte entrar como aspirante.
      </p>

      {errorGlobal && <MensajeError className="mt-4">{errorGlobal}</MensajeError>}

      <form onSubmit={guardar} className="mt-4 flex flex-col gap-4">
        <Campo etiqueta="Código de ficha" error={errores.ficha_codigo}>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.slice(0, 50))}
            placeholder="Ej. 3173334"
            required
            autoComplete="off"
            className={CLASE_INPUT_FICHA}
          />
        </Campo>

        <Boton type="submit" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Guardar y entrar'}
        </Boton>
      </form>

      <div className="mt-4 flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          onClick={logout}
          className="text-sena-azul/70 hover:text-sena hover:underline dark:text-sena-texto-suave dark:hover:text-sena"
        >
          Cerrar sesión
        </button>
      </div>
    </TarjetaAuth>
  )
}