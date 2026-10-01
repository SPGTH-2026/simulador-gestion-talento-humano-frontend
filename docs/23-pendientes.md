# Pendientes

Este documento recoge lo que **no** está terminado. No es una lista de deseos: es el
estado real del proyecto, comprobado archivo por archivo.

Cada punto dice qué falta, por qué importa, y cómo de difícil sería. Lo que va primero
es lo que más molesta al usar la aplicación.

---

## 1. Los 17 módulos de negocio no existen

**Estado:** es lo más grande que falta.

Las 17 pantallas provisionales devuelven un `PaginaVacia` y no piden nada al backend:

| Carpeta | Pantallas | Permisos |
|---|---|---|
| `pages/dashboard/` | 1 | `dashboard:ver` |
| `pages/convocatorias/` | 2 | `convocatorias:ver`, `convocatorias:gestionar` |
| `pages/documentos/` | 3 | `documentos:ver`, `documentos:cargar`, `documentos:validar` |
| `pages/evaluacion/` | 2 | `evaluacion:ver`, `evaluacion:evaluar` |
| `pages/seleccion/` | 2 | `seleccion:ver`, `seleccion:decidir` |
| `pages/usuarios/` | 1 | `usuarios:gestionar` |
| `pages/reportes/` | 1 | `reportes:ver` |
| `pages/supervision/` | 1 | `supervision:gestionar` |
| `pages/aspirante/` | 4 | `propio:postulaciones`, `propio:documentos`, `propio:evaluaciones`, `propio:notificaciones` |

Además, **el backend solo tiene las 10 rutas de autenticación**. No hay ni un endpoint
de negocio. Así que los dos lados están por construir.

### Por qué importa

Es lo único que impide que la aplicación se use. Todo lo demás —la marca, el modo
oscuro, los permisos, la sesión— funciona.

### Cómo se construye uno

El andamiaje ya está. El orden está en
[Convenciones del código](19-convenciones.md), sección 7. En resumen: la pantalla
pide datos, la función va en `src/api/`, la ruta en `router.jsx` con su permiso, la
entrada en `config/menu.js`, y el endpoint en el backend.

## 2. No hay ninguna prueba automática

**Estado:** cero. Ni un archivo de prueba, ni un configurador, ni un script.

```
$ git ls-files | grep -i test
(sin resultados)
```

`package.json` no tiene dependencia de Vitest, Jest ni Playwright. El script `test` no
existe.

### Por qué importa

Tres cosas que hoy no se pueden comprobar al vuelo:

| Riesgo | Qué se rompería sin avisar |
|---|---|
| El `decodeURIComponent` del token CSRF | Toda escritura al backend daría 419 |
| El salto del paso 1 al 2 en recuperación | Un F5 gastaría un envío del límite de 3 por minuto |
| La doble llamada de `sendVerification` | Se enviarían dos códigos, porque `StrictMode` monta dos veces en desarrollo |

### Qué pruebas faltan, por orden de valor

| # | Qué probar | Dónde | Dificultad |
|---|---|---|---|
| 1 | `leerOtp` devuelve `null` si pasó el TTL | `src/lib/otpSesion.js` | Fácil |
| 2 | `enmascararEmail` con correos de 1, 2 y 3 caracteres | `src/lib/otpSesion.js` | Muy fácil |
| 3 | `leerCookie` con valor que contiene `=` | `src/api/client.js` | Fácil |
| 4 | `segundosReintento` con `Retry-After` y con `X-RateLimit-Reset` | `src/api/reintento.js` | Fácil |
| 5 | `mensajeError` para cada código HTTP | `src/api/mensajeError.js` | Fácil |
| 6 | `erroresDeCampo` convierte la forma de Laravel | `src/api/mensajeError.js` | Muy fácil |
| 7 | `puedeVerGrupo` oculta lo que no tiene permiso | `src/config/menu.js` | Media |
| 8 | `ProtectedRoute` con correo sin verificar | `src/auth/` | Media |
| 9 | El login con la cookie de sesión y el CSRF | Integral | Media |
| 10 | Un módulo completo, de la ruta al render | Un módulo | Difícil |

Los cinco primeros son funciones puras, sin React ni red. Se pueden probar sin montar
nada, y son la mejor relación entre esfuerzo y seguridad.

### Qué falta además

Ni una función de prueba parece haber empezado. No hay carpeta `tests/`, ni
`vitest.config.js`, ni un `setup` de jsdom. Instalar Vitest y tener el primer test
pasando es trabajo de medio día.

## 3. `README.md` está roto

**Estado:** el archivo existe, pero no describe este proyecto.

