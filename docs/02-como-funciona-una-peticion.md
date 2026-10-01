# Cómo funciona una petición

Este documento sigue el recorrido de una petición desde que alguien escribe una URL
hasta que la pantalla aparece. Es el hilo conductor del frontend: si entiendes este
documento, entiendes cómo encaja todo lo demás.

Cada paso indica el archivo donde ocurre y qué decisiones se tomaron ahí.

---

## El punto de partida: el navegador pide una URL

Cuando alguien escribe `/convocatorias` en la barra del navegador, o hace clic en el
menú lateral, el servidor de Vite **no** tiene nada que devolver. No existe un
`convocatorias.html` en el proyecto. Todo el proyecto es una sola página.

Hay una excepción, y es importante: el archivo `public/_redirects` (o el servidor donde
se despliegue) tiene que reenviar **todas** las rutas al `index.html`. Si eso no está
configurado, recargar en `/convocatorias` da un error 404 del servidor, aunque la
aplicación funcione bien al navegar. Ver [Compilación y despliegue](17-compilacion-y-despliegue.md).

El orden real de los pasos es este:

| # | Qué pasa | Dónde |
|---|---|---|
| 1 | El navegador pide `http://localhost:5173/convocatorias` | El navegador |
| 2 | Vite sirve `index.html` | Vite |
| 3 | El HTML carga `/src/main.jsx` como módulo | `index.html` |
| 4 | React arranca y monta el árbol de componentes | `src/main.jsx` |
| 5 | El enrutador decide qué pantalla corresponde | `src/router.jsx` |
| 6 | Las guardas comprueban sesión y permisos | `src/auth/` |
| 7 | El componente de la pantalla pide datos al backend | `src/pages/` |
| 8 | `axios` añade la cookie de sesión y el token CSRF | `src/api/client.js` |
| 9 | Laravel recibe la petición y la responde | El backend |
| 10 | React pinta el resultado | `src/pages/` |

## Paso 3 y 4: el arranque

`index.html` es mínimo a propósito. No tiene lógica, solo un contenedor vacío:

```html
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
```

`src/main.jsx` es el archivo que monta React. Son 14 líneas y su único trabajo es
encadenar tres envoltorios:

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

El orden **no es arbitrario** y por eso está en este orden exacto:

| Envoltorio | Por qué va aquí |
|---|---|
| `StrictMode` | Solo desarrollo. Avisa de efectos mal declarados |
| `BrowserRouter` | Necesita saber la URL. Debe estar por encima de todo lo que enrute |
| `AuthProvider` | Necesita saber quién es el usuario. `AppRouter` va a preguntar eso |
| `AppRouter` | Ya puede decidir qué pantalla pintar |

> **Por qué `AuthProvider` va por debajo del enrutador y no por encima.** El
> enrutador no pinta pantallas hasta que sabe si hay sesión. Si el contexto llegara
> después, las guardas se ejecutarían una vez sin contexto y fallarían. Este orden lo
> evita.

## Paso 5: el enrutador decide

`src/router.jsx` declara el mapa completo de rutas. Tiene tres bloques, y cada uno es
una capa de protección distinta:

```jsx
<Routes>
  {/* Sin sesión: las pantallas públicas */}
  <Route element={<AuthLayout />}>
    <Route path="/login" element={<Login />} />
    <Route path="/registro" element={<Registro />} />
    <Route path="/recuperar" element={<RecuperarContrasena />} />
  </Route>

  {/* Con sesión */}
  <Route element={<ProtectedRoute />}>
    <Route path="/verificar-correo" element={<VerificarCorreo />} />
    <Route element={<AppLayout />}>
      <Route element={<PermissionRoute permiso="convocatorias:ver" />}>
        <Route path="convocatorias" element={<ConvocatoriasListado />} />
      </Route>
      {/* ...las demás rutas de negocio... */}
    </Route>
  </Route>
</Routes>
```

Un `<Route>` sin `path` y con `element` no es una página: es una **envolvente**. Agrupa
rutas hijas y ejecuta una condición antes de dejarlas pasar. Por eso `/convocatorias`
necesita tres niveles: `ProtectedRoute` comprueba la sesión, `AppLayout` pinta el marco
con el menú, y `PermissionRoute` comprueba el permiso.

Detalle completo en [Enrutado y protección de rutas](07-enrutado-y-proteccion.md).

## Paso 6: las guardas pueden cortar el paso

