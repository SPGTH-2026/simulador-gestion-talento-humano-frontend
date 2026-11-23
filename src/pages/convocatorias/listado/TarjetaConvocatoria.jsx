import EtiquetaVentana from '../../../components/convocatorias/EtiquetaVentana'
import EtiquetaEstado from '../../../components/convocatorias/EtiquetaEstado'
import EtiquetaPostulacion from '../../../components/convocatorias/EtiquetaPostulacion'
import { CLASE_CHIP, CLASE_META_DD, CLASE_META_DT, CLASE_TARJETA_PLANA } from '../../../lib/estilos'
import { formatearFecha, textoCierraPronto } from '../../../lib/ventanaPostulacion'
import AccionesConvocatoria from './AccionesConvocatoria'

// Una tarjeta de la rejilla. Usa solo campos del resumen de la convocatoria (sin llamadas al detalle).
export default function TarjetaConvocatoria({ c, ctx }) {
  const { esAspirante, fichas, gestiona, gestionaEstricto } = ctx
  const documentos = c.documentos ?? []
  const obligatorios = documentos.filter((d) => d.obligatorio).length
  // "Cierra en N días" solo cuando faltan 3 días o menos (se calcula
  // con las fechas de la convocatoria, sin zona horaria ambigua).
  const cierraPronto = textoCierraPronto(c.fecha_cierre)

  return (
    <article
      className={`${CLASE_TARJETA_PLANA} @container flex h-full flex-col p-5 transition-colors hover:border-sena-azul/40 motion-reduce:transition-none dark:hover:border-sena-borde`}
    >
      {/* 1) Fila superior: identificador (solo gestión) a la
          izquierda y estado a la derecha. El Aspirante no ve el
          identificador (dato de gestión) y sí el estado de la
          ventana: si puede postularse ahora, si aún no abre o si
          ya cerró. */}
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 truncate pt-0.5 font-mono text-xs font-medium tracking-wide text-slate-600 dark:text-sena-texto-suave">
          {gestionaEstricto ? c.codigo : null}
          {/* La ficha va como texto plano junto al código, y solo cuando el usuario tiene más de una en su
              alcance (la lista de fichas es el alcance completo, no el resultado filtrado: al filtrar por una
              sola sigue visible) y la API la entrega (solo Instructor y Superadministrador). */}
          {fichas.length > 1 && c.ficha?.codigo && (
            <>
              {gestionaEstricto ? ' ' : null}
              <span
                title={`Ficha ${c.ficha.codigo}${c.ficha.nombre_programa ? ` · ${c.ficha.nombre_programa}` : ''}`}
                className={gestionaEstricto ? 'ml-3 uppercase' : 'uppercase'}
              >
                Ficha {c.ficha.codigo}
              </span>
            </>
          )}
        </span>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          {esAspirante && <EtiquetaVentana convocatoria={c} />}
          {(gestionaEstricto || c.estado?.codigo !== 'cerrada') && (
            <EtiquetaEstado codigo={c.estado?.codigo} nombre={c.estado?.nombre} />
          )}
        </div>
      </div>

      {/* 2) Identidad: título a dos líneas como máximo (para que las
          tarjetas de la fila conserven la misma altura) con el
          nombre completo en el tooltip, y debajo la línea
          secundaria "cargo · área". */}
      <div className="mt-4">
        <h3
          title={c.nombre}
          className="line-clamp-2 text-base font-semibold leading-snug text-sena-azul [overflow-wrap:anywhere] dark:text-sena-texto"
        >
          {c.nombre}
        </h3>
        <p
          title={[c.cargo, c.area].filter(Boolean).join(' · ')}
          className="mt-1.5 line-clamp-1 text-sm text-slate-600 dark:text-sena-texto-suave"
        >
          {c.cargo}
          {c.area && <span> · {c.area}</span>}
        </p>
      </div>

      {/* 3) Chips en orden fijo: modalidad, tipo de contrato y tipo
          de convocatoria. Cada uno dice qué es (title y aria-label),
          porque el chip solo lleva el valor. */}
      <div className="mt-4 flex flex-wrap gap-2">
        {c.modalidad?.nombre && (
          <span
            title={`Modalidad: ${c.modalidad.nombre}`}
            aria-label={`Modalidad: ${c.modalidad.nombre}`}
            className={CLASE_CHIP}
          >
            {c.modalidad.nombre}
          </span>
        )}
        {c.tipo_contrato?.nombre && (
          <span
            title={`Tipo de contrato: ${c.tipo_contrato.nombre}`}
            aria-label={`Tipo de contrato: ${c.tipo_contrato.nombre}`}
            className={CLASE_CHIP}
          >
            {c.tipo_contrato.nombre}
          </span>
        )}
        {c.tipo_convocatoria?.nombre && (
          <span
            title={`Tipo de convocatoria: ${c.tipo_convocatoria.nombre}`}
            aria-label={`Tipo de convocatoria: ${c.tipo_convocatoria.nombre}`}
            className={CLASE_CHIP}
          >
            {c.tipo_convocatoria.nombre}
          </span>
        )}
      </div>

      {/* 4) Cuadrícula de datos con la etiqueta arriba y el valor
          abajo. "Apertura" es fecha_apertura (el backend no tiene
          fecha de publicación). "Postulaciones enviadas" solo lo ve
          quien puede gestionar y cuenta las postulaciones enviadas
          de usuarios activos: no es el total de personas. */}
      <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3.5">
        <div>
          <dt className={CLASE_META_DT}>Apertura</dt>
          <dd className={CLASE_META_DD}>{formatearFecha(c.fecha_apertura)}</dd>
        </div>
        <div>
          <dt className={CLASE_META_DT}>Cierre</dt>
          <dd className={CLASE_META_DD}>{formatearFecha(c.fecha_cierre)}</dd>
          {cierraPronto && (
            <dd className="mt-0.5 text-xs font-medium text-sena-azul dark:text-sena-texto">
              {cierraPronto}
            </dd>
          )}
        </div>
        <div>
          <dt className={CLASE_META_DT}>Vacantes</dt>
          <dd className={CLASE_META_DD}>{c.vacantes}</dd>
        </div>
        <div>
          <dt className={CLASE_META_DT}>Documentos</dt>
          <dd className={CLASE_META_DD}>
            {documentos.length === 0 ? (
              'Sin documentos'
            ) : (
              <>
                {documentos.length}
                <span className="ml-1 text-xs font-normal text-slate-600 dark:text-sena-texto-suave">
                  ·{' '}
                  {obligatorios === documentos.length
                    ? 'todos obligatorios'
                    : obligatorios === 0
                      ? 'opcionales'
                      : `${obligatorios} obligatorio${obligatorios === 1 ? '' : 's'}`}
                </span>
              </>
            )}
          </dd>
        </div>
        {gestiona && (
          <div>
            <dt className={CLASE_META_DT}>Postulaciones enviadas</dt>
            <dd className={CLASE_META_DD}>{c.postulantes ?? 0}</dd>
            <dd className="mt-0.5 text-xs text-slate-600 dark:text-sena-texto-suave">
              de usuarios activos
            </dd>
          </div>
        )}
      </dl>

      {/* 5) Pie: al aspirante le queda el estado de su postulación;
          debajo, las acciones. */}
      <div className="mt-auto pt-5">
        {esAspirante && c.mi_postulacion && (
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-sena-texto-suave">
            <span>Tu postulación</span>
            <EtiquetaPostulacion
              codigo={c.mi_postulacion.estado?.codigo}
              nombre={c.mi_postulacion.estado?.nombre}
            />
          </div>
        )}

        <div className="flex flex-col gap-2"><AccionesConvocatoria c={c} ctx={ctx} /></div>
      </div>
    </article>
  )
}
