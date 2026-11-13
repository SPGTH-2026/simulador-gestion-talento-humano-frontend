import { IconoOjo } from '../convocatorias/Iconos'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { ESTADO_DOCUMENTO, formatearPeso } from '../../lib/evaluacion'
import { EtiquetaConIcono } from './PresentacionEvaluacion'
import RespuestaSiNo from './RespuestaSiNo'

// Un requisito de la lista: el documento pedido por la convocatoria con lo que
// se sabe de él (si el aspirante lo subió, si es obligatorio, cuánto pesa) y los
// controles del evaluador. Lo que el aspirante subió y lo que el evaluador
// decide son cosas distintas: la etiqueta describe lo primero, Sí/No lo segundo.
export default function RequisitoEvaluacion({
  documento,
  peso,
  respuesta,
  actualizado = false,
  onChange,
  onVerDocumento,
  abriendo = false,
}) {
  const estado = ESTADO_DOCUMENTO[documento.estado] ?? ESTADO_DOCUMENTO.pendiente
  const sinArchivo = !documento.archivo

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 @min-[36rem]:flex-row @min-[36rem]:items-center @min-[36rem]:justify-between @min-[36rem]:gap-4">
      <div className="min-w-0">
        <p className={`font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{documento.nombre}</p>
        <p className={`mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${CLASE_TEXTO_SUAVE}`}>
          <EtiquetaConIcono
            tono={estado.tono}
            icono={documento.estado === 'subido' ? <Icono nombre="check" className="size-3.5" /> : null}
          >
            {estado.texto}
          </EtiquetaConIcono>
          {actualizado && (
            <EtiquetaConIcono tono="azul" icono={<Icono nombre="reintentar" className="size-3.5" />}>
              Corregido por el aspirante
            </EtiquetaConIcono>
          )}
          <span className="whitespace-nowrap">
            {documento.obligatorio ? 'Obligatorio' : 'Opcional'}
            <span aria-hidden="true"> · </span>
            <span className="sr-only">, </span>
            Peso {formatearPeso(peso)}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 @min-[36rem]:flex @min-[36rem]:shrink-0 @min-[36rem]:items-center">
        <Boton
          variante="contorno"
          tamano="tactil"
          onClick={onVerDocumento}
          disabled={sinArchivo || abriendo}
          aria-busy={abriendo}
          aria-label={`Ver documento: ${documento.nombre}`}
          className="col-span-2 @min-[36rem]:col-auto"
        >
          <IconoOjo className="h-4 w-4" />
          {abriendo ? 'Abriendo…' : 'Ver documento'}
        </Boton>
        <RespuestaSiNo
          requisito={documento.nombre}
          valor={respuesta}
          onChange={onChange}
          className="col-span-2"
        />
      </div>
    </li>
  )
}
