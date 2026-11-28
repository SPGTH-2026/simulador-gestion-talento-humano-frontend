import { Suave, PuestoYResultado } from './ComparadorPiezas'
import { useEffect, useId, useState } from 'react'
import { compararCandidatos } from '../../api/seleccion'
import { mensajeError } from '../../api/mensajeError'
import { EtiquetaConIcono } from '../evaluacion/PresentacionEvaluacion'
import Icono from '../ui/Icono'
import Valor from './Valor'
import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { ACTIVIDADES, MOTIVO_REVISION, estadoDocumental, formatoFecha, textoCumplimiento, textoNota } from '../../lib/seleccion'

export function criterios(meta) {
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

// Lógica de ComparadorCandidatos: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function useComparadorCandidatos({ convocatoriaId, ids, onCerrar }) {
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

    return {
      candidatos,
      clave,
      convocatoriaId,
      datos,
      error,
      estado,
      fase,
      filas,
      idTitulo,
      ids,
      intento,
      meta,
      onCerrar,
      reintentar,
      setEstado,
      setIntento,
    }
}
