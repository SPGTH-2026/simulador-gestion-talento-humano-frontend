import { createContext, useCallback, useContext, useRef, useState } from 'react'
import ConfirmarAccion from '../components/ui/ConfirmarAccion'

const ConfirmacionContext = createContext(null)

// Proveedor: renderiza el diálogo y resuelve la promesa de confirmar().
// Solo puede haber un diálogo a la vez; si se abre otro, el anterior se cancela.
export function ConfirmacionProvider({ children }) {
  const [opciones, setOpciones] = useState(null)
  const resolverRef = useRef(null)

  const cerrar = useCallback((resultado) => {
    resolverRef.current?.(resultado)
    resolverRef.current = null
    setOpciones(null)
  }, [])

  const confirmar = useCallback((nuevas) => {
    resolverRef.current?.(false)
    return new Promise((resolver) => {
      resolverRef.current = resolver
      setOpciones({
        titulo: 'Confirmar acción',
        textoConfirmar: 'Confirmar',
        textoCancelar: 'Cancelar',
        peligro: false,
        ...nuevas,
      })
    })
  }, [])

  const valor = { confirmar }

  return (
    <ConfirmacionContext.Provider value={valor}>
      {children}
      {opciones && (
        <ConfirmarAccion
          {...opciones}
          onConfirmar={() => cerrar(true)}
          onCancelar={() => cerrar(false)}
        />
      )}
    </ConfirmacionContext.Provider>
  )
}

// Uso: if (!(await confirmar({ titulo, mensaje, textoConfirmar, peligro }))) return
export function useConfirmacion() {
  const contexto = useContext(ConfirmacionContext)
  if (!contexto) {
    throw new Error('useConfirmacion debe usarse dentro de <ConfirmacionProvider>')
  }
  return contexto.confirmar
}
