import { useEffect, useState } from 'react'
import { candidatosConvocatoria } from '../../api/seleccion'
import { mensajeError } from '../../api/mensajeError'
import { useAuth } from '../../auth/useAuth'
import { EtiquetaConIcono } from '../evaluacion/PresentacionEvaluacion'
import AvatarIniciales from '../evaluacion/AvatarIniciales'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import { MensajeError } from '../ui/Mensaje'
import Rueda from '../ui/Rueda'
import DetalleCandidato from './DetalleCandidato'
import Paginacion from '../ui/Paginacion'
import {
  CLASE_TARJETA_PLANA,
  CLASE_TBODY,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
  CLASE_THEAD,
} from '../../lib/estilos'
import { estadoDocumental, puedeDesignarReferencia, textoCumplimiento } from '../../lib/seleccion'

const CLASE_TH = 'whitespace-nowrap px-3 py-2.5 first:pl-4 last:pr-4'
const CLASE_TD = 'px-3 py-2.5 align-middle first:pl-4 last:pr-4'
// Columnas que solo caben desde ~520 px de panel; por debajo sus datos pasan bajo el nombre.
const ANCHA_TH = `hidden @min-[520px]:table-cell ${CLASE_TH}`
const ANCHA_TD = `hidden @min-[520px]:table-cell ${CLASE_TD}`

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

// Candidatos (postulaciones enviadas) de UNA convocatoria. El padre lo monta con 'key' = id de la
// convocatoria: al cambiar de convocatoria el panel nace de cero (página 1, sin filas, sin detalle abierto) y la
// respuesta tardía de la anterior se descarta porque su efecto ya fue limpiado.
// 'activo': la pestaña está a la vista. Los datos se piden la primera vez que se abre y no se repiten al volver.
export default function PanelCandidatos({ convocatoriaId, activo = true }) {
  const { user, can } = useAuth()
  const puedeDecidir = can('seleccion:decidir')
  const puedeDesignar = puedeDesignarReferencia(user, can)

  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState({ fase: 'cargando', filas: [], meta: null, error: '' })
  const [intento, setIntento] = useState(0)
  // La pestaña se abrió al menos una vez: desde ahí los datos se piden.
  const [abierta, setAbierta] = useState(activo)
  if (activo && !abierta) setAbierta(true)
  // Candidato cuyo detalle está abierto (id de la postulación). El detalle se pide solo al abrirlo.
  const [abierto, setAbierto] = useState(null)

  useEffect(() => {
    if (!abierta) return undefined
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
  }, [abierta, convocatoriaId, pagina, intento])

  const cambiarPagina = (n) => {
    setAbierto(null)
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setPagina(n)
  }
  const reintentar = () => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setIntento((n) => n + 1)
  }

  // Lo que el servidor devolvió al guardar una referencia o una nota se aplica a la fila, sin recargar la lista:
  // la convocatoria y la página siguen siendo las mismas.
  const actualizarFila = ({ id, estado_documental, cumplimiento }) => {
    setEstado((previo) => ({
      ...previo,
      filas: previo.filas.map((f) =>
        f.id === id
          ? {
              ...f,
              ...(estado_documental !== undefined && { estado_documental }),
              ...(cumplimiento !== undefined && { cumplimiento }),
            }
          : f,
      ),
    }))
  }

  const { fase, filas, meta, error } = estado
  const cargando = fase === 'cargando'
  const hayFilas = filas.length > 0
  const filaAbierta = filas.find((f) => f.id === abierto) ?? null

  return (
    <div className="@container flex flex-col gap-3" aria-busy={cargando}>
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
        <div className={`${CLASE_TARJETA_PLANA} overflow-hidden ${cargando ? 'opacity-60' : ''}`}>
          <table className="w-full table-fixed text-left text-sm">
            <caption className="sr-only">Candidatos de la convocatoria</caption>
            <colgroup>
              <col />
              <col className="hidden w-40 @min-[520px]:table-column" />
              <col className="hidden w-24 @min-[520px]:table-column" />
              <col className="w-36" />
            </colgroup>
            <thead className={CLASE_THEAD}>
              <tr>
                <th scope="col" className={CLASE_TH}>Aspirante</th>
                <th scope="col" className={ANCHA_TH}>Estado documental</th>
                <th scope="col" className={`${ANCHA_TH} text-right`}>Cumplimiento</th>
                <th scope="col" className={`${CLASE_TH} text-right`}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className={CLASE_TBODY}>
              {filas.map((c) => (
                <tr key={c.id} className="hover:bg-sena-fondo/60 dark:hover:bg-sena-superficie-alta/40">
                  <td className={CLASE_TD}>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="hidden shrink-0 @min-[520px]:block"><AvatarIniciales nombre={c.aspirante} /></span>
                      <div className="flex min-w-0 flex-col items-start gap-1">
                        {/* Dos líneas como máximo; el nombre completo también va en el title y en el botón del detalle. */}
                        <span
                          title={c.aspirante}
                          className={`line-clamp-2 font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}
                        >
                          {c.aspirante}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 @min-[520px]:hidden">
                          <EtiquetaEstadoDocumental codigo={c.estado_documental} />
                          <span className="text-xs">
                            <Cumplimiento valor={c.cumplimiento} />
                          </span>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={ANCHA_TD}>
                    <EtiquetaEstadoDocumental codigo={c.estado_documental} />
                  </td>
                  <td className={`${ANCHA_TD} text-right`}>
                    <Cumplimiento valor={c.cumplimiento} />
                  </td>
                  <td className={`${CLASE_TD} text-right`}>
                    <Boton
                      variante="contorno"
                      tamano="tactil"
                      aria-label={`Abrir el detalle de ${c.aspirante}`}
                      onClick={() => setAbierto(c.id)}
                    >
                      Ver detalle
                    </Boton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hayFilas && meta && (
        <Paginacion
          meta={meta}
          singular="candidato"
          plural="candidatos"
          etiqueta="Paginación de candidatos"
          ocupado={cargando}
          onPagina={cambiarPagina}
          className="px-1"
        />
      )}

      {filaAbierta && (
        <DetalleCandidato
          key={filaAbierta.id}
          convocatoriaId={convocatoriaId}
          fila={filaAbierta}
          puedeDecidir={puedeDecidir}
          puedeDesignar={puedeDesignar}
          onCerrar={() => setAbierto(null)}
          onCambio={actualizarFila}
        />
      )}
    </div>
  )
}
