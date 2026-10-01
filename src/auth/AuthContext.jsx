import { createContext, useCallback, useEffect, useState } from 'react'
import * as authApi from '../api/auth'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // While GET /auth/me is in flight: false. Until it resolves the router must
  // not render, otherwise the login flashes before the session is known.
  const [authResolved, setAuthResolved] = useState(false)
  // Backend down / network error. This is NOT a logout: user stays null.
  const [errorRed, setErrorRed] = useState('')

  // Startup: the session lives in an HttpOnly cookie, so the only way to know
  // who the user is (including after a full-page Google redirect) is me().
  useEffect(() => {
    let vivo = true

    authApi
      .me()
      .then((data) => {
        if (vivo) setUser(data.user)
      })
      .catch((error) => {
        if (!vivo) return
        // 401 = not logged in, that is a normal answer. Anything else (no
        // response at all) is a network problem: we must not close a session.
        if (error.response?.status === 401) {
          setUser(null)
        } else {
          setErrorRed('No se pudo contactar al servidor. Revisa que esté corriendo.')
        }
      })
      .finally(() => {
        if (vivo) setAuthResolved(true)
      })

    return () => {
      vivo = false
    }
  }, [])

  // Any 401 on any request means the session is gone. client.js raises the
  // event; here we just reflect it so the router sends the user to /login.
  useEffect(() => {
    const cerrarSesion = () => setUser(null)
    window.addEventListener('auth:expirada', cerrarSesion)
    return () => window.removeEventListener('auth:expirada', cerrarSesion)
  }, [])

  // login and register already return { user }, so no extra me() is needed.
  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (formData) => {
    const data = await authApi.register(formData)
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // Even if the request fails, close the session in the browser.
    }
    setUser(null)
  }, [])

  // After confirming the email we need email_verified = true in the context,
  // otherwise ProtectedRoute would bounce the user right back.
  const refrescar = useCallback(async () => {
    const data = await authApi.me()
    setUser(data.user)
    return data.user
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, authResolved, errorRed, login, register, logout, refrescar }}
    >
      {children}
    </AuthContext.Provider>
  )
}