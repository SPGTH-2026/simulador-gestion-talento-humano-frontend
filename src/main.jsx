import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import { AuthProvider } from './auth/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import { ConfirmacionProvider } from './hooks/useConfirmacion'
import AppRouter from './router'

// La barrera de la raíz es el último recurso: si falla algo fuera del marco (sesión, rutas, pantallas de acceso)
// se ve un aviso con salida en lugar de una página en blanco.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary nivel="app">
      <BrowserRouter>
        <AuthProvider>
          <ConfirmacionProvider>
            <AppRouter />
          </ConfirmacionProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
