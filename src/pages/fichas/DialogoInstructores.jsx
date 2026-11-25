import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import Dialogo from '../../components/ui/Dialogo'
import EncabezadoDialogo from '../../components/ui/EncabezadoDialogo'
import { MensajeError, MensajeExito } from '../../components/ui/Mensaje'
import Rueda from '../../components/ui/Rueda'
import { CLASE_CAMPO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { useInstructoresFicha } from './useInstructoresFicha'

const ID_TITULO = 'dialogo-instructores-titulo'

// Instructores de una ficha. Todos los que ven la ficha pueden consultar la lista completa; asignar y quitar es solo del super
// admin (`puedeGestionar`), y el backend lo exige igual. `ficha` es siempre la versión actual del listado: al asignar o quitar, el
// backend devuelve la ficha actualizada y se refleja aquí y en su tarjeta.
export default function DialogoInstructores({ ficha, puedeGestionar, onCerrar, onActualizada }) {
  const ctx = useInstructoresFicha({ ficha, puedeGestionar, onActualizada })
  const { exito, pausaExito, refResumen, asignar, asignando, cargando, disponibles, elegido, errorAccion, errorCarga, ocupado, quitandoId, quitar, reintentar, setElegido } = ctx
  const total = ficha.instructores.length

  return (
    <Dialogo idTitulo={ID_TITULO} onCerrar={ocupado ? () => {} : onCerrar} className="max-w-lg">
      <div className="@container flex flex-col gap-4 p-5 sm:p-6">
        <EncabezadoDialogo
          idTitulo={ID_TITULO}
          titulo={`Instructores de la ficha ${ficha.codigo}`}
          contexto={ficha.nombre_programa}
          onCerrar={onCerrar}
          deshabilitado={ocupado}
        />

        {errorAccion && <MensajeError>{errorAccion}</MensajeError>}
        {exito && (
          <div {...pausaExito}>
            <MensajeExito>{exito.texto}</MensajeExito>
          </div>
        )}

        <section aria-label="Instructores asignados" className="flex flex-col gap-2">
          <p ref={refResumen} tabIndex={-1} className={`text-sm font-medium focus:outline-none ${CLASE_TEXTO_SUAVE}`}>
            {total === 0 ? 'Sin instructores' : total === 1 ? '1 instructor asignado' : `${total} instructores asignados`}
          </p>
          {puedeGestionar && total > 0 && (
            // La API no dice en cuántas fichas está cada instructor, así que no se puede deshabilitar «Quitar» por adelantado: se avisa
            // antes y el servidor sigue aplicando la regla (y respondiendo si cambió mientras tanto).
            <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
              Cada instructor debe estar asignado al menos a una ficha. Para quitarlo de esta, primero asígnalo a otra si es su única ficha.
            </p>
          )}
          {total > 0 && (
            <ul className="divide-y divide-sena-linea/70 rounded-lg border border-sena-linea/70 dark:divide-sena-borde/50 dark:border-sena-borde/50">
              {ficha.instructores.map((instructor) => (
                <li key={instructor.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 [overflow-wrap:anywhere] dark:text-sena-texto">{instructor.name}</p>
                    {instructor.email && <p className={`text-xs [overflow-wrap:anywhere] ${CLASE_TEXTO_SUAVE}`}>{instructor.email}</p>}
                  </div>
                  {puedeGestionar && (
                    <Boton
                      variante="peligroSuave"
                      onClick={() => quitar(instructor)}
                      ocupado={quitandoId === instructor.id}
                      disabled={ocupado}
                      aria-label={`Quitar a ${instructor.name} de la ficha`}
                      className="shrink-0"
                    >
                      Quitar
                    </Boton>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {puedeGestionar && (
          <section aria-label="Asignar instructor" className="flex flex-col gap-3 border-t border-sena-linea/70 pt-4 dark:border-sena-borde/50">
            {cargando && (
              <p role="status" className={`flex items-center gap-2 text-sm ${CLASE_TEXTO_SUAVE}`}>
                <Rueda className="size-4" /> Cargando instructores…
              </p>
            )}

            {!cargando && errorCarga && (
              <div className="flex flex-col items-start gap-2">
                <MensajeError className="w-full">No pudimos cargar los instructores. {errorCarga}</MensajeError>
                <Boton variante="contorno" onClick={reintentar}>
                  Reintentar
                </Boton>
              </div>
            )}

            {!cargando && !errorCarga && disponibles.length === 0 && (
              <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>No hay más instructores para asignar a esta ficha.</p>
            )}

            {!cargando && !errorCarga && disponibles.length > 0 && (
              <>
                <Campo etiqueta="Agregar instructor">
                  {({ id }) => (
                    <select id={id} value={elegido} onChange={(e) => setElegido(e.target.value)} disabled={ocupado} className={CLASE_CAMPO}>
                      <option value="">Elige un instructor</option>
                      {disponibles.map((candidato) => (
                        <option key={candidato.id} value={candidato.id}>
                          {candidato.name}
                        </option>
                      ))}
                    </select>
                  )}
                </Campo>
                <div className="flex flex-col @min-[22rem]:flex-row @min-[22rem]:justify-end">
                  <Boton onClick={asignar} ocupado={asignando} disabled={!elegido || (ocupado && !asignando)} className="w-full @min-[22rem]:w-auto">
                    {asignando ? 'Asignando…' : 'Asignar'}
                  </Boton>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </Dialogo>
  )
}
