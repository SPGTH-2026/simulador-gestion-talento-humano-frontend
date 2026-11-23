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
        {(aviso.tipo === 'exito' || aviso.tipo === 'info') && <MensajeExito>{aviso.texto}</MensajeExito>}
        {aviso.tipo === 'aviso' && <MensajeAviso>{aviso.texto}</MensajeAviso>}
        {aviso.tipo === 'error' && <MensajeError>{aviso.texto}</MensajeError>}
      </div>
    )}
    {/* Resumen a la izquierda y, a la derecha, el grupo de acciones que nunca se parte: «Revisar y confirmar» es la
        acción principal y va última (en móvil, primera y a ancho completo); «Elegir la sugerencia» y «Vaciar elección»
        son secundarias. Con poco ancho el resumen queda arriba y los botones debajo, como grupo. */}
    <div className="flex flex-col gap-3 @min-[860px]:flex-row @min-[860px]:items-center @min-[860px]:justify-between">
      <p aria-live="polite" className={`min-w-0 text-sm ${CLASE_TEXTO_FUERTE}`}>
        <span className="font-semibold tabular-nums">{seleccion.size}</span>{' '}
        {seleccion.size === 1 ? 'candidato elegido' : 'candidatos elegidos'} · objetivo{' '}
        <span className="tabular-nums">{meta.objetivo.efectivo}</span>
        {desactualizado && <span className="font-medium text-aviso"> · pendiente de revisar</span>}
      </p>
      <div className="flex flex-col gap-2 @min-[560px]:flex-row @min-[560px]:items-center @min-[560px]:justify-between @min-[860px]:shrink-0 @min-[860px]:justify-end @min-[860px]:gap-4">
        <div className="order-last flex flex-wrap items-center justify-center gap-2 @min-[560px]:order-first @min-[560px]:flex-nowrap @min-[560px]:justify-start">
          {modo === 'con_actividades' && meta.sugeridos > 0 && (
            <Boton variante="contorno" ocupado={buscando} onClick={usarSugerencia}>
              {buscando ? 'Buscando…' : 'Elegir la sugerencia'}
            </Boton>
          )}
          <Boton variante="enlace" disabled={seleccion.size === 0 || buscando} onClick={limpiar}>
            Vaciar elección
          </Boton>
        </div>
        <Boton
          className="order-first w-full @min-[560px]:order-last @min-[560px]:w-auto"
          disabled={seleccion.size === 0 || buscando}
          onClick={abrirRevision}
        >
          Revisar y confirmar
        </Boton>
      </div>
    </div>
  </section>
  )
}
