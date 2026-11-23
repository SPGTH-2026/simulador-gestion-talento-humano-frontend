import Boton from '../ui/Boton'
import { CLASE_CAJA_SUAVE, CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { ETAPA_DE_CAMPO, ROTULO_CAMPO } from './convocatoriaWizardUtils'

// Lo que falta para publicar: guía permanente, no bloquea. Cada elemento lleva al campo (irACampo).
// En móvil la lista empieza plegada (resumenAbierto); desde 'lg' siempre se ve.
export default function PendientesPublicar({ pendientes, resumenAbierto, setResumenAbierto, idResumen, irACampo }) {
  return (
    <section aria-label="Lo que falta para publicar" className={`${CLASE_CAJA_SUAVE} flex flex-col gap-1 p-3`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
          {pendientes.length > 0 ? `Para publicar falta (${pendientes.length})` : 'Todo listo para publicar'}
        </h2>
        {pendientes.length > 0 && (
          <Boton
            variante="fantasma"
            className="shrink-0 lg:hidden"
            aria-expanded={resumenAbierto}
            aria-controls={idResumen}
            onClick={() => setResumenAbierto((a) => !a)}
          >
            {resumenAbierto ? 'Ocultar' : 'Ver'}
          </Boton>
        )}
      </div>
      {pendientes.length > 0 ? (
        <>
          <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Puedes guardar el borrador y completarlo después.</p>
          <ul id={idResumen} className={`${resumenAbierto ? 'flex' : 'hidden'} flex-col items-start lg:flex`}>
            {pendientes.map((c) => (
              <li key={c}>
                <Boton variante="enlace" tamano="flexible" className="text-left" onClick={() => irACampo(c)}>
                  {ROTULO_CAMPO[c] ?? c} · paso {ETAPA_DE_CAMPO[c]}
                </Boton>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Ya están los datos que se exigen. Revisa los pasos y publica.</p>
      )}
    </section>
  )
}
