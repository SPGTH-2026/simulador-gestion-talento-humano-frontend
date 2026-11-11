import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { erroresDeCampo, mensajeError, traducirMensaje } from '../../api/mensajeError'
import GoogleIcon from '../../components/ui/GoogleIcon'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import CampoClave from '../../components/ui/CampoClave'
import { MensajeError } from '../../components/ui/Mensaje'
import { CLASE_CAMPO } from '../../lib/estilos'
import {
  enfocarPrimerError,
  mostrarAvisoGlobal,
  soloConError,
  validarClaveNueva,
  validarCorreo,
  validarFicha,
  validarNombre,
} from '../../lib/validacionAcceso'

const GOOGLE_URL =
  import.meta.env.VITE_GOOGLE_URL ?? '/api/auth/google/redirect'

export default function Registro() {
  const { register } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    ficha_codigo: '',
  })

  const [error, setError] = useState('')
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm((actual) => ({
      ...actual,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const formulario = e.currentTarget
    const encontrados = soloConError({
      name: validarNombre(form.name),
      email: validarCorreo(form.email),
      password: validarClaveNueva(form.password),
      ficha_codigo: validarFicha(form.ficha_codigo),
    })
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) {
      enfocarPrimerError(formulario, encontrados, ['name', 'email', 'password', 'ficha_codigo'])
      return
    }

    setEnviando(true)

    try {
      // El registro abre sesión. AuthLayout detecta al usuario con
      // correo sin verificar y lo dirige a /verificar-correo.
      await register(form)
    } catch (err) {
      // El backend responde en inglés: se traduce igual que el aviso global.
      setErrores(
        Object.fromEntries(
          Object.entries(erroresDeCampo(err)).map(([campo, mensaje]) => [
            campo,
            traducirMensaje(mensaje),
          ]),
        ),
      )
      setError(mensajeError(err))
    } finally {
      setEnviando(false)
    }
  }

  const registrarseConGoogle = () => {
    // Navegación completa: Laravel redirige a Google y procesa el callback.
    window.location.href = GOOGLE_URL
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-sena-azul dark:text-sena-texto">
        Crear cuenta de aspirante
      </h2>

      {error && mostrarAvisoGlobal(errores, ['name', 'email', 'password', 'ficha_codigo']) && (
        <MensajeError>{error}</MensajeError>
      )}

      <Boton
        variante="contorno"
        tamano="flexible"
        type="button"
        onClick={registrarseConGoogle}
        className="w-full"
      >
        <GoogleIcon />
        Registrarse con Google
      </Boton>

      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-sena-texto-suave">
        <span className="h-px flex-1 bg-sena-separador" />
        o con correo y contraseña
        <span className="h-px flex-1 bg-sena-separador" />
      </div>

      <Campo etiqueta="Nombre completo" error={errores.name}>
        {({ id, describedby, invalid }) => (
          <input
            id={id}
            name="name"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
            required
            aria-describedby={describedby}
            aria-invalid={invalid || undefined}
            className={CLASE_CAMPO}
          />
        )}
      </Campo>

      <Campo etiqueta="Correo" error={errores.email}>
        {({ id, describedby, invalid }) => (
          <input
            id={id}
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
            aria-describedby={describedby}
            aria-invalid={invalid || undefined}
            className={CLASE_CAMPO}
          />
        )}
      </Campo>

      <CampoClave
        etiqueta="Contraseña"
        name="password"
        value={form.password}
        onChange={handleChange}
        autoComplete="new-password"
        ayuda="Mínimo 8 caracteres, con letras y números."
        error={errores.password}
        required
      />

      <Campo
        etiqueta="Código de ficha"
        error={errores.ficha_codigo}
        ayuda="Es el código de tu programa de formación; te lo da el instructor."
      >
        {({ id, describedby, invalid }) => (
          <input
            id={id}
            name="ficha_codigo"
            value={form.ficha_codigo}
            onChange={handleChange}
            maxLength={50}
            placeholder="Ej. 3173334"
            autoComplete="off"
            required
            aria-describedby={describedby}
            aria-invalid={invalid || undefined}
            className={CLASE_CAMPO}
          />
        )}
      </Campo>

      <Boton type="submit" tamano="flexible" disabled={enviando} className="w-full">
        {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
      </Boton>

      <p className="flex flex-wrap items-center justify-center gap-x-1.5 text-center text-sm text-slate-600 dark:text-sena-texto-suave">
        ¿Ya tienes cuenta?
        <Link
          to="/login"
          className="inline-flex min-h-11 items-center font-semibold text-sena-oscuro underline-offset-4 hover:underline dark:text-sena-acento"
        >
          Iniciar sesión
        </Link>
      </p>
    </form>
  )
}
