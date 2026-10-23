import { useState } from 'react'
import { enviarPostulacion } from '../../api/postulaciones'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'
import { CLASE_TARJETA, CLASE_TITULO_SECCION } from '../../lib/estilos'
import { useConfirmacion } from '../../hooks/useConfirmacion'

const ESTILO_TARJETA = `${CLASE_TARJETA} p-4`

const ESTILO_TITULO = CLASE_TITULO_SECCION

const CLASE_ENVIAR =
  'rounded bg-sena-oscuro px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sena-azul disabled:cursor-not-allowed disabled:opacity-50'

// Envío del BORRADOR a 'postulada'. Solo se muestra mientras la postulación está
// en borrador y el paso es editable. Antes de enviar avisa qué falta (obligatorios
// pendientes + el sexo si aplica) con los datos del GET de estado; si el 422 trae
// `faltantes[]` (con motivo), también lo pinta. Una operación en vuelo.
//
// Si el 422 NO es por faltantes (estado desactualizado, p. ej. ya no está en
// borrador), se muestra el mensaje del backend y se pide recargar el estado.
export default function SeccionEnviarPostulacion({ estado, onExito, onError, onRecargar }) {
  const postulacionId = estado.postulacion.id
  const [enviando, setEnviando] = useState(false)
  // faltantes del 422: [{ codigo, nombre, motivo? }]
  const [faltantes, setFaltantes] = useState(null)

  // Aviso previo, con el propio GET de estado: obligatorios sin subir (los
  // 'no_aplica', como la libreta de una mujer, no cuentan) y el sexo pendiente.
  const pendientes = (estado.documentos ?? []).filter(
    (d) => d.obligatorio && d.estado === 'pendiente',
  )
  const avisoSexo = Boolean(estado.requiere_sexo)
  const hayPendientes = pendientes.length > 0 || avisoSexo

  const confirmar = useConfirmacion()

  const enviar = async () => {
    if (enviando) return
    const ok = await confirmar({
      titulo: 'Enviar postulación',
      mensaje:
        '¿Estás seguro de enviar tu postulación? Después de enviarla quedará marcada como "Postulada".',
      textoConfirmar: 'Enviar',
      textoCancelar: 'Cancelar',
    })
    if (!ok) return

    setEnviando(true)
    setFaltantes(null)
    try {
      const postulacion = await enviarPostulacion(postulacionId)
      onExito(postulacion)
    } catch (e) {
      // 422 con la lista `faltantes` (nombre + motivo). Si no viene, se cae al
      // mensaje de errors.documentos/postulacion o al genérico.
      const lista = e.response?.data?.faltantes
      if (e.response?.status === 422 && Array.isArray(lista) && lista.length > 0) {
        setFaltantes(lista)
      } else {
        const deCampo = erroresDeCampo(e)
        onError(deCampo.documentos || deCampo.postulacion || mensajeError(e))
        // Estado desactualizado (ya no está en borrador, etc.): resincroniza.
        onRecargar?.()
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className={ESTILO_TARJETA}>
      <h2 className={ESTILO_TITULO}>Enviar la postulación</h2>

      <p className="mt-2 text-xs text-slate-500 dark:text-sena-texto-suave">
        Mientras no la envíes, tu postulación se guarda como borrador. Al enviarla
        pasa a "Postulada" y se valida que los documentos obligatorios estén
        completos.
      </p>

      {hayPendientes && (
        <div className="mt-3 rounded bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          <p className="font-semibold">Antes de enviar, completa:</p>
          <ul className="mt-1 list-disc pl-4">
            {pendientes.map((documento) => (
              <li key={documento.parametro.id}>{documento.parametro.nombre}</li>
            ))}
            {avisoSexo && <li>Indica tu sexo para saber si aplica la libreta militar.</li>}
          </ul>
        </div>
      )}

      {faltantes && (
        <div
          role="alert"
          className="mt-3 rounded bg-red-100 p-3 text-xs text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          <p className="font-semibold">No se pudo enviar: faltan documentos obligatorios.</p>
          <ul className="mt-1 list-disc pl-4">
            {faltantes.map((faltante) => (
              <li key={faltante.codigo}>
                {faltante.nombre}
                {faltante.motivo ? ` (${faltante.motivo})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3">
        <button type="button" disabled={enviando} onClick={enviar} className={CLASE_ENVIAR}>
          {enviando ? 'Enviando...' : 'Enviar postulación'}
        </button>
      </div>
    </section>
  )
}
