import { useEffect, useRef, useState } from 'react'
import { validarArchivoPostulacion } from '../../lib/archivosPostulacion'
import { MAX_SKILLS, normalizarSkill } from '../../lib/postulacionDocumentos'
import { CLASE_TARJETA, CLASE_TITULO_SECCION } from '../../lib/estilos'
import {
  declararSkill,
  eliminarSkill,
  subirCertificado,
  quitarCertificado,
} from '../../api/postulacionesDocumentos'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import BarraProgreso from '../ui/BarraProgreso'

const ESTILO_TARJETA = `${CLASE_TARJETA} p-4`

const ESTILO_TITULO = CLASE_TITULO_SECCION

const ESTILO_GRUPO =
  'text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave'

const CLASE_BOTON =
  'rounded border border-sena-azul/25 px-3 py-1.5 text-xs font-semibold text-sena-azul transition-colors hover:bg-sena-cielo/30 disabled:cursor-not-allowed disabled:opacity-40 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta'

const CLASE_ETIQUETA =
  'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-sena-superficie-alta dark:text-sena-texto-suave'

const CLASE_CERTIFICADA =
  'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'

const origenTexto = (origen) =>
  origen === 'convocatoria'
    ? 'De la convocatoria'
    : origen === 'catalogo'
      ? 'Del catálogo'
      : 'Propia'

