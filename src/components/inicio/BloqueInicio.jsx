import { TarjetaSeccion } from '../ui/Tarjeta'
import Boton from '../ui/Boton'
import Cargando from '../ui/Cargando'
import { MensajeError } from '../ui/Mensaje'
import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'

// Marco común de un bloque de Inicio: título, una línea opcional que aclara el
// alcance de los datos y los tres estados de la carga. Cada bloque falla y se
// reintenta por su cuenta; un error en uno no afecta a los demás.
//  - 'recurso': el resultado de useCarga.
//  - 'vacio': true cuando, ya cargado, no hay nada que mostrar.
//  - 'pie': enlaces del bloque; se muestran aunque la lista esté vacía.
export default function BloqueInicio({
  titulo,
  descripcion,
  recurso,
  vacio = false,
  textoCarga = 'Cargando…',
  textoVacio,
  pie,
  children,
}) {
  return (
    <TarjetaSeccion titulo={titulo}>
      {descripcion && <p className={`mb-3 text-sm ${CLASE_TEXTO_SUAVE}`}>{descripcion}</p>}

      {recurso.fase === 'cargando' && (
        <div role="status">
          <Cargando>{textoCarga}</Cargando>
        </div>
      )}

      {recurso.fase === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <MensajeError className="w-full">{recurso.error}</MensajeError>
          <Boton variante="contorno" tamano="flexible" onClick={recurso.reintentar}>
            Reintentar
          </Boton>
        </div>
      )}

      {recurso.fase === 'listo' && (
        <>
          {vacio ? <p className={`py-2 text-sm ${CLASE_TEXTO_SUAVE}`}>{textoVacio}</p> : children}
          {pie && <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">{pie}</div>}
        </>
      )}
    </TarjetaSeccion>
  )
}
