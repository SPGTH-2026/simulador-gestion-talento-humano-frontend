import { createContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth'

export const AuthContext = createContext(null)

const leerUsuarioGuardado = () => {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch {
    return null
  }
}

const guardarSesion = (token, user) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

const borrarSesion = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(leerUsuarioGuardado)
  // true mientras verificamos un token ya guardado
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'))

  useEffect(() => {
    if (!localStorage.getItem('token')) return

    authApi
      .me()
      .then((data) => {
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
      })
      .catch(() => {
        // Si fue 401, el interceptor de client.js ya cerró la sesión
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await authApi.login(email, password)
    guardarSesion(data.token, data.user)
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const data = await authApi.register(formData)
    guardarSesion(data.token, data.user)
    setUser(data.user)
    return data.user
  }

  // Google: llega solo el token; el usuario se trae con me()
  const loginConToken = async (token) => {
    localStorage.setItem('token', token)
    try {
      const data = await authApi.me()
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } catch (error) {
      borrarSesion()
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Aunque falle la petición, cerramos la sesión en el navegador
    }
    borrarSesion()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginConToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
