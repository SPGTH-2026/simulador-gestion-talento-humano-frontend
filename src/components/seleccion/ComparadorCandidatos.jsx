import { useEffect, useId, useState } from 'react'
import { compararCandidatos } from '../../api/seleccion'
import { mensajeError } from '../../api/mensajeError'
import { IconoX } from '../convocatorias/Iconos'
import { EtiquetaConIcono } from '../evaluacion/PresentacionEvaluacion'
import Boton from '../ui/Boton'
import Dialogo from '../ui/Dialogo'
import Icono from '../ui/Icono'
import { MensajeAviso, MensajeError } from '../ui/Mensaje'
import Rueda from '../ui/Rueda'
import Valor from './Valor'
import {
  CLASE_META_DT,
  CLASE_TARJETA_PLANA,
  CLASE_TBODY,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
  CLASE_THEAD,
} from '../../lib/estilos'
import {
  ACTIVIDADES,
  MOTIVO_REVISION,
  estadoDocumental,
  formatoFecha,
  textoCumplimiento,
  textoNota,
} from '../../lib/seleccion'

const Suave = ({ children }) => <span className={`text-sm ${CLASE_TEXTO_SUAVE}`}>{children}</span>

// Puesto y resultado con sus etiquetas, en una línea que puede partirse entre datos (no dentro de ellos).
function PuestoYResultado({ posicion, resultado, sinPuesto, sinResultado }) {
  // Sin actividades (o si aún no está listo) no hay ni puesto ni resultado: se dice una sola vez, con palabras.
  if (posicion == null && resultado == null) return <Suave>Sin puesto ni resultado</Suave>
  return (
    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <span className="whitespace-nowrap">
        <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Puesto </span>
        <span className="font-semibold">
          <Valor valor={posicion} sinDato={sinPuesto} />
        </span>
      </span>
      <span className="whitespace-nowrap">
        <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Resultado </span>
        <span className="font-semibold">
          <Valor valor={resultado == null ? null : textoNota(resultado)} sinDato={sinResultado} />
        </span>
      </span>
    </span>
  )
}

