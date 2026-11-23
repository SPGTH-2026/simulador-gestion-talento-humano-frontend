import ErrorTotalRanking from './ranking/ErrorTotalRanking'
import CargandoRanking from './ranking/CargandoRanking'
import { usePanelRanking } from './ranking/usePanelRanking'
import EleccionFinalistas from './ranking/EleccionFinalistas'
import AvisosRanking from './ranking/AvisosRanking'
import PaginacionRanking from './ranking/PaginacionRanking'
import SinCandidatosRanking from './ranking/SinCandidatosRanking'
import SinConfigurarRanking from './ranking/SinConfigurarRanking'
import TablaRanking from './ranking/TablaRanking'
import ResumenRanking from './ranking/ResumenRanking'
import { DialogoConfirmacion } from './ranking/DialogoConfirmacion'
import Boton from '../ui/Boton'
import { MensajeError } from '../ui/Mensaje'
import BarraComparar from './BarraComparar'

export default function PanelRanking({ convocatoriaId, activo = true, enProceso, puedeDecidir, comparacion, onConfirmada }) {
  const ctx = usePanelRanking({ convocatoriaId, activo, enProceso, puedeDecidir, comparacion, onConfirmada })
  if (ctx.fase === 'error' && !ctx.meta) return <ErrorTotalRanking ctx={ctx} />
  if (!ctx.meta) return <CargandoRanking />
  const { alConfirmar, alRankingDesactualizado, avisos, borrador, cargando, desactualizado, empate, enComparacion, error, fase, hayFilas, meta, modo, puedeElegir, recargar, revision, seleccion, setBorrador, setRevision } = ctx;
  return (
    <div className="@container flex flex-col gap-3" aria-busy={cargando}>
      {fase === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <MensajeError>{error}</MensajeError>
          <Boton variante="contorno" tamano="tactil" onClick={recargar}>
            Reintentar
          </Boton>
        </div>
      )}

      {/* Resumen en una tarjeta, igual que la de Decidir: solo las cifras que ayudan a decidir según la configuración. */}
      <ResumenRanking ctx={ctx} />

      {avisos.length > 0 && (
        <AvisosRanking ctx={ctx} />
      )}

      {modo === 'pendiente_de_configurar' && (
        <SinConfigurarRanking ctx={ctx} />
      )}

      {modo !== 'pendiente_de_configurar' && !hayFilas && (
        <SinCandidatosRanking ctx={ctx} />
      )}

      {/* «Comparar candidatos» (CU-SEL-017) es un modo de la tabla, independiente de «Elegir»: sus marcas se guardan aparte
          y sobreviven a la paginación. Mientras está activo no hay casillas de «Elegir» ni acciones de confirmar, pero la
          elección (estado de este panel, que sigue montado) queda tal cual y reaparece al salir. */}
      {hayFilas && <BarraComparar comparacion={comparacion} total={meta.total} singular="candidato listo" plural="candidatos listos" />}

      {hayFilas && (
        <TablaRanking ctx={ctx} />
      )}

      {/* Con una sola página el total ya está en la cabecera de la tabla: solo se pagina cuando hay más de una. */}
      {hayFilas && (meta.last_page ?? 1) > 1 && (
        <PaginacionRanking ctx={ctx} />
      )}

      {puedeElegir && !enComparacion && hayFilas && (
        <EleccionFinalistas ctx={ctx} />
      )}

      {revision && (
        <DialogoConfirmacion
          convocatoriaId={convocatoriaId}
          version={meta.version}
          modo={modo}
          empate={empate}
          objetivo={meta.objetivo.efectivo}
          seleccion={seleccion}
          totalSugeridos={meta.sugeridos}
          justificacion={borrador}
          onJustificacion={setBorrador}
          desactualizado={desactualizado}
          onCerrar={() => setRevision(false)}
          onConfirmada={alConfirmar}
          onDesactualizado={alRankingDesactualizado}
        />
      )}
    </div>
  )
}

// Revisión final antes de confirmar. La justificación es obligatoria cuando se elige a mano (sin
// actividades), se resuelve un empate en el corte o la lista difiere de la sugerida; si el servidor la
// pide y aquí no se preveía, el error aparece bajo el campo.