Esta es la parte que más sorprende la primera vez. Las guardas no avisan: **reemplazan**
la pantalla.

`ProtectedRoute` decide en este orden, y el orden importa:

| Situación | Qué muestra | Por qué en ese orden |
|---|---|---|
| La sesión todavía no se comprobó | "Cargando..." | Sin esto el login aparecería un instante antes de saber si hay sesión |
| El backend no respondió | El mensaje de error de red | Un fallo de red **no** es una sesión cerrada |
| No hay usuario | Redirige a `/login` | Y guarda a dónde quería ir |
| El correo no está verificado | Redirige a `/verificar-correo` | Antes de dejarle entrar a nada de negocio |
| Todo correcto | `<Outlet />` | Continúa hacia las rutas hijas |

El caso del correo sin verificar tiene un detalle fino. `ProtectedRoute` comprueba:

```jsx
if (!user.email_verified && location.pathname !== '/verificar-correo') {
  return <Navigate to="/verificar-correo" replace />
}
```

La segunda mitad de la condición es obligatoria. `/verificar-correo` está **dentro** de
`ProtectedRoute`, así que sin esa excepción la página se redirigiría a sí misma en un
bucle infinito. Por eso `/verificar-correo` vive fuera de `AppLayout`: si compartiera
marco con las rutas de negocio, el menú aparecería en una pantalla que existe
precisamente porque el usuario todavía no puede usar nada.

## El paso que ocurre antes: preguntar quién es el usuario

Antes de que el enrutador pueda decidir nada, hace falta saber si hay sesión. Como la
sesión vive en una cookie `HttpOnly`, el JavaScript **no puede leerla**. La única forma
de enterarse es preguntar al backend.

Eso hace `AuthProvider` nada más montar, en `src/auth/AuthContext.jsx`:

```jsx
useEffect(() => {
  let vivo = true
  authApi.me()
    .then((data) => { if (vivo) setUser(data.user) })
    .catch((error) => {
      if (!vivo) return
      if (error.response?.status === 401) {
        setUser(null)                                  // No hay sesión: es normal
      } else {
        setErrorRed('No pudimos conectarnos...')      // El backend está caído
      }
    })
    .finally(() => { if (vivo) setAuthResolved(true) })
  return () => { vivo = false }
}, [])
```

Cuatro decisiones en esas 25 líneas:

| Decisión | Por qué |
|---|---|
| `let vivo = true` | Si el componente se desmonta mientras la petición vuela, la respuesta llegaría a un componente muerto |
| `error.response?.status === 401` | Un 401 es una respuesta del backend. Un fallo de red **no** tiene `response` |
| `setErrorRed` en vez de `setUser(null)` | Si el backend está caído, cerrar la sesión del usuario sería incorrecto |
| `authResolved` aparte de `user` | Con `user === null` no se puede distinguir "nadie ha preguntado todavía" de "no hay nadie" |

> **El 401 no siempre significa lo mismo.** En `AuthContext` un 401 al arrancar
> significa "no hay sesión, bienvenido". En `client.js` un 401 en cualquier otra
> petición significa "la sesión se cayó". Son contextos distintos y por eso el
> tratamiento es distinto en cada sitio. Ver [Autenticación y sesiones](04-autenticacion.md).

## Paso 7 y 8: pedir datos y que axios añada lo suyo

Un componente de pantalla pide sus datos con `axios`, nunca con `fetch` a pelo. La
diferencia está en que todas las peticiones pasan por `src/api/client.js`, que tiene
dos interceptores.

El **interceptor de petición** solo actúa en los métodos que modifican datos:

```js
const MUTADORES = new Set(['post', 'put', 'patch', 'delete'])
```

`GET` no necesita token CSRF, así que sale directo y sin esperas. `POST`, `PUT`,
`PATCH` y `DELETE` pasan primero por `asegurarCookieCsrf()`.

Esa función es la que evita el fallo más común al trabajar con Sanctum desde el
frontend:

```js
function asegurarCookieCsrf() {
  if (leerCookie('XSRF-TOKEN')) return Promise.resolve()
  if (pendienteCookie) return pendienteCookie
  pendienteCookie = csrf.get().finally(() => { pendienteCookie = null })
  return pendienteCookie
}
```

Tres cosas resueltas aquí:

