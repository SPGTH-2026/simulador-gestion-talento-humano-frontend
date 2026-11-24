import { useMisEvaluaciones } from './useMisEvaluaciones'
import Boton from '../../components/ui/Boton'
import { EsqueletoTarjetas } from '../../components/ui/Esqueleto'
import Icono from '../../components/ui/Icono'
import { MensajeError, MensajeExito } from '../../components/ui/Mensaje'
import Paginacion from '../../components/ui/Paginacion'
import { CLASE_SUBTITULO_PAGINA, CLASE_TARJETA, CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE, CLASE_TITULO_PAGINA } from '../../lib/estilos'
import { TarjetaEvaluacion, DetalleEvaluacion } from './PiezasMisEvaluaciones'

export default function MisEvaluaciones() {
  const ctx = useMisEvaluaciones()
  const { cargando, detalle, documentos, error, estadoDocumentos, evaluaciones, exito, inicioLista, irAPagina, paginaActual, pausaExito, reintentar, setDetalle, totalPaginas, verDetalle, visibles } = ctx
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className={CLASE_TITULO_PAGINA}>Mis evaluaciones</h1>
        <p className={CLASE_SUBTITULO_PAGINA}>Consulta el estado y el resultado de cada evaluación.</p>
      </div>

      {exito && (
        <div {...pausaExito}>
          <MensajeExito>{exito.texto}</MensajeExito>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-start gap-3">
          <MensajeError className="w-full">{error}</MensajeError>
          <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
            Reintentar
          </Boton>
        </div>
      )}

      {cargando ? (
        <EsqueletoTarjetas
          texto="Cargando evaluaciones…"
          n={6}
          claseTarjeta="min-h-56"
          rejilla="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          clasesItem={(i) => (i === 3 ? 'hidden md:flex' : i > 3 ? 'hidden xl:flex' : '')}
        />
      ) : (
        evaluaciones.length === 0 &&
        !error && (
          <section className={`${CLASE_TARJETA} flex flex-col items-center gap-2 px-6 py-12 text-center`}>
            <Icono nombre="evaluaciones" className="size-8 text-slate-500 dark:text-sena-texto-suave" />
            <h2 className={`text-lg font-semibold ${CLASE_TEXTO_FUERTE}`}>Aún no tienes evaluaciones registradas</h2>
            <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>
              Cuando haya una evaluación, aquí verás su estado y su resultado.
            </p>
          </section>
        )
      )}

      {!cargando && evaluaciones.length > 0 && (
        <div ref={inicioLista} className="flex scroll-mt-4 flex-col gap-4">
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibles.map((e) => (
              <TarjetaEvaluacion key={e.id} evaluacion={e} onVerDetalle={() => verDetalle(e)} />
            ))}
          </ul>
          <Paginacion
            meta={{ total: evaluaciones.length, last_page: totalPaginas, current_page: paginaActual }}
            singular="evaluación"
            plural="evaluaciones"
            etiqueta="Paginación de evaluaciones"
            onPagina={irAPagina}
            className="px-1"
          />
        </div>
      )}

      {detalle && (
        <DetalleEvaluacion
          evaluacion={detalle}
          documentos={documentos}
          estadoDocumentos={estadoDocumentos}
          onCerrar={() => setDetalle(null)}
        />
      )}
    </div>
  )
}
