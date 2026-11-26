import { useId } from 'react'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { ESTADO_DOCUMENTO, formatearPeso } from '../../lib/evaluacion'
import { EtiquetaConIcono } from './PresentacionEvaluacion'
import RespuestaSiNo from './RespuestaSiNo'

// Un requisito de la lista: el documento pedido por la convocatoria con lo que
// se sabe de él (si el aspirante lo cargó, si es obligatorio, cuánto pesa) y los
// controles del evaluador. Lo que el aspirante cargó y lo que el evaluador
// decide son cosas distintas: la etiqueta describe lo primero, Cumple / No cumple lo segundo.
//
// Un obligatorio aplicable SIN archivo no se puede marcar «Cumple» (el servidor lo rechaza): la etiqueta dice
// «Falta cargar el documento», «Cumple» queda desactivado y «No cumple» sigue disponible para que el evaluador lo
// marque de forma explícita, por ejemplo al enviar a corrección. Nada se marca por él.
export default function RequisitoEvaluacion({
  documento,
  peso,
  respuesta,
  actualizado = false,
  onChange,
  onVerDocumento,
  abriendo = false,
  items = [],
  marcasItems = {},
  onMarcaItem = () => {},
}) {
  const estado = ESTADO_DOCUMENTO[documento.estado] ?? ESTADO_DOCUMENTO.pendiente
  // Checklist propio del documento: cada ítem se marca Cumple / No cumple. Clave «docitem-{documento}-{n}» en el perfil.
  const pid = String(documento.id).replace(/^doc-/, '')
  const claveItem = (n) => `docitem-${pid}-${n}`
  const itemsCumplidos = items.filter((_, n) => marcasItems[claveItem(n)] === true).length
  // Lo que aporta este documento: su peso por la parte del checklist que cumple (si está marcado «Cumple»).
  const fraccion = items.length === 0 ? 1 : itemsCumplidos / items.length
  const aporte = respuesta === true && peso != null ? peso * fraccion : null
  const sinArchivo = !documento.archivo
  const faltante = sinArchivo && documento.estado === 'pendiente'
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
            <EtiquetaConIcono
              tono={estado.tono}
              icono={documento.estado === 'subido' ? <Icono nombre="check" className="size-3.5" /> : null}
            >
              {estado.texto}
            </EtiquetaConIcono>
          )}
          {peso != null && (
            <span className="whitespace-nowrap font-medium">
              {aporte != null ? `Aporta ${Math.round(aporte * 100) / 100} % de ${peso} %` : `Vale ${peso} %`}
            </span>
          )}
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
          {abriendo ? 'Abriendo…' : 'Ver documento'}
        </Boton>
        <RespuestaSiNo
          requisito={documento.nombre}
          valor={respuesta}
          onChange={onChange}
          textoSi="Cumple"
          textoNo="No cumple"
          ayudaId={faltante ? ayudaId : undefined}
          deshabilitadoSi={faltante}
          className="col-span-2"
        />
      </div>

      {items.length > 0 && (
        <details className="group w-full rounded-xl border border-sena-linea/70 bg-sena-superficie/40 dark:border-sena-borde/50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-sena-hundido/60 dark:hover:bg-white/5 [&::-webkit-details-marker]:hidden">
            <span className={`text-sm font-medium ${CLASE_TEXTO_FUERTE}`}>
              Checklist del documento
              <span className={`ml-2 font-normal ${CLASE_TEXTO_SUAVE}`}>
                · {itemsCumplidos} de {items.length} cumplen
              </span>
            </span>
            <Icono nombre="chevron" className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <ul className="mt-2 flex flex-col divide-y divide-sena-linea/70 px-3 dark:divide-sena-borde/50">
            {items.map((texto, n) => (
              <li
                key={claveItem(n)}
                className="flex flex-col gap-2 py-3 @min-[28rem]:flex-row @min-[28rem]:items-center @min-[28rem]:justify-between @min-[28rem]:gap-4"
              >
                <span className={`min-w-0 whitespace-pre-line text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{texto}</span>
                <div className="shrink-0">
                  <RespuestaSiNo
                    requisito={texto}
                    valor={marcasItems[claveItem(n)]}
                    onChange={(valor) => onMarcaItem(claveItem(n), valor)}
                    textoSi="Cumple"
                    textoNo="No cumple"
                  />
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </li>
  )
}