| Problema | Solución |
|---|---|
| Sanctum necesita la cookie `XSRF-TOKEN` antes del primer `POST` | Se pide si no existe |
| Si tres formularios se abren a la vez, se pediría tres veces | `pendienteCookie` comparte la misma promesa |
| `/sanctum/csrf-cookie` no vive bajo `/api` | Instancia de axios aparte, con su propio `baseURL` |

Después, el token se pone en la cabecera, **no en el cuerpo**:

```js
let valor = token
try {
  valor = decodeURIComponent(token)
} catch {
  valor = token
}
config.headers.set('X-XSRF-TOKEN', valor)
```

El `decodeURIComponent` no es opcional. El navegador guarda la cookie con el valor
codificado en formato URL, y Laravel hace `decrypt()` de lo que llega en la cabecera. Si
se manda la cookie tal cual, la respuesta es un `419`.

## Paso 9 y 10: la respuesta y el error

El **interceptor de respuesta** mira una sola cosa: si el backend contesta `401`.

```js
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('auth:expirada'))
    }
    return Promise.reject(error)
  },
)
```

Con eso, cualquier `401` en cualquier pantalla cierra la sesión de golpe, sin que
ningún componente tenga que enterarse. `AuthContext` escucha ese evento:

```jsx
useEffect(() => {
  const cerrarSesion = () => setUser(null)
  window.addEventListener('auth:expirada', cerrarSesion)
  return () => window.removeEventListener('auth:expirada', cerrarSesion)
}, [])
```

Al poner `user` en `null`, las guardas de rutas se reactivan solas y el usuario aterriza
en `/login`. Es el motivo de que exista un evento de ventana y no una función compartida:
así el interceptor de `api/` no necesita importar nada de `auth/`.

Cuando algo falla, la pantalla pide un mensaje con `mensajeError(error)`, que traduce
códigos HTTP a frases que puede entender alguien:

| Código | Lo que ve la persona |
|---|---|
| Sin respuesta | "No pudimos conectarnos. Inténtalo de nuevo en un momento." |
| 401 | "Tu sesión expiró. Vuelve a iniciar sesión." |
| 419 | "La sesión expiró. Recarga la página e inténtalo de nuevo." |
| 403 | El mensaje del backend, o "No tienes permiso para hacer esto." |
| 429 | "Demasiados intentos. Espera 30 s e inténtalo de nuevo." |
| 500 o más | "El servidor tuvo un error. Inténtalo de nuevo en un momento." |
| 422 | El primer mensaje de validación de Laravel, tal cual |

> **Por qué el 422 se muestra tal cual.** Laravel ya escribe los mensajes de validación
> en español y en segunda persona ("El correo ya está registrado."). Reescribirlos en el
> frontend sería duplicar un texto que ya es correcto, y cada copia se quedaría
> desactualizada. El frontend solo elige **cuál** mostrar, y para eso está
> `erroresDeCampo`.

## Un recorrido completo, de arriba abajo

Un usuario con permiso `convocatorias:ver` hace clic en "Convocatorias":

| # | Qué ocurre | Archivo |
|---|---|---|
| 1 | Clic en el enlace del menú | `src/components/SidebarItem.jsx` |
| 2 | `Link` navega a `/convocatorias` sin recargar la página | react-router |
| 3 | `ProtectedRoute` ya tiene `user`: deja pasar | `src/auth/ProtectedRoute.jsx` |
| 4 | `AppLayout` pinta el marco con el menú | `src/layouts/AppLayout.jsx` |
| 5 | `PermissionRoute` comprueba `convocatorias:ver`: deja pasar | `src/auth/PermissionRoute.jsx` |
| 6 | `ConvocatoriasListado` monta y pide los datos | `src/pages/convocatorias/` |
| 7 | `axios` añade la cookie de sesión y el CSRF si hace falta | `src/api/client.js` |
| 8 | Laravel responde 200 con la lista | El backend |
| 9 | La pantalla pinta la tabla | `src/pages/convocatorias/` |

Si en el paso 5 el usuario no tuviera el permiso, el paso 6 no ocurriría nunca: la
guarda pinta directamente la pantalla 403 y la petición no llega a salir.

## Lo que todavía no pasa

Esta petición termina en una pantalla de ejemplo. Los módulos como
`ConvocatoriasListado.jsx` y `DocumentosListado.jsx` no piden nada al backend todavía:
muestran un mensaje de "en construcción". El cableado completo está en
[Páginas y módulos](14-paginas-y-modulos.md), y lo que falta en general está en
[Pendientes](23-pendientes.md).
