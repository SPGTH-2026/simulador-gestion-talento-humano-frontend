import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  obtenerPortafolio,
  estadoRevision,
  descargarDocumentoRevision,
  descargarCertificadoRevision,
} from '../../api/portafolios'
import { abrirArchivoEnPestana, mensajeErrorBlob } from '../../api/postulacionesDocumentos'
import Mensaje from '../../components/ui/Mensaje'
import Cargando from '../../components/ui/Cargando'
import IndicadorCompletitud from '../../components/postulacion/IndicadorCompletitud'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import { IconoOjo, IconoDescarga } from '../../components/convocatorias/Iconos'
import { formatearTamano } from '../../lib/postulacionDocumentos'

// Portafolio en solo lectura: quien llega aquí ve y descarga, no escribe.
export default function PortafolioDetalle() {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [portafolio, setPortafolio] = useState(null)
  const [postulacionSel, setPostulacionSel] = useState(null)
  const [revision, setRevision] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [errorAccion, setErrorAccion] = useState('')

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

  const cargarRevision = useCallback(async (postulacionId) => {
    setCargando(true)
    setError('')
    try {
      const data = await estadoRevision(postulacionId)
      setRevision(data)
    } catch (e) {
      const msg = await mensajeErrorBlob(e)
      setError(msg || 'No se pudo cargar la revisión de documentos.')
      console.error(e)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarPortafolio()
  }, [cargarPortafolio])

  const handleVerDocumentos = (postulacion) => {
    if (postulacion.puede_ver_documentos) {
      setPostulacionSel(postulacion)
      setRevision(null)
      setErrorAccion('')
      cargarRevision(postulacion.id)
    }
  }

  const verArchivo = (ruta, nombre) => {
    setErrorAccion('')
    abrirArchivoEnPestana(ruta, { nombre }).catch(async (e) => {
      const msg = await mensajeErrorBlob(e)
      setErrorAccion(msg || 'No se pudo abrir el archivo.')
    })
  }

  const descargar = async (descarga) => {
    setErrorAccion('')
    try {
      await descarga()
    } catch (e) {
      const msg = await mensajeErrorBlob(e)
      setErrorAccion(msg || 'No se pudo descargar el archivo.')
    }
  }

  const rutaArchivo = (suffix) =>
    `/revision/postulaciones/${postulacionSel.id}/${suffix}`

  if (cargando && !portafolio) {
    return <Cargando mensaje="Cargando portafolio..." />
  }

  if (error && !portafolio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Mensaje tipo="error">{error}</Mensaje>
        <button onClick={() => navigate(-1)} className="text-sena-azul hover:underline">
          Volver
        </button>
      </div>
    )
  }

  if (!portafolio) return null

  const { usuario, postulaciones } = portafolio

  const botonesLectura = (ver, descargarFn) => (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={ver}
        className="px-3 py-1.5 text-sm font-semibold text-white bg-sena-azul rounded hover:bg-sena-azul/90 transition-colors whitespace-nowrap flex items-center gap-1.5"
      >
        <IconoOjo className="h-4 w-4" />
        Ver
      </button>
      <button
        onClick={() => descargar(descargarFn)}
        className="px-3 py-1.5 text-sm font-semibold text-sena-azul border border-sena-azul/25 rounded hover:bg-sena-cielo/30 transition-colors whitespace-nowrap flex items-center gap-1.5 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
      >
        <IconoDescarga className="h-4 w-4" />
        Descargar
      </button>
    </div>
  )

  return (
    <>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-sena-azul hover:underline mb-2 inline-block"
            >
              ← Volver al listado
            </button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Portafolio de {usuario.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {usuario.email} • Ficha: {usuario.ficha?.codigo ?? 'Sin ficha'}
            </p>
          </div>
        </header>

        {portafolio.postulaciones.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">
              Este aspirante no tiene postulaciones visibles en sus fichas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {postulaciones.map(p => (
              <article
                key={p.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <EtiquetaPostulacion codigo={p.estado?.codigo} nombre={p.estado?.nombre} />
                      {p.puede_ver_documentos ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Documentos disponibles
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                          Sin documentos (borrador)
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {p.convocatoria?.nombre} ({p.convocatoria?.codigo})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <IndicadorCompletitud estado={{ completo: p.completo }} />
                    {p.puede_ver_documentos && (
                      <button
                        onClick={() => handleVerDocumentos(p)}
                        className="px-3 py-1.5 text-sm font-semibold text-white bg-sena-azul rounded hover:bg-sena-azul/90 transition-colors"
                      >
                        Ver documentos
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Postulada el {p.fecha_postulacion ? new Date(p.fecha_postulacion).toLocaleDateString('es-CO') : '—'}
                  • Convocatoria: {p.convocatoria?.codigo}
                  • Documentos: {p.documentos?.subidos ?? 0}/{p.documentos?.requeridos ?? 0} requeridos, {p.documentos?.adicionales ?? 0} adicionales
                  • Skills: {p.skills?.total ?? 0} ({p.skills?.con_certificado ?? 0} con certificado)
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {postulacionSel && revision && (
        <section className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <header className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Documentos de: {postulacionSel.convocatoria?.nombre}
            </h2>
            <button
              onClick={() => { setPostulacionSel(null); setRevision(null); setErrorAccion('') }}
              className="text-sena-azul hover:underline text-sm"
            >
              ← Volver al listado de postulaciones
            </button>
          </header>

          {errorAccion && <div className="mb-4"><Mensaje tipo="error">{errorAccion}</Mensaje></div>}

          <IndicadorCompletitud estado={revision} />

          {revision.requiere_sexo && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              ⚠️ Esta convocatoria exige libreta militar y no hay sexo registrado en el perfil.
            </div>
          )}

          {revision.documentos && revision.documentos.length > 0 && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Documentos requeridos</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {revision.documentos.map(d => (
                  <article
                    key={d.parametro?.id ?? d.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900 dark:text-white">{d.parametro?.nombre ?? d.parametro?.codigo}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">{d.parametro?.codigo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {d.obligatorio ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Obligatorio</span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">Opcional</span>
                          )}
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                            {d.estado === 'subido' ? 'Subido' : d.estado === 'pendiente' ? 'Pendiente' : 'No aplica'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                      {d.archivo ? (
                        <span>{d.archivo.nombre_original} · {formatearTamano(d.archivo.tamano_bytes)}</span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400">Sin archivo</span>
                      )}
                    </div>

                    {d.archivo && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                        {botonesLectura(
                          () => verArchivo(rutaArchivo(`documentos/${d.archivo.id}/archivo?inline=1`), d.archivo.nombre_original),
                          () => descargarDocumentoRevision(postulacionSel.id, d.archivo.id, d.archivo.nombre_original),
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {revision.adicionales && revision.adicionales.length > 0 && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Documentos adicionales</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {revision.adicionales.map(d => (
                  <article
                    key={d.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white">{d.titulo}</div>
                      {d.nota && <div className="text-xs text-slate-500 dark:text-slate-400">{d.nota}</div>}
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {d.archivo?.nombre_original} · {formatearTamano(d.archivo?.tamano_bytes)}
                      </div>
                    </div>
                    {d.archivo && (
                      <div className="pt-2 mt-3 border-t border-slate-100 dark:border-slate-700">
                        {botonesLectura(
                          () => verArchivo(rutaArchivo(`documentos/${d.archivo.id}/archivo?inline=1`), d.archivo.nombre_original),
                          () => descargarDocumentoRevision(postulacionSel.id, d.archivo.id, d.archivo.nombre_original),
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {revision.skills && revision.skills.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Skills declaradas</h3>
              <div className="space-y-3">
                {revision.skills.map(s => (
                  <article
                    key={s.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900 dark:text-white">{s.nombre}</span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                            {s.origen}
                          </span>
                        </div>
                        {s.certificado && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Certificado: {s.certificado.nombre_original} · {formatearTamano(s.certificado.tamano_bytes)}
                          </div>
                        )}
                      </div>
                      {s.certificado && botonesLectura(
                        () => verArchivo(rutaArchivo(`skills/${s.id}/certificado/archivo?inline=1`), s.certificado.nombre_original),
                        () => descargarCertificadoRevision(postulacionSel.id, s.id, s.certificado.nombre_original),
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {(revision.documentos?.length === 0 && revision.adicionales?.length === 0 && revision.skills?.length === 0) && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              No hay documentos ni skills en esta postulación.
            </div>
          )}
        </section>
      )}
    </>
  )
}
