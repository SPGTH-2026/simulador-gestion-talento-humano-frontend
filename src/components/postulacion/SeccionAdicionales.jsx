import { useSeccionAdicionales } from './useSeccionAdicionales'
import { TAMANO_MAXIMO_MB } from '../../lib/archivosPostulacion'
import { MAX_DOCUMENTOS_ADICIONALES, MAX_TITULO_ADICIONAL, MAX_NOTA_ADICIONAL, formatearTamano } from '../../lib/postulacionDocumentos'
import { formatearFechaHora } from '../../lib/ventanaPostulacion'
import { CLASE_CAJA_SUAVE, CLASE_TARJETA, CLASE_TITULO_SECCION } from '../../lib/estilos'
import BarraProgreso from '../ui/BarraProgreso'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import MarcaObligatorio from '../ui/MarcaObligatorio'
import { MensajeExito } from '../ui/Mensaje'

const ESTILO_TARJETA = `${CLASE_TARJETA} p-4`

const ESTILO_TITULO = CLASE_TITULO_SECCION

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
  // Corrección vigente: el backend no admite agregar ni eliminar adicionales mientras dura.
  bloqueoCorreccion = false,
}) {
  const ctx = useSeccionAdicionales({ vista, editable, asegurar, onRecargar, onError })
  const { adicionalesMostrar, agregado, archivo, elegirArchivo, eliminar, enVueloIds, enviando, enviar, errores, nota, pausaAgregado, progresoEnvio, puedeAgregar, refArchivo, setArchivo, setNota, setTitulo, titulo, tope, ver } = ctx
  return (
    <section className={ESTILO_TARJETA}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={ESTILO_TITULO}>Documentos adicionales</h2>
        <span className="text-xs text-slate-600 dark:text-sena-texto-suave">
          {adicionalesMostrar.length} de {MAX_DOCUMENTOS_ADICIONALES}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">
        No son obligatorios, pero pueden sumar a tu postulación (maestría, cursos,
        reconocimientos...). No bloquean tu postulación.
      </p>

      <ul className="mt-3 flex flex-col divide-y divide-slate-100 dark:divide-sena-borde">
        {adicionalesMostrar.map((adicional) => {
          const enProceso = enVueloIds.has(adicional.id)
          return (
            <li key={adicional.id} className="flex flex-col gap-2 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-medium text-slate-700 dark:text-sena-texto">
                    {adicional.titulo}
                  </p>
                  {adicional.nota && (
                    <p className="mt-0.5 break-words text-sm text-slate-600 dark:text-sena-texto-suave">
                      {adicional.nota}
                    </p>
                  )}
                  {adicional.archivo && (
                    <p className="mt-0.5 break-words text-sm text-slate-600 dark:text-sena-texto-suave">
                      {adicional.archivo.nombre_original} ·{' '}
                      {formatearTamano(adicional.archivo.tamano_bytes)}
                      {adicional.archivo.subido_en && (
                        <> · Cargado el {formatearFechaHora(adicional.archivo.subido_en)}</>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {adicional.archivo && (
                    <Boton variante="contorno" tamano="tactil"
                      disabled={enProceso}
                      onClick={() => ver(adicional)}>
                      Ver
                    </Boton>
                  )}

                  {editable && !bloqueoCorreccion && (
                    <Boton variante="peligroSuave" tamano="tactil"
                      disabled={enProceso}
                      onClick={() => eliminar(adicional)}>
                      Eliminar
                    </Boton>
                  )}
                </div>
              </div>
            </li>
          )
        })}

      </ul>

      {puedeAgregar && (
        <form onSubmit={enviar} className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-sena-borde">
          <div className="flex flex-col gap-1">
            <label htmlFor="adicional-titulo" className="text-sm font-medium text-sena-azul dark:text-sena-texto">
              Título
              <MarcaObligatorio />
            </label>
            <input
              id="adicional-titulo"
              type="text"
              aria-required="true"
              value={titulo}
              maxLength={MAX_TITULO_ADICIONAL}
              onChange={(e) => setTitulo(e.target.value)}
              className="rounded border border-sena-azul/20 p-2 text-sm text-slate-700 focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto"
              placeholder="Ej.: Certificado de inglés B2"
            />
            {errores.titulo && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {errores.titulo}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="adicional-nota" className="text-sm font-medium text-sena-azul dark:text-sena-texto">
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
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {errores.nota}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span id="adicional-archivo-etiqueta" className="text-sm font-medium text-sena-azul dark:text-sena-texto">
              Archivo (PDF, máx. {TAMANO_MAXIMO_MB} MB)
              <MarcaObligatorio />
            </span>
            {/* «Seleccionar archivo» solo abre el selector: la carga empieza con «Agregar documento adicional». El
                nombre elegido se ve al lado (el control nativo cambiaba de texto según el idioma del navegador). */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Boton
                variante="contorno"
                tamano="tactil"
                disabled={enviando}
                aria-describedby="adicional-archivo-etiqueta"
                onClick={() => refArchivo.current?.click()}
              >
                {archivo ? 'Cambiar archivo' : 'Seleccionar archivo'}
              </Boton>
              {!archivo && (
                <span className="text-sm text-slate-600 dark:text-sena-texto-suave">Ningún archivo seleccionado</span>
              )}
            </div>
            {/* El archivo elegido se confirma en su propia ficha: validado y a la espera de «Agregar». Mientras se
                envía, la ficha pasa a «Cargando» y la barra de abajo muestra el avance real. */}
            <div aria-live="polite">
              {archivo && (
                <div className={`${CLASE_CAJA_SUAVE} mt-1 flex items-center gap-2.5 px-3 py-2`}>
                  <Icono nombre="documentos" className="size-5 shrink-0 text-sena-azul dark:text-sena-acento" />
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium text-slate-700 dark:text-sena-texto">{archivo.name}</p>
                    <p className="text-sm text-slate-600 dark:text-sena-texto-suave">
                      {formatearTamano(archivo.size)} ·{' '}
                      {enviando ? 'Cargando…' : 'Archivo válido, listo para agregar'}
                    </p>
                  </div>
                  {!enviando && (
                    <Boton
                      variante="fantasma"
                      tamano="tactil"
                      onClick={() => {
                        setArchivo(null)
                        if (refArchivo.current) refArchivo.current.value = ''
                      }}
                      aria-label={`Quitar el archivo ${archivo.name}`}
                    >
                      Quitar
                    </Boton>
                  )}
                </div>
              )}
            </div>
            <input
              id="adicional-archivo"
              ref={refArchivo}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              aria-label="Seleccionar archivo del documento adicional"
              onChange={(e) => {
                const elegido = e.target.files?.[0]
                if (elegido) elegirArchivo(elegido)
              }}
            />
            {errores.archivo && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {errores.archivo}
              </p>
            )}
          </div>

          {enviando && <BarraProgreso valor={progresoEnvio} etiqueta="Cargando documento adicional" />}

          <div>
            <Boton variante="primario" tamano="tactil" type="submit" ocupado={enviando}>
              {enviando ? 'Agregando…' : 'Agregar documento adicional'}
            </Boton>
          </div>
        </form>
      )}

      {agregado && (
        <div {...pausaAgregado} className="mt-3">
          <MensajeExito>Documento adicional «{agregado.titulo}» agregado.</MensajeExito>
        </div>
      )}

      {bloqueoCorreccion && (
        <p className="mt-3 text-sm text-slate-600 dark:text-sena-texto-suave">
          Durante la corrección no se pueden agregar ni eliminar documentos adicionales.
        </p>
      )}

      {tope && (
        <p className="mt-3 text-sm text-slate-600 dark:text-sena-texto-suave">
          Alcanzaste el máximo de {MAX_DOCUMENTOS_ADICIONALES} documentos adicionales.
        </p>
      )}
    </section>
  )
}