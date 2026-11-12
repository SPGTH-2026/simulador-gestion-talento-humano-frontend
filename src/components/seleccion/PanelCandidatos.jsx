import { useEffect, useState } from 'react'
import { candidatosConvocatoria } from '../../api/seleccion'
import { mensajeError } from '../../api/mensajeError'
import { EtiquetaConIcono } from '../evaluacion/PresentacionEvaluacion'
import AvatarIniciales from '../evaluacion/AvatarIniciales'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import { MensajeError } from '../ui/Mensaje'
import Rueda from '../ui/Rueda'
import Paginacion from './Paginacion'
import {
  CLASE_TARJETA_PLANA,
  CLASE_TBODY,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
  CLASE_THEAD,
} from '../../lib/estilos'
import { estadoDocumental, textoCumplimiento } from '../../lib/seleccion'

const CLASE_TH = 'whitespace-nowrap px-3 py-3 first:pl-4 last:pr-4'
const CLASE_TD = 'px-3 py-3.5 align-middle first:pl-4 last:pr-4'

function EtiquetaEstadoDocumental({ codigo }) {
  const e = estadoDocumental(codigo)
  return (
    <EtiquetaConIcono tono={e.tono} icono={<Icono nombre={e.icono} className="size-3.5" />}>
      {e.texto}
    </EtiquetaConIcono>
  )
}

// null es "sin dato" (se dice con palabras, no con un 0); 0 es un 0 % real.
function Cumplimiento({ valor }) {
  const texto = textoCumplimiento(valor)
  if (texto == null) {
    return (
      <span className={CLASE_TEXTO_SUAVE}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">Sin dato de cumplimiento</span>
      </span>
    )
  }
  return <span className={`font-medium tabular-nums ${CLASE_TEXTO_FUERTE}`}>{texto}</span>
}

// Candidatos (postulaciones enviadas) de UNA convocatoria. El padre lo monta con
// 'key' = id de la convocatoria: al cambiar de convocatoria el panel nace de cero
// (página 1, sin filas) y la respuesta tardía de la anterior se descarta porque
// su efecto ya fue limpiado.
export default function PanelCandidatos({ convocatoriaId }) {
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState({ fase: 'cargando', filas: [], meta: null, error: '' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    candidatosConvocatoria(convocatoriaId, { page: pagina })
      .then((res) => {
        if (vigente) setEstado({ fase: 'listo', filas: res.data, meta: res.meta, error: '' })
      })
      .catch((e) => {
        if (vigente) setEstado((previo) => ({ ...previo, fase: 'error', error: mensajeError(e) }))
      })
    return () => {
      vigente = false
    }
  }, [convocatoriaId, pagina, intento])

  const cambiarPagina = (n) => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setPagina(n)
  }
  const reintentar = () => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setIntento((n) => n + 1)
  }

  const { fase, filas, meta, error } = estado
  const cargando = fase === 'cargando'
  const hayFilas = filas.length > 0

  return (
    <div className="@container flex flex-col gap-4" aria-busy={cargando}>
      {fase === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <MensajeError>{error}</MensajeError>
          <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
            Reintentar
          </Boton>
        </div>
      )}

      {cargando && !hayFilas && (
        <p role="status" className={`flex items-center gap-2 py-8 text-sm ${CLASE_TEXTO_SUAVE}`}>
          <Rueda /> Cargando candidatos…
        </p>
      )}

      {fase === 'listo' && !hayFilas && (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <h3 className={`text-base font-semibold ${CLASE_TEXTO_FUERTE}`}>Aún no hay candidatos</h3>
          <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>
            Solo aparecen las postulaciones ya enviadas. Cuando un aspirante envíe la suya, la verás aquí.
          </p>
        </div>
      )}

      {hayFilas && (
        <div className={cargando ? 'opacity-60' : ''}>
          <div className="hidden @min-[640px]:block">
            <div className={`${CLASE_TARJETA_PLANA} overflow-hidden`}>
              <table className="w-full table-fixed text-left text-sm">
                <caption className="sr-only">Candidatos de la convocatoria</caption>
                <colgroup>
                  <col />
                  <col className="w-52" />
                  <col className="w-32" />
                </colgroup>
                <thead className={CLASE_THEAD}>
                  <tr>
                    <th scope="col" className={CLASE_TH}>Aspirante</th>
                    <th scope="col" className={CLASE_TH}>Estado documental</th>
                    <th scope="col" className={`${CLASE_TH} text-right`}>Cumplimiento</th>
                  </tr>
                </thead>
                <tbody className={CLASE_TBODY}>
                  {filas.map((c) => (
                    <tr key={c.id} className="hover:bg-sena-fondo/60 dark:hover:bg-sena-superficie-alta/40">
                      <td className={CLASE_TD}>
                        <div className="flex min-w-0 items-center gap-3">
                          <AvatarIniciales nombre={c.aspirante} />
                          <span className={`font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{c.aspirante}</span>
                        </div>
                      </td>
                      <td className={CLASE_TD}>
                        <EtiquetaEstadoDocumental codigo={c.estado_documental} />
                      </td>
                      <td className={`${CLASE_TD} text-right`}>
                        <Cumplimiento valor={c.cumplimiento} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="grid gap-3 @min-[640px]:hidden">
            {filas.map((c) => (
              <li key={c.id} className={`${CLASE_TARJETA_PLANA} flex min-w-0 flex-col gap-3 p-4`}>
                <div className="flex min-w-0 items-center gap-3">
                  <AvatarIniciales nombre={c.aspirante} />
                  <span className={`font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{c.aspirante}</span>
                </div>
                <dl className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-sena-linea/70 pt-3 dark:border-sena-borde/50">
                  <div>
                    <dt className="sr-only">Estado documental</dt>
                    <dd>
                      <EtiquetaEstadoDocumental codigo={c.estado_documental} />
                    </dd>
                  </div>
                  <div className="text-right">
                    <dt className={`text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Cumplimiento</dt>
                    <dd>
                      <Cumplimiento valor={c.cumplimiento} />
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hayFilas && meta && (
        <Paginacion
          meta={meta}
          unidad="candidato(s)"
          etiqueta="Paginación de candidatos"
          ocupado={cargando}
          onPagina={cambiarPagina}
        />
      )}
    </div>
  )
}
