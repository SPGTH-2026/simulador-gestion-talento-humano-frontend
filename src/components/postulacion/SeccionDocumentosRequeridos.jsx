import { useRef, useState } from 'react'
import { validarArchivoPostulacion, TAMANO_MAXIMO_MB } from '../../lib/archivosPostulacion'
import { etiquetasDocumento } from '../../lib/documentosConvocatoria'
import { CODIGO_LIBRETA_MILITAR, formatearTamano } from '../../lib/postulacionDocumentos'
import {
  subirDocumento,
  eliminarDocumento,
  descargarDocumento,
  mensajeErrorBlob,
} from '../../api/postulacionesDocumentos'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'
import DocumentActions from './DocumentActions'

const ESTILO_TARJETA =
  'rounded-lg border border-slate-200 bg-white p-4 dark:border-sena-borde dark:bg-sena-superficie'

const ESTILO_TITULO =
  'border-l-4 border-sena pl-3 text-sm font-semibold text-slate-800 dark:text-sena-texto'

const CLASE_BOTON =
  'rounded border border-sena-azul/25 px-3 py-1.5 text-xs font-semibold text-sena-azul transition-colors hover:bg-sena-cielo/30 disabled:cursor-not-allowed disabled:opacity-40 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta'

const CLASE_ELIMINAR =
  'rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50'

const CLASE_ETIQUETA =
  'rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-sena-superficie-alta dark:text-sena-texto-suave'

