import { useRef, useState } from 'react'
import { cancelarCita } from '../../../api/citaciones'
import { erroresDeCampo, mensajeError } from '../../../api/mensajeError'
import { ACTIVIDADES_CITA } from '../../../lib/citaciones'
import { CLASE_CAMPO } from '../../../lib/estilos'
import Boton from '../../ui/Boton'
import Campo from '../../ui/Campo'
import Dialogo from '../../ui/Dialogo'
import EncabezadoDialogo from '../../ui/EncabezadoDialogo'
import { MensajeError } from '../../ui/Mensaje'

const ID_TITULO = 'dialogo-cancelar-cita-titulo'

// Cancelar una cita con su motivo (el aspirante lo ve). La cita queda en el historial y se puede programar otra.
export default function DialogoCancelarCita({ convocatoriaId, postulacionId, cita, onCerrar, onGuardada }) {
  const [motivo, setMotivo] = useState('')
  const [errorCampo, setErrorCampo] = useState('')
  const [errorGlobal, setErrorGlobal] = useState('')
  const [guardando, setGuardando] = useState(false)
  const enVuelo = useRef(false)
  const nombre = ACTIVIDADES_CITA[cita.actividad] ?? 'cita'

  const cancelar = async (e) => {
    e.preventDefault()
    if (enVuelo.current) return
    enVuelo.current = true
    setGuardando(true)
    setErrorCampo('')
    setErrorGlobal('')
    try {
      await cancelarCita(convocatoriaId, postulacionId, cita.id, motivo)
      onGuardada(`La ${nombre} quedó cancelada. Avisamos al aspirante.`)
    } catch (err) {
      const deCampo = erroresDeCampo(err)
      setErrorCampo(deCampo.motivo ?? '')
      setErrorGlobal(deCampo.motivo ? '' : mensajeError(err))
    } finally {
      setGuardando(false)
      enVuelo.current = false
    }
  }

  return (
    <Dialogo rol="alertdialog" idTitulo={ID_TITULO} onCerrar={guardando ? () => {} : onCerrar} className="max-w-md">
      <form noValidate onSubmit={cancelar} aria-labelledby={ID_TITULO} className="@container flex flex-col gap-4 p-5 sm:p-6">
        <EncabezadoDialogo idTitulo={ID_TITULO} titulo={`Cancelar la ${nombre}`} contexto="El aspirante verá el motivo y recibirá un aviso." onCerrar={onCerrar} deshabilitado={guardando} />
        {errorGlobal && <MensajeError>{errorGlobal}</MensajeError>}
        <Campo etiqueta="Motivo" requerido error={errorCampo} ayuda="Mínimo 10 caracteres.">
          {({ id, describedby, invalid }) => (
            <textarea id={id} name="motivo" rows={3} maxLength={500} autoFocus value={motivo} onChange={(e) => setMotivo(e.target.value)}
              aria-describedby={describedby} aria-invalid={invalid || undefined} className={CLASE_CAMPO} />
          )}
        </Campo>
        <div className="flex flex-col @min-[22rem]:flex-row @min-[22rem]:justify-end">
          <Boton type="submit" variante="peligro" ocupado={guardando} className="w-full @min-[22rem]:w-auto">
            {guardando ? 'Cancelando…' : 'Cancelar cita'}
          </Boton>
        </div>
      </form>
    </Dialogo>
  )
}
