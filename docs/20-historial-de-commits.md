# Historial de los commits

Este documento recorre los **21 commits** del repositorio, uno por uno. Para cada uno
explica cuatro cosas:

- **Por qué** se hizo
- **Qué** cambió, archivo por archivo
- **Qué afectó** al proyecto
- **Si sigue vivo** hoy, o qué quedó de él

Está pensado para alguien que nunca ha visto este proyecto y quiere saber no solo qué
hay, sino cómo se llegó hasta aquí y qué decisiones se tomaron por el camino.

Los commits están en cuatro grupos, del más antiguo al más reciente. Los tres primeros
grupos cuentan una historia que incluye un trabajo que **se rehízo**, y esa es la parte
más útil de leer este documento.

| Grupo | Qué es | Commits |
|---|---|---|
| A | La base: estructura y login | 4 |
| B | La base técnica: React 19, Vite 8, Tailwind 4 | 1 |
| C | La rama que se descartó | 5 |
| D | La rama actual | 11 |

---

## Resumen en una tabla

| # | Commit | Fecha | Autor | Tema | Ficheros | Sigue vivo |
|---|---|---|---|---|---|---|
| 1 | `154b597` | 29 sep | yulycita | Commit inicial | 1 | Parcial |
| 2 | `e391b4a` | 29 sep | yulycita | Estructura de Vite y React | 15 | Parcial |
| 3 | `7d189b0` | 29 sep | yulycita | Login, sesión y menú por permisos | 22 | Sí |
| 4 | `e787db0` | 30 sep | Yuly Toro | Merge del PR #1 | — | Sí |
| 5 | `2d3dcc3` | 30 sep | steven-leon | Base React 19 + Vite 8 + Tailwind 4 | 16 | Sí |
| 6 | `cb4b3b0` | 30 sep | steven-leon | Autenticación con cookie (versión 1) | 14 | No, rehecho |
| 7 | `ec4dc08` | 30 sep | steven-leon | Módulos de negocio | 17 | No, ya estaban |
| 8 | `25d4d3a` | 30 sep | steven-leon | Paleta SENA en login (versión 1) | 4 | No, rehecho |
| 9 | `f5151b1` | 30 sep | steven-leon | Identidad visual SENA (versión 1) | 8 | No, rehecho |
| 10 | `227f0a0` | 30 sep | steven-leon | Formularios armonizados (versión 1) | 3 | No, rehecho |
| 11 | `47a34da` | 30 sep | steven-leon | Autenticación con cookie (versión 2) | 14 | Sí |
| 12 | `c2eeada` | 30 sep | steven-leon | Paleta SENA en login | 4 | Sí |
| 13 | `2880345` | 30 sep | steven-leon | Logotipo y favicon del SENA | 8 | Sí |
| 14 | `e22ce52` | 30 sep | steven-leon | Formularios armonizados | 3 | Sí |
| 15 | `73200ad` | 1 oct | steven-leon | Limpieza tras el rebase | 3 | Sí |
| 16 | `2784657` | 1 oct | steven-leon | Ocultar permisos y habilitar scroll | 19 | Sí |
| 17 | `747f360` | 1 oct | steven-leon | Modo oscuro | 18 | Sí |
| 18 | `48518ad` | 1 oct | steven-leon | Barras de desplazamiento | 3 | Sí |
| 19 | `ef183f5` | 1 oct | steven-leon | Clase `dark` duplicada | 1 | Sí |
| 20 | `97b0d8c` | 1 oct | steven-leon | Mensaje de error de red | 2 | Sí |
| 21 | `0ec54ed` | 1 oct | steven-leon | Limpieza de código muerto | 5 | Sí |

---

# Grupo A — La base

## 1. `154b597` — Commit inicial

**Fecha:** 29 de septiembre · **Autor:** yulycita

### Qué cambió

Un solo archivo: `README.md`, con 1.099 bytes. Es el `README` de la plantilla de Vite,
en inglés.

### Por qué

Es el arranque estándar de cualquier repositorio nuevo. No hay decisión detrás.

### Qué afectó

Nada del frontend. Nadie lo ha abierto nunca.

### Qué queda vivo

El archivo sigue ahí, y sigue siendo el texto en inglés de la plantilla de Vite. Además
tiene un problema de codificación: la última línea está guardada en UTF-16, lo que hace
que algunas herramientas lo traten como un archivo binario. Está anotado en
[Pendientes](23-pendientes.md).

## 2. `e391b4a` — Estructura inicial de Vite y React

**Fecha:** 29 de septiembre · **Autor:** yulycita

### Qué cambió

15 archivos, 2.832 líneas. Es la creación del proyecto con
`npm create vite@latest`:

