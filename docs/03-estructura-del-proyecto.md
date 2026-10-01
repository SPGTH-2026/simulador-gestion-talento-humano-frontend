# Estructura del proyecto


---

## 4. Estructura de carpetas y archivos

Este es el árbol **real** del proyecto. Todo lo que hay dentro de `src/` está en español
para que sea fácil de leer; los comentarios explicativos están mayormente en español
(componentes) y algunos en inglés (capa de autenticación y API).

```text
simulador-gestion-talento-humano-frontend-main/
│
├── .env.example              Plantilla de variables de entorno (SÍ se sube a Git)
├── .gitignore                Lista de archivos que Git NO debe subir (incluye .env)
├── index.html                HTML base + carga de Work Sans + script anti-parpadeo
├── package.json              Dependencias y scripts del proyecto
├── package-lock.json         Versiones exactas ya instaladas
├── vite.config.js            Configuración de Vite (plugins de React y Tailwind)
├── DOCUMENTACION_DETALLADA.md Este archivo
│
├── public/                   Archivos servidos tal cual, sin compilar
│   ├── favicon.svg           Ícono de la pestaña del navegador
│   ├── icons.svg             Íconos (símbolo de la institution)
│   └── logo-sena.svg         Logosímbolo institucional del SENA
│
└── src/                      Todo el código que se compila
    │
    ├── main.jsx              PUNTO DE ENTRADA. Monta React en <div id="root">
    ├── router.jsx            Define TODAS las rutas y sus protecciones
    ├── index.css             Tokens de color, tipografía, variante dark, scrollbars
    │
    ├── api/                  Hablar con el backend
    │   ├── client.js         Cliente Axios: base URL, cookies, CSRF, sesión expirada
    │   ├── auth.js           Endpoints de autenticación
    │   ├── mensajeError.js   Convierte errores del backend en textos para el usuario
    │   └── reintento.js      Lee la cabecera Retry-After (429) para el botón de reintento
    │
    ├── auth/                 Autenticación y control de acceso
    │   ├── AuthContext.jsx   Estado global: usuario, sesión, error de red
    │   ├── useAuth.js        Hook para leer ese estado + helpers de permisos
    │   ├── ProtectedRoute.jsx  Exige sesión y correo verificado
    │   └── PermissionRoute.jsx Exige un permiso concreto
    │
    ├── components/           Piezas de interfaz
    │   ├── Sidebar.jsx       Menú lateral izquierdo
    │   ├── SidebarItem.jsx   Cada opción del menú (con submenús)
    │   ├── Topbar.jsx        Barra superior
    │   ├── ThemeToggle.jsx   Botón sol/luna del modo claro/oscuro
    │   └── ui/
    │       ├── LogoSena.jsx    Logosímbolo reutilizable
    │       ├── TarjetaAuth.jsx  Tarjeta centrada de los formularios públicos
    │       └── PaginaVacia.jsx  Placeholder "Página en construcción"
    │
    ├── config/
    │   └── menu.js           Estructura del menú lateral + permiso de cada opción
    │
    ├── layouts/              Plantillas de pantalla
    │   ├── AuthLayout.jsx    Pantallas públicas (login, registro, recuperar)
    │   └── AppLayout.jsx     Pantallas internas (con sidebar, topbar y contenido)
    │
    ├── lib/                  Utilidades
    │   ├── useTema.js        Modo claro/oscuro: estado, persistencia, sistema
    │   ├── useCuentaAtras.js Cuenta regresiva para reintentos (429)
    │   └── otpSesion.js      Recuerda en la sesión que ya se envió un código OTP
    │
    ├── pages/                Una carpeta por módulo
    │   ├── login/            Login.jsx, Registro.jsx, RecuperarContrasena.jsx,
    │   │                     VerificarCorreo.jsx
    │   ├── errores/          NotFound.jsx (404), Forbidden.jsx (sin permiso)
    │   ├── dashboard/        Dashboard.jsx
    │   ├── convocatorias/    ConvocatoriasListado.jsx, ConvocatoriaNueva.jsx
    │   ├── documentos/       DocumentosListado.jsx, DocumentoCargar.jsx,
    │   │                     DocumentoValidacion.jsx
    │   ├── evaluacion/       EvaluacionListado.jsx, EvaluacionEvaluar.jsx
    │   ├── seleccion/        SeleccionRanking.jsx, SeleccionDecidir.jsx
    │   ├── usuarios/         Usuarios.jsx
    │   ├── reportes/         Reportes.jsx
    │   ├── supervision/      Supervision.jsx
    │   └── aspirante/        MisPostulaciones.jsx, MisDocumentos.jsx,
    │                         MisEvaluaciones.jsx, Notificaciones.jsx
    │
    └── (aquí termina src/)
```

