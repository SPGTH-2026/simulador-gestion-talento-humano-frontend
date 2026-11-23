import { useState } from 'react'
import { fijarObjetivoFinalistas } from '../../../api/seleccion'
import { erroresDeCampo, mensajeError } from '../../../api/mensajeError'
import useAvisoTransitorio from '../../../hooks/useAvisoTransitorio'

// Objetivo de finalistas del ranking: formulario, guardado y avisos. Devuelve todo en un objeto.
export function useObjetivoRanking({ convocatoriaId, meta, recargar, montado, botonCambiar }) {
  // Objetivo: null = el formulario está cerrado; un texto = abierto y editándose.
  const [objetivoTexto, setObjetivoTexto] = useState(null)
  const [guardandoObjetivo, setGuardandoObjetivo] = useState(false)
  const [errorObjetivo, setErrorObjetivo] = useState('')
  // Confirmación del último cambio de objetivo ({ texto }); un objeto nuevo en cada cambio reinicia su plazo.
  const [avisoObjetivo, setAvisoObjetivo] = useState(null)
  const pausaObjetivo = useAvisoTransitorio(avisoObjetivo, () => setAvisoObjetivo(null))

  const abrirObjetivo = () => {
    setAvisoObjetivo(null)
    setErrorObjetivo('')
    setObjetivoTexto(String(meta.objetivo.valor))
  }
  const cerrarObjetivo = () => {
    setObjetivoTexto(null)
    setErrorObjetivo('')
    // El foco vuelve al botón que abrió el formulario (existe otra vez al cerrarse).
    requestAnimationFrame(() => botonCambiar.current?.focus())
  }

  const guardarObjetivo = async (valor) => {
    setGuardandoObjetivo(true)
    setErrorObjetivo('')
    try {
      await fijarObjetivoFinalistas(convocatoriaId, valor)
      if (!montado.current) return
      setObjetivoTexto(null)
      setAvisoObjetivo({ texto: valor == null ? 'Objetivo restablecido a 2 × vacantes.' : `Objetivo actualizado a ${valor}.` })
      recargar()
      requestAnimationFrame(() => botonCambiar.current?.focus())
    } catch (e) {
      if (!montado.current) return
      const porCampo = erroresDeCampo(e)
      setErrorObjetivo(Object.values(porCampo)[0] ?? mensajeError(e))
    } finally {
      if (montado.current) setGuardandoObjetivo(false)
    }
  }

  const objetivoActual = meta ? String(meta.objetivo.valor) : ''
  const textoObjetivo = objetivoTexto ?? objetivoActual
  const objetivoNumero = Number(textoObjetivo)
  const objetivoValido = /^\d+$/.test(textoObjetivo) && objetivoNumero >= 1 && objetivoNumero <= 500
  const objetivoCambio = textoObjetivo !== objetivoActual

  return {
    abrirObjetivo,
    avisoObjetivo,
    cerrarObjetivo,
    errorObjetivo,
    guardandoObjetivo,
    guardarObjetivo,
    objetivoActual,
    objetivoCambio,
    objetivoNumero,
    objetivoTexto,
    objetivoValido,
    pausaObjetivo,
    setAvisoObjetivo,
    setErrorObjetivo,
    setGuardandoObjetivo,
    setObjetivoTexto,
    textoObjetivo,
  }
}
