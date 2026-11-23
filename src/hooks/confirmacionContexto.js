import { createContext } from 'react'

// Contexto de confirmación. Vive aparte del proveedor y del hook para que cada archivo exporte una sola cosa
// (react-refresh solo recarga bien los archivos que exportan componentes).
export const ConfirmacionContext = createContext(null)
