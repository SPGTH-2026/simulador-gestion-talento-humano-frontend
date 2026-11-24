import { Link } from 'react-router-dom'
import Boton from '../../ui/Boton'
import { MensajeAviso, MensajeError, MensajeExito } from '../../ui/Mensaje'
import { CLASE_TARJETA_PLANA, CLASE_TEXTO_FUERTE } from '../../../lib/estilos'

// Sección de PanelRanking. Recibe solo lo que muestra, por props.
export default function EleccionFinalistas({ abrirRevision, aviso, avisoTransitorio, buscando, desactualizado, limpiar, mensajeRef, meta, modo, pausaAviso, seleccion, usarSugerencia }) {
  return (
  <section
    aria-label="Elección de finalistas"
    className={`${CLASE_TARJETA_PLANA} flex flex-col gap-3 p-3`}
  >
    {/* El resultado de la última acción va aquí, pegado a los botones, también cuando la elección queda vacía. */}
    {aviso && (
      <div ref={mensajeRef} tabIndex={-1} className="focus:outline-none" {...(avisoTransitorio ? pausaAviso : {})}>
        {(aviso.tipo === 'exito' || aviso.tipo === 'info') && (
          <MensajeExito>
            {aviso.texto}
            {aviso.enlace && (
              <>
                {' '}
                <Link to={aviso.enlace.to} className="font-semibold underline underline-offset-2">
                  {aviso.enlace.texto}
                </Link>
              </>
            )}
          </MensajeExito>
        )}
        {aviso.tipo === 'aviso' && <MensajeAviso>{aviso.texto}</MensajeAviso>}
        {aviso.tipo === 'error' && <MensajeError>{aviso.texto}</MensajeError>}
      </div>
    )}
    {/* El orden en el código ES el orden que se ve y el del teclado (sin 'order-*'): resumen, «Vaciar elección» (enlace),
        «Elegir la sugerencia» (secundaria) y «Revisar y confirmar» (principal) al final. Con poco ancho todo se apila y los
        botones ocupan el ancho; desde 520 px los botones van en fila (y se parten solos si no caben) y desde 860 px el
        resumen queda a la izquierda y las acciones a la derecha. */}
    <div className="flex flex-col gap-3 @min-[860px]:flex-row @min-[860px]:items-center @min-[860px]:justify-between">
      <p aria-live="polite" className={`min-w-0 text-sm ${CLASE_TEXTO_FUERTE}`}>
        <span className="font-semibold tabular-nums">{seleccion.size}</span>{' '}
        {seleccion.size === 1 ? 'candidato elegido' : 'candidatos elegidos'} · objetivo{' '}
        <span className="tabular-nums">{meta.objetivo.efectivo}</span>
        {desactualizado && <span className="font-medium text-aviso"> · pendiente de revisar</span>}
      </p>
      <div className="flex flex-col gap-2 @min-[520px]:flex-row @min-[520px]:flex-wrap @min-[520px]:items-center @min-[520px]:justify-end @min-[860px]:shrink-0 @min-[860px]:flex-nowrap">
        <Boton
          variante="enlace"
          className="w-full @min-[520px]:w-auto"
          disabled={seleccion.size === 0 || buscando}
          onClick={limpiar}
        >
          Vaciar elección
        </Boton>
        {modo === 'con_actividades' && meta.sugeridos > 0 && (
          <Boton variante="contorno" className="w-full @min-[520px]:w-auto" ocupado={buscando} onClick={usarSugerencia}>
            {buscando ? 'Buscando…' : 'Elegir la sugerencia'}
          </Boton>
        )}
        <Boton className="w-full @min-[520px]:w-auto" disabled={seleccion.size === 0 || buscando} onClick={abrirRevision}>
          Revisar y confirmar
        </Boton>
      </div>
    </div>
  </section>
  )
}
