import { useSeccionSkills } from './useSeccionSkills'
import { MAX_SKILLS, normalizarSkill } from '../../lib/postulacionDocumentos'
import FilaSkill from './FilaSkill'
import { ESTILO_GRUPO, ESTILO_TITULO, ESTILO_TARJETA } from './estilosSkills'

export default function SeccionSkills({
  vista,
  editable,
  asegurar,
  onRecargar,
}) {
  const ctx = useSeccionSkills({ vista, editable, asegurar, onRecargar })
  // Sin skills en la convocatoria ni declaradas antes, el hook devuelve null: la sección no se pinta.
  if (ctx === null) return null
  const { accionesDeclarada, buscarDeclarada, certificadosSubidos, declaradas, declarar, enVuelo, error, errorClave, esVieja, fallarEn, progresoCert, quitar, requeridas, tope, viejas } = ctx
  return (
    <section className={ESTILO_TARJETA}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={ESTILO_TITULO}>Skills</h2>
        <span className="text-xs text-slate-600 dark:text-sena-texto-suave">
          {declaradas.length} de {MAX_SKILLS}
        </span>
      </div>

      {requeridas.length > 0 && (
        <p className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">
          Activa las habilidades que deseas declarar. Son opcionales y no
          bloquean el envío de tu postulación. Puedes adjuntar un certificado.
        </p>
      )}

      {requeridas.length > 0 && (
        <div className="mt-3">
          <p className={ESTILO_GRUPO}>Requeridas por la convocatoria</p>
          <ul className="mt-1 flex flex-col divide-y divide-slate-100 dark:divide-sena-borde">
            {requeridas.map((requerida) => {
              const declarada = buscarDeclarada(requerida.nombre)
              // Una fila vieja que coincide con una skill de la convocatoria
              // tampoco se toca: se muestra con su nota, sin interruptor.
              const soloLectura = declarada ? esVieja(declarada) : false
              const clave = `req-${requerida.id ?? normalizarSkill(requerida.nombre)}`

              return (
                <FilaSkill
                  key={clave}
                  nombre={requerida.nombre}
                  declarada={declarada}
                  editable={editable}
                  enVuelo={enVuelo} progresoCert={progresoCert} certificadosSubidos={certificadosSubidos} error={error} errorClave={errorClave}
                  clave={clave}
                  tope={tope}
                  sinSiNo={soloLectura}
                  onActivar={() => {
                    if (declarada) return
                    declarar(clave, (fresco) => {
                      const id =
                        requerida.id ??
                        (fresco?.skills_convocatoria ?? []).find(
                          (s) => normalizarSkill(s.nombre) === normalizarSkill(requerida.nombre),
                        )?.id

                      // El backend solo admite la skill de la convocatoria (por
                      // id): sin id no se puede declarar.
                      if (!id) {
                        fallarEn(clave, 'No se encontró la skill de la convocatoria.')
                        return null
                      }

                      return { convocatoriaSkillId: id }
                    })
                  }}
                  onDesactivar={() => declarada && quitar(declarada)}
                  {...accionesDeclarada(declarada)}
                />
              )
            })}
          </ul>
        </div>
      )}

      {viejas.length > 0 && (
        <div className="mt-4">
          <p className={ESTILO_GRUPO}>Declaradas antes</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-sena-texto-suave">
            Registradas cuando la postulación todavía permitía agregar
            habilidades propias o del catálogo. Se conservan, pero ya no se
            pueden editar ni quitar.
          </p>
          <ul className="mt-1 flex flex-col divide-y divide-slate-100 dark:divide-sena-borde">
            {viejas.map((skill) => (
              <FilaSkill
                key={`skill-${skill.id}`}
                nombre={skill.nombre}
                declarada={skill}
                editable={editable}
                enVuelo={enVuelo} progresoCert={progresoCert} certificadosSubidos={certificadosSubidos} error={error} errorClave={errorClave}
                clave={`skill-${skill.id}`}
                tope={tope}
                sinSiNo
                {...accionesDeclarada(skill)}
              />
            ))}
          </ul>
        </div>
      )}

      {error && !errorClave && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {tope && (
        <p className="mt-3 text-sm text-slate-600 dark:text-sena-texto-suave">
          Alcanzaste el máximo de {MAX_SKILLS} skills.
        </p>
      )}
    </section>
  )
}