
import Boton from '../../components/ui/Boton'
import CampoBusqueda from '../../components/ui/CampoBusqueda'
import Paginacion from '../../components/ui/Paginacion'
import Campo from '../../components/ui/Campo'
import Icono from '../../components/ui/Icono'
import { MensajeError } from '../../components/ui/Mensaje'
import { CLASE_SUBTITULO_PAGINA, CLASE_TARJETA_PLANA, CLASE_TBODY, CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE, CLASE_THEAD, CLASE_TITULO_PAGINA } from '../../lib/estilos'
import { useEvaluacionesListado } from './listado/useEvaluacionesListado'
import { CLASE_TH, FilaTabla, TarjetaAspirante } from './listado/FilasAspirantes'
import { ChipFiltro, EsqueletoListado, FiltroSelect, Hueco } from './listado/PiezasListado'

export default function EvaluacionListado() {
  const { actualizando, cargando, error, filas, filtroConvocatoria, filtroFicha, filtrosActivos, filtrosAbiertos, filtrosDelPanel, hayFilas, limpiarFiltros, mostrarTotal, meta, opcionesConvocatoria, opcionesFicha, puedeFiltrarPorFicha, elegirConvocatoria, elegirFicha, setFiltrosAbiertos, setPagina, setTermino, termino, verEsqueleto, verVacio } = useEvaluacionesListado()

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={`${CLASE_TITULO_PAGINA} text-balance`}>Evaluación de aspirantes</h1>
          <p className={CLASE_SUBTITULO_PAGINA}>
            Revisa el portafolio de cada aspirante, registra su evaluación y consulta el resultado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          {mostrarTotal ? (
            <p
              className="inline-flex items-baseline gap-1.5 rounded-full bg-sena-hundido px-4 py-1.5 text-sm text-sena-azul dark:bg-sena-superficie-alta dark:text-sena-texto"
              aria-live="polite"
            >
              <span className="text-lg font-bold tabular-nums">{meta.total}</span>
              {/* El espacio inicial no se ve (el flex lo ignora) pero hace que
                  un lector de pantalla diga "3 aspirantes" y no "3aspirantes". */}
              {meta.total === 1 ? ' aspirante' : ' aspirantes'}
            </p>
          ) : cargando ? (
            <Hueco className="h-9 w-32 rounded-full" />
          ) : null}

          {/* Indicador de actualización. El aviso para lectores de pantalla
              existe siempre (sr-only) para que el cambio se anuncie; a la vista
              solo aparece mientras hay una consulta pendiente, a la izquierda del
              total para que este no se mueva. */}
          <p
            role="status"
            className={
              actualizando
                ? `inline-flex items-center gap-2 text-xs sm:order-first ${CLASE_TEXTO_SUAVE}`
                : 'sr-only'
            }
          >
            {actualizando && (
              <>
                <span
                  className="size-3 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
                  aria-hidden="true"
                />
                Actualizando resultados...
              </>
            )}
          </p>
        </div>
      </header>

      {/* Los filtros van directamente sobre el lienzo, sin tarjeta alrededor. */}
      <div className="@container">
        <div role="search" aria-label="Filtrar aspirantes" className="flex flex-col gap-3">
          {/* Las columnas dependen del ancho de este bloque (no de la ventana):
              el buscador ocupa una fila entera hasta que caben tres campos sin
              cortar el texto de las opciones. */}
          <div className="grid gap-3 @min-[520px]:grid-cols-2 @min-[860px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-end">
            <Campo
              etiqueta="Buscar aspirante"
              className="@min-[520px]:col-span-2 @min-[860px]:col-span-1"
            >
              <CampoBusqueda
                placeholder="Nombre o correo…"
                value={termino}
                onChange={(e) => setTermino(e.target.value)}
              />
            </Campo>

            <Boton
              variante="contorno"
              tamano="tactil"
              onClick={() => setFiltrosAbiertos((v) => !v)}
              aria-expanded={filtrosAbiertos}
              aria-controls="evaluacion-filtros"
              className="col-span-full w-full whitespace-normal! md:hidden"
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2">
                  <Icono nombre="filtro" className="size-4" />
                  Ficha y convocatoria
                  {filtrosDelPanel > 0 && (
                    <span className="rounded-full bg-sena-oscuro px-2 py-0.5 text-xs font-semibold tabular-nums text-white dark:bg-sena-acento dark:text-sena-noche">
                      {filtrosDelPanel}
                      <span className="sr-only">
                        {filtrosDelPanel === 1 ? ' filtro activo' : ' filtros activos'}
                      </span>
                    </span>
                  )}
                </span>
                <Icono
                  nombre="chevron"
                  className={`size-4 transition-transform motion-reduce:transition-none ${
                    filtrosAbiertos ? 'rotate-180' : ''
                  }`}
                />
              </span>
            </Boton>

            {/* En móvil se pliega con 'hidden' (fuera del teclado y de los
                lectores de pantalla); desde md los dos selects se integran en
                la fila de la cuadrícula. */}
            <div
              id="evaluacion-filtros"
              className={`${filtrosAbiertos ? 'grid' : 'hidden'} col-span-full gap-3 @min-[520px]:grid-cols-2 md:contents`}
            >
              {puedeFiltrarPorFicha && (
                <FiltroSelect
                  etiqueta="Ficha"
                  valor={filtroFicha}
                  onElegir={elegirFicha}
                  todas="Todas las fichas"
                  opciones={opcionesFicha}
                />
              )}
              <FiltroSelect
                etiqueta="Convocatoria"
                valor={filtroConvocatoria}
                onElegir={elegirConvocatoria}
                todas="Todas las convocatorias"
                opciones={opcionesConvocatoria}
              />
            </div>
          </div>

          {filtrosActivos.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-sena-linea/70 pt-3 dark:border-sena-borde/50">
              <p className={`text-sm font-medium ${CLASE_TEXTO_SUAVE}`}>Filtros activos:</p>
              <ul className="flex flex-wrap items-center gap-2">
                {filtrosActivos.map((f) => (
                  <li key={f.tipo}>
                    <ChipFiltro tipo={f.tipo} texto={f.texto} onQuitar={f.quitar} />
                  </li>
                ))}
              </ul>
              <Boton variante="contorno" tamano="tactil" onClick={limpiarFiltros}>
                Limpiar filtros
              </Boton>
            </div>
          )}
        </div>
      </div>

      {error && <MensajeError>{error}</MensajeError>}

      {/* La tabla de seis columnas aparece cuando ESTE contenedor mide 940 px o
          más (no la ventana: el menú lateral le quita ancho). Por debajo, cada
          aspirante es una tarjeta. Las clases @min-[...] van escritas completas
          porque Tailwind no genera las que se arman concatenando cadenas. */}
      <div className="@container flex flex-col gap-3" aria-busy={actualizando}>
        {verEsqueleto && (
          <EsqueletoListado texto={cargando ? 'Cargando aspirantes…' : 'Buscando aspirantes…'} />
        )}

        {verVacio && (
          <div className={`${CLASE_TARJETA_PLANA} flex flex-col items-center gap-3 px-6 py-12 text-center`}>
            <h2 className={`text-lg font-semibold ${CLASE_TEXTO_FUERTE}`}>
              {filtrosActivos.length > 0
                ? 'Ningún aspirante coincide con los filtros'
                : 'Aún no hay aspirantes para evaluar'}
            </h2>
            <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>
              {filtrosActivos.length > 0
                ? 'Prueba con otro nombre o correo, o quita algún filtro.'
                : 'Cuando haya postulaciones en tus fichas, aparecerán aquí.'}
            </p>
            {filtrosActivos.length > 0 && (
              <Boton variante="contorno" tamano="tactil" onClick={limpiarFiltros}>
                Limpiar filtros
              </Boton>
            )}
          </div>
        )}

        {hayFilas && (
          <>
            <div className="hidden @min-[940px]:block">
              <div className={`${CLASE_TARJETA_PLANA} overflow-hidden`}>
                <table className="w-full table-fixed text-left text-sm">
                  <caption className="sr-only">Aspirantes por evaluar</caption>
                  {/* Anchos medidos en pantalla: las cuatro columnas pequeñas son
                      fijas y caben su encabezado y su contenido más ancho (la
                      etiqueta "Pasa a selección" mide 145 px). "Documentos cargados"
                      y "Cumplimiento" se ensancharon: su encabezado en mayúsculas
                      no cabe en el ancho anterior y se montaba sobre la columna
                      siguiente. Aspirante toma un 26 % y Convocatoria el resto. */}
                  <colgroup>
                    <col className="w-[26%]" />
                    <col />
                    <col className="w-48" />
                    <col className="w-28" />
                    <col className="w-44" />
                    <col className="w-28" />
                  </colgroup>
                  <thead className={CLASE_THEAD}>
                    <tr>
                      {['Aspirante', 'Convocatoria', 'Documentos cargados', 'Cumplimiento', 'Evaluación'].map(
                        (titulo) => (
                          <th key={titulo} scope="col" className={CLASE_TH}>
                            {titulo}
                          </th>
                        ),
                      )}
                      <th scope="col" className={`${CLASE_TH} text-right`}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className={CLASE_TBODY}>
                    {filas.map((fila) => (
                      <FilaTabla key={fila.id} fila={fila} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <ul className="grid gap-3 @min-[600px]:grid-cols-2 @min-[940px]:hidden">
              {filas.map((fila) => (
                <TarjetaAspirante key={fila.id} fila={fila} />
              ))}
            </ul>

            <Paginacion
              meta={meta}
              singular="aspirante"
              plural="aspirantes"
              etiqueta="Paginación de aspirantes"
              ocupado={actualizando}
              onPagina={setPagina}
              className="px-1"
            />
          </>
        )}
      </div>
    </div>
  )
}