// Una fila de skill: nombre + Sí/No (las filas de solo lectura NO tienen
// Sí/No) y, cuando está declarada, el estado Certificada/Declarada con sus
// acciones.
//
// `sinSiNo` marca las filas que NO se pueden marcar ni desmarcar: son las
// declaradas antes del cambio (del catálogo o propias). Se muestran tal cual,
// con la nota "declaradas antes", sin editar ni borrar.
function FilaSkill({
  nombre,
  declarada,
  editable,
  enVuelo,
  progresoCert,
  certificadosSubidos,
  clave,
  tope,
  sinSiNo = false,
  onActivar,
  onDesactivar,
  onAdjuntar,
  onDescargar,
  onQuitarCertificado,
  registrarRef,
  onArchivo,
}) {
  const activa = Boolean(declarada)
  const certificado = declarada?.certificado || (declarada?.id ? certificadosSubidos?.[declarada.id] : null)
  const ocupada =
    enVuelo === clave ||
    (activa && (enVuelo === `cert-${declarada.id}` || enVuelo === `skill-${declarada.id}`))

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-sena-texto">
          {nombre}
          {activa && <span className={CLASE_ETIQUETA}>{origenTexto(declarada.origen)}</span>}
          {activa && (
            <span className={certificado ? CLASE_CERTIFICADA : CLASE_ETIQUETA}>
              {certificado ? 'Certificada' : 'Declarada'}
            </span>
          )}
          {sinSiNo && (
            <span className={CLASE_ETIQUETA}>Declarada antes</span>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {!sinSiNo && (
            <div className="inline-flex overflow-hidden rounded border border-slate-200 dark:border-sena-borde">
              <button
                type="button"
                aria-pressed={activa}
                onClick={onActivar}
                disabled={!editable || Boolean(enVuelo) || (tope && !activa)}
                className={`px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  activa
                    ? 'bg-sena-oscuro text-white'
                    : 'bg-white text-slate-600 dark:bg-sena-noche dark:text-sena-texto-suave'
                }`}
              >
                Sí
              </button>
              <button
                type="button"
                aria-pressed={!activa}
                onClick={onDesactivar}
                disabled={!editable || Boolean(enVuelo) || !activa}
                className={`border-l border-slate-200 px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 dark:border-sena-borde ${
                  !activa
                    ? 'bg-sena-oscuro text-white'
                    : 'bg-white text-slate-600 dark:bg-sena-noche dark:text-sena-texto-suave'
                }`}
              >
                No
              </button>
            </div>
          )}

          {activa && (
            certificado ? (
              <>
                <button type="button" disabled={ocupada} onClick={onDescargar} className={CLASE_BOTON}>
                  Ver
                </button>
                {editable && !sinSiNo && (
                  <button
                    type="button"
                    disabled={Boolean(enVuelo)}
                    onClick={onAdjuntar}
                    className="px-3 py-1.5 text-xs font-semibold text-sena-azul border border-sena-azul/25 rounded hover:bg-sena-cielo/30 transition-colors hover:bg-sena-cielo/30 disabled:cursor-not-allowed disabled:opacity-40 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
                  >
                    Reemplazar
                  </button>
                )}
                {editable && !sinSiNo && (
                  <button
                    type="button"
                    disabled={ocupada}
                    onClick={onQuitarCertificado}
                    className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50"
                  >
                    Quitar certificado
                  </button>
                )}
              </>
            ) : (
              editable &&
              !sinSiNo && (
                <button
                  type="button"
                  disabled={Boolean(enVuelo)}
                  onClick={onAdjuntar}
                  className="rounded border border-sena-azul/25 px-3 py-1.5 text-xs font-semibold text-sena-azul transition-colors hover:bg-sena-cielo/30 disabled:cursor-not-allowed disabled:opacity-40 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
                >
                  {ocupada ? 'Subiendo...' : 'Adjuntar certificado'}
                </button>
              )
            ))}
        </div>
      </div>

      {certificado?.nombre_original && (
        <p className="break-words text-xs text-slate-500 dark:text-sena-texto-suave">
          {certificado.nombre_original}
        </p>
      )}

      {activa && enVuelo === `cert-${declarada.id}` && (
        <BarraProgreso valor={progresoCert ?? 0} etiqueta="Subiendo certificado" />
      )}

      <input
        ref={registrarRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        aria-label={`Certificado de ${nombre}`}
        onChange={(e) => {
          const archivo = e.target.files?.[0]
          if (archivo) onArchivo?.(archivo)
          e.target.value = ''
        }}
      />
      {activa && enVuelo === `cert-${declarada.id}` && (
        <BarraProgreso valor={progresoCert ?? 0} etiqueta="Subiendo certificado" />
      )}
    </li>
  )
}

// Skills de la postulación (doc 33). SOLO las que pide la convocatoria
// (vista.skills_convocatoria): el aspirante marca Sí/No y puede adjuntar un
// certificado OPCIONAL. Todas son opcionales (ninguna bloquea el envío).
//
// Las filas declaradas ANTES del cambio (origen 'catalogo' o 'propia') NO se
// borran ni se modifican: se muestran por nombre en solo lectura, con la nota
// "declaradas antes". La primera acción de guardado dispara el borrador
// silencioso (asegurar), así que la sección funciona con y sin postulación.
export default function SeccionSkills({
  vista,
  editable,
  asegurar,
  onRecargar,
  onError,
}) {
  const declaradas = vista.skills ?? []
  const requeridas = vista.skills_convocatoria ?? []

  const [error, setError] = useState('')
  // clave de la operación en vuelo: `req-...` | `skill-<id>` | `cert-<id>`
  const [enVuelo, setEnVuelo] = useState(null)
  // Porcentaje (0-100) de la subida del certificado en curso.
  const [progresoCert, setProgresoCert] = useState(0)
  // certificadosSubidos[skillId] = certificado recién subido, para mostrarlo de
  // inmediato sin esperar a que onRecargar() vuelva a traer todo el estado.
  const [certificadosSubidos, setCertificadosSubidos] = useState({})
  const refsCertificado = useRef({})

  // Cuando la vista se actualiza (onRecargar terminó), limpiamos los locales.
  useEffect(() => {
    setCertificadosSubidos({})
  }, [vista])

  const buscarDeclarada = (nombre) =>
    declaradas.find((s) => normalizarSkill(s.nombre) === normalizarSkill(nombre))

  const tope = declaradas.length >= MAX_SKILLS

  // Las skills que ya estaban declaradas antes (catálogo o propias) no se
  // pueden tocar: se muestran aparte y en solo lectura.
  const esVieja = (skill) => skill.origen !== 'convocatoria'
  const nombresRequeridas = new Set(requeridas.map((r) => normalizarSkill(r.nombre)))
  const viejas = declaradas.filter(
    (s) => esVieja(s) && !nombresRequeridas.has(normalizarSkill(s.nombre)),
  )

  // La postulación ya existe (la vista trae su id); si no, se crea el borrador
  // de forma silenciosa justo antes de guardar.
  const pidSeguro = async () => vista.postulacion?.id ?? (await asegurar()).postulacionId

  const declarar = async (clave, formaDe) => {
    if (!editable || enVuelo) return false
    setEnVuelo(clave)
    setError('')
    try {
      const { postulacionId, estado } = await asegurar()
      const forma = formaDe(estado)

      // Sin forma válida no se manda nada (el backend solo admite la skill
      // de la convocatoria, por id).
      if (!forma) return false

      await declararSkill(postulacionId, forma)
      onRecargar()
      return true
    } catch (e) {
      const deCampo = erroresDeCampo(e)
      setError(
        deCampo.convocatoria_skill_id || deCampo.nombre || deCampo.parametro_id || mensajeError(e),
      )
      return false
    } finally {
      setEnVuelo(null)
    }
  }

  const confirmar = useConfirmacion()

  const quitar = async (skill) => {
    if (!editable || enVuelo) return
    const ok = await confirmar({
      titulo: 'Quitar skill',
      mensaje: `¿Estás seguro de quitar la skill "${skill.nombre}"?`,
      textoConfirmar: 'Quitar',
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return
    setEnVuelo(`skill-${skill.id}`)
    setError('')
    try {
      await eliminarSkill(await pidSeguro(), skill.id)
      onRecargar()
    } catch (e) {
      onError(mensajeError(e))
    } finally {
      setEnVuelo(null)
    }
  }

  const elegirCertificado = async (skill, archivo) => {
    const validacion = validarArchivoPostulacion(archivo)
    if (!validacion.ok) {
      setError(validacion.mensaje)
      return
    }
    setEnVuelo(`cert-${skill.id}`)
    setProgresoCert(0)
    setError('')
    try {
      const resultado = await subirCertificado(await pidSeguro(), skill.id, archivo, setProgresoCert)
      // Mostrar el certificado de inmediato, sin esperar a onRecargar().
      if (resultado?.certificado) {
        setCertificadosSubidos((prev) => ({ ...prev, [skill.id]: resultado.certificado }))
      }
      onRecargar() // sincroniza en segundo plano
    } catch (e) {
      const deCampo = erroresDeCampo(e)
      setError(deCampo.archivo || mensajeError(e))
    } finally {
      setEnVuelo(null)
    }
  }

  const quitarCertificadoDe = async (skill) => {
    if (!editable || enVuelo) return
    const ok = await confirmar({
      titulo: 'Quitar certificado',
      mensaje: `¿Estás seguro de quitar el certificado de "${skill.nombre}"? La skill se conserva.`,
      textoConfirmar: 'Quitar',
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return
    setEnVuelo(`cert-${skill.id}`)
    setError('')
    try {
      await quitarCertificado(await pidSeguro(), skill.id)
      onRecargar()
    } catch (e) {
      onError(mensajeError(e))
    } finally {
      setEnVuelo(null)
    }
  }

  // "Ver" certificado: el PDF lo abre PanelDocumentosPostulacion (evento document:view).
  const verCertificadoDe = (skill) =>
    window.dispatchEvent(new CustomEvent('document:view', {
      detail: { skillId: skill.id, nombre: skill.certificado?.nombre_original },
    }))

  const registrarRef = (id) => (el) => {
    refsCertificado.current[id] = el
  }

  // Acciones comunes de una fila ya declarada (certificado + quitar).
  const accionesDeclarada = (skill) =>
    skill
      ? {
          registrarRef: registrarRef(skill.id),
          onAdjuntar: () => refsCertificado.current[skill.id]?.click(),
          onDescargar: () => verCertificadoDe(skill),
          onQuitarCertificado: () => quitarCertificadoDe(skill),
          onArchivo: (archivo) => elegirCertificado(skill, archivo),
        }
      : {}

  // Si la convocatoria NO pide skills y el aspirante no tiene ninguna
  // declarada antes, la sección entera no se pinta: nada que ver con skills.
  if (requeridas.length === 0 && viejas.length === 0) {
    return null
  }

  return (
    <section className={ESTILO_TARJETA}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={ESTILO_TITULO}>Skills</h2>
        <span className="text-xs text-slate-500 dark:text-sena-texto-suave">
          {declaradas.length} de {MAX_SKILLS}
        </span>
      </div>

      {requeridas.length > 0 && (
        <p className="mt-2 text-xs text-slate-500 dark:text-sena-texto-suave">
          Marca las que tengas de las que pide la convocatoria. Todas son
          opcionales y ninguna bloquea el envío. Con "Sí" puedes adjuntar un
          certificado si lo quieres (opcional).
        </p>
      )}

      {requeridas.length > 0 && (
        <div className="mt-3">
          <p className={ESTILO_GRUPO}>Requeridas por la convocatoria</p>
          <ul className="mt-1 flex flex-col divide-y divide-slate-100 dark:divide-sena-borde">
            {requeridas.map((requerida) => {
              const declarada = buscarDeclarada(requerida.nombre)
              // Una fila vieja que coincide con una skill de la convocatoria
              // tampoco se toca: se muestra con su nota, sin Sí/No.
              const soloLectura = declarada ? esVieja(declarada) : false
              const clave = `req-${requerida.id ?? normalizarSkill(requerida.nombre)}`

              return (
                <FilaSkill
                  key={clave}
                  nombre={requerida.nombre}
                  declarada={declarada}
                  editable={editable}
                  enVuelo={enVuelo} progresoCert={progresoCert} certificadosSubidos={certificadosSubidos}
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
                        setError('No se encontró la skill de la convocatoria.')
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
          <p className="mt-1 text-xs text-slate-500 dark:text-sena-texto-suave">
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
                enVuelo={enVuelo} progresoCert={progresoCert} certificadosSubidos={certificadosSubidos}
                clave={`skill-${skill.id}`}
                tope={tope}
                sinSiNo
                {...accionesDeclarada(skill)}
              />
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {tope && (
        <p className="mt-3 text-xs text-slate-500 dark:text-sena-texto-suave">
          Alcanzaste el máximo de {MAX_SKILLS} skills.
        </p>
      )}
    </section>
  )
}