import { useEffect, useId } from 'react'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import VisorEnLinea from '../ui/VisorEnLinea'
import { CLASE_TARJETA, CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { atajoDocumento, claveItem, formatearPorcentaje, indicadorDocumento, resumenChecklist } from '../../lib/evaluacion'
import { MensajeAviso } from '../ui/Mensaje'
import { EtiquetaIndicador } from './PresentacionEvaluacion'
import RespuestaSiNo from './RespuestaSiNo'

// Calificar un documento con el archivo a un lado (60 % del ancho) y su checklist al otro (apilados en pantallas estrechas).
// «Ampliar documento» lo lleva a pantalla casi completa, con el archivo grande y el checklist en una columna a su lado; «Reducir»
// (o Escape) vuelve a la vista normal.
//  - Con checklist: cada ítem se marca ✓ / ✗ y el documento muestra un indicador de solo lectura según la mayoría de los ítems.
//  - Sin checklist: solo «Cumple» / «No cumple» del documento.
export default function PanelCalificarDocumento({
  documento,
  ruta,
  puntos,
  respuestas,
  itemMarcas,
  ampliado,
  soloLectura = false,
  faltante = false,
  onAmpliar,
  onCerrar,
  onMarcaItem,
  onMarcaDocumento,
}) {
  const idTitulo = useId()
  const items = documento.items ?? []
  const atajo = atajoDocumento(documento, respuestas)
  const indicador = indicadorDocumento(documento, itemMarcas)
  const resumen = resumenChecklist(documento, itemMarcas)

  // En pantalla casi completa, Escape vuelve a la vista normal.
  useEffect(() => {
    if (!ampliado) return undefined
    const alTeclear = (e) => {
      if (e.key === 'Escape') onAmpliar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [ampliado, onAmpliar])

  return (
    <section
      aria-labelledby={idTitulo}
      className={
        ampliado
          ? 'fixed inset-0 z-50 flex flex-col gap-3 overflow-auto bg-sena-fondo p-4 dark:bg-sena-noche'
          : `${CLASE_TARJETA} flex flex-col gap-3 p-4`
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={idTitulo} className={`text-base font-semibold ${CLASE_TEXTO_FUERTE}`}>
          Calificando: {documento.nombre}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {!faltante && (
            <Boton variante="contorno" onClick={onAmpliar} aria-pressed={ampliado}>
              {ampliado ? 'Reducir documento' : 'Ampliar documento'}
            </Boton>
          )}
          <Boton variante="fantasma" onClick={onCerrar}>
            Cerrar
          </Boton>
        </div>
      </div>

      <div className={`grid min-h-0 flex-1 gap-4 ${ampliado ? 'lg:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]' : 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'}`}>
        {faltante ? (
          <MensajeAviso>El aspirante todavía no cargó este documento: no hay nada que abrir.</MensajeAviso>
        ) : (
          <VisorEnLinea ruta={ruta} titulo={documento.nombre} altura={ampliado ? 'h-[calc(100vh-7rem)]' : 'h-[80vh]'} />
        )}

        <div className={`flex min-w-0 flex-col gap-3 ${ampliado ? 'overflow-auto' : ''}`}>
          {atajo.visible ? (
            <div className="flex flex-col gap-2">
              <p className={`text-sm font-medium ${CLASE_TEXTO_FUERTE}`}>
                Resultado del documento
                {puntos != null && <span className={`ml-2 font-normal ${CLASE_TEXTO_SUAVE}`}>Vale {formatearPorcentaje(puntos)}</span>}
              </p>
              <RespuestaSiNo
                requisito={documento.nombre}
                valor={atajo.valor}
                onChange={(valor) => onMarcaDocumento(valor)}
                textoSi="Cumple"
                textoNo="No cumple"
                deshabilitadoSi={soloLectura || faltante}
                deshabilitadoNo={soloLectura}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <p className={`flex flex-wrap items-center gap-2 text-sm font-medium ${CLASE_TEXTO_FUERTE}`}>
                Documento
                <EtiquetaIndicador indicador={indicador} />
                {puntos != null && <span className={`font-normal ${CLASE_TEXTO_SUAVE}`}>Vale {formatearPorcentaje(puntos)}</span>}
              </p>
              <p className={`flex items-start gap-1.5 text-xs ${CLASE_TEXTO_SUAVE}`}>
                <Icono nombre="reloj" className="mt-0.5 size-3.5 shrink-0" />
                Se considera «Cumple» si cumplen más de la mitad de los ítems ({indicador.necesita} de {indicador.total}). El puntaje es proporcional: cada ítem
                aporta {formatearPorcentaje(Number(puntos) / items.length)}.
              </p>
            </div>
          )}

          {items.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className={`text-sm font-medium ${CLASE_TEXTO_FUERTE}`}>
                Checklist
                <span className={`ml-2 font-normal ${CLASE_TEXTO_SUAVE}`}>
                  · {resumen.cumplen} de {resumen.total} cumplen
                  {resumen.sinResponder > 0 && ` · ${resumen.sinResponder} sin calificar`}
                </span>
              </p>
              <ul className="flex flex-col divide-y divide-sena-linea/70 dark:divide-sena-borde/50">
                {items.map((texto, n) => (
                  <li key={claveItem(documento.id, n)} className="flex items-center justify-between gap-3 py-2.5">
                    <span className={`min-w-0 whitespace-pre-line text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{texto}</span>
                    <div className="shrink-0">
                      <RespuestaSiNo
                        requisito={texto}
                        valor={itemMarcas[claveItem(documento.id, n)]}
                        onChange={(valor) => onMarcaItem(claveItem(documento.id, n), valor)}
                        textoSi="Cumple"
                        textoNo="No cumple"
                        deshabilitadoSi={soloLectura || faltante}
                        deshabilitadoNo={soloLectura}
                        cuadrado
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