| Problema | Detalle |
|---|---|
| Contido equivocado | Son 12 líneas del texto en inglés de la plantilla de Vite: `# React + Vite` |
| Codificación rota | La última línea está guardada en **UTF-16**, no en UTF-8 |
| Consecuencia | Algunas herramientas lo detectan como archivo binario y no pueden leerlo |

La última línea se ve así, con un espacio entre cada carácter:

```
#  s i M u l a d o r   - g e s t i o n ...
```

### Por qué importa

Es el primer archivo que ve alguien que abre el repositorio. Dice lo contrario de lo
que es el proyecto.

### Cómo se arregla

Dos opciones, y hay que decidir cuál:

| Opción | Qué implica |
|---|---|
| Escribir un `README.md` real | Hay que versionarlo. Pasaría a verse en Git |
| Dejarlo así y que la documentación viva aparte | Se acepta que el `README` es un resto |

Lo que hay que hacer en cualquier caso es **arreglar la codificación**: un archivo en
UTF-16 dentro de un proyecto en UTF-8 es un error, se arregle o no el contenido. El
resto del proyecto usa UTF-8 sin BOM.

## 4. `public/icons.svg` no lo usa nadie

**Estado:** 24 líneas de un sprite de iconos de la plantilla de Vite.

Ningún archivo de `src/` lo menciona. Nunca se descargará, porque el navegador solo
pide los recursos que alguien referencia.

### Qué hacer

Borrarlo. Es una eliminación segura, porque no hay ningún `import` que lo dependa. La
misma limpieza hizo el commit `0ec54ed` con `react.svg` y `vite.svg`, y este se quedó
fuera.

## 5. Volver a la pantalla que querías tras iniciar sesión

**Estado:** se guarda el destino, pero no se usa.

`ProtectedRoute` lo guarda:

```jsx
return <Navigate to="/login" replace state={{ from: location }} />
```

Pero `Login.jsx` **nunca lee `state.from`**. Después de entrar, `AuthLayout` redirige
según el correo:

```jsx
if (user) {
  return <Navigate to={user.email_verified ? '/' : '/verificar-correo'} replace />
}
```

### Qué pasa en la práctica

Alguien con permiso `convocatorias:ver` hace clic en "Convocatorias" sin sesión. Va a
`/login`. Escribe su correo y contraseña. Entra. Y aterriza en `/` (el inicio), no en
las convocatorias que quería.

### Por qué importa

Es una molestia pequeña pero visible, y ocurre a quien usa la aplicación todos los días.
La parte difícil ya está hecha: el destino se guarda. Falta leerlo.

## 6. La recarga directa en rutas profundas no está configurada

**Estado:** no hay ningún archivo de reenvío.

```
$ git ls-files | grep -E '_redirects|netlify|vercel|nginx'
(sin resultados)
```

### Qué pasa en la práctica

En desarrollo no se nota: el servidor de Vite resuelve solo. En producción, si se
sirve `dist/` con un servidor que no sabe de aplicaciones de una sola página, pulsar
F5 en `/convocatorias` da un **404 del servidor**, no un 404 de la aplicación.

### Qué falta

Depende de dónde se despliegue:

| Plataforma | Qué hace falta |
|---|---|
| Netlify | `public/_redirects` con `/*  /index.html  200` |
| Vercel | `vercel.json` con el reescrito, o `public/_redirects` |
| Apache | Un `FallbackResource /index.html` en el `.htaccess` |
| Nginx | `try_files $uri $uri/ /index.html;` |

Ninguno de esos es solo añadir un archivo: hay que probarlo contra el despliegue real.

## 7. Sin carga diferida de rutas

**Estado:** `router.jsx` importa las 23 páginas estáticamente.

```jsx
import Dashboard from './pages/dashboard/Dashboard'
import ConvocatoriasListado from './pages/convocatorias/ConvocatoriasListado'
// ... 21 imports más
```

No hay ni un `lazy()` ni un `Suspense`.

### Por qué importa, y por qué todavía no

Hoy el paquete es pequeño, así que no se nota. Pero las 17 pantallas provisionales
serán 17 módulos reales con tablas, filtros y formularios. Cuando eso pase, el
`bundle` crecerá y la primera carga se alargará.

| Opción | Envoltorio |
|---|---|
| `React.lazy` + `Suspense` | Un `<Suspense>` en `router.jsx` y un estado de carga |
| Compilación por rutas | Un plugin de Vite |

Es trabajo para cuando los módulos existan. Hacerlo ahora sería optimizar un problema
que aún no tiene.

## 8. Sin límite de errores (Error Boundary)