| Archivo | Qué es |
|---|---|
| `package.json` | 27 líneas, las dependencias de la plantilla |
| `package-lock.json` | 2.299 líneas, el bloqueo de versiones |
| `src/App.jsx` | 122 líneas, la pantalla de ejemplo de Vite |
| `src/App.css` | 184 líneas, sus estilos |
| `src/index.css` | 111 líneas, el CSS de la plantilla |
| `src/assets/hero.png` | Una imagen decorativa, 13 KB |
| `src/assets/react.svg`, `src/assets/vite.svg` | Los logotipos de la plantilla |
| `public/icons.svg` | Un sprite de iconos |
| `.gitignore`, `.oxlintrc.json`, `vite.config.js`, `index.html` | La configuración |

### Por qué

Crear el proyecto desde la plantilla oficial de Vite es el punto de partida estándar de
React. Trae una pantalla de ejemplo que sirve para comprobar que la cadena de
compilación funciona.

### Qué afectó

Nada todavía. La pantalla de ejemplo convive con el trabajo real hasta el commit 21, que
la borra.

### Qué queda vivo

| Sigue vivo | Por qué |
|---|---|
| `package.json`, `package-lock.json` | Con las dependencias cambiadas después |
| `vite.config.js` | Con el plugin de Tailwind añadido después |
| `.oxlintrc.json` | Con una regla ajustada después |
| `index.html` | Rehecho por completo en los commits de marca |
| `public/icons.svg` | **Nada lo usa.** Quedó como resto de la plantilla |

Lo que se borró o se reescribió: `App.jsx`, `App.css`, `index.css`, `hero.png`,
`react.svg` y `vite.svg`.

## 3. `7d189b0` — Estructura del frontend con login, sesión y menú

**Fecha:** 29 de septiembre · **Autor:** yulycita

### Qué cambió

22 archivos, y es el commit que más peso tiene en la historia del proyecto: crea toda la
arquitectura.

**El andamiaje de autenticación (nuevo):**

| Archivo | Qué introduce |
|---|---|
| `src/api/client.js` | 34 líneas. Instancia de axios con `withCredentials` |
| `src/api/auth.js` | 17 líneas. Los endpoints de autenticación |
| `src/api/mensajeError.js` | 20 líneas. Traduce errores HTTP a frases |
| `src/auth/AuthContext.jsx` | 89 líneas. El estado global de sesión |
| `src/auth/useAuth.js` | 20 líneas. El hook `useAuth` y `can` / `hasAny` |
| `src/auth/ProtectedRoute.jsx` | 17 líneas. Guard de sesión |
| `src/auth/PermissionRoute.jsx` | 16 líneas. Guard de permisos |

**La interfaz (nuevo):**

| Archivo | Qué introduce |
|---|---|
| `src/config/menu.js` | 52 líneas. La estructura del menú con permisos |
| `src/components/Sidebar.jsx` | 32 líneas. El menú lateral |
| `src/components/SidebarItem.jsx` | 48 líneas. Cada entrada, con su acordeón |
| `src/components/Topbar.jsx` | 81 líneas. La barra superior con el menú de usuario |
| `src/components/ui/PaginaVacia.jsx` | 11 líneas. El marcador de vista sin construir |
| `src/layouts/AppLayout.jsx` | 19 líneas. El marco de las páginas de negocio |
| `src/layouts/AuthLayout.jsx` | 27 líneas. El marco de login y registro |

**Los 17 marcadores de página (nuevos):** `Dashboard`, las 2 de convocatorias, las 3 de
documentos, las 2 de evaluación, las 2 de selección, `Usuarios`, `Reportes`,
`Supervision` y las 4 del aspirante. Cada uno, 5 líneas.

**Lo que se borró:** `App.jsx` pasó de 122 a 9 líneas (sus 125 líneas se convirtieron en
el enrutado) y `index.css` perdió 112 de sus 111 líneas, porque la pantalla de ejemplo
ya no estaba.

### Por qué

Es el primer commit de trabajo real. Marca el salto de "proyecto de Vite" a "aplicación
de gestión de talento humano". La estructura que crea aquí —`api/`, `auth/`,
`components/`, `layouts/`, `pages/`, `config/`— es exactamente la que tiene el proyecto
hoy, cuatro meses después.

### Qué afectó

Todo. La decisión de agrupar las 17 pantallas en `pages/` por módulo funcional, en vez
de una sola carpeta plana, es lo que hace que hoy `pages/aspirante/` y
`pages/convocatorias/` estén separados.

### Qué queda vivo

Prácticamente todo. Estos son los 22 archivos que estructuran la aplicación. Los 17
marcadores de página siguen sin construirse, y el andamiaje de autenticación es el
mismo, aunque reescrito por el commit 11.

## 4. `e787db0` — Merge del pull request #1

