import axios from 'axios'

// Rutas relativas por defecto: en producción las redirige netlify.toml al
// backend de Render. En local, el .env las substituye por http://localhost:8000.
const API_URL = import.meta.env.VITE_API_URL ?? '/api'
const CSRF_URL = import.meta.env.VITE_CSRF_URL ?? '/sanctum/csrf-cookie'

const MUTADORES = new Set(['post', 'put', 'patch', 'delete'])

export function leerCookie(nombre) {
  // Los navegadores serializan los pares separados por ';' o por '; ', y el
  // valor puede venir URL-encoded. Nos quedamos con el primero que coincida.
  for (const fila of document.cookie.split(';')) {
    const partes = fila.trim().split('=')
    if (partes.shift() === nombre) {
      return partes.join('=')
    }
  }
  return null
}

// /sanctum/csrf-cookie NO vive bajo /api, así que necesita su propia instancia.
// Un solo GET compartido: si varias peticiones de escritura salen a la vez,
// todas esperan a la misma promesa en vez de pedir la cookie N veces.
const csrf = axios.create({
  baseURL: CSRF_URL,
  withCredentials: true,
  headers: { Accept: 'application/json' },
})

let pendienteCookie = null

function asegurarCookieCsrf() {
  if (leerCookie('XSRF-TOKEN')) return Promise.resolve()
  if (pendienteCookie) return pendienteCookie

  pendienteCookie = csrf
    .get()
    .then(() => undefined)
    .finally(() => {
      pendienteCookie = null
    })

  return pendienteCookie
}

const client = axios.create({
  baseURL: API_URL,
  // Imprescindible: la sesión viaja en la cookie HttpOnly 'laravel-session'.
  withCredentials: true,
  headers: { Accept: 'application/json' },
  // El header CSRF lo pone el interceptor de abajo, no axios. Así no dependemos
  // de si la versión instalada lo manda (y con qué formato) y controlamos el
  // decodeURIComponent, que Laravel exige sí o sí.
  xsrfCookieName: null,
})

client.interceptors.request.use(async (config) => {
  const metodo = (config.method ?? 'get').toLowerCase()
  if (!MUTADORES.has(metodo)) return config

  await asegurarCookieCsrf()

  const token = leerCookie('XSRF-TOKEN')
  if (token) {
    let valor = token
    try {
      // La cookie llega URL-encoded y el backend hace decrypt() del header:
      // sin decodificar, Laravel responde 419.
      valor = decodeURIComponent(token)
    } catch {
      valor = token
    }

    if (typeof config.headers?.set === 'function') {
      config.headers.set('X-XSRF-TOKEN', valor)
    } else {
      config.headers['X-XSRF-TOKEN'] = valor
    }
  }

  return config
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo un 401 CON respuesta significa sesión perdida. Si no hay response
    // el backend está caído: no se cierra la sesión del usuario por eso.
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('auth:expirada'))
    }
    return Promise.reject(error)
  },
)

export default client