// Documentos que pide la convocatoria: uno por tipo, con subir/reemplazar.
// La primera acción de guardado dispara el borrador silencioso (asegurar), así
// que la sección funciona con y sin postulación existente.
export default function SeccionDocumentosRequeridos({
  vista,
  editable,
  sexo,
  asegurar,
  onRecargar,
  onError,
}) {
  const documentos = vista.documentos ?? []
  const sexoMujer = sexo?.codigo === 'mujer'
  const sinSexo = !sexo?.codigo

  // códigos de los documentos con una petición EN VUELO. Un Set permite que
  // varias filas trabajen a la vez sin pisarse (una operación por documento).
  const [enVuelo, setEnVuelo] = useState(() => new Set())
  // errores[codigo] = mensaje de validación o del backend.
  const [errores, setErrores] = useState({})
  const refsInput = useRef({})

  const marcarEnVuelo = (codigo, activo) =>
    setEnVuelo((prev) => {
      const siguiente = new Set(prev)
      if (activo) siguiente.add(codigo)
      else siguiente.delete(codigo)
      return siguiente
    })

  const limpiarError = (codigo) =>
    setErrores((prev) => {
      const siguiente = { ...prev }
      delete siguiente[codigo]
      return siguiente
    })

  // La postulación ya existe (la fila tiene archivo o la vista trae su id);
  // si no, el borrador se crea de forma silenciosa justo antes de guardar.
  const pidSeguro = async () => vista.postulacion?.id ?? (await asegurar()).postulacionId

  const elegirArchivo = async (codigo, archivo) => {
    const validacion = validarArchivoPostulacion(archivo)
    if (!validacion.ok) {
      setErrores((prev) => ({ ...prev, [codigo]: validacion.mensaje }))
      return
    }

    marcarEnVuelo(codigo, true)
    limpiarError(codigo)
    try {
      const { postulacionId } = await asegurar()
      await subirDocumento(postulacionId, codigo, archivo)
      onRecargar()
    } catch (e) {
      // 422 por archivo, tipo de documento o libreta militar: se pinta en la fila.
      const deCampo = erroresDeCampo(e)
      const mensaje = deCampo.codigo || deCampo.archivo || mensajeError(e)
      setErrores((prev) => ({ ...prev, [codigo]: mensaje }))
    } finally {
      marcarEnVuelo(codigo, false)
    }
  }

  const eliminar = async (documento, codigo) => {
    if (!window.confirm('¿Eliminar este documento? Podrás volver a subirlo.')) return

    marcarEnVuelo(codigo, true)
    limpiarError(codigo)
    try {
      await eliminarDocumento(await pidSeguro(), documento.id)
      onRecargar()
    } catch (e) {
      onError(mensajeError(e))
    } finally {
      marcarEnVuelo(codigo, false)
    }
  }

  return (
    <section className={ESTILO_TARJETA}>
      <h2 className={ESTILO_TITULO}>Documentos requeridos</h2>
      <p className="mt-2 text-xs text-slate-500 dark:text-sena-texto-suave">
        Solo se aceptan archivos PDF de máximo {TAMANO_MAXIMO_MB} MB.
      </p>

      <ul className="mt-3 flex flex-col divide-y divide-slate-100 dark:divide-sena-borde">
        {documentos.map((documento) => {
          const { parametro, obligatorio, estado: estadoDoc, archivo } = documento
          const codigo = parametro.codigo
          const enProceso = enVuelo.has(codigo)
          const error = errores[codigo]
          const esLibreta = codigo === CODIGO_LIBRETA_MILITAR
          const noAplicaReal = estadoDoc === 'no_aplica'
          const noAplica = noAplicaReal || (esLibreta && sexoMujer)
          const bloqueoLibreta = esLibreta && (sexoMujer || sinSexo)
          const puedeEditar = editable && !enProceso
          // La libreta se muestra siempre que se pueda editar (deshabilitada si
          // no aplica); el resto de documentos no se muestran si el backend los
          // marcó 'no_aplica'.
          const mostrarSubir = puedeEditar && !(noAplicaReal && !esLibreta)

          const motivoLibreta = !esLibreta
            ? ''
            : sexoMujer
              ? 'No aplica para ti'
              : sinSexo
                ? 'Elige tu sexo para saber si te aplica'
                : ''

          return (
            <li key={parametro.id} className="flex flex-col gap-2 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-sena-texto">
                    {parametro.nombre}
                    {etiquetasDocumento(codigo, obligatorio).map((etiqueta) => (
                      <span key={etiqueta} className={CLASE_ETIQUETA}>
                        {etiqueta}
                      </span>
                    ))}
                  </p>

                  {estadoDoc === 'subido' && archivo && (
                    <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-sena-texto-suave">
                      {archivo.nombre_original} · {formatearTamano(archivo.tamano_bytes)}
                    </p>
                  )}
                  {estadoDoc === 'pendiente' && !bloqueoLibreta && (
                    <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                      Pendiente por subir
                    </p>
                  )}
                  {noAplica && !esLibreta && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-sena-texto-suave">
                      No aplica
                    </p>
                  )}
                  {motivoLibreta && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-sena-texto-suave">
                      {motivoLibreta}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Botón Ver (preview) - solo si hay archivo */}
                  {archivo && (
                    <button
                      type="button"
                      disabled={enProceso}
                      onClick={() => {
                        // Se manejará desde el componente padre via DocumentActions
                        // Aquí solo emitimos un evento personalizado
                        window.dispatchEvent(new CustomEvent('document:view', {
                          detail: { archivo, codigo }
                        }))
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-sena-azul rounded hover:bg-sena-azul/90 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 5.943 7.523 0 12 0c4.478 0 8.268 5.943 8.008 10.734C16.732 18.057 11.278 24 12 24c-4.478 0-8.268-5.943-8.008-10.734z" />
                      </svg>
                      Ver
                    </button>
                  )}

                  {mostrarSubir && (
                    <button
                      type="button"
                      disabled={bloqueoLibreta}
                      title={bloqueoLibreta ? motivoLibreta : undefined}
                      onClick={() => refsInput.current[codigo]?.click()}
                      className={CLASE_BOTON}
                    >
                      {enProceso
                        ? 'Subiendo...'
                        : estadoDoc === 'subido'
                          ? 'Reemplazar'
                          : 'Subir'}
                    </button>
                  )}

                  {puedeEditar && estadoDoc === 'subido' && (
                    <button
                      type="button"
                      onClick={() => eliminar(archivo, codigo)}
                      className={CLASE_ELIMINAR}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <input
                ref={(el) => {
                  refsInput.current[codigo] = el
                }}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                aria-label={`Subir ${parametro.nombre}`}
                onChange={(e) => {
                  const archivo = e.target.files?.[0]
                  if (archivo) elegirArchivo(codigo, archivo)
                  // Se limpia para poder elegir el mismo archivo otra vez.
                  e.target.value = ''
                }}
              />
            </li>
          )
        })}

        {documentos.length === 0 && (
          <li className="py-3 text-sm text-slate-500 dark:text-sena-texto-suave">
            Esta convocatoria no pide documentos.
          </li>
        )}
      </ul>
    </section>
  )
}