**Fecha:** 30 de septiembre · **Autor:** Yuly Patricia Toro Maseto

### Qué cambió

Es un commit de fusión: une `SPGTH-2026/feature/primera-vista-login` en la rama
principal. No tiene cambios propios, solo junta el trabajo del commit 3.

El mensaje es el del pull request:

```
Merge pull request #1 from SPGTH-2026/feature/primera-vista-login

feat: estructura del frontend con login, sesión y menú lateral por permisos
```

### Por qué

Es el momento en que el trabajo de Yuly se incorpora al proyecto. A partir de aquí la
rama principal tiene la estructura de la aplicación.

### Qué afectó

Marca **el punto de partida real del proyecto**. Todo lo que se hizo después es trabajo
nuestro sobre esta base.

### Qué queda vivo

El commit no queda en el historial de la rama actual, porque la rama actual se reancló
sobre `main`. Pero su contenido es el commit 3, y eso vive.

---

# Grupo B — La base técnica

## 5. `2d3dcc3` — Base de React 19 con Vite 8, Tailwind 4 y oxlint

**Fecha:** 30 de septiembre · **Autor:** steven-leon

### Qué cambió

16 archivos, 2.628 líneas. Sustituye la base técnica de la plantilla por una moderna:

| Cambio | Antes | Después |
|---|---|---|
| React | 19 | 19 (se mantiene) |
| Vite | La versión de la plantilla | 8 |
| Tailwind | No había | 4, con su plugin de Vite |
| Lint | oxlint, con la configuración por defecto | oxlint, con `allowConstantExport` |

Archivos tocados: `package.json`, `package-lock.json`, `vite.config.js`, `.oxlintrc.json`,
`.gitignore`, `index.html`, `src/main.jsx`, `src/index.css`, `src/App.jsx`, más los
archivos de la plantilla.

### Por qué

Tailwind 4 es la base de toda la identidad visual que viene después. Sin él, los
colores del SENA y el modo oscuro no se podrían haber hecho con la misma facilidad. Y
Vite 8 es lo que permite que Tailwind 4 funcione mediante su plugin en lugar de una
configuración de PostCSS aparte.

### Qué Stelló afectado

Decisiones de fondo que condicionan todo lo posterior:

| Decisión | Consecuencia |
|---|---|
| Tailwind 4 con variables CSS en `@theme` | Los colores del SENA son variables, y por eso el modo oscuro puede redefinirlos |
| `src/index.css` pasa a tener **1 línea** | Toda la definición de tema vive en `tailwind.config` o en las directivas de Tailwind |
| oxlint con `react(only-export-components` como aviso | El aviso que aparece hoy en `AuthContext.jsx` viene de aquí |

### Qué queda vivo

Todo. Es la base técnica sobre la que está construido el resto del proyecto.

---

# Grupo C — La rama que se descartó

Este grupo requiere una explicación previa, porque **sus cinco commits se hicieron y
luego se tiraron**. Están en el repositorio, pero en una rama aparte que ya no es la
del trabajo actual.

## Qué pasó: el rebase

El trabajo de este grupo se hizo sobre una base equivocada. Se rehío: autenticación con la cookie de
Sanctum, y rebranding —paleta del SENA, formularios— pero sobre una versión del
proyecto anterior a la base técnica del grupo B.

Cuando se quiso integrar, hubo que **rebasear** la rama sobre `main`. Un rebase reescribe
los commits: crea copies nuevas con los mismos cambios, pero apoyadas en la base
actual. Los commits originales quedan en una rama de reserva.

El resultado es este repositorio, que tiene tres ramas:

```
* feature/branding-sena        ← la actual, 11 commits
  backup/antes-de-rebase       ← los 5 commits originales, ya rehechos
  main                         ← la base del proyecto
```

> **Por qué importa esto.** Los commits del grupo C existen, se pueden ver con
> `git show`, y **no son el código que está en el proyecto**. El commit `227f0a0` y el
> commit `47a34da` se llaman casi igual, pero hacen cosas distintas: uno es la versión
> rehecha y el otro la original. La rama actual usa el rehecho.

Los commits originales y sus versiones reescritas no son idénticos. El rebase resolvió
conflictos, y al resolverlos el resultado quedó **14 archivos distintos** entre las dos
versiones, con 174 líneas añadidas y 125 borradas. Es decir: el rebase no solo movió los
commits, también cambió parte del código al resolver los conflictos.

## 6. `cb4b3b0` — Autenticación con cookie de Sanctum (versión original)

### Qué cambió

14 archivos, el mismo conjunto que el commit 11. Es la primera versión del trabajo de
autenticación: cambiar el login de token a cookie de sesión.

### Por qué

