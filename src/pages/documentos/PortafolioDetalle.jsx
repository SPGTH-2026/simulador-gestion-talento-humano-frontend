import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  obtenerPortafolio,
  estadoRevision,
  descargarDocumentoRevision,
  descargarCertificadoRevision,
} from '../../api/portafolios'
import { abrirArchivoEnPestana, mensajeErrorBlob } from '../../api/postulacionesDocumentos'
import Mensaje, { MensajeAviso } from '../../components/ui/Mensaje'
import Boton from '../../components/ui/Boton'
import Cargando from '../../components/ui/Cargando'
import Etiqueta from '../../components/ui/Etiqueta'
import Icono from '../../components/ui/Icono'
import Tarjeta from '../../components/ui/Tarjeta'
import IndicadorCompletitud from '../../components/postulacion/IndicadorCompletitud'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import { EtiquetaConIcono } from '../../components/evaluacion/PresentacionEvaluacion'
import {
  CLASE_SUBTITULO_PAGINA,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
  CLASE_TITULO_PAGINA,
} from '../../lib/estilos'
import { ESTADO_DOCUMENTO } from '../../lib/evaluacion'
import { formatearTamano } from '../../lib/postulacionDocumentos'
import { formatearFechaHora } from '../../lib/ventanaPostulacion'

// Línea de acciones de volver: botón fantasma con flecha, el mismo de Evaluación. Con 'to' es un enlace fijo (no
// depende del historial: un enlace directo o una pestaña nueva también vuelve al listado); con 'onClick', una acción.
function Volver({ to, onClick, children }) {
  return (
    <Boton
      variante="fantasma"
      tamano="tactil"
      {...(to ? { as: Link, to } : { onClick })}
      className="-ml-4 self-start"
    >
      <Icono nombre="flechaIzquierda" className="size-4" />
      {children}
    </Boton>
  )
}

const TITULO_BLOQUE = `text-base font-semibold ${CLASE_TEXTO_FUERTE}`

