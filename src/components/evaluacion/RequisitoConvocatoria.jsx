import { useId } from 'react'
import Boton from '../ui/Boton'
import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import RespuestaSiNo from './RespuestaSiNo'

// Un requisito de la convocatoria (texto) con el documento que lo respalda y los controles del evaluador: ver el
// documento, marcar si cumple o no cumple. Es informativo: la marca no cambia el porcentaje.
export default function RequisitoConvocatoria({
  texto,
  documentos,
  documentoId,
  marca,
  onDocumento,
  onMarca,
  onVerDocumento,
  abriendo = false,
}) {
  const selectId = useId()
  const documento = documentos.find((d) => d.id === documentoId) ?? null

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 @min-[36rem]:flex-row @min-[36rem]:items-center @min-[36rem]:justify-between @min-[36rem]:gap-4">
      <div className="min-w-0 flex-1">
        <p className={`whitespace-pre-line font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{texto}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label htmlFor={selectId} className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
            Documento que lo respalda
          </label>
          <select
            id={selectId}
            value={documentoId ?? ''}
            onChange={(e) => onDocumento(e.target.value === '' ? null : Number(e.target.value))}
            className="max-w-full rounded-lg border border-sena-linea bg-transparent px-2 py-1 text-sm dark:border-sena-borde/70"
          >
            <option value="">Sin documento</option>
            {documentos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 @min-[36rem]:flex @min-[36rem]:shrink-0 @min-[36rem]:items-center">
        <Boton
          variante="contorno"
          tamano="tactil"
          onClick={() => documento && onVerDocumento(documento)}
          disabled={!documento || abriendo}
          aria-busy={abriendo}
          aria-label={documento ? `Ver documento: ${documento.nombre}` : 'Ver documento: elige primero el documento'}
          className="col-span-2 @min-[36rem]:col-auto"
        >
          {abriendo ? 'Abriendo…' : 'Ver documento'}
        </Boton>
        <RespuestaSiNo
          requisito={texto}
          valor={marca}
          onChange={(valor) => onMarca(valor === null ? undefined : valor)}
          textoSi="Cumple"
          textoNo="No cumple"
          className="col-span-2"
        />
      </div>
    </li>
  )
}
