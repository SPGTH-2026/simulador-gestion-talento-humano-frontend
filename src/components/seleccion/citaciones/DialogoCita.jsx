import { useRef, useState } from 'react'
import { programarCita, reprogramarCita } from '../../../api/citaciones'
import { erroresDeCampo, mensajeError } from '../../../api/mensajeError'
import { ACTIVIDADES_CITA, hoyEnColombia } from '../../../lib/citaciones'
import { CLASE_CAMPO, CLASE_TEXTO_SUAVE } from '../../../lib/estilos'
import { enfocarPrimerError, mostrarAvisoGlobal } from '../../../lib/validacionAcceso'
import Boton from '../../ui/Boton'
import Campo from '../../ui/Campo'
import Dialogo from '../../ui/Dialogo'
import EncabezadoDialogo from '../../ui/EncabezadoDialogo'
import { MensajeError } from '../../ui/Mensaje'

const CAMPOS = ['fecha', 'hora', 'lugar_o_enlace', 'indicaciones']
const ID_TITULO = 'dialogo-cita-titulo'

// Programar (cita = null) o reprogramar una cita. Fecha y hora son de Colombia. Si algo falla el diálogo sigue abierto con lo escrito y
// el error junto al campo; mientras guarda no se puede cerrar ni enviar dos veces. Al cerrar, el foco vuelve a quien lo abrió.
export default function DialogoCita({ convocatoriaId, postulacionId, actividad, cita, onCerrar, onGuardada }) {
  const [form, setForm] = useState({
    fecha: cita?.fecha ?? '', hora: cita?.hora ?? '', lugar_o_enlace: cita?.lugar_o_enlace ?? '', indicaciones: cita?.indicaciones ?? '',
  })
  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [guardando, setGuardando] = useState(false)
  const enVuelo = useRef(false)
  const nombre = ACTIVIDADES_CITA[actividad] ?? 'cita'
  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const guardar = async (e) => {
    e.preventDefault()
    if (enVuelo.current) return
    const formulario = e.currentTarget
    enVuelo.current = true
    setGuardando(true)
    setErrores({})
    setErrorGlobal('')
    try {
      if (cita) await reprogramarCita(convocatoriaId, postulacionId, cita.id, form)
      else await programarCita(convocatoriaId, postulacionId, { ...form, actividad })
      onGuardada(cita ? `La ${nombre} quedó reprogramada. Avisamos al aspirante.` : `La ${nombre} quedó programada. Avisamos al aspirante.`)
    } catch (err) {
      const deCampo = erroresDeCampo(err)
      setErrores(deCampo)
      setErrorGlobal(mostrarAvisoGlobal(deCampo, CAMPOS) ? mensajeError(err) : '')
      enfocarPrimerError(formulario, deCampo, CAMPOS)
    } finally {
      setGuardando(false)
      enVuelo.current = false
    }
  }

  const campo = (nombreCampo, etiqueta, props, ayuda) => (
    <Campo etiqueta={etiqueta} requerido={nombreCampo !== 'indicaciones'} error={errores[nombreCampo]} ayuda={ayuda}>
      {({ id, describedby, invalid }) =>
        nombreCampo === 'indicaciones' ? (
          <textarea id={id} name={nombreCampo} rows={3} maxLength={500} value={form[nombreCampo]} onChange={cambiar(nombreCampo)}
            aria-describedby={describedby} aria-invalid={invalid || undefined} className={CLASE_CAMPO} />
        ) : (
          <input id={id} name={nombreCampo} value={form[nombreCampo]} onChange={cambiar(nombreCampo)}
            aria-describedby={describedby} aria-invalid={invalid || undefined} className={CLASE_CAMPO} {...props} />
        )
      }
    </Campo>
  )

  return (
    <Dialogo idTitulo={ID_TITULO} onCerrar={guardando ? () => {} : onCerrar} className="max-w-lg">
      <form noValidate onSubmit={guardar} aria-labelledby={ID_TITULO} className="@container flex flex-col gap-4 p-5 sm:p-6">
        <EncabezadoDialogo
          idTitulo={ID_TITULO}
          titulo={`${cita ? 'Reprogramar' : 'Programar'} ${nombre}`}
          contexto="La fecha y la hora son de Colombia."
          onCerrar={onCerrar}
          deshabilitado={guardando}
        />
        {errorGlobal && <MensajeError>{errorGlobal}</MensajeError>}
        <div className="grid gap-4 @min-[26rem]:grid-cols-2">
          {campo('fecha', 'Fecha', { type: 'date', min: hoyEnColombia(), autoFocus: true })}
          {campo('hora', 'Hora', { type: 'time' })}
        </div>
        {campo('lugar_o_enlace', 'Lugar o enlace', { type: 'text', maxLength: 255, autoComplete: 'off' }, 'Un lugar, o un enlace que empiece por https://')}
        {campo('indicaciones', 'Indicaciones (opcional)', {}, 'Breves: qué llevar, a quién preguntar, etc.')}
        <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>El aspirante recibe un aviso en sus notificaciones.</p>
        <div className="flex flex-col @min-[22rem]:flex-row @min-[22rem]:justify-end">
          <Boton type="submit" ocupado={guardando} className="w-full @min-[22rem]:w-auto">
            {guardando ? 'Guardando…' : cita ? 'Guardar cambios' : 'Programar'}
          </Boton>
        </div>
      </form>
    </Dialogo>
  )
}
