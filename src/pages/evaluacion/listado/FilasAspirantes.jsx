import { Link } from 'react-router-dom'
import { DatosAspirante, EtiquetaEvaluacion, Cumplimiento, Resultado } from '../../../components/evaluacion/PresentacionEvaluacion'
import Boton from '../../../components/ui/Boton'
import Etiqueta from '../../../components/ui/Etiqueta'
import { CLASE_TARJETA_PLANA, CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../../lib/estilos'

// Filas y tarjetas de la lista de aspirantes: la tabla (desde 940 px del contenedor) y la tarjeta (por debajo).
// Fondo de fila al pasar el cursor: el más claro que mantiene las etiquetas
// verdes sobre 4.5:1 (sena-hundido las dejaba en 4.1:1).
export const CLASE_FILA =
  'transition-colors hover:bg-sena-fondo/60 focus-within:bg-sena-fondo/60 motion-reduce:transition-none dark:hover:bg-sena-superficie-alta/40 dark:focus-within:bg-sena-superficie-alta/40'

// Los encabezados no se parten: el ancho de las columnas pequeñas se fija en
// el <colgroup> para que ninguno se corte ni invada a su vecino.
export const CLASE_TH = 'whitespace-nowrap px-3 py-3 first:pl-4 last:pr-4'
export const CLASE_TD = 'px-3 py-3.5 align-middle first:pl-4 last:pr-4'

// Tono de la etiqueta del estado de postulación; un estado que no está aquí
// cae al neutro.
export const TONO_POSTULACION = {
  Postulado: 'azul',
  'En evaluación': 'azul',
  'En revisión': 'aviso',
  'Documentación validada': 'exito',
  Seleccionado: 'exito',
}

export const nombreDe = (fila) => fila.aspirante.name ?? 'aspirante'

// Barra de documentos: gris sin documentos o sin ninguno cargado, ámbar con
// avance parcial y verde con todos. El texto "x/y" acompaña siempre a la
// barra: el color nunca es el único canal. El backend cuenta como 'cargados' los
// documentos que el aspirante cargó (antes 'validados'): el contrato no trae
// validación documental, así que aquí se rotulan como cargados.
export function ProgresoDocumentos({ fila }) {
  const docs = fila.documentos ?? {}
  const total = docs.total ?? 0
  const cargados = docs.cargados ?? docs.validados ?? 0
  const maximo = Math.max(total, 1)
  const pct = Math.min(100, Math.round((cargados / maximo) * 100))
  const relleno =
    total === 0 || cargados === 0
      ? 'bg-slate-400 dark:bg-sena-texto-suave'
      : cargados === total
        ? 'bg-exito'
        : 'bg-aviso'

  return (
    <div className="flex items-center gap-2.5">
      <div
        role="progressbar"
        aria-label={`Documentos de ${nombreDe(fila)}`}
        aria-valuemin={0}
        aria-valuemax={maximo}
        aria-valuenow={Math.min(cargados, maximo)}
        aria-valuetext={`${cargados} de ${total} documentos cargados`}
        className="h-2 min-w-10 flex-1 overflow-hidden rounded-full bg-sena-hundido dark:bg-sena-borde"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${relleno}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`whitespace-nowrap text-sm font-medium tabular-nums ${CLASE_TEXTO_FUERTE}`}
        aria-hidden="true"
      >
        {cargados}/{total}
      </span>
    </div>
  )
}

// Convocatoria y estado de postulación. Los estados del backend pueden ser
// largos ("Documentación validada"): en una columna estrecha la etiqueta se
// parte en dos líneas en lugar de salirse.
export function Convocatoria({ fila, tamanoTexto = '' }) {
  const estado = fila.estado === 'postulado' ? 'Postulado' : fila.estado
  return (
    <div className="flex min-w-0 flex-col items-start gap-1.5">
      <p className={`${tamanoTexto} font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
        {fila.convocatoria.titulo}
      </p>
      {estado && (
        <Etiqueta tono={TONO_POSTULACION[estado] ?? 'neutral'} className="max-w-full">
          {estado}
        </Etiqueta>
      )}
    </div>
  )
}

export function EnlaceRevisar({ fila, variante, className, children }) {
  return (
    <Boton
      as={Link}
      to={`/evaluacion/evaluar/${fila.id}`}
      aria-label={`Revisar a ${nombreDe(fila)}`}
      variante={variante}
      tamano="tactil"
      className={className}
    >
      {children}
    </Boton>
  )
}

export function FilaTabla({ fila }) {
  return (
    <tr className={CLASE_FILA}>
      <td className={CLASE_TD}>
        <DatosAspirante aspirante={fila.aspirante} tamano="sm" />
      </td>
      <td className={CLASE_TD}>
        <Convocatoria fila={fila} />
      </td>
      <td className={CLASE_TD}>
        <ProgresoDocumentos fila={fila} />
      </td>
      <td className={CLASE_TD}>
        <Cumplimiento evaluacion={fila.evaluacion} />
      </td>
      <td className={CLASE_TD}>
        <div className="flex flex-col items-start gap-1.5">
          <EtiquetaEvaluacion evaluacion={fila.evaluacion} />
          <Resultado evaluacion={fila.evaluacion} />
        </div>
      </td>
      <td className={`${CLASE_TD} text-right`}>
        <EnlaceRevisar fila={fila} variante="contorno">
          Revisar
        </EnlaceRevisar>
      </td>
    </tr>
  )
}

export function TarjetaAspirante({ fila }) {
  return (
    <li className={`${CLASE_TARJETA_PLANA} flex min-w-0 flex-col gap-4 p-4`}>
      <DatosAspirante aspirante={fila.aspirante} tamano="md" />
      <Convocatoria fila={fila} tamanoTexto="text-sm" />

      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-3 border-t border-sena-linea/70 pt-4 dark:border-sena-borde/50">
        <div className="min-w-0">
          <dt className={`mb-1 text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Documentos cargados</dt>
          <dd>
            <ProgresoDocumentos fila={fila} />
          </dd>
        </div>
        <div className="text-right">
          <dt className={`mb-1 text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Cumplimiento</dt>
          <dd>
            <Cumplimiento evaluacion={fila.evaluacion} />
          </dd>
        </div>
        <div className="col-span-2 flex flex-wrap items-center gap-2">
          <dt className="sr-only">Evaluación</dt>
          <dd className="flex flex-wrap items-center gap-2">
            <EtiquetaEvaluacion evaluacion={fila.evaluacion} />
            <Resultado evaluacion={fila.evaluacion} />
          </dd>
        </div>
      </dl>

      <EnlaceRevisar fila={fila} variante="primario" className="mt-auto w-full">
        Revisar
      </EnlaceRevisar>
    </li>
  )
}

// Marcador gris que respira mientras llegan los datos (quieto con movimiento
// reducido).