// Los criterios, en un solo lugar: la tabla de escritorio y las tarjetas de móvil los leen de aquí, así que son SIEMPRE los
// mismos y van en el mismo orden. 'etiqueta' es el nombre del criterio; 'celda' pinta el dato de un candidato.
function criterios(meta) {
  const conActividades = meta.modo === 'con_actividades'
  const sinPuesto = conActividades ? 'Sin puesto' : 'Sin puesto: la convocatoria no tiene actividades'
  const sinResultado = conActividades ? 'Sin resultado' : 'Sin resultado: la convocatoria no tiene actividades'
  const lista = meta.lista

  const filas = [
    {
      id: 'confirmada',
      etiqueta: lista ? `Lista confirmada · versión ${lista.version}` : 'Lista confirmada',
      ayuda: 'Lo que conservó la lista al confirmarse',
      celda: (c) => {
        if (!lista) return <Suave>Aún no hay una lista confirmada</Suave>
        if (!c.confirmada) return <Suave>No está en la lista vigente</Suave>
        return (
          <div className="flex flex-col gap-1">
            <PuestoYResultado posicion={c.confirmada.posicion} resultado={c.confirmada.resultado} sinPuesto={sinPuesto} sinResultado={sinResultado} />
            {c.revision && (
              <span className="flex items-start gap-1.5 text-xs font-medium text-aviso">
                <Icono nombre="alerta" className="mt-px size-3.5 shrink-0" />
                {MOTIVO_REVISION[c.revision] ?? 'Requiere revisión.'}
              </span>
            )}
          </div>
        )
      },
    },
    {
      id: 'actual',
      etiqueta: 'Ranking de hoy',
      ayuda: 'Con las notas y la habilitación de ahora',
      celda: (c) => {
        if (!c.actual) return <Suave>Su postulación ya no está activa</Suave>
        return (
          <div className="flex flex-col gap-1">
            <PuestoYResultado posicion={c.actual.posicion} resultado={c.actual.resultado} sinPuesto={sinPuesto} sinResultado={sinResultado} />
            {!c.actual.listo && <span className="text-xs font-medium text-aviso">Aún no está listo para el ranking</span>}
          </div>
        )
      },
    },
    {
      id: 'documental',
      etiqueta: 'Habilitación documental',
      celda: (c) => {
        const d = estadoDocumental(c.documental.estado)
        return (
          <div className="flex flex-col items-start gap-1">
            <EtiquetaConIcono tono={d.tono} icono={<Icono nombre={d.icono} className="size-3.5" />}>
              {d.texto}
            </EtiquetaConIcono>
            <span className="text-sm">
              <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Cumplimiento </span>
              <Valor valor={textoCumplimiento(c.documental.cumplimiento)} sinDato="Sin dato de cumplimiento" />
            </span>
          </div>
        )
      },
    },
    {
      id: 'evaluador',
      etiqueta: 'Evaluador o referencia',
      celda: (c) => {
        // Solo Instructor y Superadministrador reciben estos datos (la misma regla de la referencia documental).
        if (!meta.evaluador_visible) return <Suave>No disponible para tu perfil</Suave>
        const { referencia, evaluaciones } = c.evaluacion
        if (referencia) {
          return (
            <div className="flex flex-col gap-0.5 text-sm">
              <span className={CLASE_TEXTO_FUERTE}>
                <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Referencia </span>
                {referencia.evaluador ?? 'Evaluador eliminado'}
              </span>
              <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
                Designada por {referencia.designada_por ?? 'un usuario'}
                {referencia.vigente ? '' : ' · ya no vigente'}
              </span>
            </div>
          )
        }
        if (evaluaciones.length === 0) return <Suave>Sin evaluación finalizada</Suave>
        if (evaluaciones.length === 1) return <span className={`text-sm ${CLASE_TEXTO_FUERTE}`}>{evaluaciones[0].evaluador ?? 'Evaluador eliminado'}</span>
        return (
          <div className="flex flex-col gap-0.5 text-sm">
            <span className="text-xs font-medium text-aviso">Varias evaluaciones y ninguna referencia</span>
            <span className={CLASE_TEXTO_FUERTE}>{evaluaciones.map((e) => e.evaluador ?? 'Evaluador eliminado').join(', ')}</span>
          </div>
        )
      },
    },
  ]

  if (conActividades) {
    for (const actividad of ACTIVIDADES) {
      const peso = meta.actividades[actividad.id].peso
      filas.push({
        id: actividad.id,
        etiqueta: `${actividad.etiqueta}${peso != null ? ` · peso ${peso} %` : ''}`,
        ayuda: 'Nota vigente hoy, no una copia de la que había al confirmar',
        celda: (c) => {
          const a = c.actividades[actividad.id]
          if (a.estado === 'desactivada') return <Suave>No forma parte de la convocatoria</Suave>
          if (a.estado === 'pendiente') return <Suave>Sin nota registrada</Suave>
          return (
            <div className="flex flex-col gap-1">
              <span className={`text-xl font-bold tabular-nums ${CLASE_TEXTO_FUERTE}`}>{textoNota(a.nota)}</span>
              <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
                Realizada el {formatoFecha(a.fecha_realizacion)} · registrada por {a.registrada_por ?? 'un usuario'}
              </span>
              {a.observacion ? (
                <span className={`text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{a.observacion}</span>
              ) : (
                <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Sin observación</span>
              )}
            </div>
          )
        },
      })
    }
  } else {
    filas.push({
      id: 'actividades',
      etiqueta: 'Entrevista y prueba técnica',
      celda: () => (
        <Suave>
          {meta.modo === 'sin_actividades'
            ? 'La convocatoria no tiene actividades presenciales'
            : 'Aún no se configuran las actividades presenciales'}
        </Suave>
      ),
    })
  }

  filas.push(
    {
      id: 'skills',
      etiqueta: 'Skills',
      ayuda: '«Certificado cargado» solo dice que hay un archivo; no es una validación',
      celda: (c) => (
        <div className="flex flex-col gap-1 text-sm">
          {meta.skills_requeridas === 0 ? (
            <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>La convocatoria no pide skills</span>
          ) : (
            <ul className="flex flex-col gap-1">
              {c.skills.requeridas.map((s) => (
                <li key={s.nombre} className="flex flex-col">
                  <span className={`font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{s.nombre}</span>
                  <span className={`text-xs ${s.declarada ? '' : 'italic '}${CLASE_TEXTO_SUAVE}`}>
                    {s.declarada ? (s.certificado_cargado ? 'Declarada · Certificado cargado' : 'Declarada · Sin certificado') : 'No declarada'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
            {c.skills.adicionales === 0
              ? 'Sin skills adicionales'
              : `${c.skills.adicionales} ${c.skills.adicionales === 1 ? 'skill adicional' : 'skills adicionales'}`}
          </span>
        </div>
      ),
    },
    {
      id: 'fecha',
      etiqueta: 'Fecha de postulación',
      celda: (c) => <Valor valor={c.fecha_postulacion ? formatoFecha(c.fecha_postulacion) : null} sinDato="Sin fecha de postulación" />,
    },
  )

  return filas
}

// Comparación de 2 a 5 candidatos de UNA convocatoria. SOLO LECTURA: no cambia la lista, las decisiones ni las marcas
// de «Elegir». Se pide en una sola petición al abrirse; con carga lenta muestra el estado y con error ofrece reintentar.
// 'ids' en el orden en que se marcaron. Escritorio: criterios en filas y candidatos en columnas; móvil: una tarjeta por
// candidato con los mismos criterios en el mismo orden.
export default function ComparadorCandidatos({ convocatoriaId, ids, onCerrar }) {
  const idTitulo = useId()
  const clave = ids.join(',')
  const [estado, setEstado] = useState({ fase: 'cargando', datos: null, error: '' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    compararCandidatos(convocatoriaId, clave.split(',').map(Number))
      .then((res) => {
        if (vigente) setEstado({ fase: 'listo', datos: res, error: '' })
      })
      .catch((e) => {
        if (vigente) setEstado({ fase: 'error', datos: null, error: mensajeError(e) })
      })
    return () => {
      vigente = false
    }
  }, [convocatoriaId, clave, intento])

  const reintentar = () => {
    setEstado({ fase: 'cargando', datos: null, error: '' })
    setIntento((n) => n + 1)
  }

  const { fase, datos, error } = estado
  const candidatos = datos?.data ?? []
  const meta = datos?.meta
  const filas = meta ? criterios(meta) : []

  return (
    <Dialogo idTitulo={idTitulo} onCerrar={onCerrar} className="max-w-6xl">
      <div className="@container flex flex-col gap-4 p-4 sm:p-6" aria-busy={fase === 'cargando'}>
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id={idTitulo} className={`text-lg font-semibold ${CLASE_TEXTO_FUERTE}`}>
              Comparar candidatos
            </h2>
            <p className={`mt-0.5 text-sm ${CLASE_TEXTO_SUAVE}`}>
              {ids.length} candidatos · solo lectura: no cambia la lista ni las decisiones
            </p>
          </div>
          <Boton variante="fantasma" onClick={onCerrar} aria-label="Cerrar la comparación">
            <IconoX className="size-5" />
          </Boton>
        </header>

        {fase === 'cargando' && (
          <p role="status" className={`flex items-center gap-2 py-8 text-sm ${CLASE_TEXTO_SUAVE}`}>
            <Rueda /> Cargando la comparación…
          </p>
        )}

        {fase === 'error' && (
          <div className="flex flex-col items-start gap-3">
            <MensajeError>{error}</MensajeError>
            <Boton variante="contorno" onClick={reintentar}>
              Reintentar
            </Boton>
          </div>
        )}

        {fase === 'listo' && (
          <>
            {meta.modo !== 'con_actividades' && (
              <MensajeAviso>
                {meta.modo === 'sin_actividades'
                  ? 'Convocatoria sin actividades: el ranking no tiene puesto ni resultado numérico. La comparación se apoya en la habilitación documental.'
                  : 'La convocatoria aún no tiene configuradas sus actividades, así que el ranking no tiene puesto ni resultado.'}
              </MensajeAviso>
            )}
            {meta.lista?.requiere_revision && (
              <MensajeAviso>
                La lista confirmada (versión {meta.lista.version}) requiere revisión: lo confirmado y lo de hoy pueden diferir.
              </MensajeAviso>
            )}

            {/* Escritorio: criterios en filas y candidatos en columnas. */}
            <div className={`${CLASE_TARJETA_PLANA} hidden overflow-x-auto @min-[960px]:block`}>
              <table className="w-full table-fixed text-left text-sm">
                <caption className="sr-only">Comparación lado a lado de {candidatos.length} candidatos</caption>
                <colgroup>
                  <col className="w-44" />
                  {candidatos.map((c) => (
                    <col key={c.postulacion_id} />
                  ))}
                </colgroup>
                <thead className={CLASE_THEAD}>
                  <tr>
                    <th scope="col" className="px-3 py-2.5 first:pl-4">
                      Criterio
                    </th>
                    {candidatos.map((c) => (
                      <th key={c.postulacion_id} scope="col" className="px-3 py-2.5 align-bottom text-sm normal-case tracking-normal last:pr-4">
                        <span title={c.aspirante} className={`line-clamp-2 ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
                          {c.aspirante}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={CLASE_TBODY}>
                  {filas.map((f) => (
                    <tr key={f.id}>
                      <th scope="row" className="px-3 py-3 pl-4 align-top font-medium">
                        <span className={CLASE_TEXTO_FUERTE}>{f.etiqueta}</span>
                        {f.ayuda && <span className={`mt-0.5 block text-xs font-normal ${CLASE_TEXTO_SUAVE}`}>{f.ayuda}</span>}
                      </th>
                      {candidatos.map((c) => (
                        <td key={c.postulacion_id} className="px-3 py-3 align-top last:pr-4">
                          {f.celda(c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Móvil y anchos estrechos: una tarjeta por candidato con los mismos criterios, en el mismo orden. */}
            <ul className="flex flex-col gap-3 @min-[960px]:hidden">
              {candidatos.map((c) => (
                <li key={c.postulacion_id} className={`${CLASE_TARJETA_PLANA} flex flex-col gap-3 p-4`}>
                  <h3 className={`text-base font-semibold ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{c.aspirante}</h3>
                  <dl className="flex flex-col gap-3">
                    {filas.map((f) => (
                      <div key={f.id} className="flex flex-col gap-1">
                        <dt className={CLASE_META_DT}>{f.etiqueta}</dt>
                        <dd className="text-sm">{f.celda(c)}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Dialogo>
  )
}
