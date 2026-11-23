import { EtiquetaSugerencia, SinDato } from './IndicadoresRanking'
import { CLASE_TH, CLASE_TD } from './clasesRanking'
import AvatarIniciales from '../../evaluacion/AvatarIniciales'
import Etiqueta from '../../ui/Etiqueta'
import { CasillaComparar } from '../BarraComparar'
import CasillaSeleccion from '../CasillaSeleccion'
import { CLASE_TARJETA_PLANA, CLASE_TBODY, CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE, CLASE_THEAD } from '../../../lib/estilos'
import { textoCumplimiento, textoNota } from '../../../lib/seleccion'

// Sección de PanelRanking. Recibe solo lo que muestra, por props.
export default function TablaRanking({ alternar, cargando, columnaCasillas, comparacion, conPuesto, enComparacion, filas, seleccion }) {
  return (
  <div className={`${CLASE_TARJETA_PLANA} overflow-hidden ${cargando ? 'opacity-60' : ''}`}>
    <table className="w-full table-fixed text-left text-sm">
      <caption className="sr-only">Ranking de candidatos listos</caption>
      {/* Puesto y Resultado son columnas propias en escritorio y solo existen con actividades (sin ellas no hay nada que
          mostrar). En móvil esos datos van bajo el nombre, con su etiqueta. 'Documental' tiene ancho de sobra para su
          encabezado en mayúsculas con el relleno de la celda: antes se recortaba contra el borde de la tarjeta. */}
      {/* Desde 640 px Aspirante ocupa poco más de un tercio (o el 60 % sin Puesto ni Resultado) y las demás columnas
          se reparten el resto por igual, en vez de dejarle todo el ancho sobrante al nombre. Por debajo, anchos fijos
          (el encabezado «Documental» necesita unos 115 px). */}
      {/* Entre 640 y 860 px las cifras necesitan anchos fijos; desde 860 px Aspirante toma un tercio y las cifras se
          reparten el resto por igual. La columna de casillas mide 96 px en modo comparación (su encabezado es más largo). */}
      <colgroup>
        {columnaCasillas && <col className={enComparacion ? 'w-24' : 'w-14 @min-[640px]:w-20'} />}
        <col className={conPuesto ? '@min-[860px]:w-[34%]' : '@min-[860px]:w-[56%]'} />
        {conPuesto && <col className="hidden w-16 @min-[640px]:table-column @min-[860px]:w-auto" />}
        {conPuesto && <col className="hidden w-24 @min-[640px]:table-column @min-[860px]:w-auto" />}
        <col className="hidden w-32 @min-[640px]:table-column @min-[860px]:w-auto" />
      </colgroup>
      <thead className={CLASE_THEAD}>
        <tr>
          {columnaCasillas && (
            <th scope="col" className={CLASE_TH}>
              {enComparacion ? 'Comparar' : 'Elegir'}
            </th>
          )}
          <th scope="col" className={CLASE_TH}>Aspirante</th>
          {conPuesto && <th scope="col" className={`hidden @min-[640px]:table-cell ${CLASE_TH} text-right`}>Puesto</th>}
          {conPuesto && <th scope="col" className={`hidden @min-[640px]:table-cell ${CLASE_TH} text-right`}>Resultado</th>}
          <th scope="col" className={`hidden @min-[640px]:table-cell ${CLASE_TH} text-right`}>Documental</th>
        </tr>
      </thead>
      <tbody className={CLASE_TBODY}>
        {filas.map((f) => {
          const res = textoNota(f.resultado_adicional)
          const doc = textoCumplimiento(f.cumplimiento_documental)
          return (
            <tr
              key={f.postulacion_id}
              className={
                f.sugerencia === 'empate_en_corte'
                  ? 'bg-aviso/5 hover:bg-aviso/10'
                  : 'hover:bg-sena-fondo/60 dark:hover:bg-sena-superficie-alta/40'
              }
            >
              {columnaCasillas && (
                <td className={CLASE_TD}>
                  {/* Una sola columna de casillas: «Elegir» en la vista normal, «Comparar» en el modo comparación. */}
                  {enComparacion ? (
                    <CasillaComparar comparacion={comparacion} id={f.postulacion_id} aspirante={f.aspirante} />
                  ) : (
                    <CasillaSeleccion
                      marcada={seleccion.has(f.postulacion_id)}
                      onCambiar={() => alternar(f)}
                      etiqueta={`Elegir a ${f.aspirante} como finalista`}
                    />
                  )}
                </td>
              )}
              <td className={CLASE_TD}>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="hidden shrink-0 @min-[860px]:block"><AvatarIniciales nombre={f.aspirante} /></span>
                  <div className="flex min-w-0 flex-col items-start gap-1">
                    {/* Dos líneas como máximo; el nombre completo también va en el title y en la casilla. */}
                    <span title={f.aspirante} className={`line-clamp-2 font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
                      {f.aspirante}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <EtiquetaSugerencia codigo={f.sugerencia} />
                      {f.finalista && <Etiqueta tono="azul" className="whitespace-nowrap">En la lista vigente</Etiqueta>}
                    </span>
                    {/* En móvil los datos van bajo el nombre y dicen qué son: «Puesto 1 · Resultado 10,00 · Documental 100 %». */}
                    {(conPuesto || doc != null) && (
                      <span className={`text-xs tabular-nums @min-[640px]:hidden ${CLASE_TEXTO_SUAVE}`}>
                        {[
                          conPuesto && `Puesto ${f.posicion ?? '—'}`,
                          conPuesto && `Resultado ${res ?? '—'}`,
                          doc != null && `Documental ${doc}`,
                        ]
                          .filter(Boolean)
                          // Espacio duro dentro de cada dato: la línea se parte entre datos, nunca entre «100» y «%».
                          .map((dato) => dato.replace(/ /g, ' '))
                          .join(' · ')}
                      </span>
                    )}
                  </div>
                </div>
              </td>
              {conPuesto && (
                <td className={`hidden @min-[640px]:table-cell ${CLASE_TD} text-right`}>
                  <span className={`font-semibold tabular-nums ${CLASE_TEXTO_FUERTE}`}>{f.posicion ?? '—'}</span>
                </td>
              )}
              {conPuesto && (
                <td className={`hidden @min-[640px]:table-cell ${CLASE_TD} text-right`}>
                  {res == null ? (
                    <SinDato lectura="Sin resultado" />
                  ) : (
                    <span className={`font-semibold tabular-nums ${CLASE_TEXTO_FUERTE}`}>{res}</span>
                  )}
                </td>
              )}
              <td className={`hidden @min-[640px]:table-cell ${CLASE_TD} text-right`}>
                {doc == null ? (
                  <SinDato lectura="Sin dato de cumplimiento" />
                ) : (
                  <span className={`font-medium tabular-nums ${CLASE_TEXTO_FUERTE}`}>{doc}</span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
  )
}
