import { useRecuperarContrasena } from './useRecuperarContrasena'
import { Link } from 'react-router-dom'
import { enmascararEmail, MINUTOS_VALIDEZ } from '../../lib/otpSesion'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import CampoClave from '../../components/ui/CampoClave'
import Icono from '../../components/ui/Icono'
import { MensajeError } from '../../components/ui/Mensaje'
import { CLASE_CAMPO, CLASE_CAMPO_CODIGO } from '../../lib/estilos'
import { mostrarAvisoGlobal } from '../../lib/validacionAcceso'

// El backend valida esto en Password::min(8)->letters()->numbers().

export default function RecuperarContrasena() {
  const ctx = useRecuperarContrasena()
  const { bloqueado, codigo, confirmacion, email, enviando, errorGlobal, errores, paso, password, pedirCodigo, reenviando, reenviar, restablecer, segundos, setCodigo, setConfirmacion, setEmail, setPassword, volverAlPaso1 } = ctx
  return (
    <>
      {/* Flecha para volver un paso: del primer paso al inicio de sesión; del segundo, a pedir el código. */}
      <div className="-mt-2 mb-3">
        {paso === 1 ? (
          <Boton as={Link} to="/login" variante="enlace" tamano="flexible" className="-ml-2 !justify-start">
            <Icono nombre="flechaIzquierda" className="size-5 shrink-0" />
            Volver
          </Boton>
        ) : (
          <Boton variante="enlace" tamano="flexible" className="-ml-2 !justify-start" onClick={volverAlPaso1}>
            <Icono nombre="flechaIzquierda" className="size-5 shrink-0" />
            Volver
          </Boton>
        )}
      </div>
      <h2 className="text-2xl font-bold text-sena-azul dark:text-sena-texto">
        Restablecer contraseña
      </h2>

      {errorGlobal && mostrarAvisoGlobal(
          errores,
          paso === 1 ? ['email'] : ['code', 'password', 'confirmacion'],
        ) && <MensajeError className="mt-4">{errorGlobal}</MensajeError>}

      {paso === 1 ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            pedirCodigo(email, e.currentTarget)
          }}
          className="mt-4 flex flex-col gap-4"
        >
          <p className="text-sm text-slate-600 dark:text-sena-texto-suave">
            Escribe tu correo y te enviamos un código de 6 dígitos.
          </p>

          <Campo etiqueta="Correo" error={errores.email}>
            {({ id, describedby, invalid }) => (
              <input
                id={id}
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              required
            aria-describedby={describedby}
                aria-invalid={invalid || undefined}
                className={CLASE_CAMPO}
              />
            )}
          </Campo>

          <Boton type="submit" tamano="flexible" ocupado={enviando} disabled={bloqueado}>
            {enviando
              ? 'Enviando...'
              : bloqueado
                ? `Espera ${segundos} s`
                : 'Enviar código'}
          </Boton>

          <Boton as={Link} to="/login" variante="enlace" tamano="flexible">
            Volver a iniciar sesión
          </Boton>
        </form>
      ) : (
        <>
          <p className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">
            Enviamos un código a <strong>{enmascararEmail(email)}</strong>. Válido
            durante {MINUTOS_VALIDEZ} minutos.
          </p>

          <form noValidate onSubmit={restablecer} className="mt-4 flex flex-col gap-4">
            <Campo etiqueta="Código" error={errores.code}>
              {({ id, describedby, invalid }) => (
                <input
                  id={id}
                  type="text"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            aria-describedby={describedby}
                  aria-invalid={invalid || undefined}
                  className={CLASE_CAMPO_CODIGO}
                />
              )}
            </Campo>

            <CampoClave
              etiqueta="Nueva contraseña"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              ayuda="Mínimo 8 caracteres, con letras y números."
              error={errores.password}
        required
            />

            <CampoClave
              etiqueta="Repetir contraseña"
              name="confirmacion"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              autoComplete="new-password"
              error={errores.confirmacion}
        required
            />

            <Boton type="submit" tamano="flexible" ocupado={enviando} disabled={bloqueado}>
              {enviando ? 'Guardando...' : 'Restablecer contraseña'}
            </Boton>
          </form>

          <div className="mt-4 flex flex-col items-stretch gap-1">
            <Boton
              variante="enlace"
              tamano="flexible"
              onClick={reenviar}
              ocupado={reenviando} disabled={bloqueado}
            >
              {reenviando
                ? 'Enviando...'
                : bloqueado
                  ? `Reenviar código (${segundos} s)`
                  : 'Reenviar código'}
            </Boton>

            <Boton variante="enlace" tamano="flexible" onClick={volverAlPaso1}>
              Cambiar correo
            </Boton>
          </div>
        </>
      )}
    </>
  )
}
