import { isValidElement } from 'react'
import { usePanelCalificaciones } from './usePanelCalificaciones'
import Boton from '../ui/Boton'
import { MensajeAviso, MensajeError } from '../ui/Mensaje'
import Rueda from '../ui/Rueda'
import { CLASE_CAJA_SUAVE, CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { ACTIVIDADES, ESTADO_RESULTADO, textoNota } from '../../lib/seleccion'
import { TarjetaActividad } from './PiezasCalificaciones'

export default function PanelCalificaciones({ convocatoriaId, postulacionId, puedeDecidir, recarga, onCambio, soloLectura = false }) {
  const ctx = usePanelCalificaciones({ convocatoriaId, postulacionId, puedeDecidir, recarga, onCambio, soloLectura })
  // Mientras carga, falla o no está abierto, el hook devuelve la propia pantalla (un elemento de React) y no el contexto.
  if (ctx === null || isValidElement(ctx)) return ctx
  const { actualizando, datos, editando, error, fallo, guardar, puedeEscribir, razon, reintentar, resultado, setEditando, sinActividades, sinConfigurar } = ctx
  return (
    <div className="@container flex flex-col gap-4" aria-busy={actualizando}>
      {actualizando && (
        <p role="status" className={`flex items-center gap-2 text-sm ${CLASE_TEXTO_SUAVE}`}>
          <Rueda /> Actualizando calificaciones…
          {soloLectura ? '' : ' Las acciones de escritura están bloqueadas hasta tener datos vigentes.'}
        </p>
      )}
      {fallo && (
        <div className="flex flex-col items-start gap-3">
          <MensajeError>{error}</MensajeError>
          <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
            Estas son las últimas notas que se pudieron consultar.
            {soloLectura ? '' : ' No se puede registrar ni corregir hasta recargar.'}
          </p>
          <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
            Reintentar
          </Boton>
        </div>
      )}

      <dl className="grid gap-3 @min-[520px]:grid-cols-3">
        <div className={`${CLASE_CAJA_SUAVE} p-3`}>
          <dt className={`text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Progreso</dt>
          <dd className={`mt-1 text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
            {sinConfigurar || sinActividades ? (
              '—'
            ) : (
              <>
                <span className="tabular-nums">
                  {datos.progreso.registradas} de {datos.progreso.requeridas}
                </span>{' '}
                notas registradas
              </>
            )}
          </dd>
        </div>
        <div className={`${CLASE_CAJA_SUAVE} p-3 @min-[520px]:col-span-2`}>
          <dt className={`text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>
            {soloLectura ? 'Resultado adicional de hoy' : 'Resultado adicional'}
          </dt>
          <dd className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {resultado.valor != null ? (
              <span className={`text-2xl font-bold tabular-nums ${CLASE_TEXTO_FUERTE}`}>
                {textoNota(resultado.valor)}
              </span>
            ) : (
              <span className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
                {ESTADO_RESULTADO[resultado.estado] ?? resultado.estado}
              </span>
            )}
            {resultado.estado === 'incompleto' && datos.progreso.pendientes.length > 0 && (
              <span className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
                Falta:{' '}
                {datos.progreso.pendientes
                  .map((p) => ACTIVIDADES.find((a) => a.id === p)?.etiqueta ?? p)
                  .join(' y ')}
              </span>
            )}
          </dd>
        </div>
      </dl>

      {sinConfigurar && (
        <MensajeAviso>
          Pendiente de configurar: esta convocatoria aún no tiene definidas sus actividades presenciales. Se configuran
          en la pestaña Configuración de la convocatoria.
        </MensajeAviso>
      )}
      {sinActividades && (
        <p className={`${CLASE_CAJA_SUAVE} p-3 text-sm ${CLASE_TEXTO_FUERTE}`}>
          Esta convocatoria no tiene actividades presenciales: solo cuenta la habilitación documental.
        </p>
      )}
      {razon && <MensajeAviso>{razon}</MensajeAviso>}

      {!sinConfigurar && !sinActividades && (
        <ul className="grid gap-3 @min-[620px]:grid-cols-2">
          {ACTIVIDADES.map((actividad) => (
            <TarjetaActividad
              key={`${postulacionId}-${actividad.id}`}
              actividad={actividad}
              info={datos.actividades[actividad.id]}
              puedeEscribir={puedeEscribir}
              editando={editando === actividad.id}
              algunaEditando={editando != null}
              onEditar={() => setEditando(actividad.id)}
              onCerrar={() => setEditando(null)}
              onGuardar={guardar}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
