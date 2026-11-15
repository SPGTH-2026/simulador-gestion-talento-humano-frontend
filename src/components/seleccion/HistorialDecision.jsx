import { useEffect, useState } from 'react'
import { historialDecision } from '../../api/seleccion'
import { mensajeError } from '../../api/mensajeError'
import Boton from '../ui/Boton'
import { MensajeError } from '../ui/Mensaje'
import Paginacion from '../ui/Paginacion'
import Rueda from '../ui/Rueda'
import { CLASE_LISTA, CLASE_TARJETA_PLANA, CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { RESULTADO_DECISION, formatoFechaHora } from '../../lib/seleccion'

// Historial de la decisión de UN candidato, paginado, del evento más reciente al más antiguo. Es el contenido de la pestaña
// «Historial» del detalle; el padre lo monta con key = id del candidato, así que al abrir otro empieza de cero y la
// respuesta tardía del anterior se descarta.
// 'activo': la pestaña está a la vista. Los datos se piden la primera vez que se abre y no se repiten al volver.
export default function HistorialDecision({ convocatoriaId, postulacionId, activo = true }) {
  const [pagina, setPagina] = useState(1)
  const [intento, setIntento] = useState(0)
  const [abierta, setAbierta] = useState(activo)
  if (activo && !abierta) setAbierta(true)
  const [estado, setEstado] = useState({ fase: 'cargando', filas: [], meta: null, error: '' })

  useEffect(() => {
    if (!abierta) return undefined
    let vigente = true
    historialDecision(convocatoriaId, postulacionId, { page: pagina })
      .then((res) => {
        if (vigente) setEstado({ fase: 'listo', filas: res.data, meta: res.meta, error: '' })
      })
      .catch((e) => {
        if (vigente) setEstado((previo) => ({ ...previo, fase: 'error', error: mensajeError(e) }))
      })
    return () => {
      vigente = false
    }
  }, [abierta, convocatoriaId, postulacionId, pagina, intento])

  const { fase, filas, meta, error } = estado
  const cargando = fase === 'cargando'
  const cambiarPagina = (n) => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setPagina(n)
  }
  const reintentar = () => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setIntento((n) => n + 1)
  }

  return (
    <div className="flex flex-col gap-4" aria-busy={cargando}>
      {fase === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <MensajeError>{error}</MensajeError>
          <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
            Reintentar
          </Boton>
        </div>
      )}

      {cargando && filas.length === 0 && (
        <p role="status" className={`flex items-center gap-2 py-6 text-sm ${CLASE_TEXTO_SUAVE}`}>
          <Rueda /> Cargando historial…
        </p>
      )}

      {fase === 'listo' && filas.length === 0 && (
        <p className={`py-6 text-center text-sm ${CLASE_TEXTO_SUAVE}`}>Aún no hay decisiones registradas para este candidato.</p>
      )}

      {filas.length > 0 && (
        <ul className={`${CLASE_TARJETA_PLANA} ${CLASE_LISTA} ${cargando ? 'opacity-60' : ''}`}>
          {filas.map((e, i) => (
            <li key={`${e.registrado_en}-${i}`} className="flex flex-col gap-0.5 px-4 py-3">
              <p className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
                {e.resultado_anterior ? `${RESULTADO_DECISION[e.resultado_anterior]} → ` : 'Primera decisión: '}
                {RESULTADO_DECISION[e.resultado_nuevo]}
              </p>
              <p className={`text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>«{e.motivo}»</p>
              <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
                {e.registrado_por ?? 'Un usuario'} · {formatoFechaHora(e.registrado_en)}
                {e.lista_version != null && (
                  <>
                    {' '}
                    · lista versión <span className="tabular-nums">{e.lista_version}</span>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}

      {meta && filas.length > 0 && (
        <Paginacion
          meta={meta}
          singular="evento"
          plural="eventos"
          etiqueta="Paginación del historial de la decisión"
          ocupado={cargando}
          onPagina={cambiarPagina}
          className="px-1"
        />
      )}
    </div>
  )
}
