import { CLASE_FILA, CLASE_TD, CLASE_INPUT } from '../../lib/estilos'
import Boton from '../../components/ui/Boton'
import Etiqueta from '../../components/ui/Etiqueta'

// Fila de una ficha (solo lectura): código, programa, estado, instructores y acciones según el permiso.
export default function FilaFicha({ ficha, ctx }) {
  const { asignandoId, asignar, elegido, empezarEdicion, eliminar, esSuperAdmin, instructores, quitar, setElegido } = ctx
  return (
                    <tr className={CLASE_FILA}>
      <td className={CLASE_TD}>
        <div className="font-semibold text-slate-800 dark:text-sena-texto">
          {ficha.codigo}
        </div>
        <div className="text-xs text-slate-500 dark:text-sena-texto-suave">
          {ficha.nombre_programa}
        </div>
      </td>

      <td className={CLASE_TD}>
        <Etiqueta tono={ficha.estado === 'activa' ? 'exito' : 'neutral'}>
          {ficha.estado === 'activa' ? 'Activa' : 'Cerrada'}
        </Etiqueta>
      </td>

      <td className={`${CLASE_TD} text-slate-700 dark:text-sena-texto`}>
        {ficha.creado_por ? ficha.creado_por.name : '—'}
      </td>

      <td className={`${CLASE_TD} min-w-60`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {ficha.instructores.length === 0 && (
            <span className="text-xs text-slate-500 dark:text-sena-texto-suave">
              Sin instructores
            </span>
          )}

          {ficha.instructores.map((instructor) => (
            <span
              key={instructor.id}
              className="inline-flex items-center gap-1 rounded-full bg-sena-cielo/40 py-0.5 pl-2.5 pr-1 text-xs font-medium text-sena-azul dark:bg-sena-superficie-alta dark:text-sena-texto"
            >
              {instructor.name}
              {esSuperAdmin && (
                // Quitar: la «×» mide 28 px, pero su zona de toque llega a 44 px (after:-inset-2); con hover y foco visibles.
                <button
                  type="button"
                  onClick={() => quitar(ficha, instructor)}
                  className="relative grid size-7 place-items-center rounded-full font-bold text-peligro transition-colors after:absolute after:-inset-2 after:content-[''] hover:bg-peligro/10 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sena motion-reduce:transition-none"
                  title="Quitar de la ficha"
                  aria-label={`Quitar a ${instructor.name} de la ficha`}
                >
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </span>
          ))}
        </div>

        {esSuperAdmin && (
          <div className="mt-2 flex flex-col items-stretch gap-2">
            <select
              aria-label={`Instructor para la ficha ${ficha.codigo}`}
              value={elegido[ficha.id] ?? ''}
              onChange={(e) => setElegido({ ...elegido, [ficha.id]: e.target.value })}
              className={CLASE_INPUT}
            >
              <option value="">— Instructor —</option>
              {instructores
                .filter((i) => !ficha.instructores.some((asignado) => asignado.id === i.id))
                .map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name}
                  </option>
                ))}
            </select>
            <Boton
              variante="contorno"
              tamano="tactil"
              className="self-start"
              onClick={() => asignar(ficha)}
              disabled={asignandoId === ficha.id || !elegido[ficha.id]}
            >
              Asignar
            </Boton>
          </div>
        )}
      </td>

      <td className={`${CLASE_TD} text-slate-700 dark:text-sena-texto`}>
        {ficha.convocatorias_count}
      </td>

      <td className={`${CLASE_TD} text-slate-700 dark:text-sena-texto`}>
        {ficha.usuarios_count}
      </td>

      <td className={`${CLASE_TD} text-right`}>
        <div className="flex justify-end gap-2">
          {ficha.puede_gestionar && (
            <>
              <Boton variante="contorno" tamano="tactil" onClick={() => empezarEdicion(ficha)}>
                Editar
              </Boton>
              <Boton variante="peligro" tamano="tactil" onClick={() => eliminar(ficha)}>
                Eliminar
              </Boton>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}
