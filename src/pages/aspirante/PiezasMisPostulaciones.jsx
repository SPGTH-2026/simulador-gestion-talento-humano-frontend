import { Link } from 'react-router-dom'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import Boton from '../../components/ui/Boton'
import { estadoVentana, formatearFechaHora, textoVentana } from '../../lib/ventanaPostulacion'

// Botones de acción de una fila: 40 px de alto, 12 px de texto y separacion de
// 8 px. El principal es el verde del sistema; el secundario, de contorno; el
// destructivo, de contorno rojo.

// Piezas de la lista de postulaciones: bloques de convocatoria, estado y acciones.
export const CLASE_ACCION = 'min-h-10'

export const CLASE_ENLACE_TITULO =
  'font-semibold text-sena-azul underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/40 dark:text-sena-texto'

// "Mis postulaciones": solo las del autenticado (el backend filtra por user_id,
// sea cual sea el rol). LLEGAN TODAS, también los borradores: el listado no
// filtra por estado.
//
// La fila muestra: la convocatoria (el título es un enlace a su detalle), la
// fecha de postulación, el estado de la postulación, el estado DERIVADO de la
// convocatoria (si la ventana está abierta, si aún no abre o si ya cerró) y las
// acciones según el estado.
//
// En escritorio es una tabla; por debajo de 768 px la misma información se
// apila en tarjetas (una por postulación), sin scroll horizontal.

// Convocatoria: título (enlace al detalle) y debajo "Cargo · Área".
// El título reserva SIEMPRE dos líneas (aunque el texto ocupe una): así las
// filas de la tabla quedan a la misma altura.
//
// Si la convocatoria está CERRADA el título NO es un enlace: su detalle ya no
// está disponible para quien no gestiona (el backend responde 404), así que el
// enlace llevaría a un error. Se muestra como texto plano con el mismo tamaño.
export function BloqueConvocatoria({ convocatoria }) {
  const secundaria = [convocatoria?.cargo, convocatoria?.area].filter(Boolean).join(' · ')

  const cerrada =
    convocatoria?.estado?.codigo === 'cerrada' || estadoVentana(convocatoria) === 'cerrada'

  return (
    <div className="min-w-0">
      {cerrada ? (
        <span
          title={convocatoria?.nombre ?? undefined}
          className="line-clamp-2 block min-h-[2.75rem] font-semibold text-slate-700 dark:text-sena-texto"
        >
          {convocatoria?.nombre ?? '—'}
        </span>
      ) : (
        <Link
          to={`/convocatorias/${convocatoria?.id}`}
          title={convocatoria?.nombre ?? undefined}
          className={`line-clamp-2 min-h-[2.75rem] ${CLASE_ENLACE_TITULO}`}
        >
          {convocatoria?.nombre ?? '—'}
        </Link>
      )}
      {secundaria && (
        <p
          title={secundaria}
          className="mt-0.5 line-clamp-1 text-sm text-slate-600 dark:text-sena-texto-suave"
        >
          {secundaria}
        </p>
      )}
    </div>
  )
}

// Estado de la postulación ("Estado") y, si está retirada, la fecha en una
// sola línea debajo del badge. El bloque va centrado: son datos cortos y así la
// columna queda equilibrada con las de al lado.
// 'alinear': 'centro' (columna de la tabla) o 'inicio' (tarjeta, donde todo se lee desde la izquierda).
export function BloqueEstadoPostulacion({ postulacion, alinear = 'centro' }) {
  const codigo = postulacion.estado?.codigo

  return (
    <div className={`flex flex-col gap-1 ${alinear === 'inicio' ? 'items-start text-left' : 'items-center text-center'}`}>
      <EtiquetaPostulacion codigo={codigo} nombre={postulacion.estado?.nombre} />
      {codigo === 'retirada' && postulacion.fecha_retiro && (
        <span className="whitespace-nowrap text-sm text-slate-600 dark:text-sena-texto-suave">
          Retirada el {formatearFechaHora(postulacion.fecha_retiro)}
        </span>
      )}
    </div>
  )
}

// Acciones de la fila: una sola línea, alineada a la derecha. Cada estado
// tiene su propia combinación (no se inventan acciones).
export function BloqueAcciones({
  postulacion,
  publicada,
  ventanaAbierta,
  enVuelo,
  irADocumentos,
  cambiarEstado,
  reabrir,
  descartar,
}) {
  const codigo = postulacion.estado?.codigo

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-nowrap items-center justify-end gap-2">
        {codigo === 'borrador' && (
          <>
            <Boton
              variante="primario"
              tamano="tactil"
              className={CLASE_ACCION}
              disabled={enVuelo}
              onClick={() => irADocumentos(postulacion)}
            >
              Continuar postulación
            </Boton>
            <Boton
              variante="peligroSuave"
              tamano="tactil"
              className={CLASE_ACCION}
              disabled={!publicada || enVuelo}
              onClick={() => cambiarEstado(postulacion, 'retirada', 'descartar')}
            >
              {enVuelo ? 'Descartando...' : 'Descartar'}
            </Boton>
          </>
        )}

        {codigo === 'postulada' && (
          <>
            <Boton
              variante="primario"
              tamano="tactil"
              className={CLASE_ACCION}
              disabled={enVuelo}
              onClick={() => irADocumentos(postulacion)}
            >
              Ver documentos
            </Boton>
            <Boton
              variante="peligroSuave"
              tamano="tactil"
              className={CLASE_ACCION}
              disabled={!publicada || enVuelo}
              onClick={() => cambiarEstado(postulacion, 'retirada', 'retirar')}
            >
              {enVuelo ? 'Retirando...' : 'Retirarse'}
            </Boton>
          </>
        )}

        {codigo === 'retirada' && (
          <>
            <Boton
              variante="contorno"
              tamano="tactil"
              className={CLASE_ACCION}
              disabled={enVuelo}
              onClick={() => irADocumentos(postulacion)}
            >
              Ver documentos
            </Boton>
            {/* Con la convocatoria abierta se puede reabrir; cuando ya cerró no hay nada que reabrir y se ofrece descartarla. */}
            {ventanaAbierta ? (
              <Boton
                variante="primario"
                tamano="tactil"
                className={CLASE_ACCION}
                disabled={enVuelo}
                onClick={() => reabrir(postulacion)}
              >
                {enVuelo ? 'Reabriendo...' : 'Reabrir'}
              </Boton>
            ) : (
              <Boton
                variante="peligroSuave"
                tamano="tactil"
                className={CLASE_ACCION}
                disabled={enVuelo}
                onClick={() => descartar(postulacion)}
              >
                {enVuelo ? 'Descartando...' : 'Descartar'}
              </Boton>
            )}
          </>
        )}
      </div>

      {/* Los avisos NO son botones: van debajo de la fila de acciones. */}
      {(codigo === 'borrador' || codigo === 'postulada') && !publicada && (
        <span className="text-xs text-slate-500 dark:text-sena-texto-suave">
          La convocatoria ya no está publicada
        </span>
      )}

      {codigo === 'retirada' && !ventanaAbierta && (
        <span className="text-xs text-slate-500 dark:text-sena-texto-suave">
          {textoVentana(postulacion.convocatoria)}
        </span>
      )}
    </div>
  )
}
