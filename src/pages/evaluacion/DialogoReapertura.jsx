import { useState } from 'react'
import { autorizarReapertura } from '../../api/evaluaciones'
import { mensajeError } from '../../api/mensajeError'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import Dialogo from '../../components/ui/Dialogo'
import { CLASE_CAMPO, CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../lib/estilos'

// Autorización excepcional de una ronda de corrección: justificación de 10 a 500 caracteres. La da el Instructor (sus
// fichas) o el Superadmin; después, el evaluador pide la ronda con los documentos y la observación.
export default function DialogoReapertura({ postulacionId, onCerrar, onAutorizada }) {
  const [justificacion, setJustificacion] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const largo = justificacion.trim().length
  const valida = largo >= 10 && largo <= 500

  const autorizar = async (e) => {
    e.preventDefault()
    if (!valida || enviando) return
    setEnviando(true)
    setError('')
    try {
      await autorizarReapertura(postulacionId, justificacion.trim())
      await onAutorizada()
    } catch (err) {
      setError(mensajeError(err))
      setEnviando(false)
    }
  }

  return (
    <Dialogo idTitulo="reapertura-titulo" onCerrar={enviando ? () => {} : onCerrar} className="max-w-lg p-5 sm:p-6">
      <form onSubmit={autorizar} className="flex flex-col gap-4">
        <h2 id="reapertura-titulo" className={`text-lg font-bold ${CLASE_TEXTO_FUERTE}`}>
          Autorizar una ronda excepcional
        </h2>
        <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
          Da derecho a UNA ronda más de corrección, con 48 horas de plazo nuevo, que no consume una ronda ordinaria. El
          evaluador debe pedirla indicando los documentos y la observación.
        </p>
        <Campo etiqueta="Justificación" requerido error={error}>
          <textarea
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            rows={4}
            disabled={enviando}
            autoFocus
            className={CLASE_CAMPO}
          />
        </Campo>
        <p className={`text-sm tabular-nums ${valida || largo === 0 ? CLASE_TEXTO_SUAVE : 'text-peligro'}`}>
          {largo} de 500 caracteres (mínimo 10)
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton variante="contorno" tamano="tactil" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Boton>
          <Boton tamano="tactil" type="submit" ocupado={enviando} disabled={!valida}>
            {enviando ? 'Autorizando…' : 'Autorizar'}
          </Boton>
        </div>
      </form>
    </Dialogo>
  )
}
