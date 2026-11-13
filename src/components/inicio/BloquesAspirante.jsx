import { Link } from 'react-router-dom'
import Boton from '../ui/Boton'
import Etiqueta from '../ui/Etiqueta'
import { TarjetaSeccion } from '../ui/Tarjeta'
import EtiquetaPostulacion from '../convocatorias/EtiquetaPostulacion'
import EtiquetaVentana from '../convocatorias/EtiquetaVentana'
import { Puntaje, Resultado } from '../evaluacion/PresentacionEvaluacion'
import {
  CLASE_ENLACE_TITULO,
  CLASE_LISTA,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
} from '../../lib/estilos'
import { MAX_ELEMENTOS } from '../../lib/inicio'
import {
  estadoVentana,
  formatearFecha,
  formatearFechaHora,
  textoCierraPronto,
  textoVentana,
} from '../../lib/ventanaPostulacion'
import BloqueInicio from './BloqueInicio'

const CLASE_FILA_LISTA =
  'flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4'

// Una convocatoria cerrada ya no tiene detalle para quien no la gestiona (el
// backend responde 404): su título no es un enlace, igual que en Mis
// postulaciones.
function TituloConvocatoria({ convocatoria }) {
  const cerrada =
    convocatoria?.estado?.codigo === 'cerrada' || estadoVentana(convocatoria) === 'cerrada'
  const nombre = convocatoria?.nombre ?? '—'

  return cerrada ? (
    <span className={`font-semibold text-slate-700 dark:text-sena-texto ${CLASE_TEXTO_PARTIDO}`}>
      {nombre}
    </span>
  ) : (
    <Link
      to={`/convocatorias/${convocatoria?.id}`}
      className={`${CLASE_ENLACE_TITULO} ${CLASE_TEXTO_PARTIDO}`}
    >
      {nombre}
    </Link>
  )
}

// Postulaciones propias que piden atención: los borradores primero (hay algo
// que completar) y luego las enviadas. Las retiradas quedan en "Mis
// postulaciones". El endpoint pagina y no garantiza el orden de los estados
// (un borrador no tiene fecha de postulación): solo se ve la primera página y no
// se recorren las demás. Por eso, si hay más páginas, el bloque lo dice y no
// afirma que no existan borradores o envíos que simplemente quedaron fuera.
export function BloquePostulaciones({ recurso }) {
  const lista = recurso.datos?.data ?? []
  const hayMasPaginas = (recurso.datos?.meta?.last_page ?? 1) > 1
  const activas = lista.filter((p) => ['borrador', 'postulada'].includes(p.estado?.codigo))
  const visibles = [
    ...activas.filter((p) => p.estado?.codigo === 'borrador'),
    ...activas.filter((p) => p.estado?.codigo === 'postulada'),
  ].slice(0, MAX_ELEMENTOS)

  return (
    <BloqueInicio
      titulo="Mis postulaciones"
      recurso={recurso}
      textoCarga="Cargando tus postulaciones…"
      vacio={visibles.length === 0}
      textoVacio={
        hayMasPaginas
          ? 'Entre tus postulaciones más recientes no hay borradores ni enviadas. Revisa el listado completo para ver el resto.'
          : 'No tienes postulaciones en borrador ni enviadas. Elige una convocatoria disponible para empezar.'
      }
      pie={
        <Boton as={Link} to="/mis-postulaciones" variante="enlace" tamano="flexible">
          Ver todas mis postulaciones
        </Boton>
      }
    >
      {hayMasPaginas && (
        <p className={`mb-2 text-sm ${CLASE_TEXTO_SUAVE}`}>
          Se muestran las de la primera página de tu listado; el resto está en Mis postulaciones.
        </p>
      )}
      <ul className={CLASE_LISTA}>
        {visibles.map((p) => {
          const codigo = p.estado?.codigo
          const ventana = estadoVentana(p.convocatoria)
          const abierta = codigo === 'borrador' && ventana === 'abierta'
          const cierraPronto = abierta ? textoCierraPronto(p.convocatoria?.fecha_cierre) : null

          return (
            <li key={p.id} className={CLASE_FILA_LISTA}>
              <div className="min-w-0">
                <TituloConvocatoria convocatoria={p.convocatoria} />
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <EtiquetaPostulacion codigo={codigo} nombre={p.estado?.nombre} />
                  {cierraPronto && <Etiqueta tono="aviso">{cierraPronto}</Etiqueta>}
                </div>
                <p className={`mt-1 text-sm ${CLASE_TEXTO_SUAVE}`}>
                  {codigo === 'postulada' && `Enviada el ${formatearFechaHora(p.fecha_postulacion)}.`}
                  {abierta &&
                    (p.completo
                      ? 'Documentos completos: falta enviarla.'
                      : 'Faltan documentos obligatorios.')}
                  {codigo === 'borrador' && !abierta && textoVentana(p.convocatoria)}
                </p>
              </div>
              {abierta && (
                <Boton
                  as={Link}
                  to={`/postulaciones/${p.id}/documentos`}
                  tamano="flexible"
                  className="shrink-0"
                >
                  Continuar postulación
                </Boton>
              )}
              {codigo === 'postulada' && (
                <Boton
                  as={Link}
                  to={`/postulaciones/${p.id}/documentos`}
                  variante="contorno"
                  tamano="flexible"
                  className="shrink-0"
                >
                  Ver documentos
                </Boton>
              )}
            </li>
          )
        })}
      </ul>
    </BloqueInicio>
  )
}