// Portafolio en solo lectura: quien llega aquí ve y descarga, no escribe.
function Portafolio({ userId }) {
  const [portafolio, setPortafolio] = useState(null)
  const [postulacionSel, setPostulacionSel] = useState(null)
  const [revision, setRevision] = useState(null)
  // La carga inicial empieza en curso: sin esto el primer render dibujaba una pantalla en blanco.
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Postulación cuya revisión se está abriendo, y el fallo (con su postulación) para mostrarlo junto a su botón.
  const [abriendoId, setAbriendoId] = useState(null)
  const [errorRevision, setErrorRevision] = useState(null)
  // Archivos con una acción en curso (claves 'ver:…' / 'descargar:…') y el error de cada tarjeta de archivo.
  const [enCurso, setEnCurso] = useState(() => new Set())
  const [erroresArchivo, setErroresArchivo] = useState({})
  const encabezadoRevision = useRef(null)
  // Guarda síncrona: dos clics seguidos llegan antes de que React pinte el botón ocupado, así que el estado solo no basta.
  const guardaAcciones = useRef(new Set())

  const cargarPortafolio = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const data = await obtenerPortafolio(userId)
      setPortafolio(data)
    } catch (e) {
      setError('No se pudo cargar el portafolio.')
      console.error(e)
    } finally {
      setCargando(false)
    }
  }, [userId])

  useEffect(() => {
    cargarPortafolio()
  }, [cargarPortafolio])

  // Al terminar de cargar una revisión, el foco pasa a su encabezado (y se desplaza a la vista): la revisión aparece
  // debajo de la lista y, sin esto, quien usa teclado o lector de pantalla no sabría que ya está.
  useEffect(() => {
    if (!revision) return
    encabezadoRevision.current?.focus()
    encabezadoRevision.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [revision])

  const handleVerDocumentos = async (postulacion) => {
    if (!postulacion.puede_ver_documentos || guardaAcciones.current.has('revision')) return
    guardaAcciones.current.add('revision')
    setAbriendoId(postulacion.id)
    setErrorRevision(null)
    try {
      const data = await estadoRevision(postulacion.id)
      setPostulacionSel(postulacion)
      setErroresArchivo({})
      setRevision(data)
    } catch (e) {
      const msg = await mensajeErrorBlob(e)
      setErrorRevision({ id: postulacion.id, mensaje: msg || 'No se pudo cargar la revisión de documentos.' })
      console.error(e)
    } finally {
      guardaAcciones.current.delete('revision')
      setAbriendoId(null)
    }
  }

  // Ejecuta una acción sobre un archivo: mientras dura, su botón queda ocupado (un doble clic no la repite) y, si
  // falla, el error aparece en la tarjeta de ese archivo.
  const accionArchivo = async (clave, accion, textoError) => {
    if (guardaAcciones.current.has(clave)) return
    guardaAcciones.current.add(clave)
    setEnCurso((previo) => new Set(previo).add(clave))
    setErroresArchivo((previo) => ({ ...previo, [clave.split(':')[1]]: '' }))
    try {
      await accion()
    } catch (e) {
      const msg = await mensajeErrorBlob(e)
      setErroresArchivo((previo) => ({ ...previo, [clave.split(':')[1]]: msg || textoError }))
    } finally {
      guardaAcciones.current.delete(clave)
      setEnCurso((previo) => {
        const siguiente = new Set(previo)
        siguiente.delete(clave)
        return siguiente
      })
    }
  }

  // Abre el archivo en otra pestaña. Devuelve la promesa: 'accionArchivo' mantiene el botón ocupado hasta que termina.
  const verArchivo = (ruta, nombre) => abrirArchivoEnPestana(ruta, { nombre })

  const rutaArchivo = (suffix) => `/revision/postulaciones/${postulacionSel.id}/${suffix}`

  if (cargando && !portafolio) {
    return <Cargando>Cargando portafolio…</Cargando>
  }

  if (error && !portafolio) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Mensaje tipo="error">{error}</Mensaje>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Boton variante="contorno" tamano="tactil" onClick={cargarPortafolio}>
            Reintentar
          </Boton>
          <Boton variante="fantasma" tamano="tactil" as={Link} to="/documentos">
            Volver al listado
          </Boton>
        </div>
      </div>
    )
  }

  if (!portafolio) return null

  const { usuario, postulaciones } = portafolio

  // Ver y Descargar son acciones neutras de lectura: las dos con contorno, sin iconos decorativos.
  // 'id' identifica el archivo (también para mostrar su error junto a los botones).
  const botonesLectura = (id, nombre, ver, descargarFn) => (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Boton
          variante="contorno"
          tamano="tactil"
          ocupado={enCurso.has(`ver:${id}`)}
          aria-label={`Ver ${nombre}`}
          onClick={() => accionArchivo(`ver:${id}`, ver, 'No se pudo abrir el archivo.')}
        >
          Ver
        </Boton>
        <Boton
          variante="contorno"
          tamano="tactil"
          ocupado={enCurso.has(`descargar:${id}`)}
          aria-label={`Descargar ${nombre}`}
          onClick={() => accionArchivo(`descargar:${id}`, descargarFn, 'No se pudo descargar el archivo.')}
        >
          Descargar
        </Boton>
      </div>
      {erroresArchivo[id] && <Mensaje tipo="error">{erroresArchivo[id]}</Mensaje>}
    </div>
  )

  return (
    <>
      <div className="flex flex-col gap-5">
        <header className="flex flex-col">
          <Volver to="/documentos">Volver al listado</Volver>
          <h1 className={`${CLASE_TITULO_PAGINA} text-balance ${CLASE_TEXTO_PARTIDO}`}>Portafolio de {usuario.name}</h1>
          <p className={CLASE_SUBTITULO_PAGINA}>
            {usuario.email} · Ficha: {usuario.ficha?.codigo ?? 'Sin ficha'}
          </p>
        </header>

        {portafolio.postulaciones.length === 0 ? (
          <div className="py-12 text-center">
            <p className={CLASE_TEXTO_SUAVE}>Este aspirante no tiene postulaciones visibles en sus fichas.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {postulaciones.map((p) => (
              <Tarjeta
                key={p.id}
                as="article"
                aria-current={revision && postulacionSel?.id === p.id ? 'true' : undefined}
                className={`flex flex-col gap-3 p-4 ${
                  revision && postulacionSel?.id === p.id ? 'ring-2 ring-sena/60 dark:ring-sena-acento/60' : ''
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <EtiquetaPostulacion codigo={p.estado?.codigo} nombre={p.estado?.nombre} />
                      {revision && postulacionSel?.id === p.id && <Etiqueta tono="azul">En revisión</Etiqueta>}
                      {p.puede_ver_documentos ? (
                        <Etiqueta tono="exito">Documentos disponibles</Etiqueta>
                      ) : (
                        <Etiqueta tono="neutral">Sin documentos (borrador)</Etiqueta>
                      )}
                    </div>
                    <p className={`font-medium ${CLASE_TEXTO_FUERTE} ${CLASE_TEXTO_PARTIDO}`}>{p.convocatoria?.nombre}</p>
                    <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>{p.convocatoria?.codigo}</p>
                  </div>
                  {p.puede_ver_documentos && (
                    // Abre la revisión de la postulación: navegación, con contorno como «Ver detalle».
                    <Boton
                      variante="contorno"
                      tamano="tactil"
                      ocupado={abriendoId === p.id}
                      disabled={abriendoId !== null && abriendoId !== p.id}
                      onClick={() => handleVerDocumentos(p)}
                      className="shrink-0"
                    >
                      {abriendoId === p.id ? 'Abriendo…' : 'Ver documentos'}
                    </Boton>
                  )}
                </div>

                {errorRevision?.id === p.id && <Mensaje tipo="error">{errorRevision.mensaje}</Mensaje>}

                <IndicadorCompletitud estado={{ completo: p.completo }} titulo="Estado de los documentos" />

                <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
                  Postulada el {formatearFechaHora(p.fecha_postulacion)}
                  {' · '}Documentos: {p.documentos?.subidos ?? 0}/{p.documentos?.requeridos ?? 0} requeridos,{' '}
                  {p.documentos?.adicionales ?? 0} adicionales
                  {' · '}Skills: {p.skills?.total ?? 0} ({p.skills?.con_certificado ?? 0} con certificado)
                </p>
              </Tarjeta>
            ))}
          </div>
        )}
      </div>

      {postulacionSel && revision && (
        <Tarjeta as="section" className="mt-6 flex flex-col gap-5 p-4 sm:p-6">
          <header className="flex flex-col gap-1">
            <Volver
              onClick={() => {
                setPostulacionSel(null)
                setRevision(null)
              }}
            >
              Volver al listado de postulaciones
            </Volver>
            <h2
              ref={encabezadoRevision}
              tabIndex={-1}
              className={`scroll-mt-4 text-xl font-bold focus:outline-none ${CLASE_TEXTO_FUERTE} ${CLASE_TEXTO_PARTIDO}`}
            >
              Documentos de: {postulacionSel.convocatoria?.nombre}
            </h2>
          </header>

          <IndicadorCompletitud estado={revision} titulo="Estado de los documentos" />

          {revision.requiere_sexo && (
            <MensajeAviso>Esta convocatoria exige libreta militar y no hay sexo registrado en el perfil.</MensajeAviso>
          )}

          {revision.documentos && revision.documentos.length > 0 && (
            <section>
              <h3 className={`${TITULO_BLOQUE} mb-3`}>Documentos requeridos</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {revision.documentos.map((d) => {
                  const estado = ESTADO_DOCUMENTO[d.estado] ?? ESTADO_DOCUMENTO.pendiente
                  return (
                    <Tarjeta key={d.parametro?.id ?? d.id} as="article" className="flex flex-col gap-3 p-4">
                      <div className="min-w-0">
                        <p className={`font-medium ${CLASE_TEXTO_FUERTE} ${CLASE_TEXTO_PARTIDO}`}>
                          {d.parametro?.nombre ?? d.parametro?.codigo}
                        </p>
                        <p className={`mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${CLASE_TEXTO_SUAVE}`}>
                          <EtiquetaConIcono
                            tono={estado.tono}
                            icono={d.estado === 'subido' ? <Icono nombre="check" className="size-3.5" /> : null}
                          >
                            {estado.texto}
                          </EtiquetaConIcono>
                          <span className="whitespace-nowrap">{d.obligatorio ? 'Obligatorio' : 'Opcional'}</span>
                        </p>
                      </div>

                      <p className={`text-sm ${CLASE_TEXTO_SUAVE} ${CLASE_TEXTO_PARTIDO}`}>
                        {d.archivo
                          ? `${d.archivo.nombre_original} · ${formatearTamano(d.archivo.tamano_bytes)}`
                          : 'Sin archivo'}
                      </p>

                      {d.archivo && (
                        <div className="mt-auto border-t border-sena-linea/70 pt-3 dark:border-sena-borde/50">
                          {botonesLectura(
                            `doc-${d.archivo.id}`,
                            d.archivo.nombre_original,
                            () => verArchivo(rutaArchivo(`documentos/${d.archivo.id}/archivo?inline=1`), d.archivo.nombre_original),
                            () => descargarDocumentoRevision(postulacionSel.id, d.archivo.id, d.archivo.nombre_original),
                          )}
                        </div>
                      )}
                    </Tarjeta>
                  )
                })}
              </div>
            </section>
          )}

          {revision.adicionales && revision.adicionales.length > 0 && (
            <section>
              <h3 className={`${TITULO_BLOQUE} mb-3`}>Documentos adicionales</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {revision.adicionales.map((d) => (
                  <Tarjeta key={d.id} as="article" className="flex flex-col gap-3 p-4">
                    <div className="min-w-0">
                      <p className={`font-medium ${CLASE_TEXTO_FUERTE} ${CLASE_TEXTO_PARTIDO}`}>{d.titulo}</p>
                      {d.nota && <p className={`text-xs ${CLASE_TEXTO_SUAVE} ${CLASE_TEXTO_PARTIDO}`}>{d.nota}</p>}
                      <p className={`mt-1 text-xs ${CLASE_TEXTO_SUAVE} ${CLASE_TEXTO_PARTIDO}`}>
                        {d.archivo?.nombre_original} · {formatearTamano(d.archivo?.tamano_bytes)}
                      </p>
                    </div>
                    {d.archivo && (
                      <div className="mt-auto border-t border-sena-linea/70 pt-3 dark:border-sena-borde/50">
                        {botonesLectura(
                          `adic-${d.archivo.id}`,
                          d.archivo.nombre_original,
                          () => verArchivo(rutaArchivo(`documentos/${d.archivo.id}/archivo?inline=1`), d.archivo.nombre_original),
                          () => descargarDocumentoRevision(postulacionSel.id, d.archivo.id, d.archivo.nombre_original),
                        )}
                      </div>
                    )}
                  </Tarjeta>
                ))}
              </div>
            </section>
          )}

          {revision.skills && revision.skills.length > 0 && (
            <section>
              <h3 className={`${TITULO_BLOQUE} mb-3`}>Skills declaradas</h3>
              <div className="flex flex-col gap-3">
                {revision.skills.map((s) => (
                  <Tarjeta key={s.id} as="article" className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className={`font-medium ${CLASE_TEXTO_FUERTE} ${CLASE_TEXTO_PARTIDO}`}>{s.nombre}</span>
                          <Etiqueta tono="neutral">{s.origen}</Etiqueta>
                        </div>
                        {s.certificado && (
                          <p className={`text-xs ${CLASE_TEXTO_SUAVE} ${CLASE_TEXTO_PARTIDO}`}>
                            Certificado: {s.certificado.nombre_original} · {formatearTamano(s.certificado.tamano_bytes)}
                          </p>
                        )}
                      </div>
                      {s.certificado &&
                        botonesLectura(
                          `skill-${s.id}`,
                          s.certificado.nombre_original,
                          () => verArchivo(rutaArchivo(`skills/${s.id}/certificado/archivo?inline=1`), s.certificado.nombre_original),
                          () => descargarCertificadoRevision(postulacionSel.id, s.id, s.certificado.nombre_original),
                        )}
                    </div>
                  </Tarjeta>
                ))}
              </div>
            </section>
          )}

          {revision.documentos?.length === 0 && revision.adicionales?.length === 0 && revision.skills?.length === 0 && (
            <p className={`py-8 text-center ${CLASE_TEXTO_SUAVE}`}>No hay documentos ni skills en esta postulación.</p>
          )}
        </Tarjeta>
      )}
    </>
  )
}

// 'key' por aspirante: al cambiar de portafolio el estado del anterior (revisión abierta, errores) se descarta.
export default function PortafolioDetalle() {
  const { userId } = useParams()
  return <Portafolio key={userId} userId={userId} />
}
