import { useEffect, useId, useRef, useState } from 'react'
import { guardarDecision } from '../../api/seleccion'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import Boton from '../ui/Boton'
import Campo from '../ui/Campo'
import Dialogo from '../ui/Dialogo'
import { MensajeAviso, MensajeError } from '../ui/Mensaje'
import { CLASE_CAJA_SUAVE, CLASE_CAMPO, CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { CODIGOS_CONFLICTO_DECISION, RESULTADO_DECISION, formatoFechaHora, traducirError } from '../../lib/seleccion'

const CLASE_CHECK = 'size-5 shrink-0 cursor-pointer accent-sena-oscuro disabled:cursor-not-allowed'

// Registrar o rectificar la decisión sobre UN finalista. El padre lo mantiene montado mientras refresca los datos tras
// un 409: la justificación escrita y la elección no se pierden, y 'acciones' (que el padre recalcula con los datos
// nuevos) dice qué sigue siendo posible. Mientras se envía no se puede cerrar ni repetir el envío.
export default function DialogoDecision({ convocatoriaId, fila, acciones, cupos, lista, onGuardada, onConflicto, onCerrar }) {
  const idTitulo = useId()
  const [resultado, setResultado] = useState(acciones.liberacion ? 'no_seleccionado' : '')
  const [justificacion, setJustificacion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [revisada, setRevisada] = useState(true)
  const [errorJustificacion, setErrorJustificacion] = useState('')
  const [errorGeneral, setErrorGeneral] = useState('')
  const montado = useRef(true)
  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  const elegida = acciones.resultados.find((r) => r.id === resultado)
  // Tras refrescar por un 409 la opción elegida puede haber dejado de estar disponible: se desmarca para que nada
  // quede elegido a ciegas (la justificación escrita se conserva).
  if (resultado !== '' && acciones.puede && (elegida == null || elegida.bloqueado)) setResultado('')
  const permitido = acciones.puede && elegida != null && !elegida.bloqueado
  const texto = justificacion.trim()
  const largoValido = texto.length >= 10 && texto.length <= 500
  const puedeEnviar = permitido && largoValido && revisada && !enviando

  const enviar = async (e) => {
    e.preventDefault()
    if (!puedeEnviar) return
    setEnviando(true)
    setErrorJustificacion('')
    setErrorGeneral('')
    try {
      // La versión de la lista solo viaja cuando el servidor la exige; al liberar un cupo usa la vigente.
      const cuerpo = { resultado, justificacion: texto, ...(!acciones.liberacion && { lista_version: lista?.version }) }
      const res = await guardarDecision(convocatoriaId, fila.postulacion_id, cuerpo)
      if (montado.current) onGuardada(res.data)
    } catch (err) {
      if (!montado.current) return
      const codigo = err.response?.status === 409 ? err.response.data?.codigo : null
      if (CODIGOS_CONFLICTO_DECISION.includes(codigo)) {
        setAviso(err.response.data?.message ?? 'Los datos cambiaron.')
        setRevisada(false)
        setEnviando(false)
        await onConflicto()
        return
      }
      const porCampo = erroresDeCampo(err)
      if (porCampo.justificacion) setErrorJustificacion(traducirError(porCampo.justificacion))
      const otro = Object.entries(porCampo).find(([campo]) => campo !== 'justificacion')
      setErrorGeneral(otro ? traducirError(otro[1]) : Object.keys(porCampo).length === 0 ? mensajeError(err) : '')
    } finally {
      if (montado.current) setEnviando(false)
    }
  }

  const decision = fila.decision
  return (
    <Dialogo idTitulo={idTitulo} onCerrar={enviando ? () => {} : onCerrar} className="max-w-xl">
      <form onSubmit={enviar} noValidate aria-busy={enviando} className="flex flex-col gap-4 p-5 sm:p-6">
        <div>
          <h2 id={idTitulo} className={`text-lg font-bold ${CLASE_TEXTO_FUERTE}`}>
            {acciones.liberacion ? 'Liberar el cupo' : (acciones.etiqueta ?? 'Decisión')}
          </h2>
          <p className={`mt-1 text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_SUAVE}`}>
            <span className={`font-semibold ${CLASE_TEXTO_FUERTE}`}>{fila.aspirante}</span>
            {fila.posicion != null && (
              <>
                {' '}
                · posición <span className="tabular-nums">{fila.posicion}</span>
              </>
            )}
          </p>
        </div>

        {decision && (
          <div className={`${CLASE_CAJA_SUAVE} flex flex-col gap-0.5 px-3 py-2 text-sm`}>
            <p className={CLASE_TEXTO_FUERTE}>
              Decisión actual: <span className="font-semibold">{RESULTADO_DECISION[decision.resultado]}</span>
            </p>
            <p className={`${CLASE_TEXTO_SUAVE} ${CLASE_TEXTO_PARTIDO}`}>
              {decision.decidida_por ?? 'Un usuario'} · {formatoFechaHora(decision.decidida_en)}
            </p>
          </div>
        )}

        {aviso && (
          <MensajeAviso>{aviso} Los datos ya se actualizaron: revisa la fila y los cupos antes de confirmar.</MensajeAviso>
        )}

        {!acciones.puede ? (
          <>
            <MensajeAviso>{acciones.razon || 'Esta decisión ya no se puede registrar con los datos actuales.'}</MensajeAviso>
            {/* Lo escrito no se pierde: se deja a la vista (y se puede copiar) aunque ya no haya con qué guardarlo. */}
            {texto !== '' && (
              <div className={`${CLASE_CAJA_SUAVE} flex flex-col gap-1 px-3 py-2`}>
                <p className={`text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Tu justificación (no se guardó)</p>
                <p className={`text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{texto}</p>
              </div>
            )}
          </>
        ) : (
          <>
            <fieldset className="flex flex-col gap-1" disabled={enviando}>
              <legend className="mb-1 text-sm font-medium text-sena-azul dark:text-sena-texto">
                {acciones.liberacion ? 'Nuevo resultado' : 'Resultado'}
              </legend>
              {acciones.resultados.map((r) => (
                <label
                  key={r.id}
                  className={`flex min-h-11 items-start gap-3 text-sm ${r.bloqueado ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${CLASE_TEXTO_FUERTE}`}
                >
                  <input
                    type="radio"
                    name="resultado-decision"
                    value={r.id}
                    checked={resultado === r.id}
                    disabled={r.bloqueado}
                    onChange={() => setResultado(r.id)}
                    className={`${CLASE_CHECK} mt-0.5`}
                  />
                  <span className="flex flex-col">
                    {RESULTADO_DECISION[r.id]}
                    {r.bloqueado && <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>{r.razon}</span>}
                  </span>
                </label>
              ))}
            </fieldset>

            <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
              Cupos: <span className="tabular-nums">{cupos.cupos_ocupados}</span>{' '}
              {cupos.cupos_ocupados === 1 ? 'ocupado' : 'ocupados'} de{' '}
              <span className="tabular-nums">{cupos.vacantes_totales}</span>
              {resultado === 'seleccionado' && fila.estado !== 'seleccionado' && (
                <>
                  {' '}
                  · al guardar quedarán <span className="tabular-nums">{Math.max(0, cupos.cupos_disponibles - 1)}</span>{' '}
                  disponibles
                </>
              )}
              {acciones.liberacion && (
                <>
                  {' '}
                  · al guardar quedarán <span className="tabular-nums">{cupos.cupos_disponibles + 1}</span> disponibles
                </>
              )}
              .
            </p>

            <Campo
              etiqueta="Justificación"
              requerido
              error={errorJustificacion || (texto !== '' && !largoValido ? 'Debe tener entre 10 y 500 caracteres.' : '')}
              ayuda="De 10 a 500 caracteres. Queda en el historial de la decisión."
            >
              {({ id, describedby, invalid }) => (
                <>
                  <textarea
                    id={id}
                    rows={3}
                    maxLength={500}
                    value={justificacion}
                    onChange={(e) => {
                      setJustificacion(e.target.value)
                      setErrorJustificacion('')
                    }}
                    disabled={enviando}
                    aria-describedby={describedby}
                    aria-invalid={invalid || undefined}
                    className={`${CLASE_CAMPO} py-2`}
                  />
                  <span className={`self-end text-xs tabular-nums ${CLASE_TEXTO_SUAVE}`} aria-hidden="true">
                    {texto.length}/500
                  </span>
                </>
              )}
            </Campo>

            {aviso && (
              <label className={`flex min-h-11 cursor-pointer items-start gap-3 text-sm ${CLASE_TEXTO_FUERTE}`}>
                <input
                  type="checkbox"
                  checked={revisada}
                  onChange={(e) => setRevisada(e.target.checked)}
                  disabled={enviando}
                  className={`${CLASE_CHECK} mt-0.5`}
                />
                <span>Revisé los datos actualizados.</span>
              </label>
            )}
          </>
        )}

        {errorGeneral && <MensajeError>{errorGeneral}</MensajeError>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton variante="contorno" tamano="tactil" disabled={enviando} onClick={onCerrar}>
            Cancelar
          </Boton>
          {acciones.puede && (
            <Boton type="submit" tamano="tactil" ocupado={enviando} disabled={!puedeEnviar}>
              {enviando ? 'Guardando…' : 'Guardar decisión'}
            </Boton>
          )}
        </div>
      </form>
    </Dialogo>
  )
}
