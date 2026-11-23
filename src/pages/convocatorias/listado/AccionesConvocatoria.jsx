import { Link } from 'react-router-dom'
import Boton from '../../../components/ui/Boton'
import { pasoDeEstado } from '../../../lib/convocatorias'
import { CLASE_BOTON_ACCION, TEXTO_BOTON } from './constantesListado'

// Botones de la parte inferior de una tarjeta. El aspirante ve solo "Ver información". La gestión ve
// "Editar" y el paso siguiente del estado (si aplica) y, al final, siempre "Ver detalle".
export default function AccionesConvocatoria({ c, ctx }) {
  const { accionandoId, avanzarEstado, esAspirante, gestiona } = ctx
  const paso = pasoDeEstado(c.estado?.codigo)
  const editable = c.estado?.codigo === 'borrador' || c.estado?.codigo === 'publicada'

  // El aspirante ve UNA sola acción: "Ver información". Siempre disponible,
  // incluso si la convocatoria ya no está publicada: el detalle absorbe el 404.
  if (esAspirante) {
    return (
      // «Ver información» abre una pantalla: es navegación (contorno) y un enlace de verdad, para que la barra de
      // carga del marco y «abrir en otra pestaña» funcionen.
      <Boton
        as={Link}
        to={`/convocatorias/${c.id}`}
        variante="contorno"
        tamano="flexible"
        className={CLASE_BOTON_ACCION}
        aria-label={`Ver información de ${c.nombre}`}
      >
        <span className={TEXTO_BOTON}>Ver información</span>
      </Boton>
    )
  }

  const mostrarEditar = gestiona && editable
  const mostrarCerrar = gestiona && paso
  // Con las dos acciones, comparten fila cuando caben; con una sola, esa va a
  // todo el ancho.
  const comparten = mostrarEditar && mostrarCerrar

  return (
    <>
      {/* Las acciones secundarias van ARRIBA y "Ver detalle" siempre al final: el pie de la tarjeta
          va pegado al fondo, así "Ver detalle" queda a la misma altura en todas las tarjetas de una
          fila aunque unas tengan Editar/Cerrar y otras no. */}
      {(mostrarEditar || mostrarCerrar) && (
        <div
          className={
            comparten ? 'flex flex-col gap-2 @min-[320px]:flex-row' : 'flex flex-col gap-2'
          }
        >
          {mostrarEditar && (
            <Boton
              as={Link}
              to={`/convocatorias/${c.id}/editar`}
              variante="contorno"
              tamano="flexible"
              className={`${CLASE_BOTON_ACCION} ${comparten ? '@min-[320px]:flex-none' : ''}`}
              aria-label={`Editar ${c.nombre}`}
            >
              <span className={TEXTO_BOTON}>Editar</span>
            </Boton>
          )}

          {mostrarCerrar && (
            <Boton
              variante="peligroSuave"
              tamano="flexible"
              className={`${CLASE_BOTON_ACCION} ${
                comparten ? '@min-[320px]:min-w-0 @min-[320px]:flex-1' : ''
              }`}
              disabled={accionandoId === c.id}
              onClick={() => avanzarEstado(c, paso)}
              aria-label={`${paso.etiqueta} ${c.nombre}`}
            >
              <span className={TEXTO_BOTON}>{paso.etiqueta}</span>
            </Boton>
          )}
        </div>
      )}

      <Boton
        as={Link}
        to={`/convocatorias/${c.id}`}
        variante="contorno"
        tamano="flexible"
        className={CLASE_BOTON_ACCION}
        aria-label={`Ver detalle de ${c.nombre}`}
      >
        <span className={TEXTO_BOTON}>Ver detalle</span>
      </Boton>
    </>
  )
}
