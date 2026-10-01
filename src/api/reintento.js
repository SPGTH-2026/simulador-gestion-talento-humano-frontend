// Laravel devuelve el 429 con la cabecera 'Retry-After' (segundos) y, a veces,
// 'X-RateLimit-Reset' (timestamp unix en segundos). Preferimos Retry-After y
// caemos al segundo para el botón de reintento.
export function segundosReintento(error) {
  const headers = error?.response?.headers
  if (!headers) return null

  const retryAfter = Number(headers['retry-after'] ?? headers['Retry-After'])
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.ceil(retryAfter)
  }

  const reset = Number(headers['x-ratelimit-reset'] ?? headers['X-RateLimit-Reset'])
  if (Number.isFinite(reset) && reset > 0) {
    return Math.max(1, Math.ceil(reset - Date.now() / 1000))
  }

  return null
}