# HISTORIA DEL PROYECTO, COMMIT POR COMMIT
# SPGTH — Simulador de Procesos de Gestión de Talento Humano (Frontend)

> Este documento cuenta **todo lo que le pasó a este repositorio desde el primer
> commit**, un commit a la vez, explicado desde cero.

---

## Antes de empezar: dos documentos, dos propósitos

| Documento | Responde a | Cómo se lee |
|---|---|---|
| `DOCUMENTACION_DETALLADA.md` | **¿Cómo está el proyecto HOY?** | Capítulos por tema: arquitectura, autenticación, colores, rutas, despliegue. |
| `HISTORIA_DEL_PROYECTO.md` (este) | **¿Cómo LLEGAMOS aquí?** | Commit por commit, en orden cronológico, con el antes y el después. |

Si quieres entender **cómo funciona** algo, mira `DOCUMENTACION_DETALLADA.md`.
Si quieres entender **por qué está así**, o qué se intentó antes y por qué se descartó,
sigue leyendo esto.

> Este archivo es de consulta local. **No se sube nunca a GitHub.**

---

## Índice

- [0. Cómo leer el historial de Git (desde cero)](#0-cómo-leer-el-historial-de-git-desde-cero)
- [1. Mapa de las tres líneas de historia](#1-mapa-de-las-tres-líneas-de-historia)
- [2. Fase 1 — `main`: el proyecto nace (4 commits)](#2-fase-1--main-el-proyecto-nace-4-commits)
- [3. Fase 2 — La rama huérfana: el trabajo que se perdió (6 commits)](#3-fase-2--la-rama-huérfana-el-trabajo-que-se-perdió-6-commits)
- [4. Fase 3 — La rama actual: el renacimiento (11 commits)](#4-fase-3--la-rama-actual-el-renacimiento-11-commits)
- [5. Comparación: `main` de ayer contra hoy](#5-comparación-main-de-ayer-contra-hoy)
- [6. Línea de tiempo](#6-línea-de-tiempo)
- [7. Qué NO está en Git](#7-qué-no-está-en-git)
- [8. Glosario de Git](#8-glosario-de-git)

---

## 0. Cómo leer el historial de Git (desde cero)

Si nunca has usado Git, esta sección te sirve. Si ya lo conoces, sáltala.

### 0.1 ¿Qué es un repositorio?

Es una carpeta que **Git vigila**. Cada vez que guardas, Git anota exactamente qué
archivos cambiaron. Eso permite volver a cualquier momento anterior, ver quién cambió
qué, y trabajar sin miedo de romper nada.

### 0.2 ¿Qué es un commit?

Un commit es **una foto del proyecto** en un instante, con una nota que explica qué se
hizo. Piénsalo así:

```text
commit = foto + nota
```

Si sumas las fotos en orden, obtienes la historia completa. Por eso Git guarda cada
commit "diferente" del anterior en vez de copias enteras: es más rápido y ocupa menos.

### 0.3 ¿Qué es un hash?

Cada commit recibe un **código corto de 7 caracteres** que lo identifica para siempre,
como un número de documento. Ejemplos de este repo: `154b597`, `47a34da`, `0ec54ed`.

El hash **cambia si cambias una sola coma** del mensaje, aunque el código sea idéntico.
Por eso dos commits con el mismo contenido pueden tener hashes distintos.

### 0.4 ¿Qué es una rama?

Una rama es **una línea de commits independiente**. Permite trabajar en una idea sin
tocar lo que ya está estable.

Cuando terminas y la cosa funciona, **fusionas** (merge) tu rama con la principal y las
dos historias se juntan.

### 0.5 Los prefijos de los mensajes

En este repo los commits se escriben con un prefijo estándar:

| Prefijo | Significa | Ejemplo |
|---|---|---|
| `feat:` | **Función nueva.** Añadí algo que antes no existía. | `feat: anade modo oscuro` |
| `fix:` | **Corrección.** Arreglé algo que estaba mal. | `fix: neutraliza el mensaje de error` |
| `chore:` | **Tarea de mantenimiento.** Cambios que no son funciones ni arreglos: borrar código muerto, actualizar configuración. | `chore: elimina el codigo muerto` |
| `docs:` | Documentación. | — |
| `style:` | Formato, sin cambiar el comportamiento. | — |

También se usa el término `Merge pull request` para las fusiones.

### 0.6 Comandos útiles para verificar lo que se cuenta aquí

```bash
git log --oneline --all                  # toda la historia, una línea por commit
git show <hash>                          # qué cambió exactamente en ese commit
git show <hash> --stat                   # solo la lista de archivos y el tamaño del cambio
git branch -a                            # qué ramas existen
git diff <hashA> <hashB>                 # diferencia entre dos puntos
```

---

## 1. Mapa de las tres líneas de historia

Antes de entrar en los commits, este mapa. Dice **de dónde viene cada cosa** y por qué
existen dos carpetas de trabajo distintas.

```text
                          ┌─────────────────────────────────────────┐
                          │  FASE 2 — Rama huérfana (descartada)     │
                          │  NO tiene ancestro común con main       │
                          └─────────────────────────────────────────┘

 154b597  e391b4a  7d189b0    e787db0
    │        │        │          │                              ┌──────────────────────┐
    ▼        ▼        ▼          ▼                              │ 2d3dcc3  (su propia  │
 ┌────────────────────────┐  ┌──────────────────┐               │  raíz, sin padre)    │
 │  FASE 1 — main         │  │  Merge PR #1     │               └──────────────────────┘
 │  (autor: yulycita)     │  └──────────────────┘                     │
 └────────────────────────┘            │                            ▼
             │                        │              cb4b3b0 → ec4dc08 → 25d4d3a
             │                        │                     → f5151b1 → 227f0a0
             │                        │                                       │
             │                        │                        rama: backup/antes-de-rebase
             │                        │                        tag:  respaldo-227f0a0
             │                        │                                       │
             └────────────────────────┴───────────────────────────────────────┘
                                              │
                                              ▼  (se reaplica encima de e787db0)
                                   47a34da → c2eeada → 2880345 → e22ce52
                                   → 73200ad → 2784657 → 747f360 → 48518ad
                                   → ef183f5 → 97b0d8c → 0ec54ed
                                              │
                                              ▼
                            ┌─────────────────────────────────┐
                            │  FASE 3 — Rama actual (publicada)│
                            │  feature/branding-sena          │
                            │  = 0ec54ed                      │
                            └─────────────────────────────────┘
```

### Qué significa este mapa

1. **Fase 1** — El proyecto se creó en `main`, con el trabajo de `yulycita`.
2. **Fase 2** — Alguien (tú) empezó a trabajar en una copia que **no estaba conectada**
   a `main`. En Git, una historia así se llama **rama huérfana**, y ocurre cuando se crea
   un repositorio nuevo en vez de hacer una rama desde `main`.
3. **Fase 3** — Se reaplicó todo ese trabajo encima de `main`. Este es el resultado que
   existe hoy y que está en GitHub.

### Las tres ramas que existen ahora mismo

| Rama | Apunta a | Qué es |
|---|---|---|
| `main` | `e787db0` | La versión estable oficial. **Intocable sin revisión.** |
| `develop` | `e787db0` | Idéntica a `main` (0 commits de diferencia). |
| `feature/branding-sena` | `0ec54ed` | **Todo el trabajo de la identidad SENA.** Lo que se está desarrollando. |
| `backup/antes-de-rebase` | `227f0a0` | Copia de seguridad **solo en tu máquina**. Conserva la rama huérfana. |
| `respaldo-227f0a0` | `227f0a0` | *Tag*, es decir una etiqueta permanente en ese punto exacto. |

> `main` y `develop` apuntan al mismo sitio: hoy no hay trabajo pendiente de integrar.

---

## 2. Fase 1 — `main`: el proyecto nace (4 commits)

Autor de esta fase: **yulycita / Yuly Patricia Toro Maseto**.
Fechas: 29 y 30 de septiembre de 2026.

### 2.1 `154b597` — Initial commit

```text
Autor: yulycita
Fecha: 2026-09-29
Mensaje: Initial commit
Archivos: README.md  (solo uno)
```

**Qué se hizo:** nada más que empezar el repositorio. El único archivo es un `README.md`.

**Dato curioso y útil:** el commit tiene el mensaje "Initial commit", que es el que Git
pone automáticamente cuando creas un repositorio vacío. Y **el archivo que contiene es
un único `README.md`**. Es un commit casi vacío a propósito: la costumbre es crear el
repositorio primero y meter el código después.

### 2.2 `e391b4a` — Agregando estructura inicial del proyecto Vite y React

```text
Autor: yulycita
Fecha: 2026-09-29
Mensaje: Agregando estructura inicial del proyecto Vite y React
Archivos: 13 archivos nuevos, 2.698 líneas
```

**Qué se hizo:** se creó el proyecto con la herramienta oficial `npm create vite@latest`.
Eso descarga una plantilla lista para usar. Lo que llegó:

| Archivo | Líneas | Qué es |
|---|---|---|
| `package-lock.json` | 2.299 | Las versiones **exactas** de cada librería instalada. Es el archivo más grande y es normal. |
| `src/App.css` | 184 | **Estilos de demostración** de la plantilla, con colores morados de ejemplo. |
| `src/App.jsx` | 122 | **Pantalla de demostración** de la plantilla. |
| `src/index.css` | 111 | Hoja de estilos de demostración, con variables como `--accent: #aa3bff` (morado). |
| `package.json` | 27 | Lista de dependencias y scripts. |
| `.gitignore` | 24 | Qué archivos no subir. |
| `.oxlintrc.json` | 8 | Configuración del revisor de código. |
| `index.html` | 13 | La página base. |
| `src/main.jsx` | 10 | Punto de entrada: monta React. |
| `vite.config.js` | 7 | Configuración de Vite. |
| `public/favicon.svg`, `public/icons.svg` | 1 + 24 | Íconos de ejemplo. |
| `src/assets/react.svg`, `src/assets/vite.svg` | 1 + 1 | Logotipos de ejemplo. |

**La idea para principiantes:** cuando creas un proyecto con una plantilla, trae **archivos
de ejemplo que hay que borrar**. Nadie los va a usar. Los morados y los logos de React y
Vite son relleno.

### 2.3 `7d189b0` — feat: estructura del frontend con login, sesión y menú lateral por permisos

```text
Autor: yulycita
Fecha: 2026-09-29
Mensaje: feat: estructura del frontend con login, sesión y menú lateral por permisos
Archivos: 47 archivos, +1.319 / -119 líneas
```

**Este es el commit más importante de la fase 1.** Aquí la plantilla de demostración se
convierte en una aplicación real. Se borraron los ejemplos y se construyó el esqueleto.

#### Lo que se borró (los restos de la plantilla)

| Archivo | Cambio | Por qué |
|---|---|---|
| `src/App.jsx` | 122 → 9 líneas | Se reemplazó la demo por una prueba mínima de Tailwind. |
| `src/index.css` | 111 → 1 línea | Los estilos morados de ejemplo se sustituyeron por una sola línea: `@import "tailwindcss";`. |
| `src/App.css` | **184 líneas, sin tocar** | **Este es el error que años después costó un commit de limpieza.** Ese archivo ya no se usaba desde este commit, pero se quedó en el repo. |
| `src/assets/react.svg`, `vite.svg` | sin tocar | Logotipos de ejemplo que quedaron huérfanos. |

#### Lo que se construyó

**La capa de red (`src/api/`)**

- `client.js` (34 líneas): creó el cliente de Axios. Lo más importante: **guardaba el
  token de acceso en el navegador**.

  ```js
  // Antes de cada petición: si hay token guardado, lo agrega
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
  ```

  Y en cada `401` (sesión no válida) **borraba el token y recargaba la página entera**
  llevándola a `/login` con `window.location.href`.

- `auth.js` (17 líneas), `mensajeError.js` (20 líneas).

**La capa de sesión (`src/auth/`)**

- `AuthContext.jsx` (89 líneas): guardaba **dos cosas en el navegador**:
  `localStorage.setItem('token', token)` y `localStorage.setItem('user', ...)`.
  Al arrancar, leía esas dos cosas y por eso la sesión sobrevivía al recargar.
- `useAuth.js` (20 líneas), `ProtectedRoute.jsx` (17 líneas),
  `PermissionRoute.jsx` (16 líneas).

**Los componentes (`src/components/`)**

`Sidebar.jsx` (32), `SidebarItem.jsx` (48), `Topbar.jsx` (81),
`ui/PaginaVacia.jsx` (11).

**Los layouts (`src/layouts/`)**

`AppLayout.jsx` (19) para las pantallas internas, `AuthLayout.jsx` (27) para el login.

**El menú con permisos (`src/config/menu.js`, 52 líneas)**

Lista de opciones con el permiso que cada una exige. Es el archivo que hoy sigue
organizando el menú lateral.

**Las 18 pantallas de los módulos**

Cada módulo con su archivo, y cada archivo con 5 líneas: importan `PaginaVacia` y
muestran el título. Estaban **previstas pero sin construir**:

`dashboard`, `convocatorias` (2), `documentos` (3), `evaluacion` (2), `seleccion` (2),
`usuarios`, `reportes`, `supervision`, y las 4 del aspirante.

Y dos páginas de error: `NotFound.jsx` (404) y `Forbidden.jsx` (403).

**El login (`src/pages/login/`)**

- `Login.jsx` (96 líneas) y `Registro.jsx` (99 líneas).
- **`GoogleCallback.jsx` (58 líneas)**: una página *entera* dedicada a recibir la respuesta
  de Google. Leía el token de la dirección:

  ```js
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
  ```

  Necesitaba además un candado (`useRef`) porque en desarrollo React ejecuta los efectos
  dos veces y sin eso se habría procesado el token duplicado.
- `router.jsx` (105 líneas) con todas las rutas.

#### Lo que este commit NO tenía

Faltaban dos pantallas enteras, que se añadieron después en la fase 3:

- `RecuperarContrasena.jsx` (recuperar contraseña)
- `VerificarCorreo.jsx` (verificación del correo con código)

**Lección de este commit:** enseñó dos cosas que después hubo que corregir. Primero, que
guardar el token en el navegador es frágil. Segundo, que borrar archivos de la plantilla
hay que **comprobarlo después**: `App.css` y los logos se quedaron olvidados.

### 2.4 `e787db0` — Merge pull request #1

```text
Autor: Yuly Patricia Toro Maseto
Fecha: 2026-09-30
Mensaje: Merge pull request #1 from SPGTH-2026/feature/primera-vista-login
```

**Qué es un *pull request*?** Es una petición de «¿puedo incorporar mi trabajo?».
Se crea una rama, se trabaja en ella, y se pide revisión antes de mezclarla.

**Qué hizo este commit:** una *fusión*. Tomó el trabajo de la rama
`feature/primera-vista-login` y lo incorporó a `main`. Cuando Git muestra el detalle de
una fusión, lista todos los archivos como si fueran nuevos: es un efecto de cómo se
calcula la comparación, **no** significa que se haya vuelto a añadir todo.

**Por qué importa `e787db0`:** es el punto exacto donde la rama actual se apoya. Todas las
ramas nuevas salen de aquí. Por eso `main` y `develop` están hoy exactamente en este
commit, y por eso la fase 3 empieza con la historia oficial apoyada en él.

---

## 3. Fase 2 — La rama huérfana: el trabajo que se perdió (6 commits)

Autor: **steven-leon** (tú). Fecha: 30 de septiembre de 2026.

### 3.1 Qué es una rama huérfana

Una rama huérfana es una historia de commits que **no tiene ningún ancestro en común**
con `main`. Se reconoce porque el comando que busca el ancestro común no devuelve nada:

```bash
git merge-base main 227f0a0
# (no devuelve nada: no hay base común)
```

**Cómo se cuela una por accidente:** se copia la carpeta del proyecto a otro sitio, se
inicializa Git ahí (`git init`), o se importa el proyecto como repositorio nuevo. En
cualquiera de los dos casos Git no sabe que el proyecto ya existía.

Consecuencia práctica: **el trabajo se guarda en dos sitios que Git no puede comparar.**
Cuando quieras unir ambas historias, Git te pide decidir archivo por archivo, a mano.

### 3.2 `2d3dcc3` — chore: base de React 19 con Vite 8, Tailwind 4 y oxlint

```text
Autor: steven-leon      Fecha: 2026-09-30
Archivos: 14 archivos nuevos, 2.603 líneas
```

**Este es la raíz de la rama huérfana.** No tiene padre: es el primer commit de esa
historia, creado desde cero.

Creó la base del proyecto con las versiones más recientes del momento:

| Paquete | Versión |
|---|---|
| React | `^19.2.8` |
| Vite | `^8.3.0` |
| Tailwind CSS | `^4.3.3` |
| Oxlint | `^1.81.0` |
| `@vitejs/plugin-react` | `^6.1.1` |

Trajo también los archivos de ejemplo otra vez: `App.css` (184 líneas), `App.jsx` (9
líneas: "Tailwind funcionando ✅"), `react.svg` y `vite.svg`.

> **Detalle que explica la historia:** la base de esta rama era **más limpia** que la de
> `main`. Su `App.jsx` tenía 9 líneas en vez de 122, y su `index.css` una línea en vez de
> 111. Por eso, después de fusionar, el proyecto terminó con el `App.css` de 184 líneas:
> venía de la plantilla de `main`, y el archivo "limpio" de la rama huérfana se descartó
> al resolver la fusión.

### 3.3 `cb4b3b0` — feat: autenticacion por sesion con cookie de Laravel Sanctum

```text
Archivos: 23 archivos nuevos, 1.288 líneas
```

**El cambio de fondo: se abandonó el token en el navegador.**

| | Antes (`main`) | Ahora (esta rama) |
|---|---|---|
| Dónde se guarda la sesión | `localStorage` (JavaScript puede leerlo) | Cookie `HttpOnly` (JavaScript **no** puede leerla) |
| Cómo se viaja | `Authorization: Bearer <token>` en cada petición | La cookie viaja sola |
| Protección CSRF | No había | Cookie `XSRF-TOKEN` + cabecera obligatoria |
| Sesión caducada | Recarga forzada con `window.location.href` | Un evento y React actualiza la pantalla |
| Google | Página aparte `GoogleCallback.jsx` | Ya no hace falta: la cookie ya está |
| Verificación de correo | No existía | Nuevas pantallas y rutas |

**Archivos creados:** `api/client.js` (95), `api/auth.js` (35),
`api/mensajeError.js` (57), `api/reintento.js` (19), `auth/AuthContext.jsx` (88),
`auth/PermissionRoute.jsx` (16), `auth/ProtectedRoute.jsx` (28), `auth/useAuth.js` (20),
`lib/otpSesion.js` (55), `lib/useCuentaAtras.js` (20), `router.jsx` (112) y las
pantallas de `Login`, `Registro`, `RecuperarContrasena` (282) y `VerificarCorreo` (163).

**Sobre `GoogleCallback.jsx`:** en `main` esa página existía porque el token volvía en la
dirección y había que recogerlo. Con cookie de sesión **el problema desaparece**: al
volver de Google, la cookie ya está puesta, así que la app solo pregunta "¿quién soy?".
Ese archivo se convirtió en código muerto.

### 3.4 `ec4dc08` — feat: modulos de convocatorias, documentos, evaluacion, seleccion y usuarios

```text
Archivos: 21 archivos nuevos, 126 líneas
```

Creó `config/menu.js` (52 líneas, el menú con permisos) y las 20 pantallas de los
módulos, cada una con 5 líneas.

> **Este commit está en la historia local pero no en la rama actual.** Al reaplicar el
> trabajo sobre `main`, todo esto ya existía allí (lo había creado `7d189b0`), así que Git
> lo descartó por redundante. Por eso en la rama actual no hay ningún commit "de módulos":
> no hizo falta.

### 3.5 `25d4d3a` — feat: paleta institucional SENA en la pantalla de login

```text
Archivos: 4 archivos, +71 / -22 líneas
```

**El primer toque de identidad institucional.** Se define la paleta SENA como variables
de Tailwind, de modo que cada color genera clases usables en toda la app:

```css
@theme {
  --color-sena: #39a900;        /* Verde institucional */
  --color-sena-oscuro: #007832; /* Verde oscuro */
  --color-sena-azul: #00304d;   /* Azul oscuro */
  --color-sena-violeta: #71277a;
  --color-sena-amarillo: #fdc300;
  --color-sena-cielo: #50e5f9;
}
```

Y se aplicó a la tarjeta del login y al propio formulario: el botón azul
(`bg-blue-600`) pasó a verde institucional, los campos con borde azul, el fondo de la
tarjeta con un azul claro, y el título con azul oscuro.

**Antes → después en `Login.jsx`:** de `<h2 className="text-xl font-semibold">` a
`<h2 className="text-xl font-semibold text-sena-azul">`.

### 3.6 `f5151b1` — feat: incorpora la identidad visual institucional SENA

```text
Archivos: 8 archivos, +108 / -32 líneas
```

La identidad visual completa:

- **`public/logo-sena.svg`** (nuevo): el logosímbolo del SENA.
- **`src/components/ui/LogoSena.jsx`** (nuevo, 24 líneas): componente que lo pinta con
  `mask-image`, una técnica que permite colorear un SVG con `currentColor` y así usarlo
  en cualquier color.
- **`public/favicon.svg`**: el ícono de la pestaña pasó a ser el del SENA.
- **`src/index.css`**: se añadió `--font-sans` con **Work Sans**, la tipografía
  institucional, más una lista de fuentes alternativas por si el navegador no puede
  bajarla.
- **`src/components/Sidebar.jsx`**: el logosímbolo entró al menú lateral a 52 px.

> **Ese tamaño no es arbitrario.** El Manual de Identidad Visual exige un mínimo de
> 50 px, y se eligió 52 para no deformar la geometría original del dibujo.

### 3.7 `227f0a0` — feat: armoniza los formularios publicos con la paleta SENA

```text
Archivos: 3 archivos, +36 / -44 líneas
```

Último commit de la historia huérfana. Dio a los otros tres formularios el mismo aspecto
que el login, para que no se vieran distintos entre sí:

- **`RecuperarContrasena.jsx`**: +18 / -22 líneas.
- **`Registro.jsx`**: +11 / -11 líneas (un cambio equilibrado: se cambiaron clases de
  una en una).
- **`VerificarCorreo.jsx`**: +7 / -11 líneas.

Este commit quedó **etiquetado** como `respaldo-227f0a0` y es la punta de la rama
`backup/antes-de-rebase`.

### 3.8 El problema y la solución: el *rebase*

**El problema.** Aunque la rama huérfana tenía todo el trabajo bueno, al ser una historia
sin conexión con `main`:

- GitHub mostraba dos historias sin relación, sin ningún punto de unión.
- No se podía hacer *pull request* ni *merge*: Git no encontraba el punto de unión.
- Cualquier cambio nuevo en `main` (por ejemplo, un arreglo de seguridad) no llegaba a
  esta rama, y al revés.

**Qué es un rebase.** Es "recoger cada commit y volver a aplicarlo encima de otra base".
No copia los commits: **vuelve a crearlos** uno por uno sobre el nuevo punto de partida.
Por eso los hashes cambian: el commit `cb4b3b0` reaplicado sobre `main` se convirtió en
`47a34da`. El contenido es el mismo; la identidad es nueva.

**El plan que se siguió:**

| Paso | Qué se hizo |
|---|---|
| 1 | Crear `backup/antes-de-rebase` apuntando a `227f0a0` para poder volver atrás. |
| 2 | Crear el tag `respaldo-227f0a0` como marca permanente. |
| 3 | Reaplicar los commits sobre `e787db0` en orden: auth, paleta, identidad, formularios. |
| 4 | El commit de módulos se descartó: ya existía en `main`. |
| 5 | Resultado: una historia de 4 commits, **apoyada en `main`**, sin repetir lo que `main` ya tenía. |

**La consecuencia que se olvidó prever:** al reaplicar encima de `main`, como `main`
tenía archivos que la rama huérfana nunca tocó, esos archivos **sobrevivieron** dentro de
la rama. Concretamente:

- `GoogleCallback.jsx` volvió a existir, aunque ya no servía para nada.
- `.gitignore` venía de `main` y **no ignoraba `.env`**.
- `.env.example` no existía en la rama (solo en la huérfana).

Nada roto, pero eran tres cosas que faltaban. Se arreglaron en el commit `73200ad`
(Fase 3).

**El push fue forzado.** Como el rebase reemplaza la historia, `git push` normal es
rechazado por GitHub. Se usó `git push --force-with-lease`, que sobrescribe el remoto
pero **solo si nadie más subió nada** mientras tanto. Esa variante es la segura: si
alguien hubiera enviado commits, se negaría.

---

## 4. Fase 3 — La rama actual: el renacimiento (11 commits)

Rama: `feature/branding-sena`, publicada en GitHub.
Todos los commits de esta fase son de **steven-leon**, del 30 de septiembre al 1 de
octubre de 2026.

> **Cómo leer el mapa de correspondencia:** 4 de los 6 commits de la rama huérfana
> reaparecen aquí con hash nuevo, porque el rebase los recreó.
>
> | Rama huérfana | Rama actual |
> |---|---|
> | `cb4b3b0` autenticación Sanctum | → `47a34da` |
> | `ec4dc08` módulos | → *descartado* (ya existía en `main`) |
> | `25d4d3a` paleta SENA en login | → `c2eeada` |
> | `f5151b1` identidad visual SENA | → `2880345` |
> | `227f0a0` armonizar formularios | → `e22ce52` |
>
> Los 7 commits restantes son trabajo nuevo hecho ya sobre la base correcta.

### 4.1 `47a34da` — feat: autenticacion por sesion con cookie de Laravel Sanctum

```text
Fecha: 2026-09-30 22:42
Archivos: 14 archivos, +838 / -110 líneas
Viene de la rama huérfana: cb4b3b0
```

**El commit más grande de toda la rama actual.** Es la traducción de la autenticación por
token a la de cookies, más dos pantallas nuevas enteras.

#### `src/api/client.js` — la pieza clave (+77 / -16)

Aquí está casi toda la diferencia técnica:

```js
// 1. Se separa la URL del CSRF: /sanctum/csrf-cookie NO vive bajo /api
const CSRF_URL = import.meta.env.VITE_CSRF_URL ?? 'http://localhost:8000/sanctum/csrf-cookie'

// 2. La sesión viaja en cookie HttpOnly: hay que decirlo explícitamente
withCredentials: true

// 3. Se apaga el manejo automático de CSRF de Axios
xsrfCookieName: null
```

**Sobre el punto 3:** Axios puede poner la cabecera CSRF por su cuenta, pero se desactivó
a propósito, porque la versión instalada puede mandarla con un formato distinto al que
Laravel espera. Al hacerlo a mano se controla el `decodeURIComponent`, que **Laravel exige
sí o sí** (el backend responde `419` si falta):

```js
// La cookie llega URL-encoded y el backend hace decrypt() del header:
// sin decodificar, Laravel responde 419.
valor = decodeURIComponent(token)
```

**Un detalle fino que evita muchos bugs:** las escrituras (`post`, `put`, `patch`,
`delete`) comparten una única petición de cookie CSRF. Si se pulsara "Enviar" cinco
veces, las cinco esperan **la misma promesa** en vez de pedir la cookie cinco veces.

**Y el cambio de comportamiento más importante:**

```js
// ANTES: recargaba toda la página
localStorage.removeItem('token')
window.location.href = '/login'

// AHORA: avisa, y React reacciona
window.dispatchEvent(new Event('auth:expirada'))
```

Además se añadió una distinción que evita un fallo muy molesto: **solo un `401` que trae
respuesta significa sesión perdida.** Si no hay respuesta, es que el backend está
apagado, y en ese caso **no se cierra la sesión del usuario**. Antes, un backend caído
cerraba la sesión y echaba a la gente.

#### `src/auth/AuthContext.jsx` — el estado de sesión (+53 / -54)

| Antes | Ahora |
|---|---|
| `loading` (¿estoy cargando el token?) | `authResolved` (¿ya sé quién es el usuario?) |
| — | `errorRed` (el backend no responde) |
| `loginConToken` (para Google) | **eliminado** |
| — | `refrescar()` (vuelve a pedir el usuario) |

Se eliminó todo lo que tocaba `localStorage`. Al arrancar, la única forma de saber quién
es el usuario es preguntar `me()`. Se añadió una protección contra el caso en que la
petición termina **después** de que el componente se haya desmontado:

```js
let vivo = true
// ...
.catch((error) => { if (!vivo) return ... })
return () => { vivo = false }
```

#### `src/auth/ProtectedRoute.jsx` — el filtro del correo verificado (+14 / -3)

```js
// El correo sin confirmar solo puede estar en /verificar-correo.
if (!user.email_verified && location.pathname !== '/verificar-correo') {
  return <Navigate to="/verificar-correo" replace />
}
```

#### `src/router.jsx` — dos rutas nuevas (+9 / -2)

| Ruta | Dónde vive | Por qué ahí |
|---|---|---|
| `/recuperar` | dentro de `AuthLayout` | Es pública: se entra sin sesión. |
| `/verificar-correo` | dentro de `ProtectedRoute` pero **fuera** de `AppLayout` | Requiere sesión, pero **no** el menú lateral. Si compartiera layout con las rutas de negocio, el guard de `email_verified` devolvería al usuario a la misma página en un bucle infinito. |

#### `src/components/ui/TarjetaAuth.jsx` — nuevo (14 líneas)

Un marco centrado con el título "SPGTH" que estaba **copiado dentro** de `AuthLayout`.
Se extrajo a un componente propio para que las cuatro pantallas públicas lo reutilicen.
Este refactor es la razón por la que los commits de marca (`c2eeada`, `2880345`) pudieron
pintar las cuatro pantallas tocando un solo archivo.

#### `src/lib/otpSesion.js` — nuevo (55 líneas)

El código de un solo uso (OTP) dura 10 minutos. Cada envío **invalida el anterior**, y
hay límite de 3 por minuto y 10 por hora. Eso significa que un F5 (recargar) podría
quedarte sin poder entrar. La solución: guardar en `sessionStorage` qué pantalla ya tiene
un código vigente, para no pedir otro.

Se usa `sessionStorage` y no `localStorage` a propósito: el registro debe **morir al
cerrar la pestaña**. Un código de un solo uso no debería sobrevivir a la sesión de trabajo.

También trae `enmascararEmail()`: en vez de mostrar `juan.perez@sena.edu.co` entero, muestra
`ju***@sena.edu.co`.

#### `src/lib/useCuentaAtras.js` — nuevo (20 líneas)

Cuando el backend responde `429` (demasiados intentos), trae una cabecera `Retry-After`
con los segundos exactos. Este hook la convierte en una cuenta atrás en el botón.

#### `src/pages/login/RecuperarContrasena.jsx` — nuevo (282 líneas)

Pantalla de dos pasos: pides el código, luego lo pones con la contraseña nueva.

- **Anti-enumeración:** el backend responde **igual** exista o no el correo. Por eso la
  pantalla avanza siempre al paso 2 sin comprobar nada. Si te dijera "ese correo no
  existe", alguien podría averiguar qué correos están registrados.
- El botón de reenviar está **bloqueado** con cuenta atrás.
- Si restableces la contraseña, el backend cierra **todas** las sesiones, así que siempre
  se vuelve a `/login`.
- La regla de la contraseña (8 caracteres, con letras y números) se comprueba **en el
  navegador antes de enviar**, para no gastar la petición.

#### `src/pages/login/VerificarCorreo.jsx` — nuevo (163 líneas)

- Al entrar, **pide el código sola** (salvo que ya haya uno vigente).
- Tiene un candado (`useRef`) porque en desarrollo React ejecuta los efectos **dos
  veces**, y sin eso se pediría el código dos veces de golpe, gastando el límite.
- **Un detalle que evita un bucle infinito:** tras confirmar el código hay que llamar a
  `refrescar()` para traer el usuario actualizado con `email_verified = true`. Sin eso,
  `ProtectedRoute` devolvería al usuario a esta misma página para siempre.

#### `src/pages/login/Login.jsx` (+43 / -8)

- Se eliminó el `<GoogleCallback />` del formulario.
- Se leyeron dos parámetros de la dirección con `useSearchParams`: `?error=` (vuelve mal de
  Google) y `?contrasena=` (contraseña restablecida con éxito). Antes eso lo manejaba la
  página aparte.
- Se añadió el enlace «¿Olvidaste tu contraseña?».

#### `src/api/auth.js` (+28 / -10)

De 3 endpoints a 8. Los nuevos: `logout`, `forgotPassword`, `resetPassword`,
`sendVerification`, `confirmVerification`.

#### `src/api/mensajeError.js` (+40 / -3)

Se añadió un mensaje para cada error que el backend puede devolver:

| Código HTTP | Qué significa | Mensaje al usuario |
|---|---|---|
| `401` | Sesión expirada | «Tu sesión expiró. Vuelve a iniciar sesión.» |
| `403` | Sin permiso | «No tienes permiso para hacer esto.» |
| `419` | Faltó el CSRF | «La sesión expiró. Recarga la página e inténtalo de nuevo.» |
| `429` | Demasiados intentos | «Demasiados intentos. Espera 42 s e inténtalo de nuevo.» |
| `500+` | Error del servidor | «El servidor tuvo un error. Inténtalo de nuevo en un momento.» |
| `422` | Datos inválidos | El mensaje del campo concreto, junto al campo. |

Se añadió `erroresDeCampo()`: convierte la respuesta de Laravel
`{ errors: { email: ['...'] } }` en `{ email: '...' }`, para poder pintar el error **en el
campo que corresponde** en vez de en un bloque arriba.

### 4.2 `c2eeada` — feat: paleta institucional SENA en la pantalla de login

```text
Fecha: 2026-09-30 22:42
Archivos: 4 archivos, +70 / -22 líneas
Viene de la rama huérfana: 25d4d3a
```

**Primer toque de identidad institucional.** Creó los tokens de color en
`src/index.css` (+13 líneas):

```css
@theme {
  --color-sena: #39a900;        /* Verde institucional */
  --color-sena-oscuro: #007832; /* Verde oscuro */
  --color-sena-azul: #00304d;   /* Azul oscuro */
  --color-sena-violeta: #71277a;
  --color-sena-amarillo: #fdc300;
  --color-sena-cielo: #50e5f9;
}
```

**¿Qué es `@theme`?** Tailwind normalmente no te deja inventar colores. Con `@theme` le
dices «de verdad son colores del proyecto», y a partir de ahí existen `bg-sena`,
`text-sena-azul`, `border-sena-oscuro`… y además admiten opacidad (`bg-sena/10`).

La fuente citada en el comentario del propio código es el **Manual de Identidad Visual SENA
2024, Resolución 1825 de 2024**, capítulo «Arquitectura del color».

Los otros tres archivos aplicaron esos colores:

| Archivo | Cambio |
|---|---|
| `TarjetaAuth.jsx` | +35 / -8: fondo `bg-sena-cielo/30`, franja verde arriba, título `text-sena-azul`. |
| `AuthLayout.jsx` | +8 / -3: pasó el color como una opción llamada `marca`. |
| `Login.jsx` | +14 / -11: botón `bg-blue-600` → `bg-sena-oscuro`, bordes y textos azules → SENA. |

> **Un detalle de diseño que parece un error y no lo es:** en este commit la paleta SENA
> se aplicó **solo al login**, y las otras tres pantallas públicas seguían neutras. Se
> hizo así a propósito, para poder ver la paleta aislada en una sola pantalla antes de
> aplicarla a todas. Se revirtió en el commit siguiente.

### 4.3 `2880345` — feat: incorpora la identidad visual institucional SENA

```text
Fecha: 2026-09-30 23:24
Archivos: 8 archivos, +98 / -42 líneas
Viene de la rama huérfana: f5151b1
```

Aquí ya entra el **logosímbolo** y la tipografía oficial.

| Archivo | Cambio | Qué aporta |
|---|---|---|
| `public/logo-sena.svg` | +16 (nuevo) | El logosímbolo del SENA. |
| `src/components/ui/LogoSena.jsx` | +24 (nuevo) | El componente que lo pinta. |
| `public/favicon.svg` | +16 / -1 | El ícono de la pestaña: era el logo morado de Vite. |
| `src/components/Sidebar.jsx` | +9 / -1 | El logosímbolo entró al menú lateral. |
| `index.html` | +8 / -2 | `lang="es"`, título real, carga de Work Sans. |
| `src/index.css` | +5 / -1 | `--font-sans` con Work Sans. |
| `src/components/ui/TarjetaAuth.jsx` | +17 / -29 | Logo sobre el título, franja verde siempre. |
| `src/layouts/AuthLayout.jsx` | +3 / -8 | **Se eliminó** la opción `marca`. |

#### El truco de `LogoSena.jsx`

Un SVG externo cargado con `<img>` **no hereda el color del texto** de la página: el
navegador lo pinta tal cual. Para poder usar el mismo archivo en verde, blanco o negro,
este componente lo usa como **máscara**:

```js
// El logosímbolo se pinta con mask-image en vez de <img> porque un SVG
// externo no hereda `currentColor` del documento.
WebkitMaskImage: "url('/logo-sena.svg')",
maskImage: "url('/logo-sena.svg')",
// ...
className={`inline-block shrink-0 bg-current ${className}`}
```

`mask-image` usa la imagen solo como **silueta**: el color real lo pone el fondo
(`bg-current` = el color de texto actual). Por eso el mismo archivo sirve en el menú
oscuro (blanco) y en la tarjeta blanca (verde).

#### El detalle de composición en `TarjetaAuth`

```jsx
{/* El logosímbolo va sobre el texto y no al lado: ya contiene las
    letras SENA, así que en horizontal competirían ambas versiones. */}
```

El logosímbolo **ya dice "SENA"** dentro del dibujo. Ponerlo al lado del texto "SPGTH"
haría que se leyeran dos nombres distintos. Por eso quedó **encima**.

#### Y la corrección de `c2eeada`

Como ya se iba a aplicar la identidad a **todas** las pantallas públicas, la opción
`marca` dejó de tener sentido y se eliminó. `TarjetaAuth` pasó de 36 a 24 líneas, y
`AuthLayout` perdió 8. El condicional se convirtió en una regla fija.

### 4.4 `e22ce52` — feat: armoniza los formularios publicos con la paleta SENA

```text
Fecha: 2026-09-30 23:59
Archivos: 3 archivos, +36 / -44 líneas
Viene de la rama huérfana: 227f0a0
```

Último commit de la noche. Aplicó la paleta a las tres pantallas que faltaban.

| Archivo | Cambio |
|---|---|
| `RecuperarContrasena.jsx` | +18 / -22 |
| `Registro.jsx` | +11 / -11 |
| `VerificarCorreo.jsx` | +7 / -11 |

El cambio de `Registro.jsx` es **equilibrado** (11 de entrada, 11 de salida) porque se
sustituyeron clases una por una, sin añadir ni quitar estructura.

Los tres siguiendo la misma receta: título `text-sena-azul`, etiquetas
`font-medium text-sena-azul`, campos con `border-sena-azul/20` y anillo verde al enfocar
(`focus:ring-sena/40`), botones `bg-sena-oscuro`, enlaces `text-sena-oscuro`.

#### Y un mini-cambio que no es de color

Al revisar estas pantallas se quitaron dos textos que no tenían que ver ahí:

```jsx
// ANTES
<p className="mt-1 text-xs text-slate-500">
  En desarrollo el código queda en <code>storage/logs/laravel.log</code> del backend.
</p>
```

Le decía al usuario final que fuera a buscar un archivo de registro del servidor. Es
información interna de desarrollo, no algo que deba ver quien está usando el sistema. Se
eliminó de las dos pantallas.

### 4.5 `73200ad` — fix: completa el .gitignore tras reanclar la rama sobre main

```text
Fecha: 2026-10-01 00:15
Archivos: 3 archivos, +11 / -58 líneas
```

El commit que recoge los tres **efectos colaterales del rebase** que se describieron en
el apartado 3.8.

**1. `.gitignore` (+4): el archivo `.env` dejó de estar en riesgo.**

```gitignore
.env
.env.local
.env.*.local
```

> **Esto es lo más importante de este commit.** `.env` guarda la configuración con
> direcciones del backend. Sin ignorar, un `git add` accidental lo sube a GitHub para
> siempre, y aunque luego lo borres, **queda en el historial**.

**2. `.env.example` (+7, nuevo): la plantilla para no equivocarse.**

```bash
# OJO: usa siempre 'localhost', NUNCA '127.0.0.1'. Las cookies distinguen host
# y las dos direcciones no comparten sesión.
VITE_API_URL=http://localhost:8000/api
VITE_CSRF_URL=http://localhost:8000/sanctum/csrf-cookie
VITE_GOOGLE_URL=http://localhost:8000/api/auth/google/redirect
```

Es un `.env` **sin secretos**, que sí se sube, para que cualquiera sepa qué variables
poner. El comentario sobre `localhost` vs `127.0.0.1` está ahí porque es un error
difícil de diagnosticar: las cookies de sesión distinguen el host, así que si el frontend
pide la cookie a `127.0.0.1` y la API responde en `localhost`, la sesión simplemente
**nunca se establece** y no hay error visible que lo explique.

**3. `src/pages/login/GoogleCallback.jsx` (0 / -58): el archivo muerto, por fin fuera.**

Era el resto del `GoogleCallback` que sobrevivió al rebase. Se borró entero.

**Lo que este commit NO tocó:** `router.jsx`. La ruta de `GoogleCallback` **ya no
existed** desde `47a34da`, así que no había nada que quitar. Ese archivo se había
desincronizado solo, sin que nadie lo notara.

### 4.6 `2784657` — fix: oculta los permisos en las vistas y habilita el scroll del menu lateral

```text
Fecha: 2026-10-01 00:21
Archivos: 19 archivos, +29 / -25 líneas
```

Dos problemas de interfaz en un mismo commit, porque se detectaron a la vez al probar la
app con muchos permisos abiertos.

#### Parte 1: el menú lateral no hacía scroll

Con todos los permisos abiertos, el menú era más alto que la pantalla y **las últimas
opciones quedaban inalcanzables**. No había ninguna barra de desplazamiento.

```jsx
// El nav es lo unico que desplaza. min-h-0 es imprescindible: sin el,
// un flex item en columna no baja de su altura minima y el contenido
// se desborda en vez de generar barra.
<nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden pr-1">
```

**¿Por qué `min-h-0` es imprescindible?** Es la parte menos intuitiva de este arreglo. En
una columna flexible (flex-column), un elemento tiene por defecto una altura **mínima
automática**: se niega a ser más bajo que su contenido. Con `min-h-0` se le quita ese
mínimo y entonces sí puede encogerse, y por tanto generar la barra de scroll.

`pr-1` es un margen pequeño a la derecha, para que la barra no quede pegada al texto.
También se añadió `shrink-0` a la cabecera del logo, para que **no se aplaste** al
desplazarse el menú.

#### Parte 2: los permisos se veían en pantalla

Las páginas que aún no están construidas mostraban esto:

```jsx
<p className="mt-4 text-sm text-slate-400">
  Permiso requerido: <code>{permiso}</code>
</p>
```

O sea, el usuario veía `Permiso requerido: convocatorias:gestionar` en una pantalla
vacía. Eso es un detalle interno del enrutado: **no le aporta nada a quien usa el
sistema**, y le da la sensación de que la aplicación está a medio hacer.

```jsx
// Marcador de vista todavia no construida. No se muestra el permiso que la
// habilita: es un detalle interno del enrutado y no le aporta nada al usuario.
export default function PaginaVacia({ titulo }) {
```

Para quitarlo hizo falta tocar **17 páginas más**, una por una, para borrarles el
`permiso="..."`. De ahí los 19 archivos del commit. También se añadió la línea final al
archivo, que antes no la tenía.

### 4.7 `747f360` — feat: anade modo oscuro y toggle de tema

```text
Fecha: 2026-10-01 00:37
Archivos: 18 archivos, +298 / -76 líneas
```

El commit más grande de la fase final. Añade el **tema oscuro** a toda la aplicación.

#### El problema del «fogonazo» y su solución

Si el tema oscuro se aplicara desde React, ocurriría esto: la página carga en blanco →
llega React → lee la preferencia → oscurece. Ese parpadeo se llama *flicker* o fogonazo
de tema, y se nota muchísimo.

La solución es poner un `<script>` **en el `<head>` de `index.html`**, antes de que cargue
React, que aplica la clase al instante:

```html
<!-- Debe ejecutarse antes de que React monte: si la clase dark se añadiera
     después, la primera pintada saldría en claro y se vería un fogonazo. -->
<script>
  ;(function () {
    try {
      var guardado = localStorage.getItem('spgth-tema')
      var oscuro = guardado
        ? guardado === 'oscuro'
        : window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', oscuro)
      document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light'
    } catch (e) {
      /* modo claro como respaldo */
    }
  })()
</script>
```

Tres decisiones en esas pocas líneas:

- **Si no hay preferencia guardada**, respeta el tema del sistema (`prefers-color-scheme`).
- **El `try/catch`** es por si el navegador tiene el almacenamiento bloqueado (modo
  privado, políticas del empresa). Sin él, un `localStorage` inaccesible rompería la
  aplicación entera.
- **`colorScheme`** le dice al navegador que ponga también oscuro los controles nativos
  (el cursor, los desplegables del navegador, los checkboxes). Sin eso, el tema oscuro se
  ve a medias.

Este script también corrigió un detalle: el título pasó de `·` a `—` (guion largo).

#### `src/lib/useTema.js` — nuevo (57 líneas)

El hook que maneja el estado del tema:

| Función | Para qué |
|---|---|
| `leerTema()` | Lee la preferencia guardada. |
| `usarTema()` | Devuelve el estado actual y `alternarTema()`. |
| `matchMedia` | Escucha los cambios del tema **del sistema** mientras la app esté abierta. |
| `colorScheme` | Mantiene sincronizado el `color-scheme` del documento. |
| Clave `spgth-tema` | El nombre con el que se guarda en `localStorage`. |

Un detalle importante: si el usuario **no ha elegido nada** y cambia el tema del sistema
(por ejemplo, de día a noche), la app **también cambia sola**. Pero si el usuario ya
eligió, su elección manda y el sistema deja de influir.

#### `src/components/ThemeToggle.jsx` — nuevo (54 líneas)

El botón sol/luna de la barra superior. Dos detalles de accesibilidad:

```jsx
<button aria-pressed={oscuro} title={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
```

- **`aria-pressed`** le dice a un lector de pantalla si el botón está activo o no.
- El **`title` cambia con el estado**, para que el tooltip diga siempre la acción
  contraria a la actual («Cambiar a modo claro» cuando estás en oscuro).

#### `src/index.css` (+25)

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Con esta línea, Tailwind entiende `dark:`. En la versión 3 era distinto; en la 4 hay que
declararlo. Y se añadieron los tokens de la superficie oscura (`#00121f` y derivados).

#### Los 14 archivos de pantallas

Cada pantalla, layout y componente recibió su variante oscura:

| Archivo | Cambio |
|---|---|
| `ProtectedRoute.jsx` | +6 / -2: el texto «Cargando…» y el error de red en color claro. |
| `Topbar.jsx` | +10 / -5: la barra superior. |
| `Sidebar.jsx`, `SidebarItem.jsx` | Fondo y elemento activo. |
| `AppLayout.jsx`, `AuthLayout.jsx` | Los fondos del contenedor. |
| `TarjetaAuth.jsx` | +6 / -4: las cuatro pantallas públicas. |
| `Login.jsx`, `Registro.jsx`, `RecuperarContrasena.jsx`, `VerificarCorreo.jsx` | +89 / -50 en total. |
| `PaginaVacia.jsx`, `Forbidden.jsx`, `NotFound.jsx` | Los marcadores de página vacía y los errores. |

> **Un error que este commit introdujo y el siguiente corrigió:** en `Registro.jsx` se
> escribió `dark:text-sena-texto dark:text-sena-texto` — la misma clase **dos veces**. No
> rompía nada (CSS aplica la última), pero era basura. Se arregló en `ef183f5`.

### 4.8 `48518ad` — feat: estiliza las barras de desplazamiento con la paleta SENA

```text
Fecha: 2026-10-01 00:37
Archivos: 3 archivos, +58 / -3 líneas
```

Casi a la vez que el modo oscuro. En `2784657` se consiguió que el menú tuviera barra de
scroll, pero **se veía con el aspecto por defecto del sistema**: gris, ancha, ajena al
diseño.

Se crearon dos clases en `src/index.css`:

| Clase | Dónde |
|---|---|
| `.scroll-sena-lateral` | El menú lateral (fondo oscuro). |
| `.scroll-sena-contenido` | El área de contenido (fondo claro). |

#### El detalle técnico: hay que escribirlas dos veces

```css
/* Se declaran las propiedades estándar y los pseudo-elementos webkit porque
   cada motor soporta un juego distinto: solo con las estándar la barra se ve
   plana, y solo con las webkit no funciona en Firefox. */
.scroll-sena-lateral {
  scrollbar-width: thin;                                        /* Firefox */
  scrollbar-color: rgba(57, 169, 0, 0.55) transparent;          /* Firefox */
}
.scroll-sena-lateral::-webkit-scrollbar { width: 6px; }          /* Chrome, Edge, Safari */
```

No es duplicación por descuido: cada familia de navegadores soporta un método distinto,
y hay que declarar los dos.

#### Los colores se eligieron por contraste, no por gusto

Este es el detalle más cuidadoso del commit, y está escrito en el propio código:

```css
/* Colores fijados por contraste, no a criterio: sobre el fondo del menú
   (#1e293b) el verde institucional da 4.77:1, sobre fondo claro (#f8fafc)
   da solo 2.93:1 y no cumpliría, así que ahí se usa el verde oscuro. */
```

- En el **menú oscuro** (fondo `#1e293b`) el verde institucional `#39a900` da **4.77:1**,
  que cumple el estándar de accesibilidad.
- En el **contenido claro** (fondo `#f8fafc`) ese mismo verde da solo **2.93:1**: no
  cumple. Por eso allí se usa el **verde oscuro** `#007832`.
- En **modo oscuro** el fondo pasa a `#00121f` y el verde institucional vuelve a dar
  **6.19:1**, así que se recupera el color claro.

Otros detalles:

- **6 px de grosor**, con el pulgar redondeado (`border-radius: 9999px`).
- El `hover` cambia **la opacidad, no el grosor**. El motivo está en el comentario:
  el ancho de la barra forma parte del cálculo del layout, y **no se puede animar**
  sin que la página "salte" al pasar el ratón.
- La pista es transparente.

Los otros dos archivos solo aplicaron la clase:

```jsx
// Sidebar.jsx
<nav className="scroll-sena-lateral flex min-h-0 flex-1 ...">

// AppLayout.jsx
<main className="scroll-sena-contenido flex-1 overflow-y-auto p-6">
```

### 4.9 `ef183f5` — fix: elimina la clase dark duplicada en el formulario de registro

```text
Fecha: 2026-10-01 01:04
Archivos: 1 archivo, +1 / -1 línea
```

El error que introdujo `747f360`, corregido. En `Registro.jsx`:

```diff
- <label className="... text-sena-azul dark:text-sena-texto dark:text-sena-texto">
+ <label className="... text-sena-azul dark:text-sena-texto">
```

Un commit diminuto, y aun así tiene su valor: **cada commit debería hacer una sola cosa**.
Este no mezcla el arreglo con nada más, así que si algo se rompe se sabe exactamente qué
fue.

### 4.10 `97b0d8c` — fix: neutraliza el mensaje de error de conexion para el usuario

```text
Fecha: 2026-10-01 01:09
Archivos: 2 archivos, +3 / -3 líneas
```

**Qué estaba mal.** Cuando el backend estaba apagado, el usuario leía:

> «No se pudo conectar con el servidor. Revisa que el backend esté corriendo.»

Es un mensaje **para el desarrollador**, no para el usuario final. Le está diciendo a
alguien que usa un simulador de procesos de selección que vaya a arrancar un servidor
Laravel. Nadie que use el sistema puede hacer eso.

**El mensaje neutro:**

> «No pudimos conectarnos. Inténtalo de nuevo en un momento.»

Dice lo mismo útil (no se pudo, inténtalo otra vez) sin.internalismo.

Se cambió en los dos sitios donde se mostraba:

| Archivo | Contexto |
|---|---|
| `src/api/mensajeError.js` | El error de red de cualquier petición. |
| `src/auth/AuthContext.jsx` | El `errorRed` del arranque de la aplicación. |

Y de paso, en ese mismo commit se corrigió un **typo en un comentario** del código
(`paintedarlo` → `pintarlo`). Un comentario equivocado no rompe nada, pero dentro de seis
meses alguien lo leerá y loará.

> **Lección de este commit:** el mensaje de error es parte de la interfaz. Si el
> usuario final no puede actuar sobre él, sobra. Y el detalle de dónde se muestra
> importa: en `AuthContext` el mensaje sale en la pantalla del login, envuelto en
> `TarjetaAuth`; en `mensajeError` sale dentro del formulario. Por eso hubo que
> cambiarlo en dos sitios.

### 4.11 `0ec54ed` — chore: elimina el codigo muerto de la plantilla de Vite

```text
Fecha: 2026-10-01 01:10
Archivos: 5 archivos, -195 líneas (0 líneas añadidas)
```

**El último commit.** Cierra una deuda que venía desde `e391b4a`, el primer commit con
código. Un commit **puro de borrado**: no añade nada.

| Archivo borrado | Líneas | Qué era |
|---|---|---|
| `src/App.css` | 184 | Estilos de la demo de Vite: `.counter`, `.hero`, `#next-steps`, `#docs`, `.ticks`… |
| `src/App.jsx` | 9 | La pantalla «Tailwind funcionando ✅». |
| `src/assets/react.svg` | 1 | El logo de React. |
| `src/assets/vite.svg` | 1 | El logo de Vite. |
| `src/assets/hero.png` | binario | Una imagen decorativa de la plantilla. |

**¿Por qué seguían ahí?** Porque en `7d189b0` se limpió casi todo lo de la plantilla, pero
`App.css` y los logos **no se borraron**. Nadie lo notó porque no molestaban: nadie los
importaba.

**¿Por qué los estilos no estaban en `src/index.css`?** Porque ya se habían sustituido en `7d189b0` por
una sola línea: `@import "tailwindcss";`.

**La diferencia de fondo:** desde `7d189b0`, `main.jsx` monta el enrutador directamente,
así que `App.jsx` **nunca se ha ejecutado**:

```jsx
// main.jsx
createRoot(document.getElementById('root')).render(
  <StrictMode><AppRouter /></StrictMode>
)
```

Es decir: `App.jsx` era un archivo que nadie miraba, y `App.css` una hoja de estilos sin
aplicar. Y esto se notó además al compilar: el CSS pasó de **19.83 kB a 17.91 kB**, casi
2 kB menos de estilos que el navegador descargaba para nada.

**Un recordatorio sobre `chore:`:** este commit lleva ese prefijo y no `feat:` ni `fix:`,
porque no añade una función ni corrige un fallo: **limpia**. Es exactamente para eso.

---

## 5. Comparación: `main` de ayer contra hoy

Si quieres saltar toda la historia y ver solo **qué cambió en total** desde que `main`
se congeló en `e787db0`, esta es la respuesta corta.

```bash
git diff --stat main..feature/branding-sena
```

| Aspecto | `main` (`e787db0`) | Hoy (`0ec54ed`) |
|---|---|---|
| **Sesión** | Token en `localStorage` | Cookie `HttpOnly` de Laravel Sanctum |
| **CSRF** | No existía | Cookie `XSRF-TOKEN` + cabecera obligatoria |
| **Sesión caducada** | Recarga forzada de la página | Evento, React actualiza en sitio |
| **Backend apagado** | Cerraba la sesión del usuario | Muestra un mensaje, **no** cierra sesión |
| **Google** | Página aparte (`GoogleCallback`) | Flujo simplificado, sin página aparte |
| **Contraseña olvidada** | No existía | `/recuperar`, con código de 6 dígitos |
| **Verificar correo** | No existía | `/verificar-correo`, obligatoria para entrar |
| **Errores 401/403/419/429/500** | Solo texto genérico | Un mensaje para cada caso, en su campo |
| **Errores por campo (422)** | Un bloque arriba | En el campo que corresponde |
| **Colores** | Azules y grises genéricos | Paleta institucional SENA completa |
| **Tipografía** | La del sistema | Work Sans (la institucional) |
| **Logotipo** | Ninguno | Logosímbolo del SENA + favicon |
| **Idioma** | `lang="en"` | `lang="es"` |
| **Modo oscuro** | No existía | Toggle con anti-fogonazo, respeta el sistema |
| **Barras de scroll** | Las del sistema | Estilizadas según contraste |
| **Menú lateral** | Sin scroll | Con scroll y `min-h-0` |
| **Páginas vacías** | Mostraban el permiso requerido | Solo el título |
| **`.env`** | **No estaba ignorado** | Ignorado, con `.env.example` |
| **Archivos muertos** | 5 sin usar | 0 |

---

## 6. Línea de tiempo

```text
  FECHA            HORA   RAMA              COMMIT     QUÉ PASÓ
  ──────────────────────────────────────────────────────────────────────────
  2026-09-29      14:39   main             154b597    Initial commit (solo README.md)
  2026-09-29      14:42   main             e391b4a    Plantilla de Vite + React
  2026-09-29      20:58   main             7d189b0    ★ La app real: login, sesión, menú
  2026-09-30      10:57   main             e787db0    Merge PR #1 → e787db0 es la base

  2026-09-30      22:40   huérfana          2d3dcc3    Base React 19 / Vite 8 (raíz suelta)
  2026-09-30      22:42   huérfana          cb4b3b0    Autenticación Sanctum
  2026-09-30      22:42   huérfana          ec4dc08    Módulos (→ se descartará)
  2026-09-30      22:42   huérfana          25d4d3a    Paleta SENA en login
  2026-09-30      23:24   huérfana          f5151b1    Identidad visual SENA
  2026-09-30      23:59   huérfana          227f0a0    Armonizar formularios

  ══ REBASE: todo lo de arriba se reaplica encima de e787db0 ══

  2026-09-30      22:42   feature/…        47a34da    ← cb4b3b0   Autenticación Sanctum
  2026-09-30      22:42   feature/…        c2eeada    ← 25d4d3a   Paleta SENA en login
  2026-09-30      23:24   feature/…        2880345    ← f5151b1   Identidad visual SENA
  2026-09-30      23:59   feature/…        e22ce52    ← 227f0a0   Armonizar formularios
  2026-10-01      00:15   feature/…        73200ad    ✚ .gitignore, .env.example, −GoogleCallback
  2026-10-01      00:21   feature/…        2784657    ✚ Scroll del menú, −permisos en pantalla
  2026-10-01      00:37   feature/…        747f360    ✚ Modo oscuro
  2026-10-01      00:37   feature/…        48518ad    ✚ Barras de scroll SENA
  2026-10-01      01:04   feature/…        ef183f5    ✚ Arregla clase dark duplicada
  2026-10-01      01:09   feature/…        97b0d8c    ✚ Mensaje de error neutral
  2026-10-01      01:10   feature/…        0ec54ed    ✚ Borra código muerto de Vite
```

**Cómo se lee:** `←` significa «este commit es el mismo trabajo que el de la rama
huérfana, recreado por el rebase». `✚` significa «trabajo nuevo, hecho ya sobre la base
correcta». `★` marca el commit más importante de `main`.

---

## 7. Qué NO está en Git

Git guarda **archivos**, no todo lo que pasó. Estas cosas no aparecen en el historial, y
conviene saberlo para no buscarlas:

| No está en Git | Por qué |
|---|---|
| **Los conflictos del rebase** | Son decisiones que se tomaron al vuelo. Git no guarda "qué se eligió" ni "por qué". |
| **El `.env` real** | A propósito: está en `.gitignore`. Las cookies no se suben nunca. |
| **`.env.example`** | Sí está, desde `73200ad`. No tiene secretos. |
| **`node_modules/`** | Las librerías instaladas. Se regeneran con `npm install`. |
| **`dist/`** | La carpeta de compilación. Se regenera con `npm run build`. |
| **Los mensajes de error en rojo de la terminal** | No son parte del código. |
| **Las capturas de pantalla y pruebas manuales** | Viven fuera del repositorio. |
| **La rama `backup/antes-de-rebase` en GitHub** | Es local, por seguridad. El tag tampoco se subiría. |
| **`DOCUMENTACION_DETALLADA.md` y este archivo** | Documentación local, excluida con `.git/info/exclude`. |

**Y una advertencia práctica:** el historial de Git **no se puede reescribir sin que se
note**. Si un commit con un secreto se sube a un repositorio público, hay que
reescribir la historia (y los hashes de todos los commits posteriores cambian) **y**
pedirle a GitHub que purgue las cachés. Por eso `.env` se ignoró desde `73200ad`.

---

## 8. Glosario de Git

Términos usados en este documento, explicados en una línea.

| Término | Qué significa |
|---|---|
| **Repositorio** | Carpeta con historial que Git vigila. |
| **Commit** | Foto del proyecto con una nota. |
| **Hash** | Código de 7 caracteres que identifica un commit para siempre. |
| **Rama / branch** | Línea de commits independiente. |
| **`main`** | La rama estable y oficial. |
| **`develop`** | Rama de trabajo integrada; aquí nunca se usó. |
| **Merge / fusión** | Juntar dos historias en una. |
| **Rebase** | Reaplicar commits sobre otra base (cambia los hashes). |
| **Rama huérfana / orphan** | Historia sin ancestro común con `main`. |
| **Ancestro común** | El commit del que salen dos ramas. Si no existe, Git no puede unirlas solo. |
| **`--force-with-lease`** | Push que sobrescribe el remoto, pero solo si nadie subió nada. |
| **Tag / etiqueta** | Marca permanente que apunta a un commit concreto. |
| **`git log --oneline`** | Lista el historial en una línea por commit. |
| **`git show <hash>`** | Muestra un commit y sus cambios. |
| **`git diff A..B`** | Diferencia entre dos puntos. |
| **`git status`** | Dice si hay cambios sin commitear. |
| **`git add`** | Prepara archivos para el próximo commit. |
| **`git commit`** | Guarda el punto. |
| **`git push`** | Sube tus commits al remoto (GitHub). |
| **`.gitignore`** | Lista de archivos que NO se suben. Se versiona. |
| **`.git/info/exclude`** | Lo mismo, pero **local**: no se versiona. Aquí están los documentos. |
| **Staging / área de preparación** | Lo que está listo para el próximo commit. |
| **Codemod / refactor** | Cambiar el código sin cambiar su comportamiento. |

---

## Apéndice: los 21 commits, en una tabla

| # | Commit | Rama | Fecha | Archivos | Qué hizo |
|---|---|---|---|---|---|
| 1 | `154b597` | main | 29/09 14:39 | 1 | Commit inicial, solo `README.md`. |
| 2 | `e391b4a` | main | 29/09 14:42 | 13 | Plantilla de Vite + React + Tailwind + Oxlint. |
| 3 | `7d189b0` | main | 29/09 20:58 | 47 | La app real: login, sesión por token, menú por permisos, 18 pantallas vacías. |
| 4 | `e787db0` | main | 30/09 10:57 | — | Merge del PR #1. **Base de todo lo demás.** |
| 5 | `2d3dcc3` | huérfana | 30/09 22:40 | 14 | Base React 19 / Vite 8 / Tailwind 4. Raíz suelta. |
| 6 | `cb4b3b0` | huérfana | 30/09 22:42 | 23 | Autenticación Sanctum con cookies. |
| 7 | `ec4dc08` | huérfana | 30/09 22:42 | 21 | Menú y pantallas de módulos. **Se descartó al rebase.** |
| 8 | `25d4d3a` | huérfana | 30/09 22:42 | 4 | Paleta SENA en el login. |
| 9 | `f5151b1` | huérfana | 30/09 23:24 | 8 | Identidad visual: logosímbolo, Work Sans, favicon. |
| 10 | `227f0a0` | huérfana | 30/09 23:59 | 3 | Harmonización de los otros tres formularios. **Punta del respaldo.** |
| 11 | `47a34da` | feature | 30/09 22:42 | 14 | El #6 recreado sobre `main`. Sanctum + contraseña y verificación. |
| 12 | `c2eeada` | feature | 30/09 22:42 | 4 | El #8 recreado. Tokens de color SENA. |
| 13 | `2880345` | feature | 30/09 23:24 | 8 | El #9 recreado. Logosímbolo y tipografía. |
| 14 | `e22ce52` | feature | 30/09 23:59 | 3 | El #10 recreado. |
| 15 | `73200ad` | feature | 01/10 00:15 | 3 | `.env` ignorado, `.env.example` creado, `GoogleCallback` borrado. |
| 16 | `2784657` | feature | 01/10 00:21 | 19 | Scroll en el menú; los permisos dejan de verse en pantalla. |
| 17 | `747f360` | feature | 01/10 00:37 | 18 | Modo oscuro completo con toggle. |
| 18 | `48518ad` | feature | 01/10 00:37 | 3 | Barras de desplazamiento con la paleta SENA. |
| 19 | `ef183f5` | feature | 01/10 01:04 | 1 | Quita la clase `dark:` duplicada en Registro. |
| 20 | `97b0d8c` | feature | 01/10 01:09 | 2 | Mensaje de conexión neutral para el usuario. |
| 21 | `0ec54ed` | feature | 01/10 01:10 | 5 | **Borra 5 archivos muertos de la plantilla.** Estado actual. |

---

*Fin del documento. Para el estado actual del proyecto, ver `DOCUMENTACION_DETALLADA.md`.*
