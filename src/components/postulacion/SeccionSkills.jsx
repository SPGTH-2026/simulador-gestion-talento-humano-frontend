import { useRef, useState } from 'react'
import { validarArchivoPostulacion } from '../../lib/archivosPostulacion'
import { MAX_SKILLS, MAX_SKILL_NOMBRE, normalizarSkill } from '../../lib/postulacionDocumentos'
import {
  declararSkill,
  eliminarSkill,
  subirCertificado,
  quitarCertificado,
} from '../../api/postulacionesDocumentos'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { IconoOjo } from '../convocatorias/Iconos'
import BarraProgreso from '../ui/BarraProgreso'

const ESTILO_TARJETA =
  'rounded-lg border border-slate-200 bg-white p-4 dark:border-sena-borde dark:bg-sena-superficie'

const ESTILO_TITULO =
  'border-l-4 border-sena pl-3 text-sm font-semibold text-slate-800 dark:text-sena-texto'

const ESTILO_GRUPO =
  'text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave'

const CLASE_INPUT =
  'rounded border border-sena-azul/20 p-2 text-sm text-slate-700 focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto'

const CLASE_ETIQUETA =
  'rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-sena-superficie-alta dark:text-sena-texto-suave'

const CLASE_CERTIFICADA =
  'rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'

const origenTexto = (origen) =>
  origen === 'convocatoria'
    ? 'De la convocatoria'
    : origen === 'catalogo'
      ? 'Del catálogo'
      : 'Propia'