> **No existe `src/App.jsx`.** La plantilla original de Vite traía un `App.jsx` con un
> "Tailwind funcionando?" y un `App.css` que nadie importaba. Se borraron: `main.jsx`
> monta `router.jsx` directamente, así que eran código muerto. También se borró
> `src/assets/` (`hero.png`, `react.svg`, `vite.svg`), que no se usaba en ninguna parte.
>
> Ese borrado bajó el CSS compilado de 19.83 kB a 17.91 kB. La razón no es el tamaño del
> archivo, sino que **Tailwind v4 escanea todos los archivos del proyecto** para descubrir
> qué clases existen, y las clases de `App.jsx` (`bg-blue-900`, `text-4xl`…) se estaban
> generando en el CSS final sin que ninguna pantalla las mostrara. Borrar el archivo
> muerto eliminó también sus clases del resultado.

---

---

## 24. Mapa completo: los 58 archivos

Este capítulo es el índice técnico total del repositorio. **Los 58 archivos están
versionados** (los cuenta `git ls-files`); el proyecto usa 57, porque
`package-lock.json` lo genera `npm install`.

### 24.1 El mapa visual

```text
frontend_spgth/
│
├── .env.example              7    Plantilla de configuración (SÍ se sube)
├── .gitignore               25    Qué NO se sube
├── .oxlintrc.json             8    Reglas del revisor de código
├── README.md                12    Descripción del repo (⚠ ver 28.7)
├── index.html               37    La página base + script anti-parpadeo
├── package.json             27    Dependencias y scripts
├── package-lock.json      2299    Versiones exactas (generado, no se edita)
├── vite.config.js            7    Configuración de Vite
│
├── public/                         Se copia tal cual a la carpeta de publicación
│   ├── favicon.svg         16    Ícono de la pestaña (el logosímbolo SENA)
│   ├── icons.svg           24    ⚠ No lo usa nadie (ver 28.6)
│   └── logo-sena.svg       16    El logosímbolo, en negro reutilizable
│
└── src/
    │
    ├── main.jsx             15    ⚡ Punto de entrada. Monta React.
    ├── router.jsx           99    ⚡ Todas las rutas y sus permisos
    ├── index.css            91    Paleta SENA, modo oscuro, barras de scroll
    │
    ├── api/                        Hablar con el backend
    │   ├── client.js        79    Axios, cookies, CSRF, sesión caducada
    │   ├── auth.js          27    Los 8 endpoints de autenticación
    │   ├── mensajeError.js  46    Traduce errores técnicos a mensajes
    │   └── reintento.js     16    Lee el tiempo de espera del 429
    │
    ├── auth/                       Quién es el usuario y qué puede hacer
    │   ├── AuthContext.jsx  77    Estado global de sesión
    │   ├── ProtectedRoute   26    Puerta: exige sesión + correo verificado
    │   ├── PermissionRoute  12    Puerta: exige un permiso concreto
    │   └── useAuth.js       14    El hook que consume todo eso
    │
    ├── components/                 Las piezas visuales del armazón
    │   ├── Sidebar.jsx      41    Menú lateral con filtro de permisos
    │   ├── SidebarItem.jsx  45    Una opción del menú (o un acordeón)
    │   ├── Topbar.jsx       78    Barra superior: tema, campana, usuario
    │   ├── ThemeToggle.jsx  50    Botón sol/luna
    │   └── ui/                     Piezas visuales reutilizables
    │       ├── LogoSena.jsx    23    El logosímbolo, coloreable
    │       ├── PaginaVacia.jsx 12    Marcador de pantalla sin construir
    │       └── TarjetaAuth.jsx  28    Marco centrado del login
    │
    ├── config/
    │   └── menu.js          46    La lista del menú y sus permisos
    │
    ├── layouts/                    Las envolturas de cada grupo de rutas
    │   ├── AppLayout.jsx    16    Pantallas internas: menú + barra + contenido
    │   └── AuthLayout.jsx   32    Pantallas públicas: la tarjeta del login
    │
    ├── lib/                        Utilidades sin nada de React visual
    │   ├── useTema.js       49    El estado del tema claro/oscuro
    │   ├── otpSesion.js     47    recuerda códigos de un solo uso
    │   └── useCuentaAtras.js 15    Cuenta atrás del botón tras un 429
    │
    └── pages/                      Las pantallas
        ├── login/                  Las 4 pantallas públicas
        │   ├── Login.jsx              130
        │   ├── Registro.jsx            96
        │   ├── RecuperarContrasena.jsx 258  ← la más larga del proyecto
        │   └── VerificarCorreo.jsx     148
        ├── errores/
        │   ├── Forbidden.jsx           18  403
        │   └── NotFound.jsx            18  404
        │
        └── Los 17 módulos (4 líneas cada uno) — ver capítulo 26
            ├── dashboard/Dashboard.jsx
            ├── convocatorias/  ConvocatoriasListado, ConvocatoriaNueva
            ├── documentos/     DocumentosListado, DocumentoCargar,
            │                    DocumentoValidacion
            ├── evaluacion/     EvaluacionListado, EvaluacionEvaluar
            ├── seleccion/      SeleccionRanking, SeleccionDecidir
            ├── usuarios/       Usuarios
            ├── reportes/       Reportes
            ├── supervision/    Supervision
            └── aspirante/      MisPostulaciones, MisDocumentos,
                                 MisEvaluaciones, Notificaciones
```

