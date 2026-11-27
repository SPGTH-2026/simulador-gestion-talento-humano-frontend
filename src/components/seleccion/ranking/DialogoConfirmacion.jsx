import { CLASE_CHECK } from './clasesRanking'
import { useEffect, useRef, useState } from 'react'
import { confirmarFinalistas } from '../../../api/seleccion'
import { erroresDeCampo, mensajeError } from '../../../api/mensajeError'
import Boton from '../../ui/Boton'
import Campo from '../../ui/Campo'
import Dialogo from '../../ui/Dialogo'
import { MensajeAviso, MensajeError } from '../../ui/Mensaje'
import { CLASE_CAJA_SUAVE, CLASE_CAMPO, CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../../lib/estilos'

export function DialogoConfirmacion({
  convocatoriaId,
  version,
  modo,
  empate,
  objetivo,
  seleccion,
  totalSugeridos,
  justificacion,
  onJustificacion,
  desactualizado,
  onCerrar,
  onConfirmada,
  onDesactualizado,
}) {
  const setJustificacion = onJustificacion
  const [revisada, setRevisada] = useState(!desactualizado)
  const [enviando, setEnviando] = useState(false)
  const [errorJustificacion, setErrorJustificacion] = useState('')
  const [errorGeneral, setErrorGeneral] = useState('')
  const montado = useRef(true)
  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  const ids = new Set(seleccion.keys())
  const motivos = []
  // Comparación con la sugerencia sin pedir páginas: la elección coincide si tiene tantos candidatos como
  // meta.sugeridos y todos estaban marcados «sugerido» en esta misma versión del ranking. Si alguna marca es de
  // otra versión no se puede afirmar nada: se avisa y el servidor valida si hace falta justificación.
  const entradas = [...seleccion.values()]
  const marcasVigentes = entradas.every((e) => e.version === version && e.sugerencia !== undefined)
  const coincide = marcasVigentes && ids.size === totalSugeridos && entradas.every((e) => e.sugerencia === 'sugerido')
  if (modo === 'sin_actividades') motivos.push('elegiste a los finalistas a mano, sin actividades')
  if (empate) motivos.push('hay un empate en el corte')
  if (modo === 'con_actividades' && marcasVigentes && !coincide) motivos.push('la lista difiere de la sugerida')
  const incierta = modo === 'con_actividades' && !marcasVigentes && motivos.length === 0
  const obligatoria = motivos.length > 0
  const texto = justificacion.trim()
  const largoValido = texto.length >= 10 && texto.length <= 500
  const puedeEnviar = revisada && (!obligatoria || largoValido) && (texto === '' || largoValido) && !enviando
  const elegidos = [...seleccion.entries()].sort(
    ([, a], [, b]) => (a.posicion ?? Infinity) - (b.posicion ?? Infinity) || a.aspirante.localeCompare(b.aspirante, 'es'),
  )

  const enviar = async (e) => {
    e.preventDefault()
    if (!puedeEnviar) return
    setEnviando(true)
    setErrorJustificacion('')
    setErrorGeneral('')
    try {
      const cuerpo = { version, postulacion_ids: [...ids] }
      if (texto) cuerpo.justificacion = texto
      const res = await confirmarFinalistas(convocatoriaId, cuerpo)
      if (montado.current) onConfirmada(res)
    } catch (err) {
      if (!montado.current) return
      if (err.response?.status === 409 && err.response.data?.codigo === 'ranking_desactualizado') {
        onDesactualizado()
        return
      }
      const porCampo = erroresDeCampo(err)
      if (porCampo.justificacion) setErrorJustificacion(porCampo.justificacion)
      const otro = Object.entries(porCampo).find(([campo]) => campo !== 'justificacion')
      setErrorGeneral(otro ? otro[1] : Object.keys(porCampo).length === 0 ? mensajeError(err) : '')
    } finally {
      if (montado.current) setEnviando(false)
    }
  }

  return (
    <Dialogo idTitulo="confirmar-finalistas-titulo" onCerrar={enviando ? () => {} : onCerrar} className="max-w-xl">
      <form onSubmit={enviar} noValidate aria-busy={enviando} className="flex flex-col gap-4 p-5 sm:p-6">
        <div>
          <h2 id="confirmar-finalistas-titulo" className={`text-lg font-bold ${CLASE_TEXTO_FUERTE}`}>
            Confirmar finalistas
          </h2>
          <p className={`mt-1 text-sm ${CLASE_TEXTO_SUAVE}`}>
            Eliges <span className="font-semibold tabular-nums">{ids.size}</span>{' '}
            {ids.size === 1 ? 'candidato' : 'candidatos'} para un objetivo de{' '}
            <span className="tabular-nums">{objetivo}</span>. Se registrará una versión nueva de la lista.
          </p>
        </div>

        <ul className={`${CLASE_CAJA_SUAVE} max-h-52 divide-y divide-sena-linea/60 overflow-y-auto dark:divide-sena-borde/40`}>
          {elegidos.map(([id, f]) => (
            <li key={id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span className={`min-w-0 ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{f.aspirante}</span>
              <span className={`shrink-0 tabular-nums ${CLASE_TEXTO_SUAVE}`}>
                {f.posicion == null ? 'Sin posición' : `Posición ${f.posicion}`}
              </span>
            </li>
          ))}
        </ul>

        {desactualizado && (
          <MensajeAviso>
            El ranking cambió mientras elegías. Revisa que la lista siga siendo la que quieres antes de confirmar.
          </MensajeAviso>
        )}

        <Campo
          etiqueta="Justificación"
          requerido={obligatoria}
          error={errorJustificacion || (texto !== '' && !largoValido ? 'Debe tener entre 10 y 500 caracteres.' : '')}
          ayuda={
            obligatoria
              ? `Obligatoria porque ${motivos.join(' y ')} (de 10 a 500 caracteres).`
              : incierta
                ? 'Si la lista difiere de la sugerida, el servidor pedirá la justificación (de 10 a 500 caracteres).'
                : 'Opcional: la lista coincide con la sugerida.'
          }
        >
          {({ id, describedby, invalid }) => (
            <textarea
              id={id}
              rows={3}
              maxLength={500}
              autoFocus={obligatoria}
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
          )}
        </Campo>

        {desactualizado && (
          <label className={`flex min-h-11 cursor-pointer items-start gap-3 text-sm ${CLASE_TEXTO_FUERTE}`}>
            <input
              type="checkbox"
              checked={revisada}
              onChange={(e) => setRevisada(e.target.checked)}
              disabled={enviando}
              className={`${CLASE_CHECK} mt-0.5`}
            />
            <span>Revisé la lista con el ranking actualizado.</span>
          </label>
        )}

        {errorGeneral && <MensajeError>{errorGeneral}</MensajeError>}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Boton variante="contorno" tamano="tactil" disabled={enviando} onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" tamano="tactil" ocupado={enviando} disabled={!puedeEnviar}>
            {enviando ? 'Confirmando…' : 'Confirmar finalistas'}
          </Boton>
        </div>
      </form>
    </Dialogo>
  )
}
