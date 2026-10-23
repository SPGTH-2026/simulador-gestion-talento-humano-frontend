import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import { AuthProvider } from './auth/AuthContext'
import { ConfirmacionProvider } from './hooks/useConfirmacion'
import AppRouter from './router'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConfirmacionProvider>
          <AppRouter />
        </ConfirmacionProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
