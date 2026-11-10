import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import { TarjetaSeccion } from '../ui/Tarjeta'
import EtiquetaEstado from '../convocatorias/EtiquetaEstado'
import {
  CLASE_ENLACE_TITULO,
  CLASE_LISTA,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
} from '../../lib/estilos'
import { MAX_ELEMENTOS, alcanceConvocatorias } from '../../lib/inicio'
import { formatearFecha } from '../../lib/ventanaPostulacion'
import BloqueInicio from './BloqueInicio'

const CLASE_FILA_LISTA =
  'flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4'

// Primeras convocatorias del listado, dentro del alcance real del usuario (el
// backend filtra por fichas). El texto de arriba dice de quién son. No se
// afirma ningún orden ni se presenta la cantidad mostrada como un total.
export function BloqueConvocatoriasGestion({ recurso }) {
  const { user } = useAuth()
  const lista = (recurso.datos?.data ?? []).slice(0, MAX_ELEMENTOS)

  return (
    <BloqueInicio
      titulo="Convocatorias"
      descripcion={`${alcanceConvocatorias(user)} Se muestran las primeras del listado.`}
      recurso={recurso}
      textoCarga="Cargando convocatorias…"
      vacio={lista.length === 0}
      textoVacio="No hay convocatorias en tu alcance todavía."
      pie={
        <>
          <Boton as={Link} to="/convocatorias" variante="enlace" tamano="flexible">
            Ver el listado completo
          </Boton>
          <Boton as={Link} to="/convocatorias/nueva" variante="enlace" tamano="flexible">
            Nueva convocatoria
          </Boton>
        </>
      }
    >
      <ul className={CLASE_LISTA}>
        {lista.map((c) => (
          <li key={c.id} className={CLASE_FILA_LISTA}>
            <div className="min-w-0">
              <Link
                to={`/convocatorias/${c.id}`}
                className={`${CLASE_ENLACE_TITULO} ${CLASE_TEXTO_PARTIDO}`}
              >
                {c.nombre}
              </Link>
              <p className={`mt-0.5 text-sm ${CLASE_TEXTO_SUAVE} ${CLASE_TEXTO_PARTIDO}`}>
                {[c.cargo, c.area].filter(Boolean).join(' · ')}
              </p>
              {c.fecha_cierre && (
                <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
                  Cierra el {formatearFecha(c.fecha_cierre)}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
              {c.postulantes != null && (
                <span className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
                  {c.postulantes} {c.postulantes === 1 ? 'postulante' : 'postulantes'}
                </span>
              )}
              <EtiquetaEstado codigo={c.estado?.codigo} nombre={c.estado?.nombre} />
            </div>
          </li>
        ))}
      </ul>
    </BloqueInicio>
  )
}

// Evaluaciones que el aprendiz ya empezó y no ha finalizado. GET
// /mis-evaluaciones devuelve SOLO las que hizo él (no pagina), así que la
// cantidad es completa. No se muestra puntaje ni cumplimiento: son
// provisionales hasta finalizar.
export function BloqueEvaluacionesEnProceso({ recurso }) {
  const enProceso = (recurso.datos?.data ?? []).filter((e) => e.estado === 'en_proceso')
  const lista = enProceso.slice(0, MAX_ELEMENTOS)

  return (
    <BloqueInicio
      titulo="Mis evaluaciones en proceso"
      descripcion="Evaluaciones que empezaste y aún no finalizas."
      recurso={recurso}
      textoCarga="Cargando tus evaluaciones…"
      vacio={lista.length === 0}
      textoVacio="No tienes evaluaciones en proceso."
      pie={
        <Boton as={Link} to="/evaluacion" variante="enlace" tamano="flexible">
          Ir al listado de evaluación
        </Boton>
      }
    >
      {enProceso.length > lista.length && (
        <p className={`mb-2 text-sm ${CLASE_TEXTO_SUAVE}`}>
          Tienes {enProceso.length} en proceso; se muestran {lista.length}.
        </p>
      )}
      <ul className={CLASE_LISTA}>
        {lista.map((e) => (
          <li key={e.id} className={CLASE_FILA_LISTA}>
            <div className="min-w-0">
              <p className={`font-semibold text-slate-800 dark:text-sena-texto ${CLASE_TEXTO_PARTIDO}`}>
                {e.aspirante?.name ?? '—'}
              </p>
              <p className={`text-sm ${CLASE_TEXTO_SUAVE} ${CLASE_TEXTO_PARTIDO}`}>
                {e.convocatoria?.titulo ?? '—'}
              </p>
            </div>
            <Boton
              as={Link}
              to={`/evaluacion/evaluar/${e.postulacion_id}`}
              variante="contorno"
              tamano="flexible"
              className="shrink-0"
            >
              Continuar evaluación
            </Boton>
          </li>
        ))}
      </ul>
    </BloqueInicio>
  )
}

// Accesos a los módulos que el usuario puede abrir. Salen del menú (destinos y
// permisos): no hay una segunda lista. 'columnas' los reparte en una o dos
// columnas según el espacio del bloque.
export function BloqueAccesos({ destinos, dosColumnas = false }) {
  return (
    <TarjetaSeccion titulo="Accesos">
      <ul className={`grid gap-2 ${dosColumnas ? 'sm:grid-cols-2' : ''}`}>
        {destinos.map((d) => (
          <li key={d.to}>
            <Boton
              as={Link}
              to={d.to}
              aria-label={d.grupo ? `${d.grupo}: ${d.label}` : undefined}
              variante="contorno"
              tamano="flexible"
              className="w-full justify-start text-left"
            >
              <Icono nombre={d.icono} className="size-5 shrink-0" />
              <span className="min-w-0">
                {d.label}
                {d.grupo && (
                  <span className={`block text-xs font-normal ${CLASE_TEXTO_SUAVE}`}>{d.grupo}</span>
                )}
              </span>
            </Boton>
          </li>
        ))}
      </ul>
    </TarjetaSeccion>
  )
}
