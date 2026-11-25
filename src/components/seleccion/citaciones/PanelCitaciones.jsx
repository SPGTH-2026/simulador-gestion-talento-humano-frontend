import { useRef, useState } from 'react'
import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../../lib/estilos'
import Boton from '../../ui/Boton'
import { MensajeAviso, MensajeError, MensajeExito } from '../../ui/Mensaje'
import Rueda from '../../ui/Rueda'
import useAvisoTransitorio from '../../../hooks/useAvisoTransitorio'
import DialogoCancelarCita from './DialogoCancelarCita'
import DialogoCita from './DialogoCita'
import TarjetaCita from './TarjetaCita'

// Citaciones de un candidato: por cada actividad activa de la convocatoria, su cita vigente (reprogramar o cancelar) o el botón para
// programarla, y debajo las canceladas con su motivo. Solo quien puede decidir ve los botones; sin actividades no se ofrece nada.
// 'ctx' viene de useCitacionesCandidato (lo comparte el detalle para saber si mostrar esta pestaña).
export default function PanelCitaciones({ convocatoriaId, postulacionId, puedeDecidir, ctx }) {
  const { datos, error, recargar } = ctx
  const [dialogo, setDialogo] = useState(null) // { tipo: 'programar' | 'reprogramar' | 'cancelar', actividad, cita }
  const [exito, setExito] = useState(null)
  const pausaExito = useAvisoTransitorio(exito, () => setExito(null))
  // Tras guardar, el botón que se pulsó cambia o desaparece: el foco pasa al título de esa actividad para no perderse.
  const titulos = useRef({})

  if (datos === null) {
    return error ? (
      <div className="flex flex-col items-start gap-3">
        <MensajeError>{error}</MensajeError>
        <Boton variante="contorno" onClick={recargar}>Reintentar</Boton>
      </div>
    ) : (
      <p role="status" className={`flex items-center gap-2 text-sm ${CLASE_TEXTO_SUAVE}`}><Rueda /> Cargando citaciones…</p>
    )
  }

  const puedeProgramar = puedeDecidir && datos.razon === null
  const cerrar = () => setDialogo(null)
  const guardada = (mensaje) => {
    const actividad = dialogo?.actividad
    setDialogo(null)
    setTimeout(() => titulos.current[actividad]?.focus(), 0)
    setExito({ texto: mensaje })
    recargar()
  }
  const vigenteDe = (actividad) => datos.citaciones.find((c) => c.actividad === actividad && c.estado === 'programada')
  const canceladas = datos.citaciones.filter((c) => c.estado === 'cancelada')
  const comunes = { convocatoriaId, postulacionId, onCerrar: cerrar, onGuardada: guardada }

  return (
    <div className="flex flex-col gap-4">
      {error && <MensajeError>{error}</MensajeError>}
      {exito && (
        <div {...pausaExito}>
          <MensajeExito>{exito.texto}</MensajeExito>
        </div>
      )}
      {datos.razon && <MensajeAviso>{datos.razon}</MensajeAviso>}
      {datos.actividades.length === 0 && <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>No se ofrecen citaciones en esta convocatoria.</p>}

      {datos.actividades.map((actividad) => {
        const cita = vigenteDe(actividad.id)
        return (
          <section key={actividad.id} aria-label={actividad.etiqueta} className="flex flex-col gap-2">
            <h3 ref={(el) => { titulos.current[actividad.id] = el }} tabIndex={-1} className={`text-sm font-semibold focus:outline-none ${CLASE_TEXTO_FUERTE}`}>{actividad.etiqueta}</h3>
            {cita ? (
              <TarjetaCita
                cita={cita}
                historial
                acciones={
                  puedeProgramar && (
                    <>
                      <Boton variante="contorno" onClick={() => setDialogo({ tipo: 'reprogramar', actividad: actividad.id, cita })}>Reprogramar</Boton>
                      <Boton variante="peligro" onClick={() => setDialogo({ tipo: 'cancelar', actividad: actividad.id, cita })}>Cancelar cita</Boton>
                    </>
                  )
                }
              />
            ) : (
              <div className="flex flex-col items-start gap-2">
                <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Sin cita programada.</p>
                {puedeProgramar && <Boton variante="contorno" onClick={() => setDialogo({ tipo: 'programar', actividad: actividad.id, cita: null })}>Programar {actividad.etiqueta.toLowerCase()}</Boton>}
              </div>
            )}
          </section>
        )
      })}

      {canceladas.length > 0 && (
        <section aria-label="Citas canceladas" className="flex flex-col gap-2">
          <h3 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>Citas canceladas ({canceladas.length})</h3>
          {canceladas.map((c) => <TarjetaCita key={c.id} cita={c} historial />)}
        </section>
      )}

      {dialogo && dialogo.tipo !== 'cancelar' && <DialogoCita {...comunes} actividad={dialogo.actividad} cita={dialogo.cita} />}
      {dialogo?.tipo === 'cancelar' && <DialogoCancelarCita {...comunes} cita={dialogo.cita} />}
    </div>
  )
}
