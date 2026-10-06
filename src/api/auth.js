import client from './client'

// POST /api/auth/register  ->  201 { user }  (no deja sesión: hay que hacer login)
export const register = (datos) =>
  client.post('/auth/register', datos).then((res) => res.data)

// POST /api/auth/login  ->  200 { user }
//                         422 { errors: { email: [...] } }
export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then((res) => res.data)

// GET /api/auth/me  ->  { user }   (o 401 si no hay sesión)
// El backend lo documenta como "latido": refresca la sesión de 120 min.
export const me = () => client.get('/auth/me').then((res) => res.data)

// POST /api/auth/logout  ->  { message }
export const logout = () => client.post('/auth/logout').then((res) => res.data)

// POST /api/auth/forgot-password  body { email }  ->  { message }
// La respuesta es idéntica exista o no el correo: no permite adivinar cuentas.
export const forgotPassword = (email) =>
  client.post('/auth/forgot-password', { email }).then((res) => res.data)

// POST /api/auth/reset-password
// body { email, code, password, password_confirmation }  ->  { message }
export const resetPassword = (datos) =>
  client.post('/auth/reset-password', datos).then((res) => res.data)

// POST /api/auth/verification/send  ->  { message }
export const sendVerification = () =>
  client.post('/auth/verification/send').then((res) => res.data)

// POST /api/auth/verification/confirm  body { code }  ->  { ok: true }
export const confirmVerification = (code) =>
  client.post('/auth/verification/confirm', { code }).then((res) => res.data)