// Convocatorias que el aspirante puede ver. El backend ya devuelve solo las
// publicadas y no cerradas de su ficha; no se afirma ningún orden.
export function BloqueConvocatoriasAspirante({ recurso }) {
  const lista = (recurso.datos?.data ?? []).slice(0, MAX_ELEMENTOS)

  return (
    <BloqueInicio
      titulo="Convocatorias disponibles"
      recurso={recurso}
      textoCarga="Cargando convocatorias…"
      vacio={lista.length === 0}
      textoVacio="Por ahora no hay convocatorias disponibles para tu ficha."
      pie={
        <Boton as={Link} to="/convocatorias" variante="enlace" tamano="flexible">
          Ver todas las convocatorias
        </Boton>
      }
    >
      <ul className={CLASE_LISTA}>
        {lista.map((c) => {
          const cierraPronto =
            estadoVentana(c) === 'abierta' ? textoCierraPronto(c.fecha_cierre) : null
          return (
            <li key={c.id} className={CLASE_FILA_LISTA}>
              <div className="min-w-0">
                <Link
                  to={`/convocatorias/${c.id}`}
                  className={`${CLASE_ENLACE_TITULO} ${CLASE_TEXTO_PARTIDO}`}
                >
                  {c.nombre}
                </Link>
                {(c.cargo || c.area) && (
                  <p className={`mt-0.5 text-sm ${CLASE_TEXTO_SUAVE} ${CLASE_TEXTO_PARTIDO}`}>
                    {[c.cargo, c.area].filter(Boolean).join(' · ')}
                  </p>
                )}
                {c.fecha_cierre && (
                  <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
                    Cierra el {formatearFecha(c.fecha_cierre)}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {cierraPronto && <Etiqueta tono="aviso">{cierraPronto}</Etiqueta>}
                {c.mi_postulacion && (
                  <EtiquetaPostulacion
                    codigo={c.mi_postulacion.estado?.codigo}
                    nombre={c.mi_postulacion.estado?.nombre}
                  />
                )}
                <EtiquetaVentana convocatoria={c} />
              </div>
            </li>
          )
        })}
      </ul>
    </BloqueInicio>
  )
}

// Resultados: SOLO evaluaciones finalizadas. Una evaluación en proceso es
// provisional y no se muestra como resultado.
export function BloqueResultados({ recurso }) {
  const lista = (recurso.datos?.data ?? []).filter((e) => e.estado === 'finalizada').slice(0, 3)

  return (
    <BloqueInicio
      titulo="Mis resultados"
      recurso={recurso}
      textoCarga="Cargando tus resultados…"
      vacio={lista.length === 0}
      textoVacio="Aún no tienes evaluaciones finalizadas."
      pie={
        <Boton as={Link} to="/mis-evaluaciones" variante="enlace" tamano="flexible">
          Ver mis evaluaciones
        </Boton>
      }
    >
      <ul className={CLASE_LISTA}>
        {lista.map((e) => (
          <li key={e.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
            <p
              className={`text-sm font-semibold text-slate-800 dark:text-sena-texto ${CLASE_TEXTO_PARTIDO}`}
            >
              {e.convocatoria?.titulo ?? '—'}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Resultado evaluacion={e} />
              <span className={`flex items-center gap-1.5 text-sm ${CLASE_TEXTO_SUAVE}`}>
                Puntaje <Puntaje evaluacion={e} />
              </span>
              {e.cumplimiento != null && (
                <span className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
                  Cumplimiento {e.cumplimiento} %
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </BloqueInicio>
  )
}

// Orientación general del proceso. No marca avance: con varias postulaciones no
// hay un único estado que lo diga; el estado real de cada una está en "Mis
// postulaciones".
export function BloqueRecorrido() {
  const pasos = [
    'Elige una convocatoria disponible y postúlate.',
    'Completa tus documentos y envía la postulación.',
    'Tu postulación es evaluada.',
    'Consulta el resultado en Mis evaluaciones.',
  ]

  return (
    <TarjetaSeccion titulo="Cómo avanza el proceso">
      <ol className="flex flex-col gap-2 text-sm text-slate-700 dark:text-sena-texto">
        {pasos.map((paso, i) => (
          <li key={paso} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="grid size-6 shrink-0 place-items-center rounded-full bg-sena-hundido text-xs font-semibold text-sena-azul dark:bg-sena-superficie-alta dark:text-sena-texto"
            >
              {i + 1}
            </span>
            <span>{paso}</span>
          </li>
        ))}
      </ol>
    </TarjetaSeccion>
  )
}
