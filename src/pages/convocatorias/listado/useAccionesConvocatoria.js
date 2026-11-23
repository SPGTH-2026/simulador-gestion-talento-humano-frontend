import { useState } from 'react'
import { cambiarEstadoConvocatoria } from '../../../api/convocatorias'
import { mensajeError } from '../../../api/mensajeError'
import { useConfirmacion } from '../../../hooks/useConfirmacion'
import { NOMBRES_ESTADO } from './constantesListado'

// Acciones de la tarjeta: avanzar el estado de una convocatoria. Pide confirmación, llama a la API y
// relee la lista (recargar) para mostrar el estado real del servidor.
export function useAccionesConvocatoria({ opcionesEstado, setRecarga }) {
  const [accionandoId, setAccionandoId] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')

  const confirmar = useConfirmacion()

  // El diálogo explica la transición concreta y lo que implica, con lo que
  // hace el backend: de Publicada a En proceso se cierra la recepción de
  // postulaciones y deja de poder editarse; de En proceso a Cerrada no hay
  // vuelta atrás. Los estados avanzan de uno en uno y no se reabren.
  const textosCierre = (convocatoria, destino) => {
    const nombreDestino =
      opcionesEstado.find((o) => o.codigo === destino)?.nombre ?? NOMBRES_ESTADO[destino] ?? destino
    const nombreActual =
      convocatoria.estado?.nombre ?? NOMBRES_ESTADO[convocatoria.estado?.codigo] ?? 'su estado actual'

    if (destino === 'en_proceso') {
      return {
        titulo: 'Cerrar convocatoria',
        mensaje: `"${convocatoria.nombre}" pasará de ${nombreActual} a ${nombreDestino}: dejará de recibir postulaciones y ya no se podrá editar. Después podrás cerrarla del todo. Esta acción no se puede deshacer.`,
        textoConfirmar: `Pasar a ${nombreDestino}`,
      }
    }

    return {
      titulo: 'Cerrar convocatoria',
      mensaje: `"${convocatoria.nombre}" pasará de ${nombreActual} a ${nombreDestino}: quedará cerrada y no se podrá reabrir ni editar. Esta acción no se puede deshacer.`,
      textoConfirmar: 'Cerrar convocatoria',
    }
  }

  const avanzarEstado = async (convocatoria, { destino }) => {
    const ok = await confirmar({
      ...textosCierre(convocatoria, destino),
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return

    setAccionandoId(convocatoria.id)
    setErrorAccion('')

    try {
      await cambiarEstadoConvocatoria(convocatoria.id, { estado: destino })
    } catch (e) {
      // 422 (transición inválida), 403 (sin permiso) y 404 se muestran tal cual.
      setErrorAccion(mensajeError(e))
    } finally {
      setAccionandoId(null)
      // Tras responder (bien o mal) se relee la lista: la UI refleja el estado
      // real del servidor y no el que creíamos localmente.
      setRecarga((n) => n + 1)
    }
  }

  return { accionandoId, errorAccion, avanzarEstado }
}
