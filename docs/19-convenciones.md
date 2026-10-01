# Convenciones del código

Este documento recoge cómo se escribe el código en este proyecto: el estilo, los
patrones que se repiten, cómo se escriben los mensajes al usuario y qué reglas de
seguridad hay que respetar.

No son sugerencias. Son las decisiones ya tomadas. Si algo se hace de otra forma, hay
que actualizar este documento.

---

## 1. Estilo del código

### Las reglas de formato

El proyecto usa **[oxlint](https://oxc.rs/docs/guide/usage/linter.html)** en lugar de
ESLint. No hay Prettier, y no hay archivo de formato: el estilo sale de lo que ya está
escrito en el código.

```bash
npm run lint     # comprueba
npm run lint:fix # corrige lo que se puede corregir solo
```

**Qué aplica oxlint** (y por tanto qué formato tiene el código):

| Regla | Ejemplo |
|---|---|
| Comillas simples | `'texto'`, no `"texto"` |
| Sin punto y coma al final de línea | `const a = 1` y no `const a = 1;` |
| Sangría de 2 espacios | — |
| Paréntesis en `if` | `if (a)`, no `if(a)` |
| Llaves pegadas al `if` | `if (a) {`, no `if (a) {` |
| Línea final con salto de línea | — |

> **Lo que este proyecto NO usa.** No hay `prettier`, no hay `eslint`, no hay
> `husky`, no hay `commitlint`. Es una decisión consciente: menos dependencias, menos
> configuración que mantener, y una instalación que no tarda. El precio es que el
> formato depende de que todo el mundo lea el código existente antes de escribir.

### El único aviso de lint

`npm run lint` termina con un aviso, no con un error:

```
src/auth/AuthContext.jsx:4:14  react(only-export-components)
```

Qué significa: ese archivo exporta a la vez un componente (`AuthProvider`) y una
constante que no es un componente (`AuthContext`). La regla quiere que un archivo de
componentes exporte solo componentes, para que el recarga en caliente de React funcione
bien.

Se puede ignorar. Está anotado en el capítulo de calidad y, si algún día molesta, la
solución es mover el `createContext` a su propio archivo. **No afecta a la
aplicación**, solo a la velocidad de recarga en desarrollo.

### Los comentarios

**El proyecto escribe comentarios que explican el porqué, no el qué.**

```jsx
// ❌ No dice nada nuevo
// Obtiene el usuario
const user = await api.me()

// ✅ Dice por qué está escrito así
// Startup: the session lives in an HttpOnly cookie, so the only way to know
// who the user is (including after a full-page Google redirect) is me().
useEffect(() => { /* ... */ }, [])
```

El criterio:

| Comentario útil | Comentario inútil |
|---|---|
| Por qué se hace así | Qué hace la línea siguiente |
| Por qué no se hizo lo obvio | Repite el nombre de la función |
| Qué pasa si esto cambia | Describe la sintaxis |
| Referencia a un problema concreto | Desaparece cuando el código cambia |

Un buen ejemplo, de `src/api/client.js`:

```js
// La cookie llega URL-encoded y el backend hace decrypt() del header:
// sin decodificar, Laravel responde 419.
valor = decodeURIComponent(token)
```

Ahí el comentario justifica una línea que, sin él, parecería superflua: parece que se
puede mandar la cookie tal cual.

### El idioma

Aquí el proyecto es **incoherente**, y conviene saberlo:

| Elemento | Idioma | Estado |
|---|---|---|
| Identificadores, funciones, variables | Inglés | Consistente |
| Nombres de archivo | Español (`ProtectedRoute` es inglés, `RecuperarContrasena` es español) | Mixto |
| Comentarios | **Mayoritariamente español** | Inconsistente |
| Comentarios en `AuthContext.jsx`, `AuthLayout.jsx`, `ProtectedRoute.jsx` | Inglés | Excepción |
| Mensajes al usuario | Español | Consistente |

Los tres archivos con comentarios en inglés son `src/auth/AuthContext.jsx` (6 líneas),
`src/layouts/AuthLayout.jsx` (2) y `src/auth/ProtectedRoute.jsx` (1), los tres escritos
en el commit `47a34da`. La convención del proyecto y la del backend es **comentarios en
español**. Corregirlo es un cambio mecánico, sin riesgo, pendiente en
[Pendientes](23-pendientes.md).

> **Por qué importa la incoherencia.** Un comentario en inglés obliga a quien lee a
> cambiar de idioma a mitad de una idea. En este proyecto el código ya mezcla idiomas
> en los nombres, y eso es aceptable porque el inglés es el idioma técnico. En los
> comentarios, en cambio, el español gana porque es donde se explica el criterio.

## 2. Los patrones del código

### Las llamadas a la API pasan por `src/api/`

**Ningún componente importa `axios` directamente.** Los tres módulos de `src/api/` son
la única puerta al backend:

| Archivo | Responsabilidad | Nº de funciones |
|---|---|---|
| `client.js` | Instancia de axios, cookie de sesión, CSRF, evento de sesión caída | 2 |
| `auth.js` | Los 8 endpoints de autenticación | 8 |
| `mensajeError.js` | Traducir errores HTTP a frases | 2 |
| `reintento.js` | Leer los segundos de espera de un 429 | 1 |

Un componente importa lo que necesita de ahí, y nunca otra cosa:

```jsx
import * as authApi from '../../api/auth'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
```

> **Por qué `auth.js` devuelve `res.data` y no la respuesta entera.** Cada función de
> `auth.js` termina en `.then((res) => res.data)`. Así quien la llama escribe
> `const data = await authApi.login(...)` y nunca ve el envoltorio de axios. Una capa
> fina, pero evita que cada pantalla tenga que acordarse de desenvolver la respuesta.

### Los componentes de página son "tontos" a propósito

Los módulos de negocio son marcadores de posición. Todos tienen la misma forma:

```jsx
import PaginaVacia from '../../components/ui/PaginaVacia'

export default function ConvocatoriasListado() {
  return (
    <PaginaVacia titulo="Convocatorias" descripcion="Modulo en construccion" />
  )
}
```

No piden datos, no manejan estado, no validan. Cuando se construyan, la idea es que la
página se encargue de organizar y `src/api/` de traer los datos.

### El patrón de las tres pantallas de error

| Pantalla | Cuándo se ve | Dónde vive |
|---|---|---|
| `Cargando...` | La sesión todavía no se comprobó | `ProtectedRoute.jsx` |
| 403 Forbidden | Hay sesión pero falta el permiso | `pages/errores/Forbidden.jsx` |
| 404 NotFound | La ruta no existe | `pages/errores/NotFound.jsx` |

Las tres devuelven texto, no un modal ni una alerta. Decisión deliberada: una pantalla
completa es más fácil de leer y de probar que un panel flotante encima de la interfaz.

### Las guardas reemplazan, no avisan

Ningún guard lanza un error ni muestra un aviso. Devuelven otra pantalla o redirigen:

```jsx
// En vez de "error: no tienes permiso", la ruta devuelve directamente:
if (!hasAny(lista)) {
  return <Forbidden />
}
return <Outlet />
```

Así el usuario nunca ve una pantalla a medio construir.

### Los datos del usuario nunca se guardan en el navegador

`user` vive **solo** en memoria, dentro del contexto de React. Nunca en `localStorage`,
nunca en `sessionStorage`, nunca en un estado global externo.

La razón es que la sesión del backend es una cookie `HttpOnly`: el JavaScript no puede
leerla. Si el frontend guardara el usuario en `localStorage`, el botón "Cerrar sesión"
de otro navegador o pestaña no vaciaría nada, y aparecería un botón de "salir" en una
pantalla que en realidad no tiene sesión.

La excepción es el estado del OTP, que sí va a `sessionStorage` porque no es un secreto:
es una marca de tiempo para no gastar envíos.

## 3. Los mensajes de error

### Para el usuario

**En español, en segunda persona, sin tecnicismos.** La función que los decide es
`mensajeError(error)`, en `src/api/mensajeError.js`.

| Código | Lo que ve la persona |
|---|---|
| Sin respuesta | "No pudimos conectarnos. Inténtalo de nuevo en un momento." |
| 401 | "Tu sesión expiró. Vuelve a iniciar sesión." |
| 419 | "La sesión expiró. Recarga la página e inténtalo de nuevo." |
| 403 | El mensaje del backend, o "No tienes permiso para hacer esto." |
| 429 | "Demasiados intentos. Espera 30 s e inténtalo de nuevo." |
| 500 o más | "El servidor tuvo un error. Inténtalo de nuevo en un momento." |
| 422 | El primer mensaje de validación de Laravel, tal cual |
| Otros | El mensaje del backend, o "Ocurrió un error inesperado." |

### Lo que nunca se devuelve al usuario

| Información | Dónde va |
|---|---|
| Mensajes de excepción | Consola del navegador |
| Trazas de error | Consola del navegador |
| Nombres de tablas y columnas | Al backend, nunca al frontend |
| Detalles de `axios` | Al backend |

### El 422 se muestra tal cual

Laravel ya escribe los mensajes de validación en español y en segunda persona. El
frontend solo elige cuál mostrar:

```js
if (status === 422 && data?.errors) {
  const primerCampo = Object.values(data.errors)[0]
  return primerCampo?.[0] ?? 'Los datos enviados no son válidos.'
}
```

Para poner el mensaje bajo el campo que corresponde está `erroresDeCampo`:

```js
// { errors: { email: ['El correo ya está registrado.'] } }
//   ↓
// { email: 'El correo ya está registrado.' }
```

Reescribir esos textos en el frontend sería duplicar un texto que ya es correcto, y
cada copia se quedaría desactualizada.

## 4. Las reglas de seguridad del frontend

Estas son las decisiones ya tomadas. No son sugerencias.

### La sesión va en una cookie `HttpOnly`, nunca en el cuerpo

El frontend no guarda el token. Lo manda solo. No hay `localStorage` con sesiones, no
hay cabecera `Authorization`, no hay token en la URL.

Consecuencia práctica: **el frontend no puede cerrar la sesión por su cuenta.** Llama a
`POST /api/auth/logout` y el backend invalida la cookie. Por eso `logout` en
`AuthContext` limpia el estado aunque la petición falle:

```js
const logout = useCallback(async () => {
  try {
    await authApi.logout()
  } catch {
    // Even if the request fails, close the session in the browser.
  }
  setUser(null)
}, [])
```

### El token CSRF lo pone el código, no la librería

`client.js` desactiva a propósito el manejo automático de axios:

```js
xsrfCookieName: null,
```

El motivo está en el comentario: no se quiere depender de si la versión instalada de
axios manda la cabecera, ni de con qué formato. El interceptor lo pone a mano, con el
`decodeURIComponent` que Laravel exige. Si se dejara el automático, el 419 aparecería
dependiendo de la versión de axios instalada.

### Los permisos se comprueban, pero no son la seguridad

`PermissionRoute` y el menú filtran la interfaz. Eso es **comodidad**, no seguridad: el
JavaScript se puede modificar desde la consola del navegador.

La seguridad real está en el backend, que es quien valida el permiso en cada endpoint.
El frontend solo evita mostrar lo que no se puede usar. Nunca se debe escribir código
que confíe en que `PermissionRoute` ya ha comprobado algo.

### El correo no se revela

`forgotPassword` avanza al paso 2 sin comprobar nada, porque el backend responde igual
en ambos casos. Está en [Códigos OTP](05-codigos-otp.md).

### Los secretos no van en el código ni en `.env`

`VITE_API_URL` y `VITE_CSRF_URL` no son secretos: son direcciones públicas, y Vite las
incrusta en el paquete de producción a propósito. Cualquier cosa con prefijo `VITE_`
acaba visible en el JavaScript que descarga el navegador.

Nunca se pone en el frontend una llave, un secreto ni una contraseña del backend. Si
hace falta una llave para algo, la conexión con el backend es un problema del servidor,
no del cliente.

## 5. Cómo nombrar

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componente | `PascalCase` | `SidebarItem` |
| Función y variable | `camelCase` | `puedeVerGrupo` |
| Constante | `SCREAMING_SNAKE_CASE` | `MUTADORES` |
| Archivo de componente | `PascalCase.jsx` | `ThemeToggle.jsx` |
| Archivo de módulo de página | `PascalCase.jsx` | `ConvocatoriasListado.jsx` |
| Archivo de utilidad | `camelCase.js` | `useCuentaAtras.js` |
| Carpeta | minúsculas, sin tildes | `src/pages/errores/` |
| Permiso | `recurso:acción` | `documentos:validar` |
| Ruta | `kebab-case` o `camelCase`, en minúsculas | `/mis-postulaciones` |
| Evento de ventana | `namespace:evento` | `auth:expirada` |
| Clave en `sessionStorage` | `prefijo:namespace:pantalla` | `spgth:otp:recuperar` |

> **Los nombres de carpeta sin tilde, pero los de archivo con ella no.** Las carpetas
> van en minúsculas y sin tildes porque viajan en la URL de compilación y en las rutas
> de import; los archivos pueden llevar tilde en el nombre de la pantalla. Es
> incoherente, pero es lo que hay, y cambiarlo ahora tocaría 20 imports.

### Las rutas y los permisos van en el mismo sitio

El nombre de la ruta y el permiso que la protege siguen el mismo patrón:

| Ruta | Permiso |
|---|---|
| `/documentos` | `documentos:ver` |
| `/documentos/cargar` | `documentos:cargar` |
| `/documentos/validacion` | `documentos:validar` |
| `/evaluacion` | `evaluacion:ver` |
| `/evaluacion/evaluar` | `evaluacion:evaluar` |
| `/seleccion` | `seleccion:ver` |
| `/seleccion/decidir` | `seleccion:decidir` |
| `/mis-postulaciones` | `propio:postulaciones` |

Cuando se añada un módulo nuevo, tiene que aparecer en **tres** sitios: `router.jsx`,
`config/menu.js` y el backend. Los dos primeros juntos están en
[Páginas y módulos](14-paginas-y-modulos.md).

## 6. Los commits

Formato: **un verbo en imperativo + qué se hizo.**

```
feat: anade modo oscuro y toggle de tema
```

Los prefijos que usa el proyecto:

| Prefijo | Para qué |
|---|---|
| `feat:` | Funcionalidad nueva |
| `fix:` | Corrección de un error |
| `chore:` | Limpieza, sin cambio de comportamiento |
| `docs:` | Solo documentación |
| `refactor:` | Reestructuración sin cambiar comportamiento |
| `style:` | Solo formato |

**Los commits se centran en un tema.** El commit `2784657` toca 19 archivos, pero los
19 son el mismo cambio: quitar una línea que mostraba los nombres de los permisos. Del
mismo modo, `747f360` toca 18 archivos, y los 18 son el mismo tema: el modo oscuro.

> **Nota:** el proyecto escribe los mensajes en español. No es la convención de Git,
> que sería inglés, pero es lo que se ha hecho, y la coherencia importa más que la
> regla.

El detalle commit por commit está en [Historial de los commits](20-historial-de-commits.md).

## 7. Añadir un módulo nuevo

El orden completo. Saltarse el paso 6 es lo más habitual:

```jsx
// 1. La pantalla, como marcador de posición
//    src/pages/documentos/DocumentoNuevo.jsx
import PaginaVacia from '../../components/ui/PaginaVacia'
export default function DocumentoNuevo() {
  return <PaginaVacia titulo="..." descripcion="Modulo en construccion" />
}

// 2. La ruta con su permiso, en src/router.jsx
<Route element={<PermissionRoute permiso="documentos:nuevo" />}>
  <Route path="documentos/nuevo" element={<DocumentoNuevo />} />
</Route>

// 3. La entrada del menú, en src/config/menu.js

// 4. El endpoint en el backend

// 5. La función en src/api/, si hace falta

// 6. Documentación en docs/
```

Los pasos 2 y 3 son los que más se olvidan. Una ruta sin entrada en el menú es
inaccesible con el ratón, y una entrada de menú sin ruta lleva a un 404.

## 8. Los archivos de configuración

### Los valores por defecto van en el código

```js
// src/api/client.js
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
```

El valor por defecto va en el lado derecho del `??`. Así el proyecto arranca sin `.env`.
Solo va en `.env` lo que cambia entre máquinas, y siempre con prefijo `VITE_`.

### Si se añade una variable a `.env`, se documenta

Si añades una variable, tiene que estar en:

1. `.env.example`, con un valor **no secreto**
2. Este documento, o el capítulo que corresponda
3. Un comentario explicando para qué sirve

Una variable sin documentar es una variable que nadie va a poder cambiar.