El objetivo era el mismo que en la versión actual: que la sesión viaje en una cookie
`HttpOnly` y no en el cuerpo de la respuesta, para que el JavaScript no pueda leerla.

### Qué afectó

Reescribió el login, el cliente de axios, el contexto de sesión y las cuatro pantallas
públicas. El cambio de fondo era: el backend ya no devuelve un token JSON, y el
frontend tiene que dejar de guardarlo.

### Qué queda vivo

**Nada de este commit.** Fue reemplazado por `47a34da`, que hace lo mismo pero sobre la
base correcta. La lógica que seEstrena aquí (el interceptor de CSRF, el evento
`auth:expirada`) sí llegó a la versión final, pero reescrita.

## 7. `ec4dc08` — Módulos de convocatorias, documentos, evaluación, selección y usuarios

### Qué cambió

17 archivos: los marcadores de página de cinco módulos.

### Por qué

Crear el andamiaje de los módulos de negocio, para poder empezar a construir sobre él.

### Qué afectó

### Qué queda vivo

**Nada, y por una razón concreta.** Cuando se hizo el rebase, se vio que estos 17
marcadores **ya existían** en el commit 3 (`7d189b0`), que venía del pull request #1. Es
decir: el módulo se había creado dos veces, en dos ramas, sin que nadie lo notara. Al
reanclar, Git lo resolvió solo: los marcadores ya estaban en la base, y este commit se
volvió redundante.

> **Este commit es el ejemplo más claro de por qué vale la pena mirar el historial.**
> Un commit entero, 17 archivos, que no aporta nada porque su contenido ya estaba
> presente. Sin mirar los diffs, el mensaje del commit sugiere trabajo que nunca llegó
> al proyecto.

## 8. `25d4d3a` — Paleta institucional SENA en el login (versión original)

### Qué cambió

4 archivos: `TarjetaAuth.jsx`, `index.css`, `AuthLayout.jsx` y `Login.jsx`.

### Por qué

Pintar la pantalla de login con la identidad visual del SENA.

### Qué afectó

### Qué queda vivo

**Nada.** Reemplazado por `c2eeada`.

## 9. `f5151b1` — Identidad visual institucional SENA (versión original)

### Qué cambió

8 archivos: `index.html`, `favicon.svg`, `logo-sena.svg`, `Sidebar.jsx`, `LogoSena.jsx`,
`TarjetaAuth.jsx`, `index.css`, `AuthLayout.jsx`.

### Por qué

Lo mismo que en el commit 8, pero aplicado a toda la aplicación: el logotipo en el menú,
el favicon, y la tarjeta de los formularios.

### Qué queda vivo

**Nada.** Reemplazado por `2880345`.

## 10. `227f0a0` — Armoniza los formularios públicos (versión original)

### Qué cambió

3 archivos: `RecuperarContrasena.jsx`, `Registro.jsx` y `VerificarCorreo.jsx`.

### Por qué

Dejar los tres formularios de autenticación con el mismo aspecto: mismos campos, mismos
colores, mismo espaciado.

### Qué afectó

### Qué queda vivo

**Nada.** Reemplazado por `e22ce52`.

> **La lección del grupo C.** Tres commits (`25d4d3a`, `f5151b1`, `227f0a0`) hicieron
> trabajo real y bien pensado, y aun así se perdieron. La causa no fue el trabajo: fue
> hacerlos sobre una base que luego hubo que cambiar. La rama `backup/antes-de-rebase`
> los conserva por si acaso, y ahí se pueden comparar las dos versiones.

---

# Grupo D — La rama actual

Estos once commits son los que forman el proyecto hoy. Van del 30 de septiembre al 1
de octubre.

## 11. `47a34da` — Autenticación por sesión con cookie de Sanctum

**Fecha:** 30 de septiembre · **Autor:** steven-leon

### Qué cambió

14 archivos, **838 líneas añadidas y 110 borradas**. Es el commit más grande del
proyecto.

| Archivo | Cambio |
|---|---|
| `src/api/client.js` | Reescrito entero: 93 líneas. CSRF, cookie, evento de sesión |
| `src/api/auth.js` | 38 líneas. Los 8 endpoints |
| `src/api/mensajeError.js` | 43 líneas. El traductor de errores |
| `src/api/reintento.js` | **Nuevo**, 19 líneas. Lee el `Retry-After` |
| `src/auth/AuthContext.jsx` | 107 líneas. `refrescar` y `errorRed` |
| `src/auth/ProtectedRoute.jsx` | 17 líneas. Comprueba el correo verificado |
| `src/lib/otpSesion.js` | **Nuevo**, 55 líneas. El estado del OTP |
| `src/lib/useCuentaAtras.js` | **Nuevo**, 20 líneas. La cuenta atrás del 429 |
| `src/pages/login/RecuperarContrasena.jsx` | **Nuevo**, 282 líneas. El flujo completo |
| `src/pages/login/VerificarCorreo.jsx` | **Nuevo**, 163 líneas. El flujo completo |
| `src/pages/login/Login.jsx` | 51 líneas nuevas. El formulario de login |
| `src/router.jsx` | 11 líneas. `/verificar-correo` fuera de `AppLayout` |
| `src/layouts/AuthLayout.jsx` | 35 líneas |
| `src/components/ui/TarjetaAuth.jsx` | 14 líneas |

