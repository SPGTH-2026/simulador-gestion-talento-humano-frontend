import { Link } from 'react-router-dom'
import Etiqueta from '../ui/Etiqueta'
import Icono from '../ui/Icono'
import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { describirBloqueos } from '../../lib/bloqueosSeleccion'

const CLASE_ACCION = 'font-semibold underline underline-offset-2 hover:no-underline'

function Accion({ accion, onResolver }) {
  if (!accion) return null
  if (accion.tipo === 'ruta') {
    return (
      <Link to={accion.to} className={CLASE_ACCION}>
        {accion.texto}
      </Link>
    )
  }
  return (
    <button type="button" onClick={() => onResolver(accion.pestana)} className={CLASE_ACCION}>
      {accion.texto}
    </button>
  )
}

// Estado del candidato para elegirlo como finalista, bajo su nombre en Preselección. «Listo para elegir» NO es «Seleccionado»:
// seleccionar es una decisión posterior (Decidir). Sin bloqueos, una etiqueta; con uno, una línea con el motivo y su acción;
// con varios, el primero y «+N más» en un desplegable que los enumera. Si el servidor no manda 'bloqueos' no se dice nada.
export default function EstadoCandidato({ fila, convocatoriaId, puedeDecidir, puedeDesignar, onResolver }) {
  if (fila.listo === true) {
    return (
      <Etiqueta tono="exito">
        Listo para elegir<span className="sr-only"> como finalista</span>
      </Etiqueta>
    )
  }
  const bloqueos = describirBloqueos(fila.bloqueos, { convocatoriaId, puedeDecidir, puedeDesignar })
  if (bloqueos.length === 0) return null

  const icono = <Icono nombre="alerta" className="mt-0.5 size-3.5 shrink-0 text-aviso" />
  if (bloqueos.length === 1) {
    const [b] = bloqueos
    return (
      <p className={`flex items-start gap-1.5 text-xs ${CLASE_TEXTO_FUERTE}`}>
        {icono}
        <span className="min-w-0">
          {b.texto} <Accion accion={b.accion} onResolver={onResolver} />
        </span>
      </p>
    )
  }
  return (
    <details className={`group text-xs ${CLASE_TEXTO_FUERTE}`}>
      <summary className="flex cursor-pointer items-start gap-1.5 marker:content-none [&::-webkit-details-marker]:hidden">
        {icono}
        <span className="min-w-0">
          {bloqueos[0].corto} <span className={CLASE_TEXTO_SUAVE}>y {bloqueos.length - 1} más</span>{' '}
          <span className="font-semibold underline underline-offset-2 group-open:hidden">Ver</span>
        </span>
      </summary>
      <ul className="mt-1 flex flex-col gap-1 pl-5">
        {bloqueos.map((b) => (
          <li key={b.codigo}>
            {b.texto} <Accion accion={b.accion} onResolver={onResolver} />
          </li>
        ))}
      </ul>
    </details>
  )
}
