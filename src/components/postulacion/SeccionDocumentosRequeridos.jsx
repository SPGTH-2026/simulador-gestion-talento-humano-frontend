import { useRef, useState } from 'react'
import { validarArchivoPostulacion, TAMANO_MAXIMO_MB } from '../../lib/archivosPostulacion'
import { ETIQUETAS_DOCUMENTO, esObligatorioFijo } from '../../lib/documentosConvocatoria'
import { CODIGO_LIBRETA_MILITAR, formatearTamano } from '../../lib/postulacionDocumentos'
import { formatearFechaHora } from '../../lib/ventanaPostulacion'
import { CLASE_TARJETA, CLASE_TITULO_SECCION } from '../../lib/estilos'
import EtiquetaDocumento from '../ui/EtiquetaDocumento'
import {
  subirDocumento,
  eliminarDocumento,
} from '../../api/postulacionesDocumentos'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import BarraProgreso from '../ui/BarraProgreso'

const ESTILO_TARJETA = `${CLASE_TARJETA} p-4`

const ESTILO_TITULO = CLASE_TITULO_SECCION

const CLASE_BOTON =
  'rounded border border-sena-azul/25 px-3 py-1.5 text-xs font-semibold text-sena-azul transition-colors hover:bg-sena-cielo/30 disabled:cursor-not-allowed disabled:opacity-40 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta'

const CLASE_ELIMINAR =
  'rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50'

const CLASE_ETIQUETA =
  'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-sena-superficie-alta dark:text-sena-texto-suave'

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
  // progreso[codigo] = porcentaje (0-100) de la subida en curso de ese documento.
  const [progreso, setProgreso] = useState({})
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
    setProgreso((prev) => ({ ...prev, [codigo]: 0 }))
    limpiarError(codigo)
    try {
      const { postulacionId } = await asegurar()
      await subirDocumento(postulacionId, codigo, archivo, (porcentaje) =>
        setProgreso((prev) => ({ ...prev, [codigo]: porcentaje })),
      )
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

  const confirmar = useConfirmacion()

  const eliminar = async (documento, codigo) => {
    const nombre = documento.archivo?.nombre_original
    const ok = await confirmar({
      titulo: 'Eliminar documento',
      mensaje: nombre
        ? `¿Estás seguro de eliminar "${nombre}"? Podrás volver a subirlo.`
        : '¿Estás seguro de eliminar este documento? Podrás volver a subirlo.',
      textoConfirmar: 'Eliminar',
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return

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

  // "Ver": el PDF lo abre PanelDocumentosPostulacion (evento document:view).
  const ver = (documento) =>
    window.dispatchEvent(new CustomEvent('document:view', {
      detail: { documentoId: documento.id, nombre: documento.nombre_original },
    }))

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
                    <EtiquetaDocumento
                      obligatorio={Boolean(obligatorio) || esObligatorioFijo(codigo)}
                    />
                    {ETIQUETAS_DOCUMENTO[codigo] && (
                      <span className={CLASE_ETIQUETA}>{ETIQUETAS_DOCUMENTO[codigo]}</span>
                    )}
                  </p>

                  {estadoDoc === 'subido' && archivo && (
                    <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-sena-texto-suave">
                      {archivo.nombre_original} · {formatearTamano(archivo.tamano_bytes)}
                      {archivo.subido_en && <> · Subido el {formatearFechaHora(archivo.subido_en)}</>}
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
                  {enProceso && <BarraProgreso valor={progreso[codigo] ?? 0} />}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Botón Ver (preview) - solo si hay archivo */}
                  {archivo && (
                    <button
                      type="button"
                      disabled={enProceso}
                      onClick={() => ver(archivo)}
                      className={CLASE_BOTON}
                    >
                      Ver
                    </button>
                  )}

                  {mostrarSubir && (
                    <button
                      type="button"
                      disabled={bloqueoLibreta || enProceso}
                      title={bloqueoLibreta ? motivoLibreta : undefined}
                      onClick={() => refsInput.current[codigo]?.click()}
                      className={CLASE_BOTON}
                    >
                      {enProceso
                        ? 'Subiendo...'
                        : estadoDoc === 'subido'
                          ? 'Reemplazar'
                          : error
                            ? 'Reintentar'
                            : 'Subir'}
                    </button>
                  )}

                  {puedeEditar && estadoDoc === 'subido' && (
                    <button
                      type="button"
                      disabled={enProceso}
                      onClick={() => eliminar(archivo, codigo)}
                      className={CLASE_ELIMINAR}
                    >
                      {enProceso ? 'Eliminando...' : 'Eliminar'}
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