### Por qué

El backend cambió su autenticación. Dejó de devolver un token JSON y pasó a usar la
sesión con cookie de Sanctum. El frontend tenía que dejar de guardar el token y
empezar a depender de la cookie.

Eso arrastró tres cosas nuevas que **no existían** en el proyecto anterior:

| Necesidad | Solución que introduce |
|---|---|
| Sanctum exige una cookie CSRF antes del primer `POST` | `asegurarCookieCsrf()` en `client.js` |
| El 419 y el 401 son fallos distintos | `mensajeError.js` los distingue |
| Hay dos flujos con código de un solo uso | `otpSesion.js` y las dos pantallas nuevas |

### Qué afectó

Es el commit que define cómo se habla con el backend hoy. Todo lo que vino después
—la marca, el modo oscuro— se apoya en esto.

La decisión de que `/verificar-correo` viviera **fuera** de `AppLayout` está en este
commit, y el comentario del código explica por qué: para evitar un bucle con
`ProtectedRoute`.

### Qué queda vivo

Todo. Es el commit más importante del proyecto y prácticamente todo su código sigue
intacto.

## 12. `c2eeada` — Paleta institucional SENA en la pantalla de login

**Fecha:** 30 de septiembre · **Autor:** steven-leon

### Qué cambió

4 archivos, 70 líneas añadidas y 22 borradas: `TarjetaAuth.jsx`, `index.css`,
`AuthLayout.jsx` y `Login.jsx`.

### Por qué

El login era la primera pantalla que ve alguien, y era la más visible. Le tocó primero.

### Qué afectó

Solo la experiencia visual. Ningún cambio de comportamiento.

### Qué queda vivo

Sí, íntegro. Es la base del aspecto actual de los cuatro formularios.

## 13. `2880345` — Incorpora la identidad visual institucional SENA

**Fecha:** 30 de septiembre · **Autor:** steven-leon

### Qué cambió

8 archivos, 98 líneas añadidas y 42 borradas:

| Archivo | Cambio |
|---|---|
| `src/components/ui/LogoSena.jsx` | **Nuevo**, 24 líneas. El componente del logotipo |
| `public/logo-sena.svg` | **Nuevo**. El archivo del símbolo |
| `public/favicon.svg` | 17 líneas. El icono de la pestaña |
| `index.html` | 10 líneas. El título y el favicon |
| `src/components/Sidebar.jsx` | 10 líneas. El logotipo en el menú |
| `src/components/ui/TarjetaAuth.jsx` | 46 líneas cambiadas |
| `src/layouts/AuthLayout.jsx` | 11 líneas |
| `src/index.css` | 6 líneas. Los tokens de color nuevos |

### Por qué

El proyecto se llama "simulador de gestión de talento humano" y va dirigido a una
institución. Usar el logotipo institucional no es decoración: es lo que hace que la
aplicación se reconozca como del SENA desde el primer segundo.

El logotipo se hace con **dos archivos** a propósito: el SVG en `public/` y un
componente React que lo incrusta. Así el color del símbolo se controla con
`currentColor` y puede seguir al tema oscuro.

### Qué afectada

El menú lateral y los cuatro formularios. También el título del navegador.

### Qué queda vivo

Sí. `LogoSena.jsx` y `logo-sena.svg` son los que se usan hoy.

## 14. `e22ce52` — Armoniza los formularios públicos con la paleta SENA

**Fecha:** 30 de septiembre · **Autor:** steven-leon

### Qué cambió

3 archivos, 36 líneas añadidas y 44 borradas: `RecuperarContrasena.jsx`, `Registro.jsx`
y `VerificarCorreo.jsx`.

### Por qué

El commit 13 dejó el login bonito y los otros tres formularios sin tocar. Este commit
les aplica lo mismo.

Que se **borren más líneas de las que se añaden** (44 por 36) es la señal de que no
fue solo añadir estilo: se quitó estilo repetido que ya no hacía falta.

### Quéqedó afectado

Los tres formularios de recuperación, registro y verificación.

### Qué queda vivo

Sí.

## 15. `73200ad` — Completa el `.gitignore` tras reanclar la rama sobre `main`

