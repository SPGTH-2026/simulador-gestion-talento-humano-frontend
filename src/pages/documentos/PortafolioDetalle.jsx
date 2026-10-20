import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenerPortafolio, estadoRevision, descargarDocumentoRevision, descargarCertificadoRevision, mensajeErrorBlob } from '../../api/portafolios'
import Mensaje from '../../components/ui/Mensaje'
import Cargando from '../../components/ui/Cargando'
import IndicadorCompletitud from '../../components/postulacion/IndicadorCompletitud'
import EtiquetaEstado from '../../components/convocatorias/EtiquetaEstado'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import { formatearTamano } from '../../lib/postulacionDocumentos'

export default function PortafolioDetalle() {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [portafolio, setPortafolio] = useState(null)
  const [postulacionSel, setPostulacionSel] = useState(null)
  const [revision, setRevision] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

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
      cargarRevision(postulacion.id)
    }
  }

  const descargarDoc = async (postulacionId, documentoId, nombre) => {
    try {
      await descargarDocumentoRevision(postulacionId, documentoId, nombre)
    } catch (e) {
      const msg = await mensajeErrorBlob(e)
      alert(msg || 'Error al descargar el documento.')
    }
  }

  const descargarCert = async (postulacionId, skillId, nombre) => {
    try {
      await descargarCertificadoRevision(postulacionId, skillId, nombre)
    } catch (e) {
      const msg = await mensajeErrorBlob(e)
      alert(msg || 'Error al descargar el certificado.')
    }
  }

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

  return (
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
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <EtiquetaPostulacion postulacion={p} />
                    <EtiquetaEstado codigo={p.estado?.codigo} nombre={p.estado?.nombre} />
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

      {postulacionSel && revision && (
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <header className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Documentos de: {postulacionSel.convocatoria?.nombre}
            </h2>
            <button
              onClick={() => { setPostulacionSel(null); setRevision(null); }}
              className="text-sena-azul hover:underline text-sm"
            >
              ← Volver al listado de postulaciones
            </button>
          </header>

          <IndicadorCompletitud estado={revision} />

          {revision.requiere_sexo && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              ⚠️ Esta convocatoria exige libreta militar y no hay sexo registrado en el perfil.
            </div>
          )}

          {revision.documentos && revision.documentos.length > 0 && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Documentos requeridos</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <th className="pb-2 pr-4">Documento</th>
                      <th className="pb-2 pr-4">Obligatorio</th>
                      <th className="pb-2 pr-4">Estado</th>
                      <th className="pb-2 pr-4">Archivo</th>
                      <th className="pb-2">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {revision.documentos.map(d => (
                      <tr key={d.parametro?.id ?? d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-slate-900 dark:text-white">{d.parametro?.nombre ?? d.parametro?.codigo}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{d.parametro?.codigo}</div>
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {d.obligatorio ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Sí</span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">No</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <EtiquetaEstado codigo={d.estado} nombre={d.estado} />
                        </td>
                        <td className="py-3 pr-4">
                          {d.archivo ? (
                            <div className="text-sm text-slate-700 dark:text-slate-300">
                              {d.archivo.nombre_original} · {formatearTamano(d.archivo.tamano_bytes)}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          {d.archivo && (
                            <button
                              onClick={() => descargarDoc(postulacionSel.id, d.archivo.id, d.archivo.nombre_original)}
                              className="text-sm text-sena-azul hover:underline"
                            >
                              Descargar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {revision.adicionales && revision.adicionales.length > 0 && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Documentos adicionales</h3>
              <div className="space-y-3">
                {revision.adicionales.map(d => (
                  <div key={d.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-white">{d.titulo}</div>
                      {d.nota && <div className="text-xs text-slate-500 dark:text-slate-400">{d.nota}</div>}
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {d.archivo?.nombre_original} · {formatearTamano(d.archivo?.tamano_bytes)}
                      </div>
                    </div>
                    {d.archivo && (
                      <button
                        onClick={() => descargarDoc(postulacionSel.id, d.archivo.id, d.archivo.nombre_original)}
                        className="px-3 py-1.5 text-sm font-semibold text-white bg-sena-azul rounded hover:bg-sena-azul/90 transition-colors whitespace-nowrap"
                      >
                        Descargar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {revision.skills && revision.skills.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Skills declaradas</h3>
              <div className="space-y-3">
                {revision.skills.map(s => (
                  <div key={s.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                    {s.certificado && (
                      <button
                        onClick={() => descargarCert(postulacionSel.id, s.id, s.certificado.nombre_original)}
                        className="px-3 py-1.5 text-sm font-semibold text-white bg-sena-azul rounded hover:bg-sena-azul/90 transition-colors whitespace-nowrap"
                      >
                        Descargar certificado
                      </button>
                    )}
                  </div>
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
    </div>
  )
}