**Estado:** no hay ninguno. Si un componente lanza una excepción al renderizar, React
desmonta **toda** la aplicación y la pantalla se queda en blanco.

### Qué pasa

Un error de JavaScript en `ConvocatoriasListado` no deja de romper esa pantalla: deja de
funcionar el menú, el `Topbar` y todo. Quien esté delante ve un blanco y tiene que
recargar.

### Qué falta

Un componente `ErrorBoundary` envolviendo la aplicación en `main.jsx`, más otro dentro
de `AppLayout` para que un error en una pantalla no tumbe el marco.

## 9. Los comentarios de tres archivos están en inglés

**Estado:** incoherencia, no un error.

La convención del proyecto y del backend es **código en inglés, comentarios en
español**. Estos tres archivos no la siguen:

| Archivo | Comentarios en inglés | Nº |
|---|---|---|
| `src/auth/AuthContext.jsx` | Todos | 6 líneas |
| `src/layouts/AuthLayout.jsx` | Todos | 2 líneas |
| `src/auth/ProtectedRoute.jsx` | Todos | 1 línea |

Los tres son del mismo commit, el `47a34da`. El resto del proyecto, incluidos
`PermissionRoute.jsx` y `Login.jsx`, sí está en español.

### Por qué importa

Más que nada, coherencia. Un comentario en inglés obliga a cambiar de idioma a mitad de
una idea, justo donde está la explicación difícil.

### Cómo se arregla

Traducir. Es mecánico y no cambia ninguna funcionalidad. Conviene hacerlo cuando se
toque cualquiera de los cuatro archivos por otro motivo, no como un commit propio.

## 10. El aviso de lint sigue ahí

**Estado:** conocido y documentado, sin resolver.

```
src/auth/AuthContext.jsx:4:14  react(only-export-components)
```

`AuthContext.jsx` exporta a la vez `AuthProvider` (un componente) y `AuthContext` (una
constante que no lo es). La regla quiere que un archivo de componentes exporte solo
componentes, para que la recarga en caliente funcione.

### Qué se puede hacer

| Opción | Coste |
|---|---|
| Dejarlo | Cero. No afecta a la aplicación |
| Mover `createContext` a `src/auth/context.js` | Bajo. Toca 2 archivos |
| Silenciarlo con un comentario | Bajo, pero esconde la regla |

No es un error: `npm run lint` sale con código 0. Está anotado en
[Calidad, lint y pruebas](18-calidad-lint-y-pruebas.md).

## 11. Cosas menores

| Qué | Detalle |
|---|---|
| `VerificarCorreo.jsx:149` | El `className` del botón "Reenviar" tiene la sangría corrida. Solo estética |
| `reintento.js` no reintenta nada | Despite el nombre, solo lee la cabecera `Retry-After` para saber cuántos segundos hay que esperar. Ninguna petición se repite solo |
| El token de Google en la URL | Se eliminó en el commit `73200ad`, pero el backend sigue teniendo el endpoint. Ver más abajo |
| `Topbar.jsx` no tiene búsqueda | Si algún día se pide, ahí es donde va |
| El menú no distingue lo construido de lo pendiente | Todas las entradas tienen el mismo aspecto, aunque 17 de ellas no hagan nada todavía |

### Sobre el login con Google

El botón funciona: `Login.jsx` navega a `VITE_GOOGLE_URL` y el backend devuelve a
`/login?error=...`, que la pantalla sabe leer. Lo que **no** hay es la página intermedia
que procesara un token en la URL, porque con la cookie de Sanctum no hace falta: la
sesión ya está puesta cuando se vuelve.

Lo que queda por decidir es si el backend sigue exposing los endpoints de Google, dado
que el frontend ya no procesa ningún token. Está documentado en
[Historial de los commits](20-historial-de-commits.md), commit 15.

## Cómo elegir por dónde empezar

Si hay que ordenar todo esto:

| Prioridad | Qué | Por qué |
|---|---|---|
| 1 | Instalar Vitest y probar las 5 funciones puras | Cuesta medio día y cubre lo que más se rompería sin avisar |
| 2 | Arreglar la codificación del `README.md` | Es un error objetivo, de un minuto |
| 3 | Leer `state.from` en el login | Quince líneas y una molestia diaria |
| 4 | Borrar `public/icons.svg` | Una línea, sin riesgo |
| 5 | Añadir `ErrorBoundary` | Evita la pantalla en blanco |
| 6 | Configurar el reenvío de rutas | Antes del primer despliegue |
| 7 | Traducir los comentarios en inglés de 3 archivos | Mecánico, sin urgencia |
| 8 | Construir los 17 módulos | Lo grande. Empieza por `convocatorias`, que es el flujo central del negocio |