**Fecha:** 1 de octubre · **Autor:** steven-leon

### Qué cambió

3 archivos. Este commit es la consecuencia visible del rebase:

| Cambio | Detalle |
|---|---|
| **`.env.example`** | **Nuevo**, 7 líneas. Documenta las tres variables |
| `.gitignore` | 4 líneas. Añade `.env`, `.env.local`, `.env.*.local` |
| `src/pages/login/GoogleCallback.jsx` | **Borrado**, 58 líneas |

### Por qué, y por qué aquí

Las dos primeras correcciones son consecuencia
directa del rebase. Y la tercera es la más interesante.

#### Por qué se borró `GoogleCallback.jsx`

Ese archivo manejaba el login con Google leyendo un token de la URL:

```jsx
const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
// ...
const { loginConToken } = useAuth()
```

Ese enfoque era **incompatible** con la cookie de Sanctum que introdujo el commit 11.
Con Sanctum no hay token en la URL: la cookie se pone sola, y una recarga de página
funciona sin parámetros en la URL.

Al rehacer la rama sobre `main`, el archivo había vuelto a aparecer, ya sin sentido. Como
el token en la URL es además un problema de seguridad conocido, se borró en lugar de
adaptarlo. Queda anotado en [Pendientes](23-pendientes.md) si algún día se quiere
recuperar el login con Google.

#### Por qué `.env.example` en este commit

Al reanclar, el `.gitignore` que traía la base no cubría los archivos de entorno, y
faltaba un `.env.example` que dijera qué variables poner. Sin ese archivo, nadie sabe
qué escribir en su `.env`. Y el comentario que lleva dentro avisa de algo que no es
evidente:

```
# OJO: usa siempre 'localhost', NUNCA '127.0.0.1'. Las cookies distinguen host
# y las dos direcciones no comparten sesión.
```

Eso evita un error de los más frustrantes: tener todo configurado y que la sesión no
funcione porque el frontend usa `localhost` y el backend responde a `127.0.0.1`.

### Qué afectada

La configuración local de todos los que trabajan en el proyecto, y la eliminación de un
camino de autenticación antiguo.

### Qué queda vivo

Sí. Los tres cambios.

## 16. `2784657` — Oculta los permisos en las vistas y habilita el scroll del menú

**Fecha:** 1 de octubre · **Autor:** steven-leon

### Qué cambió

19 archivos, pero solo **dos cosas**:

**Una. Los marcadores de página ya no muestran el permiso.** 17 archivos cambian **una
línea** cada uno:

```diff
-  return <PaginaVacia titulo="Inicio" permiso="dashboard:ver" />
+  return <PaginaVacia titulo="Inicio" />
```

Y el componente deja de aceptarlo:

```diff
-export default function PaginaVacia({ titulo, permiso }) {
+// Marcador de vista todavia no construida. No se muestra el permiso que la
+// habilita: es un detalle interno del enrutado y no le aporta nada al usuario.
+export default functionPaginaVacia({ titulo }) {
```

**Dos. El menú lateral ya se desplaza.** En `Sidebar.jsx`:

```jsx
<nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden pr-1">
```

### Por qué, y por qué son las dos cosas juntas

Son **la misma queja de la misma persona**. Alguien con todos los permisos abría la
aplicación y veía esto:

1. En cada pantalla, una línea gris que decía **"Permiso requerido: `dashboard:ver`"**.
   Eso es información interna del enrutado. A nadie le sirve saber cómo se llama la
   casilla que le permite ver la pantalla.
2. En el menú, las últimas opciones **no se podían alcanzar**. Había más entradas de las
   que cabían, y no aparecía ninguna barra para bajar.

Que se arreglaran en el mismo commit es porque salieron del mismo uso. La corrección
del scroll tiene un detalle técnico que vale la pena:

> **`min-h-0` es imprescindible.** En un contenedor flex, un elemento hijo no baja de
> su altura mínima de contenido. Sin `min-h-0`, el `nav` se estira hasta la altura que
> necesitan sus hijos y el contenido **se desborda** en vez de generar una barra. Por
> eso la clase está ahí, y por eso el comentario que la acompaña tiene tres líneas.

Y `shrink-0` en el bloque del logotipo, para que el símbolo no se aplaste cuando la
ventana se estrecha.

### Qué afecta

Todas las pantallas de módulos, y el menú lateral con muchos permisos.

### Qué queda vivo

Sí. Los 19 archivos.

## 17. `747f360` — Añade el modo oscuro y el conmutador de tema

**Fecha:** 1 de octubre · **Autor:** steven-leon

### Qué cambió

18 archivos, 298 líneas añadidas y 76 borradas. Es el segundo commit más grande.

