import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import CampoClave from '../../components/ui/CampoClave'
import { MensajeError } from '../../components/ui/Mensaje'
import { CLASE_CAMPO_CODIGO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { MINUTOS_VALIDEZ, enmascararEmail } from '../../lib/otpSesion'
import { mostrarAvisoGlobal } from '../../lib/validacionAcceso'

// Pie con UNA sola acción principal (cerrar es la X del diálogo): a la derecha cuando hay espacio y a ancho completo si no. Se
// decide por el ancho del formulario, no el de la ventana.
const CLASE_PIE = 'flex flex-col @min-[22rem]:flex-row @min-[22rem]:justify-end'
const CLASE_BOTON_PIE = 'w-full @min-[22rem]:w-auto'

// Pasos de «establecer o cambiar contraseña» dentro de la sesión. Siempre pasa por el código que se envía al correo de la sesión.
export default function FormularioContrasena({ ctx, titulo }) {
  const { paso, user, codigo, password, confirmacion, errores, errorGlobal, enviando, reenviando, segundos, bloqueado, refCodigo } = ctx
  const { setCodigo, setPassword, setConfirmacion, pedirCodigo, guardar } = ctx
  const aviso = errorGlobal && mostrarAvisoGlobal(errores, paso === 'codigo' ? ['code', 'password', 'confirmacion'] : []) && (
    <MensajeError>{errorGlobal}</MensajeError>
  )

  if (paso === 'pedir') {
    return (
      <div className="@container flex flex-col gap-4" aria-label={titulo} role="group">
        <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
          Para proteger tu cuenta, te enviamos un código a <strong>{enmascararEmail(user.email)}</strong>. Tener la sesión abierta no
          basta: hace falta ese código.
        </p>
        {aviso}
        <div className={CLASE_PIE}>
          <Boton ocupado={enviando} disabled={bloqueado} onClick={() => pedirCodigo()} className={CLASE_BOTON_PIE}>
            {enviando ? 'Enviando…' : bloqueado ? `Enviar código (${segundos} s)` : 'Enviar código'}
          </Boton>
        </div>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={guardar} aria-label={titulo} className="@container flex flex-col gap-4">
      <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
        Escribe el código de 6 dígitos que enviamos a <strong>{enmascararEmail(user.email)}</strong>. Vence en {MINUTOS_VALIDEZ} minutos y
        solo sirve una vez.
      </p>
      {aviso}

      <div className="flex flex-col">
        <Campo etiqueta="Código de verificación" error={errores.code}>
          {({ id, describedby, invalid }) => (
            <input
              id={id}
              ref={refCodigo}
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
        {/* Ayuda del código: acción secundaria y discreta bajo el campo. El área sigue siendo de 44 px; el margen negativo solo
            acorta el hueco visual hasta el siguiente campo. */}
        <Boton
          variante="enlace"
          onClick={() => pedirCodigo({ reenvio: true })}
          ocupado={reenviando}
          disabled={bloqueado || enviando}
          className="-mb-2 self-start px-0! text-sm"
        >
          {reenviando ? 'Enviando…' : bloqueado ? `Reenviar código (${segundos} s)` : 'Reenviar código'}
        </Boton>
      </div>

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

      <div className={CLASE_PIE}>
        <Boton type="submit" ocupado={enviando} disabled={reenviando} className={CLASE_BOTON_PIE}>
          {enviando ? 'Guardando…' : 'Guardar contraseña'}
        </Boton>
      </div>
    </form>
  )
}
