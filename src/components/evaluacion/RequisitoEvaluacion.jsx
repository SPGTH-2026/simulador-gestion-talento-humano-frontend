import { useId } from 'react'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { ESTADO_DOCUMENTO, atajoDocumento, formatearPorcentaje, indicadorDocumento, resumenChecklist } from '../../lib/evaluacion'
import { EtiquetaConIcono, EtiquetaIndicador } from './PresentacionEvaluacion'
import RespuestaSiNo from './RespuestaSiNo'

// Un requisito de la lista: el documento pedido por la convocatoria con lo que se sabe de él (si el aspirante lo cargó, cuántos
// puntos vale y cuántos aporta) y los controles del evaluador. Lo que el aspirante cargó y lo que el evaluador decide son cosas
// distintas: la etiqueta describe lo primero, Cumple / No cumple lo segundo.
//
// «Calificar» abre el documento con su checklist al lado (PanelCalificarDocumento). Con checklist no hay botones: la fila muestra
// un indicador de solo lectura («Cumple · 4 de 6») según la mayoría de los ítems. Sin checklist, «Cumple» / «No cumple».
//
// Un obligatorio aplicable SIN archivo no se puede marcar «Cumple» (el servidor lo rechaza): la etiqueta dice «Falta cargar el
// documento», «Cumple» queda desactivado y «No cumple» sigue disponible para marcarlo de forma explícita. Nada se marca por él.
export default function RequisitoEvaluacion({
  documento,
  puntos,
  respuestas,
  itemMarcas,
  aporte,
  activo = false,
  actualizado = false,
  soloLectura = false,
  onCalificar,
  onMarcaDocumento,
}) {
  const estado = ESTADO_DOCUMENTO[documento.estado] ?? ESTADO_DOCUMENTO.pendiente
  const items = documento.items ?? []
  const resumen = resumenChecklist(documento, itemMarcas)
  const atajo = atajoDocumento(documento, respuestas)
  const indicador = indicadorDocumento(documento, itemMarcas)
  const faltante = !documento.archivo && documento.estado === 'pendiente'
  const ayudaId = useId()

  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 @min-[36rem]:flex-row @min-[36rem]:flex-wrap @min-[36rem]:items-center @min-[36rem]:justify-between @min-[36rem]:gap-4">
      <div className="min-w-0">
        <p className={`font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{documento.nombre}</p>
        <p className={`mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${CLASE_TEXTO_SUAVE}`}>
          {faltante ? (
            <span id={ayudaId}>
              <EtiquetaConIcono tono="aviso" icono={<Icono nombre="alerta" className="size-3.5" />}>
                Falta cargar el documento
              </EtiquetaConIcono>
            </span>
          ) : (
            <EtiquetaConIcono tono={estado.tono} icono={documento.estado === 'subido' ? <Icono nombre="check" className="size-3.5" /> : null}>
              {estado.texto}
            </EtiquetaConIcono>
          )}
          <span className="whitespace-nowrap font-medium">
            Aporta {formatearPorcentaje(aporte)} de {formatearPorcentaje(puntos)}
          </span>
          {items.length > 0 && (
            <>
              <EtiquetaIndicador indicador={indicador} />
              {resumen.sinResponder > 0 && <span className="whitespace-nowrap">{resumen.sinResponder} sin calificar</span>}
            </>
          )}
          {actualizado && (
            <EtiquetaConIcono tono="azul" icono={<Icono nombre="reintentar" className="size-3.5" />}>
              Corregido por el aspirante
            </EtiquetaConIcono>
          )}
          <span className="whitespace-nowrap">{documento.obligatorio ? 'Obligatorio' : 'Opcional'}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 @min-[36rem]:flex @min-[36rem]:shrink-0 @min-[36rem]:items-center">
        <Boton
          variante={activo ? 'primario' : 'contorno'}
          tamano="tactil"
          onClick={onCalificar}
          aria-label={`${faltante ? 'Revisar' : 'Calificar'} documento: ${documento.nombre}`}
          aria-pressed={activo}
          className="col-span-2 @min-[36rem]:col-auto"
        >
          {soloLectura ? 'Ver documento' : 'Calificar'}
        </Boton>
        {atajo.visible && (
          <RespuestaSiNo
            requisito={documento.nombre}
            valor={atajo.valor}
            onChange={onMarcaDocumento}
            textoSi="Cumple"
            textoNo="No cumple"
            ayudaId={faltante ? ayudaId : undefined}
            deshabilitadoSi={faltante || soloLectura}
            deshabilitadoNo={soloLectura}
            className="col-span-2"
          />
        )}
      </div>
    </li>
  )
}
