import { CLASE_TEXTO_SUAVE } from '../../../lib/estilos'
import Campo from '../../ui/Campo'
import Mensaje from '../../ui/Mensaje'

// Etapa 5 del asistente de convocatorias. Recibe el estado y las acciones del asistente en la prop ctx.
export default function EtapaFechas({ ctx }) {
  const { avisosFechas, campo, errorDe, form, minimoFecha } = ctx
  return (
      <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Campo etiqueta="Fecha de apertura" requerido error={errorDe('fecha_apertura')}>
          <input type="date" {...campo('fecha_apertura')} />
        </Campo>

        <Campo etiqueta="Fecha de cierre" requerido error={errorDe('fecha_cierre')}>
          <input
            type="date"
            min={form.fecha_apertura && minimoFecha && form.fecha_apertura > minimoFecha ? form.fecha_apertura : minimoFecha}
            {...campo('fecha_cierre')}
          />
        </Campo>

        <Campo etiqueta="Fecha de evaluación" error={errorDe('fecha_evaluacion')}>
          <input type="date" {...campo('fecha_evaluacion')} />
        </Campo>
      </div>

      <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
        La fecha de evaluación es opcional: es el día en que empieza la evaluación de los candidatos. Desde esa fecha, quienes
        ya enviaron su postulación no pueden editarla ni reemplazar documentos. Recibir postulaciones nuevas depende solo de
        las fechas de apertura y de cierre.
      </p>

      {avisosFechas.map((a) => (
        <Mensaje key={a.clave} tipo={a.tono}>
          {a.texto}
        </Mensaje>
      ))}
      </div>
  )
}
