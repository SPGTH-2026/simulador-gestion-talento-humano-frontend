# Comunicación con el backend


---

## 16. Comunicación con el Backend (API)

Todo el tráfico pasa por `src/api/client.js`.

### 16.1 Configuración

```js
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  withCredentials: true,              // envía la cookie de sesión
  headers: { Accept: 'application/json' },
  xsrfCookieName: null,               // el header lo pone nuestro interceptor
})
```

`withCredentials: true` es **imprescindible**: sin él el navegador no manda la cookie
`HttpOnly` de sesión y nada funcionaría.

`xsrfCookieName: null` desactiva el automatismo de Axios a propósito, para no depender
de qué versión instalada se tiene ni de en qué formato manda la cabecera. El código lo
controla entero.

### 16.2 El interceptor de peticiones (CSRF)

Antes de cualquier petición que **escriba** datos (`post`, `put`, `patch`, `delete`):

1. Comprueba si ya existe la cookie `XSRF-TOKEN`. Si existe, sigue.
2. Si no, hace un `GET` a `VITE_CSRF_URL` para conseguirla. Como `/sanctum/csrf-cookie`
   **no** vive bajo `/api`, usa una instancia de Axios aparte. Además **comparte una sola
   promesa** entre llamadas: si salen tres escrituras a la vez, las tres esperan al mismo
   `GET` en vez de pedir la cookie tres veces.
3. Lee la cookie y la manda en la cabecera `X-XSRF-TOKEN`, applying `decodeURIComponent`.
   Este detalle es crítico: la cookie llega codificada y el backend le hace `decrypt()`;
   **sin decodificar, Laravel responde 419**.

### 16.3 El interceptor de respuestas

```js
if (error.response?.status === 401) {
  window.dispatchEvent(new Event('auth:expirada'))
}
```

Solo actúa si hubo **respuesta** del servidor con estado 401. Si no hay respuesta
(`error.response` es `undefined`), el backend está caído: **no** se cierra la sesión del
usuario por un problema de red. Esa distinción está comentada en el propio código.

### 16.4 Mensajes para el usuario (`api/mensajeError.js`)

Convierte lo que responde Laravel (validaciones `422`, errores de autenticación, sin
conexión…) en frases comprensibles. Es la barrera que evita que un usuario vea un error
técnico crudo.

### 16.5 Límites de tasa (`api/reintento.js`)

Cuando el backend responde `429`, el frontend lee la cabecera `Retry-After` (segundos) y,
si no está, calcula la diferencia con `X-RateLimit-Reset`. Devuelve el número de
segundos para que `useCuentaAtras` bloquee el botón y muestre la cuenta atrás.

---
