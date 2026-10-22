import { useRef, useState } from 'react'
import { validarArchivoPostulacion, TAMANO_MAXIMO_MB } from '../../lib/archivosPostulacion'
import {
  MAX_DOCUMENTOS_ADICIONALES,
  MAX_TITULO_ADICIONAL,
  MAX_NOTA_ADICIONAL,
  formatearTamano,
} from '../../lib/postulacionDocumentos'
import { formatearFechaHora } from '../../lib/ventanaPostulacion'
import { CLASE_TARJETA, CLASE_TITULO_SECCION } from '../../lib/estilos'
import {
  subirAdicional,
  eliminarDocumento,
} from '../../api/postulacionesDocumentos'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'

const ESTILO_TARJETA = `${CLASE_TARJETA} p-4`

const ESTILO_TITULO = CLASE_TITULO_SECCION

const CLASE_BOTON =
  'rounded border border-sena-azul/25 px-3 py-1.5 text-xs font-semibold text-sena-azul transition-colors hover:bg-sena-cielo/30 disabled:cursor-not-allowed disabled:opacity-40 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta'

// Documentos adicionales ("tipo otro"): título obligatorio, nota opcional y
// archivo. Máximo 5; no bloquean la completitud del paso. La primera acción de
// guardado dispara el borrador silencioso (asegurar), así que funciona con y sin
// postulación existente.
export default function SeccionAdicionales({
  vista,
  editable,
  asegurar,
  onRecargar,
  onError,
}) {
  const adicionales = vista.adicionales ?? []

  const [titulo, setTitulo] = useState('')
  const [nota, setNota] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  // ids de los adicionales con una petición en vuelo (una por fila).
  const [enVueloIds, setEnVueloIds] = useState(() => new Set())
  const refArchivo = useRef(null)

  const tope = adicionales.length >= MAX_DOCUMENTOS_ADICIONALES
  const puedeAgregar = editable && !tope

  const pidSeguro = async () => vista.postulacion?.id ?? (await asegurar()).postulacionId

  const marcarEnVuelo = (id, activo) =>
    setEnVueloIds((prev) => {
      const siguiente = new Set(prev)
      if (activo) siguiente.add(id)
      else siguiente.delete(id)
      return siguiente
    })

  const limpiar = () => {
    setTitulo('')
    setNota('')
    setArchivo(null)
    setErrores({})
    if (refArchivo.current) refArchivo.current.value = ''
  }

  const elegirArchivo = (elegido) => {
    const validacion = validarArchivoPostulacion(elegido)
    if (!validacion.ok) {
      setArchivo(null)
      setErrores((prev) => ({ ...prev, archivo: validacion.mensaje }))
      return
    }
    setArchivo(elegido)
    setErrores((prev) => {
      const siguiente = { ...prev }
      delete siguiente.archivo
      return siguiente
    })
  }

  const enviar = async (evento) => {
    evento.preventDefault()

    const nuevos = {}
    if (!titulo.trim()) nuevos.titulo = 'El título es obligatorio.'
    else if (titulo.trim().length > MAX_TITULO_ADICIONAL)
      nuevos.titulo = `El título no puede superar ${MAX_TITULO_ADICIONAL} caracteres.`
    if (nota.length > MAX_NOTA_ADICIONAL)
      nuevos.nota = `La nota no puede superar ${MAX_NOTA_ADICIONAL} caracteres.`
    if (!archivo) nuevos.archivo = 'Adjunta un archivo PDF.'

    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos)
      return
    }

    setEnviando(true)
    setErrores({})
    try {
      const { postulacionId } = await asegurar()
      await subirAdicional(postulacionId, { titulo: titulo.trim(), nota: nota.trim(), archivo })
      limpiar()
      onRecargar()
    } catch (e) {
      const deCampo = erroresDeCampo(e)
      if (Object.keys(deCampo).length > 0) setErrores(deCampo)
      else onError(mensajeError(e))
    } finally {
      setEnviando(false)
    }
  }

  const eliminar = async (adicional) => {
    if (!window.confirm('¿Eliminar este documento adicional?')) return
    marcarEnVuelo(adicional.id, true)
    try {
      await eliminarDocumento(await pidSeguro(), adicional.id)
      onRecargar()
    } catch (e) {
      onError(mensajeError(e))
    } finally {
      marcarEnVuelo(adicional.id, false)
    }
  }

  // "Ver": el PDF lo abre PanelDocumentosPostulacion (evento document:view).
  const ver = (adicional) =>
    window.dispatchEvent(new CustomEvent('document:view', {
      detail: { documentoId: adicional.archivo.id, nombre: adicional.archivo.nombre_original },
    }))

  return (
    <section className={ESTILO_TARJETA}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={ESTILO_TITULO}>Documentos adicionales</h2>
        <span className="text-xs text-slate-500 dark:text-sena-texto-suave">
          {adicionales.length} de {MAX_DOCUMENTOS_ADICIONALES}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-500 dark:text-sena-texto-suave">
        No son obligatorios, pero pueden sumar a tu postulación (maestría, cursos,
        reconocimientos...). No bloquean tu postulación.
      </p>

      <ul className="mt-3 flex flex-col divide-y divide-slate-100 dark:divide-sena-borde">
        {adicionales.map((adicional) => {
          const enProceso = enVueloIds.has(adicional.id)
          return (
            <li key={adicional.id} className="flex flex-col gap-2 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-slate-700 dark:text-sena-texto">
                    {adicional.titulo}
                  </p>
                  {adicional.nota && (
                    <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-sena-texto-suave">
                      {adicional.nota}
                    </p>
                  )}
                  {adicional.archivo && (
                    <p className="mt-0.5 break-words text-xs text-slate-500 dark:text-sena-texto-suave">
                      {adicional.archivo.nombre_original} ·{' '}
                      {formatearTamano(adicional.archivo.tamano_bytes)}
                      {adicional.archivo.subido_en && (
                        <> · Subido el {formatearFechaHora(adicional.archivo.subido_en)}</>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {adicional.archivo && (
                    <button
                      type="button"
                      disabled={enProceso}
                      onClick={() => ver(adicional)}
                      className={CLASE_BOTON}
                    >
                      Ver
                    </button>
                  )}

                  {editable && (
                    <button
                      type="button"
                      disabled={enProceso}
                      onClick={() => eliminar(adicional)}
                      className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </li>
          )
        })}

        {adicionales.length === 0 && (
          <li className="py-3 text-sm text-slate-500 dark:text-sena-texto-suave">
            Aún no has agregado documentos adicionales.
          </li>
        )}
      </ul>

      {puedeAgregar && (
        <form onSubmit={enviar} className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-sena-borde">
          <div className="flex flex-col gap-1">
            <label htmlFor="adicional-titulo" className="text-xs font-semibold text-slate-600 dark:text-sena-texto-suave">
              Título *
            </label>
            <input
              id="adicional-titulo"
              type="text"
              value={titulo}
              maxLength={MAX_TITULO_ADICIONAL}
              onChange={(e) => setTitulo(e.target.value)}
              className="rounded border border-sena-azul/20 p-2 text-sm text-slate-700 focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto"
              placeholder="Ej.: Certificado de inglés B2"
            />
            {errores.titulo && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {errores.titulo}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="adicional-nota" className="text-xs font-semibold text-slate-600 dark:text-sena-texto-suave">
              Nota (opcional)
            </label>
            <textarea
              id="adicional-nota"
              value={nota}
              maxLength={MAX_NOTA_ADICIONAL}
              rows={2}
              onChange={(e) => setNota(e.target.value)}
              className="rounded border border-sena-azul/20 p-2 text-sm text-slate-700 focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto"
              placeholder="Detalle breve, si lo necesitas"
            />
            {errores.nota && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {errores.nota}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="adicional-archivo" className="text-xs font-semibold text-slate-600 dark:text-sena-texto-suave">
              Archivo (PDF, máx. {TAMANO_MAXIMO_MB} MB) *
            </label>
            <input
              id="adicional-archivo"
              ref={refArchivo}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const elegido = e.target.files?.[0]
                if (elegido) elegirArchivo(elegido)
              }}
              className="text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded file:border file:border-sena-azul/25 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-sena-azul dark:text-sena-texto-suave dark:file:border-sena-borde dark:file:bg-sena-superficie-alta dark:file:text-white"
            />
            {errores.archivo && (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {errores.archivo}
              </p>
            )}
          </div>

          <div>
            <button type="submit" disabled={enviando} className="rounded bg-sena px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sena-oscuro disabled:cursor-not-allowed disabled:opacity-50">
              {enviando ? 'Agregando...' : 'Agregar documento adicional'}
            </button>
          </div>
        </form>
      )}

      {tope && (
        <p className="mt-3 text-xs text-slate-500 dark:text-sena-texto-suave">
          Alcanzaste el máximo de {MAX_DOCUMENTOS_ADICIONALES} documentos adicionales.
        </p>
      )}
    </section>
  )
}