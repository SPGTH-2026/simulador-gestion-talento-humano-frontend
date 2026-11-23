import { useState } from 'react'
import { obtenerEvaluacion } from '../../api/evaluaciones'
import Boton from '../../components/ui/Boton'
import Icono from '../../components/ui/Icono'
import { nombreRonda, textoPlazo } from '../../lib/correcciones'
import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import DialogoReapertura from './DialogoReapertura'

// Estado de las rondas de corrección de la POSTULACIÓN (compartidas entre evaluadores). Las reglas las aplica el servidor;
// aquí solo se explica por qué «Enviar a corrección» está disponible o bloqueado: espera una respuesta, quedan rondas,
// venció el plazo, se agotaron, o hay una autorización excepcional. El Instructor y el Superadmin ven además el botón para
// autorizar una ronda excepcional.
export default function PanelRondasCorreccion({ correccion, postulacionId, onActualizada }) {
  const [dialogo, setDialogo] = useState(false)
  if (!correccion) return null

  const ronda = correccion.ronda_actual
  const puede = Boolean(correccion.puede_solicitar)

  const alAutorizar = async () => {
    setDialogo(false)
    const ev = await obtenerEvaluacion(postulacionId)
    onActualizada(ev.data)
  }

  return (
    <div id="motivo-sin-correccion" className="flex flex-col gap-2">
      <p className={`flex items-start gap-2 text-sm ${puede ? CLASE_TEXTO_SUAVE : 'font-medium text-aviso'}`}>
        <Icono nombre={puede ? 'check' : 'alerta'} className="mt-0.5 size-4 shrink-0" />
        <span>{correccion.mensaje}</span>
      </p>
      <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
        Rondas ordinarias: {correccion.ordinarias_usadas} de {correccion.ordinarias_max} usadas.
        {ronda && (
          <>
            {' '}
            Última: {nombreRonda(ronda)} · {textoPlazo(ronda)}
            {ronda.estado !== 'sin_plazo' && ' (hora de Colombia)'}.
          </>
        )}
      </p>
      {correccion.autorizacion && (
        <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
          Autorización excepcional de {correccion.autorizacion.autorizada_por?.name ?? 'Instructor'}:{' '}
          {correccion.autorizacion.justificacion}
        </p>
      )}
      {correccion.puede_autorizar && (
        <div>
          <Boton variante="contorno" tamano="tactil" onClick={() => setDialogo(true)}>
            Autorizar ronda excepcional
          </Boton>
        </div>
      )}
      {dialogo && (
        <DialogoReapertura postulacionId={postulacionId} onCerrar={() => setDialogo(false)} onAutorizada={alAutorizar} />
      )}
    </div>
  )
}
