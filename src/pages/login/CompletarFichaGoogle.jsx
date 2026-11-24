import { useEffect, useState } from 'react'
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

// Alta pendiente con Google: la cuenta todavía no existe. Se crea al elegir la ficha, así que no hay ningún aspirante
// sin ficha. Si no hay un registro pendiente, se vuelve al inicio de sesión.
export default function CompletarFichaGoogle() {
  const { refrescar } = useAuth()
  const [datos, setDatos] = useState(null)
  const [sinPendiente, setSinPendiente] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let activo = true
    authApi
      .pendienteGoogle()
      .then((d) => {
        if (activo) setDatos(d.data)
      })
      .catch(() => {
        if (activo) setSinPendiente(true)
      })
    return () => {
      activo = false
    }
  }, [])

  if (sinPendiente) return <Navigate to="/login" replace />
  if (!datos) return <PantallaCarga operacion="sesion" />

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
      await authApi.completarPendienteGoogle(codigo)
      // La sesión ya está abierta: al recargar el usuario, CompletarFicha lo manda a la aplicación.
      await refrescar()
    } catch (err) {
      setErrores(erroresDeCampo(err))
      setErrorGlobal(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <TarjetaAuth>
      <h2 className="text-2xl font-bold text-sena-azul dark:text-sena-texto">Completa tu registro</h2>

      <p className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">
        Entraste con Google como <strong>{datos.email}</strong>. Escribe el código de la ficha de tu programa (te lo da el
        instructor) para crear tu cuenta.
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

        <Boton type="submit" tamano="flexible" ocupado={enviando}>
          {enviando ? 'Creando tu cuenta...' : 'Crear cuenta y entrar'}
        </Boton>
      </form>
    </TarjetaAuth>
  )
}
