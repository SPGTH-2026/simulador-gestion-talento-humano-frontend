import { useSeccionDocumentosRequeridos } from './useSeccionDocumentosRequeridos'
import { TAMANO_MAXIMO_MB } from '../../lib/archivosPostulacion'
import { ETIQUETAS_DOCUMENTO, esObligatorioFijo } from '../../lib/documentosConvocatoria'
import { CODIGO_LIBRETA_MILITAR, formatearTamano, idFilaDocumento } from '../../lib/postulacionDocumentos'
import { formatearFechaHora } from '../../lib/ventanaPostulacion'
import { CLASE_CAJA_SUAVE, CLASE_TARJETA, CLASE_TITULO_SECCION } from '../../lib/estilos'
import MarcaObligatorio from '../ui/MarcaObligatorio'
import BarraProgreso from '../ui/BarraProgreso'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'

const ESTILO_TARJETA = `${CLASE_TARJETA} p-4`

const ESTILO_TITULO = CLASE_TITULO_SECCION

const CLASE_ETIQUETA =
  'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-sena-superficie-alta dark:text-sena-texto-suave'

// Documentos que pide la convocatoria: uno por tipo, con cargar/reemplazar (un obligatorio no se elimina).
// La primera acción de guardado dispara el borrador silencioso (asegurar), así
// que la sección funciona con y sin postulación existente.
export default function SeccionDocumentosRequeridos({
  vista,
  editable,
  sexo,
  asegurar,
  onRecargar,
  onError,
  correccion = null,
  soloCorreccion = false,
  // Hay una corrección vigente: el backend solo deja reemplazar los documentos marcados y no permite eliminar.
  bloqueoCorreccion = false,
}) {
  const ctx = useSeccionDocumentosRequeridos({ vista, editable, sexo, asegurar, onRecargar, onError, correccion, soloCorreccion, bloqueoCorreccion })
  const { archivosSubidos, documentos, elegirArchivo, eliminar, enVuelo, errores, hayMarcados, progreso, refsInput, reglasDe, sexoMujer, sinSexo, ver } = ctx
  return (
    <section className={ESTILO_TARJETA}>
      <h2 className={ESTILO_TITULO}>Documentos requeridos</h2>
      <div className={`${CLASE_CAJA_SUAVE} mt-3 flex items-start gap-2.5 px-3 py-2.5`}>
        <Icono nombre="documentos" className="mt-0.5 size-5 shrink-0 text-sena-azul dark:text-sena-acento" />
        <p className="text-sm text-slate-700 dark:text-sena-texto">
          <strong className="font-semibold">Solo PDF, máximo {TAMANO_MAXIMO_MB} MB por archivo.</strong>{' '}
          {soloCorreccion ? (
            'Reemplaza únicamente los documentos marcados por el evaluador.'
          ) : (
            <>
              Los campos marcados con <span className="font-semibold text-peligro">*</span> son obligatorios para enviar
              tu postulación. Un documento obligatorio no se elimina: se reemplaza por otro archivo.
            </>
          )}
        </p>
      </div>

      <ul className="mt-3 flex flex-col divide-y divide-slate-100 dark:divide-sena-borde">
        {documentos.map((documento) => {
          const { parametro, obligatorio, estado: estadoDoc, archivo } = documento
          const marcado = Boolean(correccion?.marcados?.has(parametro.id))
          const reemplazado = Boolean(correccion?.reemplazados?.has(parametro.id))
          // En el modo corrección solo se muestran los documentos marcados.
          if (soloCorreccion && !marcado) return null
          const codigo = parametro.codigo
          // Clave estable para el estado local: los documentos nuevos del
          // gestor nacen sin código, así que se usa el id como respaldo.
          const clave = parametro.codigo ?? parametro.id
          // Si acaba de subir, usamos el archivo local para mostrar las opciones
          // de inmediato, sin esperar a que onRecargar() vuelva.
          const archivoMostrar = archivosSubidos[clave] ?? archivo
          const enProceso = enVuelo.has(clave)
          const error = errores[clave]
          const esLibreta = codigo === CODIGO_LIBRETA_MILITAR
          const noAplicaReal = estadoDoc === 'no_aplica'
          const noAplica = noAplicaReal || (esLibreta && sexoMujer)
          // No aplica (mujer o menor de edad): no se muestra. Solo se ve a quien le corresponde presentarla.
          if (esLibreta && noAplica) return null
          const bloqueoLibreta = esLibreta && (sexoMujer || sinSexo)
          const puedeEditar = editable && !enProceso
          // Con una corrección vigente, un documento NO marcado no se toca (regla del servidor).
          const { bloqueadoReemplazo: bloqueadoPorCorreccion, motivoReemplazo: motivoCorreccion, eliminarBloqueado, motivoEliminar } =
            reglasDe(parametro.id)
          // La libreta se muestra siempre que se pueda editar (deshabilitada si
          // no aplica); el resto de documentos no se muestran si el backend los
          // marcó 'no_aplica'.
          const mostrarSubir = puedeEditar && !(noAplicaReal && !esLibreta)
          // Un obligatorio cargado no se elimina: solo se reemplaza (regla del servidor, RF-DOC-006). Los opcionales sí.
          const esObligatorio = Boolean(obligatorio) || esObligatorioFijo(codigo)
          const yaCargado = estadoDoc === 'subido' || Boolean(archivosSubidos[clave])

          const motivoLibreta = !esLibreta
            ? ''
            : sexoMujer
              ? 'No aplica para ti'
              : sinSexo
                ? 'Llena tus datos personales para saber si te aplica'
                : ''

          return (
            <li key={parametro.id} id={idFilaDocumento(parametro.id)} className="flex scroll-mt-24 flex-col gap-2 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-sena-texto">
                    {parametro.nombre}
                    {esObligatorio ? (
                      <MarcaObligatorio />
                    ) : (
                      <span className="text-sm font-normal text-slate-600 dark:text-sena-texto-suave">(opcional)</span>
                    )}
                    {ETIQUETAS_DOCUMENTO[codigo] && (
                      <span className={CLASE_ETIQUETA}>{ETIQUETAS_DOCUMENTO[codigo]}</span>
                    )}
                    {marcado && !reemplazado && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                        Corregir este documento
                      </span>
                    )}
                    {marcado && reemplazado && (
                      <span className="rounded-full bg-sena-cielo/30 px-2 py-0.5 text-xs font-medium text-sena-azul dark:bg-sena-superficie-alta dark:text-sena-texto">
                        Corregido, en revisión
                      </span>
                    )}
                  </p>

                  {(estadoDoc === 'subido' || archivosSubidos[clave]) && archivoMostrar && (
                    // Ficha del archivo cargado: icono en verde de estado «listo», nombre en una línea propia y debajo,
                    // más discreto, tamaño y fecha. Ocupa dos líneas fijas por documento, sin importar cuántos haya, y
                    // la regla de los obligatorios se explica una sola vez en la leyenda de arriba, no en cada fila.
                    <div className="mt-1.5 flex min-w-0 items-start gap-2">
                      <Icono nombre="documentos" className="mt-0.5 size-4 shrink-0 text-exito" />
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-slate-700 dark:text-sena-texto">
                          {archivoMostrar.nombre_original}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-sena-texto-suave">
                          {formatearTamano(archivoMostrar.tamano_bytes)}
                          {archivoMostrar.subido_en && <> · Cargado el {formatearFechaHora(archivoMostrar.subido_en)}</>}
                        </p>
                      </div>
                    </div>
                  )}
                  {estadoDoc === 'pendiente' && !bloqueoLibreta && (
                    <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
                      Pendiente por cargar
                    </p>
                  )}
                  {noAplica && !esLibreta && (
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-sena-texto-suave">
                      No aplica
                    </p>
                  )}
                  {motivoCorreccion && puedeEditar && (
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-sena-texto-suave">{motivoCorreccion}</p>
                  )}
                  {/* Un opcional cargado y marcado no se elimina durante la corrección: se explica en vez de ocultar el botón sin más. */}
                  {!motivoCorreccion && puedeEditar && eliminarBloqueado && !esObligatorio && estadoDoc === 'subido' && (
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-sena-texto-suave">{motivoEliminar}</p>
                  )}
                  {motivoLibreta && (
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-sena-texto-suave">
                      {motivoLibreta}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Botón Ver (preview) - solo si hay archivo */}
                  {archivoMostrar && (
                    <Boton variante="contorno" tamano="tactil"
                      disabled={enProceso}
                      onClick={() => ver(archivoMostrar)}>
                      Ver
                    </Boton>
                  )}

                  {mostrarSubir && (
                    <Boton variante="contorno" tamano="tactil"
                      ocupado={enProceso}
                      disabled={bloqueoLibreta || bloqueadoPorCorreccion || enProceso}
                      title={bloqueoLibreta ? motivoLibreta : motivoCorreccion || undefined}
                      onClick={() => refsInput.current[clave]?.click()}>
                      <span className="inline-flex items-center gap-1.5">
                        {enProceso
                          ? 'Cargando…'
                          : yaCargado
                            ? 'Reemplazar'
                            : error
                              ? 'Reintentar'
                              : 'Cargar archivo'}
                      </span>
                    </Boton>
                  )}

                  {puedeEditar && !soloCorreccion && !eliminarBloqueado && estadoDoc === 'subido' && !esObligatorio && (
                    <Boton variante="peligroSuave" tamano="tactil"
                      disabled={enProceso}
                      onClick={() => eliminar(archivoMostrar, clave, parametro.id)}>
                      {enProceso ? 'Eliminando...' : 'Eliminar'}
                    </Boton>
                  )}
                </div>
              </div>

              {/* Barra a todo el ancho de la fila (antes quedaba en la columna del nombre y se veía mucho más corta que
                  la de completitud y las de skills y adicionales). */}
              {enProceso && progreso[clave] != null && (
                <BarraProgreso valor={progreso[clave]} etiqueta="Cargando documento" className="mt-0" />
              )}

              {error && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <input
                ref={(el) => {
                  refsInput.current[clave] = el
                }}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                aria-label={`Cargar archivo: ${parametro.nombre}`}
                onChange={(e) => {
                  const archivo = e.target.files?.[0]
                  if (archivo) elegirArchivo(clave, parametro, archivo)
                  // Se limpia para poder elegir el mismo archivo otra vez.
                  e.target.value = ''
                }}
              />
            </li>
          )
        })}

        {(documentos.length === 0 || (soloCorreccion && !hayMarcados)) && (
          <li className="py-3 text-sm text-slate-600 dark:text-sena-texto-suave">
            {soloCorreccion
              ? 'No tienes documentos marcados para corregir.'
              : 'Esta convocatoria no pide documentos.'}
          </li>
        )}
      </ul>
    </section>
  )
}