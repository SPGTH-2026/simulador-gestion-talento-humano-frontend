import Boton from '../../ui/Boton'
import { CLASE_INPUT } from '../../../lib/estilos'
import { MAX_SKILLS, MAX_SKILL_LONGITUD } from '../convocatoriaWizardUtils'

// Campo de porcentaje de una habilidad: se habilita solo cuando la habilidad está elegida.
function PorcentajeSkill({ ctx, nombre, habilitado, soloLectura }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <input
        type="number"
        min="0"
        max="100"
        step="0.01"
        value={ctx.porcentajeSkill(nombre)}
        onChange={(e) => ctx.cambiarPorcentajeSkill(nombre, e.target.value)}
        disabled={!habilitado || soloLectura}
        aria-label={`Porcentaje de ${nombre}`}
        placeholder="—"
        className={`${CLASE_INPUT} w-24 text-right`}
      />
      <span className="text-sm text-slate-500 dark:text-sena-texto-suave">%</span>
    </div>
  )
}

// Etapa 4 del asistente de convocatorias. Recibe el estado y las acciones del asistente en la prop ctx.
export default function EtapaSkills({ ctx }) {
  const { agregarSkill, alternarSkillCatalogo, errorDeSkills, errorSkill, form, nuevaSkill, quitarSkill, setNuevaSkill, skillEstaAgregada, skillsCatalogo, skillsLibres, soloLectura, sumaTotal } = ctx
  return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-600 dark:text-sena-texto-suave">
          Porcentaje total de documentos y habilidades: <strong>{sumaTotal()}%</strong> de 100%. Cada habilidad elegida
          necesita su porcentaje.
        </p>

        {/* Del catálogo: casillas en una rejilla. Al elegir una habilidad se habilita su porcentaje. */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
            Del catálogo
          </h3>
          <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
            Marca las habilidades técnicas que pide la convocatoria.
          </p>

          {skillsCatalogo.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-sena-texto-suave">
              No hay skills en el catálogo.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {skillsCatalogo.map((opcion) => {
                const elegida = skillEstaAgregada(opcion.nombre)
                return (
                  <div
                    key={opcion.id}
                    className="flex items-center justify-between gap-2 rounded border border-slate-200 p-3 text-sm text-slate-700 dark:border-sena-borde dark:text-sena-texto"
                  >
                    <label className="flex min-w-0 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={elegida}
                        onChange={() => alternarSkillCatalogo(opcion)}
                        disabled={soloLectura}
                        className="h-4 w-4 accent-sena"
                      />
                      <span className="min-w-0 break-words">{opcion.nombre}</span>
                    </label>
                    <PorcentajeSkill ctx={ctx} nombre={opcion.nombre} habilitado={elegida} soloLectura={soloLectura} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Texto libre: se escribe y se agrega. Solo se listan las que NO vienen del catálogo. */}
        {(!soloLectura || skillsLibres.length > 0) && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
              Agregar otra habilidad
            </h3>

            {!soloLectura && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevaSkill}
                  maxLength={MAX_SKILL_LONGITUD}
                  placeholder="Escribe una habilidad y presiona Enter"
                  onChange={(e) => setNuevaSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      agregarSkill(nuevaSkill)
                    }
                  }}
                  className={CLASE_INPUT + ' flex-1'}
                />
                <Boton onClick={() => agregarSkill(nuevaSkill)}>Agregar</Boton>
              </div>
            )}

            {skillsLibres.length > 0 && (
              <ul className="flex flex-col divide-y divide-slate-100 dark:divide-sena-borde">
                {skillsLibres.map((s) => (
                  <li
                    key={`${s.nombre}-${s.parametro_id ?? 'libre'}`}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <span className="min-w-0 break-words text-sm text-slate-700 dark:text-sena-texto">
                      {s.nombre}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <PorcentajeSkill ctx={ctx} nombre={s.nombre} habilitado soloLectura={soloLectura} />
                      {!soloLectura && (
                        <Boton
                          variante="peligroSuave"
                          aria-label={`Quitar ${s.nombre}`}
                          onClick={() => quitarSkill(s.nombre)}
                        >
                          Quitar
                        </Boton>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {form.skills.length > 0 && (
          <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
            {form.skills.length} de {MAX_SKILLS} skills agregadas.
          </p>
        )}

        {errorSkill && (
          <span className="text-xs text-red-600 dark:text-red-400">{errorSkill}</span>
        )}
        {errorDeSkills && (
          <span className="text-xs text-red-600 dark:text-red-400">{errorDeSkills}</span>
        )}
      </div>
  )
}