| Archivo | Cambio |
|---|---|
| `src/lib/useTema.js` | **Nuevo**, 57 líneas. El estado del tema |
| `src/components/ThemeToggle.jsx` | **Nuevo**, 54 líneas. El botón |
| `index.html` | 21 líneas. El guion que evita el parpadeo |
| `src/index.css` | 25 líneas. El bloque `dark` y las variables |
| `src/components/Topbar.jsx` | 15 líneas. El conmutador entra en la barra |
| `src/components/SidebarItem.jsx` | 4 líneas |
| `src/layouts/AppLayout.jsx` | 2 líneas |
| `src/layouts/AuthLayout.jsx` | 7 líneas |
| `src/auth/ProtectedRoute.jsx` | 8 líneas |
| `src/pages/errores/Forbidden.jsx` | 11 líneas |
| `src/pages/errores/NotFound.jsx` | 11 líneas |
| `src/pages/login/*.jsx` | 38, 46, 30 y 25 líneas nuevas |
| `src/components/ui/PaginaVacia.jsx` | 8 líneas |
| `src/components/ui/TarjetaAuth.jsx` | 10 líneas |
| `src/components/Sidebar.jsx` | 2 líneas |

### Por qué

Porque en un centro de formación el proyector y la pizarra a menudo están en penumbra, y
porque un `dark:` en cada componente sin control sobre el tema no es un modo oscuro, es
una casualidad.

### Qué afectado, y las tres decisiones que importan

**Una. La preferencia se guarda y se respeta.** `useTema.js` tiene tres estados, no dos:
"claro", "oscuro" y **"siguiendo"**, que es el valor inicial y significa "usa lo que
diga el sistema". Se guarda en `localStorage`.

**Dos. El conmutador es de tres estados, no de dos.** Un botón de dos estados obliga a
elegir. `ThemeToggle` muestra sol, luna y un icono de sistema, y el ciclo pasa por los
tres.

**Tres. El parpadeo se elimina desde el HTML.** Este es el detalle fino del commit. En
`index.html` hay un pequeño guion que corre **antes de que se pinte nada**:

```html
<script>
  // Lee el tema antes del primer pintado: si se hiciera en React, la pantalla
  // aparecería un instante en claro y luego saltaría a oscuro.
</script>
```

Es la solución estándar al problema, y solo funciona si el script está en el `<head>` y
se ejecuta de forma síncrona. Está en
[Modo claro y oscuro](11-modo-oscuro.md).

### Qué queda vivo

Sí, los 18 archivos.

## 18. `48518ad` — Estiliza las barras de desplazamiento con la paleta SENA

**Fecha:** 1 de octubre · **Autor:** steven-leon

### Qué cambió

3 archivos, 58 líneas añadidas: `index.css` (57 líneas), `Sidebar.jsx` y
`AppLayout.jsx` (una línea cada uno).

### Por qué

Las barras de desplazamiento por defecto del sistema son grises, y en una aplicación
verde con fondo azul oscuro rompen el conjunto. Además, cuando se puso el modo oscuro,
las barras seguían siendo claras: era un detalle que se veía de inmediato.

### Qué decisiones lo afectan

Dos, y ambas están en `index.css`:

| Decisión | Detalle |
|---|---|
| Estilizar los dos tipos de barra | `::-webkit-scrollbar` y `scrollbar-color`, que es el estándar |
| Definir el color claro y el oscuro con variables | Para que cambie con el tema |

### Qué queda vivo

Sí.

## 19. `ef183f5` — Elimina la clase `dark` duplicada en el formulario de registro

**Fecha:** 1 de octubre · **Autor:** steven-leon

### Qué cambió

Un archivo, **una línea**:

```diff
- className="... dark:text-sena-texto dark:text-sena-texto"
+ className="... dark:text-sena-texto"
```

### Por qué

Es el commit más pequeño del proyecto, y está aquí por una razón concreta: la clase
`dark` estaba **puesta dos veces** en el mismo atributo. Cuando se aplicó el modo oscuro con
un bloque de código, es fácil que una clase quede duplicada. No rompía nada —la segunda
copia hacía lo mismo que la primera— pero se veía.

### Qué afecta

Nada funcional. Es limpieza.

### Qué queda vivo

Sí, el archivo. El valor de este commit es otro: es el ejemplo de que un commit puede
ser de una línea, y aun así tener sentido.

## 20. `97b0d8c` — Neutraliza el mensaje de error de conexión

**Fecha:** 1 de octubre · **Autor:** steven-leon

### Qué cambió

2 archivos, 3 líneas:

| Archivo | Antes | Después |
|---|---|---|
| `src/api/mensajeError.js` | "No se pudo conectar con el servidor. **Revisa que el backend esté corriendo.**" | "No pudimos conectarnos. Inténtalo de nuevo en un momento." |
| `src/auth/AuthContext.jsx` | "No se pudo contactar al servidor. **Revisa que esté corriendo.**" | "No pudimos conectarnos. Inténtalo de nuevo en un momento." |

