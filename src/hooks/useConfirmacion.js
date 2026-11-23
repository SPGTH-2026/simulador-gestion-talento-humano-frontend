import { useContext } from 'react'
import { ConfirmacionContext } from './confirmacionContexto'

// Uso: if (!(await confirmar({ titulo, mensaje, textoConfirmar, peligro }))) return
export function useConfirmacion() {
  const contexto = useContext(ConfirmacionContext)
  if (!contexto) {
    throw new Error('useConfirmacion debe usarse dentro de <ConfirmacionProvider>')
  }
  return contexto.confirmar
}
