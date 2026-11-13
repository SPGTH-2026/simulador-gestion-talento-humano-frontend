import { useEffect, useId, useState } from 'react'
import { historialDecision } from '../../api/seleccion'
import { mensajeError } from '../../api/mensajeError'
import { IconoX } from '../convocatorias/Iconos'
import Boton from '../ui/Boton'
import Dialogo from '../ui/Dialogo'
import { MensajeError } from '../ui/Mensaje'
import Paginacion from '../ui/Paginacion'
import Rueda from '../ui/Rueda'
import { CLASE_LISTA, CLASE_TARJETA_PLANA, CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { RESULTADO_DECISION, formatoFechaHora } from '../../lib/seleccion'

// Historial de la decisión de UN candidato, paginado, del evento más reciente al más antiguo. El padre lo monta con
// key = id del candidato: al abrir otro empieza de cero y la respuesta tardía del anterior se descarta.
export default function HistorialDecision({ convocatoriaId, fila, onCerrar }) {
  const idTitulo = useId()
  const [pagina, setPagina] = useState(1)
  const [intento, setIntento] = useState(0)
  const [estado, setEstado] = useState({ fase: 'cargando', filas: [], meta: null, error: '' })

  useEffect(() => {
    let vigente = true
    historialDecision(convocatoriaId, fila.postulacion_id, { page: pagina })
      .then((res) => {
        if (vigente) setEstado({ fase: 'listo', filas: res.data, meta: res.meta, error: '' })
      })
      .catch((e) => {
        if (vigente) setEstado((previo) => ({ ...previo, fase: 'error', error: mensajeError(e) }))
      })
    return () => {
      vigente = false
    }
  }, [convocatoriaId, fila.postulacion_id, pagina, intento])

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
    <Dialogo idTitulo={idTitulo} onCerrar={onCerrar} className="max-w-xl">
      <div className="flex flex-col gap-4 p-4 sm:p-6" aria-busy={cargando}>
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={idTitulo} className={`text-lg font-semibold ${CLASE_TEXTO_FUERTE}`}>
              Historial de la decisión
            </h2>
            <p className={`mt-0.5 text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_SUAVE}`}>{fila.aspirante}</p>
          </div>
          <Boton variante="fantasma" tamano="tactil" onClick={onCerrar} aria-label="Cerrar el historial">
            <IconoX className="size-5" />
          </Boton>
        </header>

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
          <p className={`py-6 text-center text-sm ${CLASE_TEXTO_SUAVE}`}>
            Aún no hay decisiones registradas para este candidato.
          </p>
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
    </Dialogo>
  )
}
