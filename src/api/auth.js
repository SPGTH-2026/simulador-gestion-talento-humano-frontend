import client from './client'

// POST /api/auth/login  ->  { token, expires_at, user }
export const login = (email, password) =>
  client.post('/auth/login', { email, password }).then((res) => res.data)

// POST /api/auth/register  ->  { token, expires_at, user }
export const register = (data) =>
  client.post('/auth/register', data).then((res) => res.data)

// GET /api/auth/me  ->  { user } (requiere token)
export const me = () =>
  client.get('/auth/me').then((res) => res.data)

// POST /api/auth/logout  (requiere token)
export const logout = () =>
  client.post('/auth/logout').then((res) => res.data)
