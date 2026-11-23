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
import RespuestaSiNo from '../evaluacion/RespuestaSiNo'
import Boton from '../ui/Boton'

const ESTILO_TARJETA = `${CLASE_TARJETA} p-4`

const ESTILO_TITULO = CLASE_TITULO_SECCION

const ESTILO_GRUPO =
  'text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-sena-texto-suave'


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

// Una fila de skill, en dos renglones para que las acciones no se amontonen:
//  1. nombre + etiquetas, y a la derecha Sí/No (las filas de solo lectura NO tienen Sí/No).
//  2. cuando está declarada, el certificado: a la izquierda su estado/nombre y a la derecha sus acciones
//     (Ver, Reemplazar, Quitar o Cargar certificado), siempre visibles.
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
  const subiendoCert = activa && enVuelo === `cert-${declarada.id}`
  // Guardando el Sí/No de ESTA fila (declarar o quitar la skill): la rueda va en la opción que se aplica.
  const guardandoSiNo = enVuelo === clave || (activa && enVuelo === `skill-${declarada.id}`)
  const puedeEditarCert = editable && !sinSiNo
  // Hay algo en curso que NO es el guardado de esta fila: sus controles se bloquean. El propio Sí/No de la fila no se
  // deshabilita mientras guarda (perdería el foco del teclado): se marca como ocupado.
  const otraOperacion = Boolean(enVuelo) && !guardandoSiNo
  // Con el envío al 100 % el archivo ya llegó y el servidor sigue trabajando: se dice «Procesando…».
  const procesandoCert = subiendoCert && (progresoCert ?? 0) >= 100
  const textoCarga = procesandoCert ? 'Procesando…' : 'Cargando…'

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-sena-texto">
          {nombre}
          {/* El origen solo se indica donde ayuda: las skills de la convocatoria ya lo dicen en su encabezado. */}
          {activa && declarada.origen !== 'convocatoria' && (
            <span className={CLASE_ETIQUETA}>{origenTexto(declarada.origen)}</span>
          )}
          {activa && (
            <span className={certificado ? CLASE_CERTIFICADA : CLASE_ETIQUETA}>
              {certificado ? 'Certificado cargado' : 'Declarada'}
            </span>
          )}
          {sinSiNo && (
            <span className={CLASE_ETIQUETA}>Declarada antes</span>
          )}
        </p>

        {!sinSiNo && (
          <RespuestaSiNo
            pregunta={`¿Declaras «${nombre}»?`}
            valor={activa}
            onChange={(declarar) => (declarar ? onActivar() : onDesactivar())}
            ocupado={guardandoSiNo}
            deshabilitadoSi={!editable || otraOperacion || Boolean(tope && !activa)}
            deshabilitadoNo={!editable || otraOperacion}
          />
        )}
      </div>

      {activa && (
        <div className="flex flex-col gap-2 rounded-lg bg-sena-fondo/50 px-3 py-2 dark:bg-sena-noche/40">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="min-w-0 break-words text-sm text-slate-600 dark:text-sena-texto-suave">
            {certificado
              ? certificado.nombre_original ?? 'Certificado cargado'
              : puedeEditarCert
                ? 'Certificado opcional: aún no cargaste uno.'
                : 'Sin certificado.'}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {certificado ? (
              <>
                <Boton variante="contorno" tamano="tactil" disabled={Boolean(enVuelo)} onClick={onDescargar}>
                  Ver
                </Boton>
                {puedeEditarCert && (
                  <Boton
                    variante="contorno"
                    tamano="tactil"
                    ocupado={subiendoCert}
                    disabled={Boolean(enVuelo)}
                    onClick={onAdjuntar}
                    aria-label={`Reemplazar certificado de ${nombre}`}
                  >
                    {subiendoCert ? textoCarga : 'Reemplazar'}
                  </Boton>
                )}
                {puedeEditarCert && (
                  <Boton
                    variante="peligroSuave"
                    tamano="tactil"
                    disabled={Boolean(enVuelo)}
                    onClick={onQuitarCertificado}
                    aria-label={`Quitar certificado de ${nombre}`}
                  >
                    Quitar
                  </Boton>
                )}
              </>
            ) : (
              puedeEditarCert && (
                <Boton
                  variante="contorno"
                  tamano="tactil"
                  ocupado={subiendoCert}
                  disabled={Boolean(enVuelo)}
                  onClick={onAdjuntar}
                  aria-label={`Cargar certificado de ${nombre}`}
                >
                  {subiendoCert ? textoCarga : 'Cargar certificado'}
                </Boton>
              )
            )}
          </div>
        </div>

        {/* Una sola barra, dentro de la franja del certificado: avance real del envío y, al llegar al 100 %,
            «Procesando…» hasta que el servidor confirma y la pantalla se actualiza. */}
        {subiendoCert && <BarraProgreso valor={progresoCert ?? 0} etiqueta="Enviando certificado" className="mt-0" />}
        </div>
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
}) {
  const declaradas = vista.skills ?? []
  const requeridas = vista.skills_convocatoria ?? []

  const [error, setError] = useState('')
  // clave de la operación en vuelo: `req-...` | `skill-<id>` | `cert-<id>` | `quitarcert-<id>`
  const [enVuelo, setEnVuelo] = useState(null)
  // Porcentaje (0-100) de la subida del certificado en curso.
  const [progresoCert, setProgresoCert] = useState(0)
  // certificadosSubidos[skillId] = certificado recién subido, para mostrarlo de
  // inmediato sin esperar a que onRecargar() vuelva a traer todo el estado.
  const [certificadosSubidos, setCertificadosSubidos] = useState({})
  const refsCertificado = useRef({})
  // Cerrojo síncrono: 'enVuelo' es estado y solo cambia en el siguiente render; dos clics seguidos (o el Sí/No y un
  // certificado) podrían colarse en ese intervalo y enviar la operación dos veces. La referencia lo impide.
  const cerrojo = useRef(false)

  // Ejecuta UNA operación a la vez: marca 'enVuelo', corre la tarea y la libera siempre. 'tarea' decide qué espera:
  // en declarar y quitar espera también la recarga del estado, así el indicador sigue hasta que la pantalla cambia.
  const ejecutar = async (clave, tarea, mensajeDe) => {
    if (cerrojo.current) return false
    cerrojo.current = true
    setEnVuelo(clave)
    setError('')
    try {
      return (await tarea()) !== false
    } catch (e) {
      setError(mensajeDe(e))
      // Un fallo de red puede llegar DESPUÉS de que el servidor aplicó el cambio: se vuelve a leer el estado real
      // para que la pantalla no quede desfasada (y el siguiente clic no actúe sobre algo que ya no existe).
      try {
        await onRecargar()
      } catch {
        /* el panel ya muestra su propio error de lectura */
      }
      return false
    } finally {
      cerrojo.current = false
      setEnVuelo(null)
    }
  }

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

  const declarar = (clave, formaDe) => {
    if (!editable) return false
    return ejecutar(
      clave,
      async () => {
        const { postulacionId, estado } = await asegurar()
        const forma = formaDe(estado)

        // Sin forma válida no se manda nada (el backend solo admite la skill
        // de la convocatoria, por id).
        if (!forma) return false

        await declararSkill(postulacionId, forma)
        // Se espera la recarga: el Sí/No y «Cargar certificado» cambian cuando llega el estado real.
        await onRecargar()
        return true
      },
      (e) => {
        const deCampo = erroresDeCampo(e)
        return deCampo.convocatoria_skill_id || deCampo.nombre || deCampo.parametro_id || mensajeError(e)
      },
    )
  }

  const confirmar = useConfirmacion()

  const quitar = async (skill) => {
    if (!editable || cerrojo.current) return
    const ok = await confirmar({
      titulo: 'Quitar skill',
      mensaje: `¿Estás seguro de quitar la skill "${skill.nombre}"?`,
      textoConfirmar: 'Quitar',
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return
    await ejecutar(
      `skill-${skill.id}`,
      async () => {
        await eliminarSkill(await pidSeguro(), skill.id)
        await onRecargar()
      },
      mensajeError,
    )
  }

  const elegirCertificado = async (skill, archivo) => {
    const validacion = validarArchivoPostulacion(archivo)
    if (!validacion.ok) {
      setError(validacion.mensaje)
      return
    }
    setProgresoCert(0)
    await ejecutar(
      `cert-${skill.id}`,
      async () => {
        // El envío informa su avance real; al 100 % el archivo ya está en el servidor y la barra pasa a
        // «Procesando…» hasta que responde. La respuesta trae el certificado guardado: con ella la franja ya
        // muestra el estado real, así que no se espera la recarga (corre en segundo plano).
        const resultado = await subirCertificado(await pidSeguro(), skill.id, archivo, setProgresoCert)
        if (resultado?.certificado) {
          setCertificadosSubidos((prev) => ({ ...prev, [skill.id]: resultado.certificado }))
        }
        onRecargar()
      },
      (e) => erroresDeCampo(e).archivo || mensajeError(e),
    )
  }

  const quitarCertificadoDe = async (skill) => {
    if (!editable || cerrojo.current) return
    const ok = await confirmar({
      titulo: 'Quitar certificado',
      mensaje: `¿Estás seguro de quitar el certificado de "${skill.nombre}"? La skill se conserva.`,
      textoConfirmar: 'Quitar',
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return
    await ejecutar(
      `quitarcert-${skill.id}`,
      async () => {
        await quitarCertificado(await pidSeguro(), skill.id)
        await onRecargar()
      },
      mensajeError,
    )
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
        <span className="text-xs text-slate-600 dark:text-sena-texto-suave">
          {declaradas.length} de {MAX_SKILLS}
        </span>
      </div>

      {requeridas.length > 0 && (
        <p className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">
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