### Por qué

El mensaje anterior le estaba **hablando al desarrollador**, no a la persona. Decirle a
alguien que "revise que el backend esté corriendo" es:

- Inútil para quien está usando la aplicación y no tiene acceso al servidor.
- Un manual de resolución de problemas en medio de la interfaz.

El mensaje nuevo dice lo mismo sin presuponer quién lo lee. Y como además el proyecto
tiene un capítulo de
[Solución de problemas](21-solucion-de-problemas.md), esa información está donde
corresponde.

### Qué afecta

Dos pantallas: la de error de red de `ProtectedRoute`, y cualquier pantalla que pinte un
error de conexión.

### Detalle que se corrigió de paso

El mismo commit arregla un comentario con una palabra pegada:

```diff
-// 422 por campo, para paintedarlo en el input que corresponde.
+// 422 por campo, para pintarlo en el input que corresponde.
```

### Qué queda vivo

Sí.

## 21. `0ec54ed` — Elimina el código muerto de la plantilla de Vite

**Fecha:** 1 de octubre · **Autor:** steven-leon

### Qué cambió

5 archivos, **195 líneas borradas y 0 añadidas**:

| Archivo | Qué se borró |
|---|---|
| `src/App.css` | 184 líneas. Los estilos de la pantalla de ejemplo |
| `src/App.jsx` | 9 líneas. El componente entero |
| `src/assets/hero.png` | 13 KB de imagen |
| `src/assets/react.svg` | El logotipo de React |
| `src/assets/vite.svg` | El logotipo de Vite |

Y este era el contenido de `App.jsx`:

```jsx
export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-900">
      <h1 className="text-4xl font-bold text-white">
        Tailwind funcionando ✅
      </h1>
    </div>
  )
}
```

### Por qué

Ese mensaje se ve desde el **commit 2**. Llevaba un mes en el repositorio, en un archivo
que nadie abría, pero que seguía ahí. Es el resto de la plantilla de Vite.

Borrarlo cierra el ciclo: el proyecto entró con una pantalla de ejemplo de Vite y
termina sin ella.

### Qué afectada

Nada, porque nada lo usaba. El borrado es seguro porque estos archivos no aparecen en
ningún `import`. Es un commit que solo quita.

### Qué queda vivo

Nada de este commit. Es el último: el proyecto queda limpio de restos de la plantilla.

---

## Lo que cuenta la historia completa

Leídos en orden, los 21 commits cuentan cuatro cosas:

### 1. El proyecto nació dos veces

La primera vez, en el pull request #1, con la estructura de Yuly. La segunda, con la
base técnica y el trabajo de steven-leon. El commit 5 es esa segunda partida.

### 2. Hubo un rebase y se perdió trabajo

Cinco commits se hicieron sobre una base equivocada y hubo que rehacerlos. Tres de ellos
—la paleta SENA, la identidad visual y los formularios— eran buen trabajo, y aun así se
tiraron. Lo único que se conserva es la rama `backup/antes-de-rebase`, por si acaso.

### 3. El momento que define la arquitectura es el commit 11

Antes del 11, la autenticación usaba un token. A partir del 11, usa una cookie de
Sanctum, y eso trajo el CSRF, el `otpSesion.js`, los dos flujos de código y el evento
`auth:expirada`. Todo lo que el proyecto comunica con el backend se decidió ahí.

### 4. Los últimos siete commits son pulido

Del 15 al 21 ya no hay arquitectura. Hay correcciones: un archivo que sobraba tras el
rebase, los permisos que se veían en pantalla, el menú que no se podía desplazar, el
modo oscuro, las barras de desplazamiento, una clase duplicada, un mensaje de error que
hablaba al desarrollador y 195 líneas muertas de la plantilla.

Y hay una diferencia de tamaño que dice algo: **el commit 11 tiene 838 líneas y el
commit 19 tiene una**. Un buen historial no es solo un historial grande.

---

## Cómo mirar el historial por tu cuenta

```bash
git log --oneline                      # la lista corta
git log --stat                         # con los ficheros de cada commit
git show 47a34da                       # un commit concreto, con su diff
git show 227f0a0                       # ver la versión original de un commit rehecho
git diff 47a34da 227f0a0               # en qué se diferencian las dos versiones
git branch -a                          # ver las tres ramas
```

Para comparar la versión original con la rehecha de un commit del grupo C, el truco es
que los dos tienen el **mismo mensaje**: se busca el rehecho en la rama actual, se saca
el hash de la original en la rama de reserva, y se comparan con `git diff`.