**⚡ = los tres archivos que عليك leer primero.** Si solo vas a leer cinco archivos del
proyecto, que sean `main.jsx`, `router.jsx` y `client.js`. Con esos tres entiendes cómo
arranca todo, qué rutas existen y cómo se habla con el servidor.

### 24.2 Los archivos por tamaño

Un dato útil para saber dónde está el trabajo de verdad:

| Tamaño | Archivos |
|---|---|
| **Una sola línea** | `src/pages/**` (los 17 módulos) |
| **Menos de 30** | `api/auth.js`, `api/reintento.js`, `auth/useAuth.js`, `auth/PermissionRoute.jsx`, `components/ui/LogoSena.jsx`, `components/ui/PaginaVacia.jsx`, `layouts/AppLayout.jsx`, `lib/useCuentaAtras.js`, `public/*.svg`, `vite.config.js`, `.oxlintrc.json`, `.env.example` |
| **30 a 60** | `api/mensajeError.js`, `auth/ProtectedRoute.jsx`, `components/Sidebar.jsx`, `components/SidebarItem.jsx`, `components/ThemeToggle.jsx`, `config/menu.js`, `lib/otpSesion.js`, `lib/useTema.js`, `layouts/AuthLayout.jsx`, `src/main.jsx`, `src/index.css` |
| **60 a 100** | `api/client.js`, `auth/AuthContext.jsx`, `components/Topbar.jsx`, `components/ui/TarjetaAuth.jsx`, `src/router.jsx` |
| **Más de 100** | `pages/login/RecuperarContrasena.jsx` (258), `pages/login/VerificarCorreo.jsx` (148), `pages/login/Login.jsx` (130), `pages/login/Registro.jsx` (96) |
| **Miles** | `package-lock.json` (2.299) — generado, nunca se edita a mano |

**Conclusión rápida:** el 80 % del código real está en 4 carpetas (`api`, `auth`,
`components`, `pages/login`). Los 17 módulos son marcadores de 4 líneas.

### 24.3 Mapa de dependencias: quién importa a quién

Este diagrama se lee **de arriba abajo** en el arranque de la aplicación:

```text
index.html
  │  ejecuta el script anti-parpadeo (tema) ANTES de nada
  ▼
src/main.jsx
  ├── index.css                      (estilos globales)
  ├── BrowserRouter                  (react-router-dom)
  ├── AuthProvider                   (src/auth/AuthContext.jsx)
  │     ├── api/auth.js
  │     │     └── api/client.js  ──►  (habla con Laravel)
  │     ├── api/mensajeError.js ──►  api/reintento.js
  │     └── Evento 'auth:expirada' ◄── api/client.js
  └── AppRouter                      (src/router.jsx)
        ├── ProtectedRoute  ──►  useAuth ──► AuthContext
        ├── PermissionRoute ──►  useAuth ──► pages/errores/Forbidden
        ├── AuthLayout ──►  TarjetaAuth, useAuth
        └── AppLayout ──►  Sidebar, Topbar
              ├── Sidebar ──►  config/menu, SidebarItem, LogoSena, useAuth
              ├── Topbar ──►  ThemeToggle ──► lib/useTema
              └── <Outlet/>  (la pantalla que toque)
```

**Y así se invierte la cadena al navegar:** cuando el usuario pulsa una opción del menú,
`SidebarItem` navega, React busca la ruta en `router.jsx`, el `PermissionRoute` comprueba
el permiso, y si lo tiene, `AppLayout` pinta el `Sidebar` + `Topbar` + la pantalla.

**Las tres dependencias que conviene tener claras:**

1. **`main.jsx` envuelve todo en `AuthProvider`.** Por eso cualquier componente puede
   llamar a `useAuth()` sin recibir props. Si un componente usa `useAuth()` y da error,
   casi siempre es porque está fuera del provider.
2. **`ProtectedRoute` y `PermissionRoute` devuelven `<Outlet/>`, no la pantalla.** Son
   puertas: en `router.jsx` se declaran como una ruta *envoltorio* sin path, y la pantalla
   real va como hija suya.
3. **`api/client.js` no importa nada de la interfaz.** Es la frontera: si el backend
   cambia, solo hay que tocar `client.js` y `auth.js`.

---