// Una fila de skill: nombre + Sí/No (salvo las propias, que solo se quitan) y,
// cuando está declarada, el estado Certificada/Declarada con sus acciones.
function FilaSkill({
  nombre,
  declarada,
  editable,
  enVuelo,
  progresoCert,
  clave,
  tope,
  esPropia,
  onActivar,
  onDesactivar,
  onQuitarSkill,
  onAdjuntar,
  onQuitarCertificado,
  registrarRef,
  onArchivo,
}) {
  const activa = Boolean(declarada)
  const certificado = declarada?.certificado
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
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {!esPropia && (
            <div className="inline-flex overflow-hidden rounded border border-slate-200 dark:border-sena-borde">
              <button
                type="button"
                aria-pressed={activa}
                onClick={onActivar}
                disabled={!editable || Boolean(enVuelo) || (tope && !activa)}
                className={`px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  activa
                    ? 'bg-sena text-white'
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
                    ? 'bg-sena text-white'
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
                <button
                  type="button"
                  disabled={ocupada}
                  onClick={() => {
                    // El padre (PanelDocumentosPostulacion) lo abre en una
                    // pestaña nueva vía el evento document:view.
                    window.dispatchEvent(new CustomEvent('document:view', {
                      detail: {
                        skillId: declarada.id,
                        nombre: certificado.nombre_original,
                      }
                    }))
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-sena-azul rounded hover:bg-sena-azul/90 transition-colors"
                >
                  <IconoOjo className="mr-1.5 h-3.5 w-3.5" />
                  Ver
                </button>
                {editable && (
                  <button
                    type="button"
                    disabled={Boolean(enVuelo)}
                    onClick={onAdjuntar}
                    className="px-3 py-1.5 text-xs font-semibold text-sena-azul border border-sena-azul/25 rounded hover:bg-sena-cielo/30 transition-colors hover:bg-sena-cielo/30 disabled:cursor-not-allowed disabled:opacity-40 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
                  >
                    Reemplazar
                  </button>
                )}
                {editable && (
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
              editable && (
                <button
                  type="button"
                  disabled={Boolean(enVuelo)}
                  onClick={onAdjuntar}
                  className="rounded border border-sena-azul/25 px-3 py-1.5 text-xs font-semibold text-sena-azul transition-colors hover:bg-sena-cielo/30 disabled:cursor-not-allowed disabled:opacity-40 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
                >
                  {ocupada ? 'Subiendo...' : 'Adjuntar certificado'}
                </button>
              )
            )
          )}

          {esPropia && editable && (
            <button
              type="button"
              disabled={ocupada || Boolean(enVuelo)}
              onClick={onQuitarSkill}
              className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50"
            >
              Quitar
            </button>
          )}
        </div>
      </div>

      {certificado?.nombre_original && (
        <p className="break-words text-xs text-slate-500 dark:text-sena-texto-suave">
          {certificado.nombre_original}
        </p>
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

// Skills de la postulación (doc 33). Tres grupos, TODAS opcionales (ninguna
// bloquea el envío):
//   A) las que pidió la convocatoria (vista.skills_convocatoria, con id);
//   B) el catálogo general (GET /parametros?tema=skill_catalogo), sin repetir A;
//   C) skills propias (texto libre, máx. 100, sin duplicados sin distinguir
//      mayúsculas). El tope total es 30.
export default function SeccionSkills({
  vista,
  catalogo,
  editable,
  asegurar,
  onRecargar,
  onError,
}) {
  const declaradas = vista.skills ?? []
  const requeridas = vista.skills_convocatoria ?? []

  const [borrador, setBorrador] = useState('')
  const [error, setError] = useState('')
  // clave de la operación en vuelo: 'propia' | `req-...` | `cat-<id>` |
  // `skill-<id>` | `cert-<id>`
  const [enVuelo, setEnVuelo] = useState(null)
  // Porcentaje (0-100) de la subida del certificado en curso.
  const [progresoCert, setProgresoCert] = useState(0)
  const refsCertificado = useRef({})

  const buscarDeclarada = (nombre) =>
    declaradas.find((s) => normalizarSkill(s.nombre) === normalizarSkill(nombre))

  const tope = declaradas.length >= MAX_SKILLS
  const nombresRequeridas = new Set(requeridas.map((r) => normalizarSkill(r.nombre)))
  const otras = (catalogo ?? []).filter((c) => !nombresRequeridas.has(normalizarSkill(c.nombre)))
  const propias = declaradas.filter((s) => s.origen === 'propia')

  // La postulación ya existe (la vista trae su id); si no, se crea el borrador
  // de forma silenciosa justo antes de guardar.
  const pidSeguro = async () => vista.postulacion?.id ?? (await asegurar()).postulacionId

  const declarar = async (clave, forma) => {
    if (!editable || enVuelo) return false
    setEnVuelo(clave)
    setError('')
    try {
      const { postulacionId, estado } = await asegurar()
      await declararSkill(postulacionId, forma(estado))
      onRecargar()
      return true
    } catch (e) {
      const deCampo = erroresDeCampo(e)
      setError(
        deCampo.nombre || deCampo.convocatoria_skill_id || deCampo.parametro_id || mensajeError(e),
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
      await subirCertificado(await pidSeguro(), skill.id, archivo, setProgresoCert)
      onRecargar()
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

  const agregarPropia = async (evento) => {
    evento.preventDefault()
    const nombre = borrador.trim()
    if (!nombre) return setError('Escribe el nombre de la skill.')
    if (nombre.length > MAX_SKILL_NOMBRE)
      return setError(`El nombre no puede superar ${MAX_SKILL_NOMBRE} caracteres.`)
    if (declaradas.some((s) => normalizarSkill(s.nombre) === normalizarSkill(nombre)))
      return setError('Ya tienes registrada esa skill.')
    if (tope) return setError(`No puedes registrar más de ${MAX_SKILLS} skills.`)

    if (await declarar('propia', () => ({ nombre }))) setBorrador('')
  }

  const registrarRef = (id) => (el) => {
    refsCertificado.current[id] = el
  }

  // Acciones comunes de una fila ya declarada (certificado + quitar).
  const accionesDeclarada = (skill) =>
    skill
      ? {
          registrarRef: registrarRef(skill.id),
          onAdjuntar: () => refsCertificado.current[skill.id]?.click(),
          onQuitarCertificado: () => quitarCertificadoDe(skill),
          onArchivo: (archivo) => elegirCertificado(skill, archivo),
        }
      : {}

  return (
    <section className={ESTILO_TARJETA}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={ESTILO_TITULO}>Skills</h2>
        <span className="text-xs text-slate-500 dark:text-sena-texto-suave">
          {declaradas.length} de {MAX_SKILLS}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-500 dark:text-sena-texto-suave">
        Todas son opcionales y ninguna bloquea el envío. Marca "Sí" en las que
        tengas y adjunta un certificado si lo quieres (opcional).
      </p>

      {requeridas.length > 0 && (
        <div className="mt-3">
          <p className={ESTILO_GRUPO}>Requeridas por la convocatoria</p>
          <ul className="mt-1 flex flex-col divide-y divide-slate-100 dark:divide-sena-borde">
            {requeridas.map((requerida) => {
              const declarada = buscarDeclarada(requerida.nombre)
              const clave = `req-${requerida.id ?? normalizarSkill(requerida.nombre)}`
              return (
                <FilaSkill
                  key={clave}
                  nombre={requerida.nombre}
                  declarada={declarada}
                  editable={editable}
                  enVuelo={enVuelo} progresoCert={progresoCert}
                  clave={clave}
                  tope={tope}
                  onActivar={() => {
                    if (declarada) return
                    declarar(clave, (fresco) => {
                      const id =
                        requerida.id ??
                        (fresco?.skills_convocatoria ?? []).find(
                          (s) => normalizarSkill(s.nombre) === normalizarSkill(requerida.nombre),
                        )?.id
                      return id ? { convocatoriaSkillId: id } : { nombre: requerida.nombre }
                    })
                  }}
                  onDesactivar={() => declarada && quitar(declarada)}
                  onQuitarSkill={() => declarada && quitar(declarada)}
                  {...accionesDeclarada(declarada)}
                />
              )
            })}
          </ul>
        </div>
      )}

      {otras.length > 0 && (
        <div className="mt-4">
          <p className={ESTILO_GRUPO}>Otras skills que puedes tener</p>
          <ul className="mt-1 flex flex-col divide-y divide-slate-100 dark:divide-sena-borde">
            {otras.map((opcion) => {
              const declarada = buscarDeclarada(opcion.nombre)
              const clave = `cat-${opcion.id}`
              return (
                <FilaSkill
                  key={clave}
                  nombre={opcion.nombre}
                  declarada={declarada}
                  editable={editable}
                  enVuelo={enVuelo} progresoCert={progresoCert}
                  clave={clave}
                  tope={tope}
                  onActivar={() => {
                    if (declarada) return
                    declarar(clave, () => ({ parametroId: opcion.id }))
                  }}
                  onDesactivar={() => declarada && quitar(declarada)}
                  onQuitarSkill={() => declarada && quitar(declarada)}
                  {...accionesDeclarada(declarada)}
                />
              )
            })}
          </ul>
        </div>
      )}

      <div className="mt-4">
        <p className={ESTILO_GRUPO}>Tus skills propias</p>

        <ul className="mt-1 flex flex-col divide-y divide-slate-100 dark:divide-sena-borde">
          {propias.map((skill) => (
            <FilaSkill
              key={`skill-${skill.id}`}
              nombre={skill.nombre}
              declarada={skill}
              editable={editable}
              enVuelo={enVuelo} progresoCert={progresoCert}
              clave={`skill-${skill.id}`}
              tope={tope}
              esPropia
              onQuitarSkill={() => quitar(skill)}
              {...accionesDeclarada(skill)}
            />
          ))}

          {propias.length === 0 && (
            <li className="py-3 text-sm text-slate-500 dark:text-sena-texto-suave">
              Aún no has agregado skills propias.
            </li>
          )}
        </ul>

        {editable && !tope && (
          <form
            onSubmit={agregarPropia}
            className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-end dark:border-sena-borde"
          >
            <div className="flex flex-1 flex-col gap-1">
              <label
                htmlFor="skill-propia"
                className="text-xs font-semibold text-slate-600 dark:text-sena-texto-suave"
              >
                Agregar una skill propia
              </label>
              <input
                id="skill-propia"
                type="text"
                value={borrador}
                maxLength={MAX_SKILL_NOMBRE}
                onChange={(e) => setBorrador(e.target.value)}
                className={CLASE_INPUT}
                placeholder="Ej.: Manejo de Excel avanzado"
              />
            </div>
            <button
              type="submit"
              disabled={enVuelo === 'propia'}
              className="rounded bg-sena px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sena-oscuro disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enVuelo === 'propia' ? 'Agregando...' : 'Agregar'}
            </button>
          </form>
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
      </div>
    </section>
  )
}