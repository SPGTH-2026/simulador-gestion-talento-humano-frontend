import { useListadoConvocatorias } from './listado/useListadoConvocatorias'
import FiltrosConvocatorias from './listado/FiltrosConvocatorias'
import TarjetaConvocatoria from './listado/TarjetaConvocatoria'
import { CLASE_ESQUELETO, ICONO_BOTON } from './listado/constantesListado'
import Boton from '../../components/ui/Boton'
import Icono from '../../components/ui/Icono'
import Paginacion from '../../components/ui/Paginacion'
import Rueda from '../../components/ui/Rueda'
import { MensajeError } from '../../components/ui/Mensaje'
import Tarjeta from '../../components/ui/Tarjeta'
import { CLASE_SUBTITULO_PAGINA, CLASE_TITULO_PAGINA } from '../../lib/estilos'

export default function ConvocatoriasListado() {
  const ctx = useListadoConvocatorias()
  const { buscando, convocatorias, error, errorAccion, gestiona, hayFiltros, hayLista, irAPagina, limpiarFiltros, meta, mostrarTotal, navigate, refResultados, setRecarga, totalTexto, verEsqueleto, verVacio } = ctx
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={CLASE_TITULO_PAGINA}>Convocatorias</h1>
          <p className={CLASE_SUBTITULO_PAGINA}>
            {gestiona
              ? 'Gestiona y consulta las convocatorias de los procesos de selección.'
              : 'Consulta las convocatorias publicadas y revisa sus condiciones.'}
          </p>
        </div>

        {gestiona && (
          <Boton
            tamano="flexible"
            onClick={() => navigate('/convocatorias/nueva')}
            className="self-start sm:self-auto"
          >
            <Icono nombre="mas" className={ICONO_BOTON} />
            Nueva convocatoria
          </Boton>
        )}
      </div>

      <FiltrosConvocatorias ctx={ctx} />

      {errorAccion && <MensajeError>{errorAccion}</MensajeError>}

      {error && (
        <div className="flex flex-col items-start gap-3">
          <MensajeError className="w-full">{error}</MensajeError>
          <Boton variante="contorno" tamano="flexible" onClick={() => setRecarga((n) => n + 1)}>
            <Icono nombre="reintentar" className={ICONO_BOTON} />
            Reintentar
          </Boton>
        </div>
      )}

      {/* Inicio de los resultados: a donde se lleva la pantalla al paginar. */}
      <div ref={refResultados} className="flex scroll-mt-4 flex-col gap-4" aria-busy={buscando}>
        {/* Una sola línea de estado sobre los resultados, siempre con el mismo estilo: carga, actualización o total. */}
        {(buscando || (hayLista && mostrarTotal)) && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p
              role="status"
              className="flex min-h-6 items-center gap-2.5 text-base font-medium text-sena-azul dark:text-sena-texto"
            >
              {buscando ? (
                <>
                  <Rueda /> {verEsqueleto ? 'Cargando convocatorias…' : 'Actualizando convocatorias…'}
                </>
              ) : (
                totalTexto
              )}
            </p>
            {/* «Limpiar filtros» vive aquí, junto al total que los filtros acaban de cambiar: así no ocupa un lugar en la
                tarjeta de filtros ni hace que el campo Ficha se parta cuando aparece. */}
            {hayFiltros && (
              <Boton variante="enlace" tamano="tactil" onClick={limpiarFiltros} className="-mr-2">
                <Icono nombre="cerrar" className={ICONO_BOTON} />
                Limpiar filtros
              </Boton>
            )}
          </div>
        )}

        {/* Esqueleto de carga. La animación se apaga si el usuario pidió reducir el movimiento. */}
        {verEsqueleto && (
          <div className="flex flex-col gap-4" aria-busy="true">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Tarjeta key={i} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className={`${CLASE_ESQUELETO} h-4 w-24`} />
                  <div className={`${CLASE_ESQUELETO} h-5 w-16 rounded-full`} />
                </div>
                <div className={`${CLASE_ESQUELETO} mt-4 h-5 w-4/5`} />
                <div className={`${CLASE_ESQUELETO} mt-2 h-4 w-3/5`} />
                <div className="mt-4 flex gap-2">
                  <div className={`${CLASE_ESQUELETO} h-6 w-20 rounded-full`} />
                  <div className={`${CLASE_ESQUELETO} h-6 w-24 rounded-full`} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
                  <div className={`${CLASE_ESQUELETO} h-9 w-full`} />
                  <div className={`${CLASE_ESQUELETO} h-9 w-full`} />
                  <div className={`${CLASE_ESQUELETO} h-9 w-full`} />
                  <div className={`${CLASE_ESQUELETO} h-9 w-full`} />
                </div>
                <div className={`${CLASE_ESQUELETO} mt-5 h-11 w-full`} />
              </Tarjeta>
            ))}
          </div>
          </div>
        )}

        {verVacio && (
          <Tarjeta className="p-10 text-center" role="status">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-sena-fondo text-sena-azul dark:bg-sena-noche/50 dark:text-sena-texto-suave">
              <Icono nombre="lupa" className="size-6" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-sena-azul dark:text-sena-texto">
              {hayFiltros ? 'No hay convocatorias con esos filtros' : 'Todavía no hay convocatorias'}
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600 dark:text-sena-texto-suave">
              {hayFiltros
                ? 'Prueba con otro término de búsqueda o quita los filtros para ver todas.'
                : gestiona
                  ? 'Crea la primera convocatoria para empezar a recibir postulaciones.'
                  : 'Cuando se publique una convocatoria, aparecerá aquí.'}
            </p>
            {hayFiltros ? (
              <Boton variante="contorno" tamano="flexible" className="mt-4" onClick={limpiarFiltros}>
                <Icono nombre="cerrar" className={ICONO_BOTON} />
                Limpiar filtros
              </Boton>
            ) : gestiona ? (
              <Boton tamano="flexible" className="mt-4" onClick={() => navigate('/convocatorias/nueva')}>
                <Icono nombre="mas" className={ICONO_BOTON} />
                Nueva convocatoria
              </Boton>
            ) : null}
          </Tarjeta>
        )}

        {/* Rejilla 3/2/1. Cada tarjeta usa solo campos del resumen: nada de
            llamadas al detalle por tarjeta. */}
        {hayLista && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {convocatorias.map((c) => (
              <TarjetaConvocatoria key={c.id} c={c} ctx={ctx} />
            ))}
          </div>
        )}
      </div>

      {hayLista && meta.total > 0 && meta.last_page > 1 && (
        <Tarjeta className="px-4 py-3">
          <Paginacion
            meta={meta}
            singular="convocatoria"
            plural="convocatorias"
            etiqueta="Paginación de convocatorias"
            onPagina={irAPagina}
          />
        </Tarjeta>
      )}
    </div>
  )
}