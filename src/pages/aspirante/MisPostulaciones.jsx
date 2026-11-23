import { useMisPostulaciones } from './useMisPostulaciones'
import { MensajeExito } from '../../components/ui/Mensaje'
import { Link } from 'react-router-dom'
import EtiquetaVentana from '../../components/convocatorias/EtiquetaVentana'
import Paginacion from '../../components/ui/Paginacion'
import Cargando from '../../components/ui/Cargando'
import { formatearFechaHora } from '../../lib/ventanaPostulacion'
import { CLASE_META_DT, CLASE_TARJETA, CLASE_TITULO_PAGINA } from '../../lib/estilos'
import { BloqueConvocatoria, BloqueEstadoPostulacion, BloqueAcciones } from './PiezasMisPostulaciones'

export default function MisPostulaciones() {
  const ctx = useMisPostulaciones()
  const { cargando, contexto, error, exito, meta, pausaExito, postulaciones, setPagina, total, totalPaginas } = ctx
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className={CLASE_TITULO_PAGINA}>Mis postulaciones</h1>
        <p className="text-sm text-slate-500 dark:text-sena-texto-suave">
          Completa y envía tus borradores, consulta tus postulaciones, retíralas o
          reábrelas mientras la convocatoria lo permita.
        </p>
      </div>

      {exito && (
        <div {...pausaExito}>
          <MensajeExito>{exito.texto}</MensajeExito>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {cargando ? (
        <Cargando>Cargando postulaciones…</Cargando>
      ) : postulaciones.length === 0 ? (
        // Sin postulaciones: mensaje claro con enlace al listado.
        <div className={`${CLASE_TARJETA} flex flex-col items-center gap-3 p-8 text-center`}>
          <p className="text-sm text-slate-600 dark:text-sena-texto-suave">
            Aún no te has postulado a ninguna convocatoria.
          </p>
          <Link
            to="/convocatorias"
            className="text-sm font-semibold text-sena-azul underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/40 dark:text-sena-texto"
          >
            Ver convocatorias
          </Link>
        </div>
      ) : (
        <>
          {/* Escritorio: tabla de 5 columnas. */}
          <div className={`${CLASE_TARJETA} hidden overflow-x-auto md:block`}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-sena-borde dark:text-sena-texto-suave">
                  <th className="p-3">Convocatoria</th>
                  <th className="p-3 text-center">Postulación</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Estado de la convocatoria</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {postulaciones.map((p) => {
                  const ctx = contexto(p)

                  return (
                    <tr
                      key={p.id}
                      className="border-b border-slate-100 align-middle last:border-0 hover:bg-sena-cielo/20 dark:border-sena-borde/60 dark:hover:bg-sena-superficie-alta/20"
                    >
                      <td className="p-3">
                        <BloqueConvocatoria convocatoria={p.convocatoria} />
                      </td>
                      <td className="whitespace-nowrap p-3 text-center text-slate-700 dark:text-sena-texto">
                        {formatearFechaHora(p.fecha_postulacion)}
                      </td>
                      <td className="p-3">
                        <BloqueEstadoPostulacion postulacion={p} />
                      </td>
                      <td className="p-3 text-center">
                        <EtiquetaVentana convocatoria={p.convocatoria} />
                      </td>
                      <td className="p-3">
                        <BloqueAcciones {...ctx} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Móvil: una tarjeta por postulación, con el mismo orden. */}
          <ul className="flex flex-col gap-3 md:hidden">
            {postulaciones.map((p) => {
              const ctx = contexto(p)

              return (
                <li key={p.id} className={`${CLASE_TARJETA} flex flex-col gap-3 p-4`}>
                  <BloqueConvocatoria convocatoria={p.convocatoria} />

                  {/* Datos alineados a la izquierda, como el título: dos columnas en teléfono y tres desde 'sm', para que
                      una tarjeta ancha no reparta los datos con huecos ni los centre. */}
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                    <div>
                      <dt className={CLASE_META_DT}>Postulación</dt>
                      <dd className="mt-0.5 whitespace-nowrap text-sm text-slate-700 dark:text-sena-texto">
                        {formatearFechaHora(p.fecha_postulacion)}
                      </dd>
                    </div>
                    <div>
                      <dt className={CLASE_META_DT}>Estado</dt>
                      <dd className="mt-0.5">
                        <BloqueEstadoPostulacion postulacion={p} alinear="inicio" />
                      </dd>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <dt className={CLASE_META_DT}>Estado de la convocatoria</dt>
                      <dd className="mt-0.5 flex">
                        <EtiquetaVentana convocatoria={p.convocatoria} />
                      </dd>
                    </div>
                  </dl>

                  <div className="border-t border-sena-linea/70 pt-3 dark:border-sena-borde/50">
                    <BloqueAcciones {...ctx} />
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {/* Con una sola página solo se dice el total; Anterior/Siguiente aparecen si hay más. */}
      <Paginacion
        meta={{ ...meta, total, last_page: totalPaginas, current_page: meta.current_page ?? 1 }}
        singular="postulación"
        plural="postulaciones"
        etiqueta="Paginación de postulaciones"
        onPagina={setPagina}
        className="px-1"
      />
    </div>
  )
}
