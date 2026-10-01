# DOCUMENTACIÓN DETALLADA DEL PROYECTO
# SPGTH — Simulador de Procesos de Gestión de Talento Humano (Frontend)

> Guía escrita desde cero: explica cada pieza del proyecto con palabras sencillas,
> para que cualquier persona pueda entenderlo, instalarlo, ejecutarlo y modificarlo.

---

## Índice

1. [¿Qué es este proyecto?](#1-qué-es-este-proyecto)
2. [Conceptos mínimos para entenderlo](#2-conceptos-mínimos-para-entenderlo)
3. [Tecnologías utilizadas](#3-tecnologías-utilizadas)
4. [Estructura de carpetas y archivos](#4-estructura-de-carpetas-y-archivos)
5. [Instalación paso a paso](#5-instalación-paso-a-paso)
6. [Configuración del entorno (.env)](#6-configuración-del-entorno-env)
7. [Scripts disponibles](#7-scripts-disponibles)
8. [Arquitectura: cómo se arma una pantalla](#8-arquitectura-cómo-se-arma-una-pantalla)
9. [Autenticación y sesiones](#9-autenticación-y-sesiones)
10. [Permisos y rutas protegidas](#10-permisos-y-rutas-protegidas)
11. [Identidad visual SENA](#11-identidad-visual-sena)
12. [Modo claro/oscuro](#12-modo-claroscuro)
13. [Barras de desplazamiento personalizadas](#13-barras-de-desplazamiento-personalizadas)
14. [Componentes principales](#14-componentes-principales)
15. [Páginas y rutas](#15-páginas-y-rutas)
16. [Comunicación con el Backend (API)](#16-comunicación-con-el-backend-api)
17. [Estilos con Tailwind CSS](#17-estilos-con-tailwind-css)
18. [Desarrollo, calidad y buenas prácticas](#18-desarrollo-calidad-y-buenas-prácticas)
19. [Cómo probar el proyecto](#19-cómo-probar-el-proyecto)
20. [Compilación y despliegue](#20-compilación-y-despliegue)
21. [Solución de problemas frecuentes](#21-solución-de-problemas-frecuentes)
22. [Glosario de términos](#22-glosario-de-términos)
23. [Historial de la rama](#23-historial-de-la-rama)
24. [Mapa completo: los 58 archivos](#24-mapa-completo-los-58-archivos)
25. [config/menu.js: el menú y su filtrado](#25-configmenu-js-el-menú-y-su-filtrado)
26. [Los 17 módulos: rutas, permisos y archivos](#26-los-20-módulos-rutas-permisos-y-archivos)
27. [Catálogo de componentes y utilidades](#27-catálogo-de-componentes-y-utilidades)
28. [Configuración, compilación y recursos](#28-configuración-compilación-y-recursos)

---

## 1. ¿Qué es este proyecto?

Este repositorio es el **Frontend** del sistema **SPGTH** (Simulador de Procesos de
Gestión de Talento Humano).

**Frontend** = todo lo que el usuario ve y toca en el navegador: botones, formularios,
menús, colores, textos. **Backend** = el servidor que guarda la información y verifica
las contraseñas. En este caso el backend está hecho en **Laravel** y vive en **otro
repositorio**; aquí no hay servidor de base de datos ni rutas de API propias.

Objetivo: dar una interfaz moderna, con identidad institucional del **SENA**, por la que
una persona pueda registrarse, iniciar sesión, verificar su correo, recuperar su
contraseña y luego usar los módulos del simulador (convocatorias, documentos, evaluación,
selección,etc.), según los permisos que tenga asignados.

---

## 2. Conceptos mínimos para entenderlo

| Concepto | Explicación sencilla |
|---|---|
| **HTML** | La estructura de la página (títulos, párrafos, botones). Es el "esqueleto". |
| **CSS** | El aspecto: colores, tamaños, espacios, fuentes. |
| **JavaScript (JS)** | El comportamiento: qué pasa cuando el usuario hace clic o escribe. |
| **JSX** | Mezcla de HTML y JavaScript. Ejemplo: `<p className="rojo">Hola</p>`. |
| **React** | Librería que permite crear la interfaz por piezas reutilizables (componentes). |
| **Componente** | Una pieza de pantalla. Ej.: un botón, una tarjeta, un menú. Se reutiliza. |
| **Props** | Datos que un componente padre le pasa a un hijo. |
| **Estado (state)** | Información que puede cambiar mientras la app está abierta. Ej.: `{ oscuro: true }`. |
| **Hook** | Función de React para usar estado o efectos. Los de este proyecto son `useAuth`, `useTema`, `useCuentaAtras`. |
| **SPA** (*Single Page Application*) | App de una sola página: no se recarga todo al navegar, solo cambia la parte necesaria. |
| **Ruta** | Dirección interna de la app: `/login`, `/documentos`, etc. Decide qué pantalla se ve. |
| **Layout** | Plantilla base: el "esqueleto" que se repite (por ejemplo, menú lateral + barra superior + contenido). |
| **Vite** | Herramienta que sirve el código mientras lo desarrollo (rápido, recarga al guardar) y que lo compila para producción. |
| **Tailwind CSS** | Framework de estilos: se escribe con clases utilitarias (`bg-white`, `text-sm`) en vez de CSS propio. |
| **npm** | Gestor de paquetes: instala las librerías que el proyecto necesita. |
| **Node.js** | Programa que permite ejecutar JavaScript fuera del navegador. Necesario para `npm`. |
| **Build** | Convertir el código de desarrollo en archivos optimizados para internet (`dist/`). |
| **Autenticación** | Proceso de comprobar quién es el usuario (correo + contraseña). |
| **Sesión** | Estado de "ya estoy logueado" que el servidor recuerda por un tiempo. |
| **Cookie `HttpOnly`** | Archivo que el navegador guarda y envía solo, al que JavaScript **no** puede leer. Así se guarda la sesión de forma segura. |
| **CSRF** | Protección contra ataques que hacen enviar peticiones desde sitios falsos. |
| **Permiso** | Derecho que tiene un usuario (ej.: `documentos:validar`) para ver Certainas pantallas. |
| **localStorage** | Memoria del navegador que sobrevive al cerrar la app. Aquí guarda la preferencia de tema. |
| **sessionStorage** | Como el anterior, pero se borra al cerrar la pestaña. Aquí se recuerda que ya te enviaron un código. |
| **Contraste (ratio)** | Medida de legibilidad entre el color de un texto y su fondo. Si es muy baja, el texto no se lee. |
| **Linter** | Programa que revisa el código y avisa de errores o malas prácticas. |

---

## 3. Tecnologías utilizadas

Versiones exactas tomadas de `package.json`:

| Tecnología | Versión | Para qué sirve |
|---|---|---|
| **React** | `^19.2.8` | Construir la interfaz por componentes. |
| **react-dom** | `^19.2.8` | Montar React en la página (`main.jsx`). |
| **react-router-dom** | `^7.18.4` | Navegación y rutas (`router.jsx`). |
| **Vite** | `^8.3.0` | Servidor de desarrollo y compilador de producción. |
| **@vitejs/plugin-react** | `^6.1.1` | Permite que Vite entienda JSX. |
| **Tailwind CSS** | `^4.3.3` | Estilos con clases utilitarias. |
| **@tailwindcss/vite** | `^4.3.3` | Conecta Tailwind con Vite. |
| **Axios** | `^1.20.0` | Cliente HTTP para hablar con el backend. |
| **Oxlint** | `^1.81.0` | Revisión automática del código. |
| **Work Sans** | (Google Fonts) | Tipografía institucional del SENA. |
| **Laravel + Sanctum** | (otro repo) | Backend: usuarios, sesiones, permisos, códigos de verificación. |

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

## 5. Instalación paso a paso

### 5.1 Requisitos previos

| Programa | Para qué | Descarga |
|---|---|---|
| **Node.js** (LTS, 20 o superior) | Ejecutar `npm` y Vite | <https://nodejs.org> |
| **Git** | Clonar el repositorio | <https://git-scm.com> |
| **VS Code** (recomendado) | Editar el código | <https://code.visualstudio.com> |

Comprueba que están instalados (PowerShell o terminal):

```bash
node --version
npm --version
git --version
```

Cada uno debe mostrar un número, por ejemplo `v22.11.0`, `10.9.0`, `2.47.1`.

### 5.2 Clonar el proyecto

```bash
git clone https://github.com/SPGTH-2026/simulador-gestion-talento-humano-frontend.git
cd simulador-gestion-talento-humano-frontend
```

### 5.3 Instalar las dependencias

```bash
npm install
```

Descarga todo lo de `node_modules/`. La primera vez puede tardar 1–2 minutos. Después,
las siguientes instalaciones son casi instantáneas.

### 5.4 Crear tu archivo de configuración

```bash
# Windows (PowerShell o CMD)
copy .env.example .env

# Linux o macOS
cp .env.example .env
```

### 5.5 Levantar el servidor de desarrollo

```bash
npm run dev
```

Salida esperada:

```text
  VITE v8.3.1  ready in 300 ms
  ➜  Local:   http://localhost:5173/
```

Abre **<http://localhost:5173/login>** en el navegador.

> ⚠️ **Usa siempre `localhost`, nunca `127.0.0.1`.** Las cookies de sesión distinguen
> el nombre del host y las dos direcciones **no** comparten sesión. Explicado en el
> [capítulo 21](#21-solución-de-problemas-frecuentes).

### 5.6 (Opcional) Levantar el backend

Este repositorio es solo el frontend. Para que el login funcione hace falta el proyecto
Laravel corriendo en `http://localhost:8000`. Sin él, la app carga pero muestra el aviso
"No pudimos conectarnos. Inténtalo de nuevo en un momento."

---

## 6. Configuración del entorno (.env)

Un archivo `.env` guarda valores que cambian según la máquina. Está en `.gitignore`
porque **nunca debe subirse a Git**.

`.env.example` es la plantilla (esta sí se sube, y no tiene secretos):

```env
# Backend Laravel + Sanctum.
# Copia este archivo a '.env' y ajusta los valores.
# OJO: usa siempre 'localhost', NUNCA '127.0.0.1'. Las cookies distinguen host
# y las dos direcciones no comparten sesión.
VITE_API_URL=http://localhost:8000/api
VITE_CSRF_URL=http://localhost:8000/sanctum/csrf-cookie
VITE_GOOGLE_URL=http://localhost:8000/api/auth/google/redirect
```

| Variable | Qué significa | Valor por defecto en el código |
|---|---|---|
| `VITE_API_URL` | Dirección base de la API. **Incluye `/api`.** | `http://localhost:8000/api` |
| `VITE_CSRF_URL` | Endpoint que entrega la cookie CSRF. **No** está bajo `/api`. | `http://localhost:8000/sanctum/csrf-cookie` |
| `VITE_GOOGLE_URL` | A dónde enviar al usuario para entrar con Google. | `http://localhost:8000/api/auth/google/redirect` |

**Reglas importantes:**

- El prefijo `VITE_` es obligatorio: solo las variables así nombradas llegan al navegador.
- **Nunca pongas aquí contraseñas, llaves privadas ni tokens.** Todo lo `VITE_*` es
  público: cualquiera que abra las herramientas del navegador puede leerlo.
- Los valores por defecto están escritos también en el código (`client.js`), así que
  si no creas `.env` la app arranca igual con esos valores.
- Si cambias los valores, **reinicia** `npm run dev`.

---

## 7. Scripts disponibles

Definidos en `package.json`. Se ejecutan con `npm run <nombre>`.

| Comando | Qué hace | Cuándo usarlo |
|---|---|---|
| `npm run dev` | Levanta el servidor de desarrollo con recarga automática. | Siempre mientras programas. |
| `npm run build` | Compila y optimiza todo para producción en `dist/`. | Antes de publicar. |
| `npm run preview` | Sirve en local la versión ya compilada de `dist/`. | Comprobar el resultado real antes de publicar. |
| `npm run lint` | Revisa el código con Oxlint y avisa de problemas. | Antes de crear un commit. |

> Este proyecto **no** tiene script de tests automatizados ni de comprobación de tipos.
> La verificación se hace con `lint` + `build` + revisión manual en el navegador.

---

## 8. Arquitectura: cómo se arma una pantalla

### 8.1 El orden de arranque

Cuando abres la app en el navegador ocurre esto:

```text
1. El navegador pide index.html al servidor de Vite
2. Se ejecuta el script anti-parpadeo  →  decide el tema ANTES de pintar nada
3. El navegador ejecuta src/main.jsx
4. main.jsx monta el árbol de React dentro de <div id="root">
5. AuthProvider lanza GET /auth/me  →  "¿hay sesión?"
6. Mientras tanto se ve "Cargando..."
7. Cuando /auth/me responde, authResolved pasa a true
8. router.jsx decide qué pantalla mostrar según usuario + permisos
```

**`main.jsx` (completo y real):**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import { AuthProvider } from './auth/AuthContext'
import AppRouter from './router'

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

Lee así: `StrictMode` activa las comprobaciones de desarrollo de React; `BrowserRouter`
gestiona las direcciones de la barra del navegador; `AuthProvider` envuelve **toda** la
app para que cualquier componente pueda saber quién es el usuario; y `AppRouter` (que es
`router.jsx`) dibuja la pantalla que corresponda.

### 8.2 La cadena de componentes de una pantalla interna

Cuando un usuario ya entró y abre, por ejemplo, `/documentos`:

```text
main.jsx
└── AuthProvider            (¿quién soy?)
    └── AppRouter           (router.jsx: ¿qué pantalla es?)
        └── ProtectedRoute   (¿tengo sesión? ¿verifiqué mi correo?)
            └── PermissionRoute  (¿tengo el permiso documentos:ver?)
                └── AppLayout      (el esqueleto: menú + barra + hueco para el contenido)
                    ├── Sidebar
                    ├── Topbar
                    └── DocumentosListado   (el contenido que la persona pidió)
```

Cada capa es una "puerta": si la persona no pasa la puerta, la siguiente capa ni se
monta. Por eso los componentes de contenido **no** necesitan revisar sesión ni permisos:
ya están protegidos por lo que los envuelve.

---

## 9. Autenticación y sesiones

### 9.1 Cómo se guarda la sesión

El backend usa **Laravel Sanctum** con **cookies de sesión**, no con un token guardado en
el navegador por JavaScript.

- Al entrar, el backend crea la sesión y deja una cookie `HttpOnly` (el navegador la
  guarda y la manda sola, pero JavaScript no puede leerla).
- En cada petición, Axios envía esa cookie gracias a `withCredentials: true`.
- Para poder escribir (enviar formularios), hace falta además la cookie `XSRF-TOKEN`,
  que Sanctum usa como protección CSRF.
- El backend refresca la sesión de 120 minutos cada vez que se llama a `/auth/me`
  (el backend lo llama "latido").

**¿Por qué no un token en `localStorage`?** Un token guardado ahí queda accesible si un
atacante logra inyectar código en la página. La cookie `HttpOnly` no.

### 9.2 Los endpoints que usa el frontend (`src/api/auth.js`)

| Función en el código | Petición | Respuesta |
|---|---|---|
| `register(datos)` | `POST /auth/register` | `201 { user }` (además inicia sesión) |
| `login(email, password)` | `POST /auth/login` | `200 { user }` / `422 { errors }` |
| `me()` | `GET /auth/me` | `{ user }` o `401` si no hay sesión |
| `logout()` | `POST /auth/logout` | `{ message }` |
| `forgotPassword(email)` | `POST /auth/forgot-password` | `{ message }` |
| `resetPassword(datos)` | `POST /auth/reset-password` | `{ message }` |
| `sendVerification()` | `POST /auth/verification/send` | `{ message }` |
| `confirmVerification(code)` | `POST /auth/verification/confirm` | `{ ok: true }` |

Todas empiezan por `VITE_API_URL` (que ya incluye `/api`).

> **Seguridad en el envío de códigos.** `forgotPassword` responde **igual** exista o no
> el correo, para que nadie pueda adivinar qué correos están registrados. Por eso la
> pantalla siempre avanza al paso 2 sin comprobar nada.

### 9.3 El estado global (`src/auth/AuthContext.jsx`)

`AuthProvider` guarda tres cosas y expone cinco funciones:

| Valor / función | Qué es |
|---|---|
| `user` | El usuario conectado, o `null` si no hay nadie. |
| `authResolved` | ¿Ya se terminó de preguntar al backend? Mientras sea `false` no se dibuja nada. |
| `errorRed` | Texto para mostrar si **no hubo respuesta** del servidor (está caído). |
| `login(email, password)` | Inicia sesión y guarda el usuario. |
| `register(form)` | Crea la cuenta e inicia sesión. |
| `logout()` | Cierra sesión (aunque el backend falle, se limpia el navegador). |
| `refrescar()` | Vuelve a pedir `/auth/me` (se usa tras verificar el correo). |

**Regla importante:** un `401` significa "no hay sesión" → se cierra en el navegador, es
normal. Pero si **no hay respuesta** (servidor caído) **no** se cierra la sesión: se
muestra `errorRed`. Confundir esos dos casos dejaría al usuario fuera de la app por un
fallo de red.

**Sesión expirada en cualquier momento:** `client.js` detecta un `401` en cualquier
petición y lanza un evento `auth:expirada`; `AuthContext` lo escucha y pone `user` a
`null`, lo que hace que el router lo mande a `/login`.

### 9.4 El registro (`pages/login/Registro.jsx`)

Solo pide **tres campos**: nombre completo, correo y contraseña. El envío es
`POST /auth/register` y el backend ya devuelve la sesión iniciada, por eso el contexto
guarda el usuario y `AuthLayout` manda a `/verificar-correo` (el correo aún no está
verificado).

### 9.5 La verificación del correo (`pages/login/VerificarCorreo.jsx`)

1. Se pide el código: `POST /auth/verification/send`.
2. La persona escribe el código de 6 dígitos: `POST /auth/verification/confirm`.
3. Al confirmarse, se llama a `refrescar()` para que el contexto tenga
   `email_verified: true`; si no, `ProtectedRoute` devolvería a la persona aquí
   mismo.
4. Hay botón de reenviar con cuenta regresiva y opción de cerrar sesión.

**Límites del backend:** el código dura **10 minutos**, se envía como máximo **3 por
minuto** y **10 por hora**. Al pedir uno nuevo, el anterior queda invalidado.

**`lib/otpSesion.js`** guarda en `sessionStorage` (clave `spgth:otp:<pantalla>`) que ya
se envió un código, para que recargar la página (`F5`) no gaste un envío. Se usa
`sessionStorage` y no `localStorage` a propósito: el registro debe morir al cerrar la
pestaña.

### 9.6 Recuperar contraseña (`pages/login/RecuperarContrasena.jsx`)

Son **dos pasos dentro de la misma pantalla** (no un enlace por correo):

- **Paso 1:** se escribe el correo → `forgotPassword` → el backend manda un **código de
  6 dígitos** por correo. Se avanza siempre al paso 2 (respuesta anti-enumeración). El
  correo se muestra enmascarado (`jua***@ejemplo.com`) con `enmascararEmail()`.
- **Paso 2:** se escriben el código, la nueva contraseña y su confirmación →
  `resetPassword({ email, code, password, password_confirmation })`.
  - Validaciones en el navegador: mínimo 8 caracteres con letras y números
    (`REGLA_PASSWORD`), y que las dos contraseñas coincidan.
  - Al terminar, el backend cierra **todas** las sesiones, así que se vuelve a
    `/login?contrasena=restablecida`, que muestra un aviso de éxito.

**Reintentos con límite de tasa:** cuando el backend responde `429`, `api/reintento.js`
lee la cabecera `Retry-After` (o `X-RateLimit-Reset`) y `useCuentaAtras` bloquea el
botón durante ese número de segundos.

### 9.7 Entrar con Google

- Botón "Entrar con Google" en `Login.jsx` que hace `window.location.href =
  VITE_GOOGLE_URL`. Es una navegación completa a propósito (no un `fetch`): el backend
  lleva a Google y luego Google devuelve al usuario a la app.
- Al volver, el backend puede añadir `?error=...` a la dirección. `Login.jsx` traduce
  esos códigos a textos claros: `oauth`, `sin_correo`, `correo_en_uso`, `desactivado`.
- También puede venir `?contrasena=...` para confirmar que la contraseña se cambió.

---

## 10. Permisos y rutas protegidas

### 10.1 De dónde salen los permisos

El backend guarda en el usuario un array `permissions` (ej.: `['documentos:ver',
'documentos:validar']`). `useAuth.js` lo expone con dos helpers:

```js
can('documentos:validar')                     // ¿tiene este permiso exacto?
hasAny(['evaluacion:ver', 'seleccion:ver'])   // ¿tiene al menos uno de estos?
```

Si el usuario no tiene el array, `useAuth.js` usa `permissions = []` (permite seguir
funcionando sin romper nada).

### 10.2 `ProtectedRoute.jsx` — la puerta de la sesión

Se usa en las tres reglas:

1. Si `authResolved` es `false` → muestra "Cargando..." (no decide nada todavía).
2. Si hay `errorRed` → muestra el aviso de red.
3. Si no hay `user` → redirige a `/login` guardando en `state.from` a dónde quería ir.
4. Si el usuario existe pero `email_verified` es `false` → solo se le permite
   `/verificar-correo`; cualquier otra ruta lo devuelve allí.

### 10.3 `PermissionRoute.jsx` — la puerta de cada módulo

Recibe un permiso (o una lista) y decide:

```jsx
export default function PermissionRoute({ permiso }) {
  const { hasAny } = useAuth()
  const lista = Array.isArray(permiso) ? permiso : [permiso]
  if (!hasAny(lista)) return <Forbidden />
  return <Outlet />
}
```

**Detalle de diseño importante:** cuando falta el permiso se **renderiza** el componente
`Forbidden` (la pantalla 403), no se redirige. Así el mensaje 403 aparece dentro del
layout que corresponde.

> **Regla del proyecto:** los códigos de permiso son información interna y **jamás** se
> muestran al usuario. Se usan solo para decidir qué se ve. Por eso `PaginaVacia` ya no
> imprime el permiso que le pasan, y las páginas no lo muestran en su título.

### 10.4 El menú también se filtra (`config/menu.js`)

`Sidebar` aplica `can()` a cada opción antes de dibujarla (`filtrarMenu`). Un módulo con
hijos (por ejemplo "Gestión Documental") se muestra si al usuario le queda **al menos un**
hijo visible; si no, desaparece el grupo entero. Por eso con todos los permisos abiertos
el menú es largo y necesita barra de desplazamiento.

---

## 11. Identidad visual SENA

El proyecto sigue el **Manual de Identidad Visual SENA 2024** (Resolución 1825 de 2024).
Todo está declarado en `src/index.css`, en el bloque `@theme` de Tailwind v4.

### 11.1 Colores del modo claro

| Token | HEX | Uso |
|---|---|---|
| `--color-sena` | `#39a900` | Verde institucional, el color principal del logosímbolo. Botones, acentos, franja de la tarjeta, ítem activo del menú. |
| `--color-sena-oscuro` | `#007832` | Verde oscuro. Botones primarios y estados `hover`. |
| `--color-sena-azul` | `#00304d` | Azul oscuro institucional. Títulos y textos de los formularios. |
| `--color-sena-violeta` | `#71277a` | Violeta institucional (complementario). |
| `--color-sena-amarillo` | `#fdc300` | Amarillo institucional. |
| `--color-sena-cielo` | `#50e5f9` | Azul claro. Fondo suave detrás de la tarjeta de login. |

Gracias a `@theme`, cada uno genera clases: `bg-sena`, `text-sena-azul`,
`border-sena-cielo`… y admite opacidad con la barra: `bg-sena/10`.

### 11.2 Colores del modo oscuro

Derivados del azul institucional. Se eligieron **por contraste medido**, no por gusto:

| Token | HEX | Uso | Contraste sobre `#00304d` |
|---|---|---|---|
| `--color-sena-noche` | `#00121f` | Fondo general, más profundo que las tarjetas. | — |
| `--color-sena-superficie` | `#00304d` | Tarjetas, barra superior, menús. | — |
| `--color-sena-superficie-alta` | `#0a3a5c` | Estados `hover`. | — |
| `--color-sena-borde` | `#14506f` | Bordes para separar. | — |
| `--color-sena-texto` | `#e8f0f7` | Texto principal. | **11.92:1** |
| `--color-sena-texto-suave` | `#9fb8cc` | Texto secundario. | **6.67:1** |
| `--color-sena-acento` | `#5fdd0a` | Acento verde para texto y enlaces. | **7.73:1** |

**Por qué un verde "acento" distinto.** El verde institucional `#39a900` da **4.48:1**
sobre `#00304d`: se queda muy justo por debajo del 4.5:1 que exige la norma de
accesibilidad para texto normal. Se usa tal cual en superficies grandes (franja, botón
sólido, ítem activo) y para **texto** se cambia a `#5fdd0a`, que sí cumple con holgura.

### 11.3 Tipografía

- **Work Sans** (tipografía institucional), cargada desde Google Fonts en `index.html`.
- Declarada en `@theme` como `--font-sans`, con alternativas del sistema por si el
  navegador no puede bajar la fuente: `-apple-system`, `BlinkMacSystemFont`,
  `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`, `sans-serif`.

### 11.4 Logosímbolo

- Archivo: `public/logo-sena.svg`.
- `components/ui/LogoSena.jsx` lo pinta con `mask-image`, así que **hereda el color del
  texto** y se puede reutilizar en cualquier color: `text-sena` en la tarjeta clara,
  blanco sobre el menú.
- En la tarjeta de acceso mide **64×64 px** (`h-16 w-16`), centrado encima del título.
- En el menú lateral mide **52×52 px** (`size-[52px]`), por encima del mínimo de 50 px que
  exige el manual, y sin deformar la geometría original. Va con el texto "SPGTH" al lado.

---

## 12. Modo claro/oscuro

Funciona con **tres piezas** que se reparten el trabajo.

### 12.1 Pieza 1 — el script anti-parpadeo (`index.html`)

Está dentro de `<head>` y **antes** del `<script type="module">` de Vite, así que se
ejecuta antes de que se pinte nada en pantalla:

```js
;(function () {
  try {
    var guardado = localStorage.getItem('spgth-tema')
    var oscuro = guardado
      ? guardado === 'oscuro'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', oscuro)
    document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light'
  } catch (e) {}
})()
```

Qué hace, paso a paso:

1. Lee la preferencia guardada en `localStorage`, clave **`spgth-tema`**.
   - Si hay valor: `'oscuro'` activa el modo oscuro, `'claro'` lo desactiva.
   - Si no hay valor (primera visita): pregunta al sistema operativo.
2. Pone o quita la clase `dark` en `<html>`.
3. Ajusta `colorScheme`, que es la propiedad que hace que los controles nativos del
   navegador (cuadros de texto, barras de desplazamiento del sistema) también se pinten
   oscuros. Sin esto, el tema quedaría "a medias".
4. Todo va dentro de `try/catch`: si el navegador tiene el almacenamiento bloqueado, la
   app **no** se rompe.

**¿Por qué esto es necesario?** Sin este script, el navegador pintaría primero el fondo
por defecto (blanco) y un instante después React aplicaría el modo oscuro. Ese parpadeo
se llama *flash* o **FOUC**. Con el script, la clase `dark` ya está puesta en el primer
píxel.

### 12.2 Pieza 2 — la variante `dark` de Tailwind (`src/index.css`)

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Por defecto Tailwind resuelve `dark:` con `prefers-color-scheme` (la preferencia del
sistema). Eso **no** sirve aquí, porque el botón tiene que poder forzar el tema en
cualquier momento. Esta línea cambia el significado de `dark:` a "cuando el elemento
está dentro de `.dark`". Así, `dark:bg-sena-superficie` responde a la clase que puso el
script, no al sistema.

### 12.3 Pieza 3 — el hook `lib/useTema.js`

```js
const { oscuro, alternar, siguiendo } = useTema()
```

| Valor | Significa |
|---|---|
| `oscuro` | `true` si el tema activo es el oscuro. |
| `alternar()` | Cambia el tema, lo aplica al DOM y lo guarda. |
| `siguiendo` | `true` mientras no haya elección manual (estamos escuchando al sistema). |

Cómo está construido:

- **Estado inicial:** lee `document.documentElement.classList.contains('dark')`, es
  decir, **lee lo que ya está en el DOM** en lugar de recalcularlo. Si el hook
  recalculara por su cuenta, podría discrepar del script en el primer render.
- **Al pulsar el botón:** invierte el estado, aplica la clase y el `colorScheme` al DOM,
  guarda `'oscuro'` o `'claro'` en `localStorage` y pone `siguiendo = false`.
- **Escucha al sistema:** con un `useEffect` se suscribe al evento `change` de
  `matchMedia('(prefers-color-scheme: dark)')`. Si el sistema pasa a oscuro, la app se
  pone oscura al instante. Y viceversa.

**La regla de oro:** la elección manual **manda** sobre el sistema. Una vez que la
persona pulsa el botón, la app deja de seguir al sistema operativo.

### 12.4 El botón (`components/ThemeToggle.jsx`)

- Solo aparece en la **barra superior** (`Topbar`), no en las pantallas públicas.
- Dibuja un SVG de sol (24×24 px de caja, trazo de 1.5) o de luna, según el estado.
- Accesible: `aria-pressed` refleja el estado, y `aria-label` + `title` cambian entre
  "Cambiar a modo oscuro" y "Cambiar a modo claro". Los SVG llevan `aria-hidden` para
  que el lector de pantalla anuncie solo el botón, no el dibujo.

### 12.5 Comportamiento esperado

| Situación | Qué pasa |
|---|---|
| Primera visita (sin preferencia guardada) | Se respeta el tema del sistema. |
| Se pulsa el botón | Se guarda la preferencia y deja de seguir al sistema. |
| Se recarga la página | El script aplica el tema antes de pintar: **sin parpadeo**. |
| Se cambia el tema del sistema y **no** hay preferencia manual | La app cambia sola. |
| Se cambia el tema del sistema y **sí** hay preferencia manual | La app **no** cambia. |

---

## 13. Barras de desplazamiento personalizadas

Dos clases en `src/index.css`, aplicadas a los dos únicos contenedores que desplazan.

### 13.1 Qué se aplica y dónde

| Clase | Se aplica en | Elemento |
|---|---|---|
| `.scroll-sena-lateral` | `components/Sidebar.jsx` | el `<nav>` del menú |
| `.scroll-sena-contenido` | `layouts/AppLayout.jsx` | el `<main>` de contenido |

### 13.2 Características

- **Se declaran las dos cosas.** `scrollbar-width` + `scrollbar-color` (Firefox y
  navegadores modernos) **y** los pseudo-elementos `::-webkit-scrollbar` (Chrome, Edge,
  Safari, Opera). Con una sola de las dos, la barra se ve plana en unos navegadores o
  directamente no existe en otros.
- **Pista transparente** (`background: transparent`): no se ve el canal de la barra.
- **Grosor 6 px** y **pulgar redondeado** (`border-radius: 9999px`).
- El `hover` (y el `:focus-within`) sube la **opacidad**, no el grosor: cambiar el ancho
  de la barra alteraría el cálculo del diseño y la página "saltaría".

### 13.3 Colores elegidos por contraste

| Contexto | Fondo | Color del pulgar | Contraste |
|---|---|---|---|
| Menú lateral (tema claro) | `#1e293b` | `rgba(57,169,0,0.55)` → `#39a900` al pasar el ratón | **4.77:1** |
| Contenido (tema claro) | `#f8fafc` | `rgba(0,120,50,0.50)` → `#007832` al pasar el ratón | El verde claro daba solo 2.93:1, insuficiente |
| Contenido (tema oscuro) | `#00121f` | `rgba(57,169,0,0.60)` → `#39a900` al pasar el ratón | **6.19:1** |

Por eso el contenido claro usa el **verde oscuro** y el oscuro vuelve al verde
institucional: en el fondo oscuro el verde claro sí tiene contraste suficiente.

### 13.4 El detalle que hace funcionar el menú

En `Sidebar.jsx` el `<nav>` lleva `min-h-0`. Sin esa clase, un elemento flexible en
columna no baja de su altura mínima: el contenido se **desbordaría** hacia abajo en vez
de generar barra, y las últimas opciones quedarían inalcanzables cuando el usuario tiene
muchos permisos. Con `min-h-0` + `flex-1` + `overflow-y-auto`, el nav es el único que
desplaza y el logo de arriba queda fijo.

---

## 14. Componentes principales

| Componente | Qué hace |
|---|---|
| **`components/ui/LogoSena.jsx`** | Logosímbolo del SENA. Usa `mask-image` con el SVG de `public/` para poder pintarlo del color que se le pida. |
| **`components/ui/TarjetaAuth.jsx`** | Envoltura de las pantallas públicas: centra una tarjeta de ancho máximo 28rem, con franja verde superior de 8 px, logo centrado, título "SPGTH" y subtítulo "Simulador de Procesos de Gestión de Talento Humano". |
| **`components/ui/PaginaVacia.jsx`** | Placeholder de módulo sin construir: título y "Página en construcción". **No muestra el código de permiso.** |
| **`components/Sidebar.jsx`** | Menú lateral de 16rem (`w-64`), fondo `slate-800` en claro y `sena-noche` en oscuro. Arriba, logo de 52 px + "SPGTH". Debajo, el nav con la barra verde. Filtra las opciones con `can()`. |
| **`components/SidebarItem.jsx`** | Una opción del menú. Si tiene hijos, los muestra como submenú. El ítem activo se pinta de **verde institucional** (`bg-sena text-white`). |
| **`components/Topbar.jsx`** | Barra superior de 4rem. De izquierda a derecha: botón de tema, campana de notificaciones (solo con permiso `propio:notificaciones`), nombre del usuario con su rol traducido a texto legible, y botón "Cerrar sesión". |
| **`components/ThemeToggle.jsx`** | Botón sol/luna. Solo en la barra superior. |

**Sobre el logo y los modos de color:** el manual autoriza la versión negativa (blanca)
del logosímbolo sobre fondos oscuros para garantizar el contraste; por eso en el menú
aparece en blanco.

**Sobre el texto del rol:** `Topbar` traduce claves como `revisor_documental` a
"Revisor documental" (cambia los guiones bajos por espacios y pone mayúscula inicial).

---

## 15. Páginas y rutas

Todo el mapa de rutas vive en `src/router.jsx`.

### 15.1 Pantallas públicas (`AuthLayout`)

| Ruta | Componente | Qué hace |
|---|---|---|
| `/login` | `login/Login.jsx` | Iniciar sesión con correo y contraseña, o entrar con Google. |
| `/registro` | `login/Registro.jsx` | Crear cuenta (nombre, correo, contraseña). |
| `/recuperar` | `login/RecuperarContrasena.jsx` | Recuperar contraseña en 2 pasos con código de 6 dígitos. |

`AuthLayout` envuelve a las tres en `TarjetaAuth` y además:

- Muestra "Cargando..." mientras `authResolved` es `false`.
- Si hay `errorRed`, muestra el aviso dentro de la tarjeta.
- **Si ya hay sesión, no deja ver estas pantallas**: redirige a `/` (si el correo está
  verificado) o a `/verificar-correo`.

### 15.2 Verificación de correo

| Ruta | Componente | Notas |
|---|---|---|
| `/verificar-correo` | `login/VerificarCorreo.jsx` | **Fuera de `AppLayout` a propósito.** Si compartiera layout con las rutas de negocio, el ciclo "te mando a verificar → el layout te devuelve a verificar" sería infinito. |

### 15.3 Pantallas internas (`AppLayout`) — cada una con su permiso

| Ruta | Componente | Permiso |
|---|---|---|
| `/` | `dashboard/Dashboard.jsx` | `dashboard:ver` |
| `/convocatorias` | `convocatorias/ConvocatoriasListado.jsx` | `convocatorias:ver` |
| `/convocatorias/nueva` | `convocatorias/ConvocatoriaNueva.jsx` | `convocatorias:gestionar` |
| `/documentos` | `documentos/DocumentosListado.jsx` | `documentos:ver` |
| `/documentos/cargar` | `documentos/DocumentoCargar.jsx` | `documentos:cargar` |
| `/documentos/validacion` | `documentos/DocumentoValidacion.jsx` | `documentos:validar` |
| `/evaluacion` | `evaluacion/EvaluacionListado.jsx` | `evaluacion:ver` |
| `/evaluacion/evaluar` | `evaluacion/EvaluacionEvaluar.jsx` | `evaluacion:evaluar` |
| `/seleccion` | `seleccion/SeleccionRanking.jsx` | `seleccion:ver` |
| `/seleccion/decidir` | `seleccion/SeleccionDecidir.jsx` | `seleccion:decidir` |
| `/usuarios` | `usuarios/Usuarios.jsx` | `usuarios:gestionar` |
| `/reportes` | `reportes/Reportes.jsx` | `reportes:ver` |
| `/supervision` | `supervision/Supervision.jsx` | `supervision:gestionar` |
| `/mis-postulaciones` | `aspirante/MisPostulaciones.jsx` | `propio:postulaciones` |
| `/mis-documentos` | `aspirante/MisDocumentos.jsx` | `propio:documentos` |
| `/mis-evaluaciones` | `aspirante/MisEvaluaciones.jsx` | `propio:evaluaciones` |
| `/notificaciones` | `aspirante/Notificaciones.jsx` | `propio:notificaciones` |
| `*` (cualquier otra) | `errores/NotFound.jsx` | — (404) |

> **`/notificaciones` no aparece en el menú lateral**, a propósito: se abre desde la
> campana de la barra superior (`config/menu.js` lo indica en un comentario).

### 15.4 Pantalla de "sin permiso"

**No hay una ruta `/403`.** `Forbidden.jsx` no está en `router.jsx`: es
`PermissionRoute.jsx` quien lo **dibuja** cuando al usuario le falta el permiso, y lo
hace dentro del layout que corresponde.

`Forbidden.jsx` muestra un `403` grande, "No tienes permiso para ver esta página." y un
botón "Volver al inicio".

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

## 17. Estilos con Tailwind CSS

Tailwind v4 se configura desde el propio CSS, sin `tailwind.config.js`.

```css
@import "tailwindcss";

@theme {
  --font-sans: "Work Sans", ...;
  --color-sena: #39a900;
  /* ... */
}

@custom-variant dark (&:where(.dark, .dark *));
```

- `@import "tailwindcss"` carga el motor.
- `@theme` **declara variables que además generan utilidades**: `--color-sena-azul`
  crea `bg-sena-azul`, `text-sena-azul`, `border-sena-azul`…
- `@custom-variant` define cómo se activa `dark:`.

Los estilos de las barras de desplazamiento están al final de `index.css`, en CSS plano
porque son pseudo-elementos que Tailwind no genera.

---

## 18. Desarrollo, calidad y buenas prácticas

### 18.1 Revisión de código

```bash
npm run lint
```

Oxlint revisa 47 archivos con 104 reglas en milisegundos. Estado actual:

```text
Found 1 warning and 0 errors.
Finished in 37ms on 48 files with 104 rules using 12 threads.
```

El único aviso es **preexistente** y está en `src/auth/AuthContext.jsx:4`:

```text
react(only-export-components): Fast refresh only works when a file only exports
components. Move your React context(s) to a separate file.
```

No es un error funcional: solo afecta a que el "recarga rápida" de React sea menos
precisa al guardar ese archivo. Se puede silenciar separando el `createContext` en su
propio archivo, pero **no es necesario** para que la app funcione.

### 18.2 Compilación

```bash
npm run build
```

Salida real de la última compilación:

```text
✓ 123 modules transformed.
dist/index.html                   1.64 kB │ gzip:   0.85 kB
dist/assets/index-XMqtM8a7.css   17.91 kB │ gzip:   4.24 kB
dist/assets/index-VCh_XfEf.js   344.89 kB │ gzip: 108.58 kB
✓ built in 354ms
```

Los nombres llevan un hash que cambia en cada compilación; sirve para que el navegador
no use una versión vieja cacheada.

### 18.3 Decisiones de diseño que conviene conocer

| Decisión | Por qué |
|---|---|
| `dark:` por clase y no por sistema | Para que el botón pueda forzar el tema sin depender del sistema operativo. |
| Script anti-parpadeo en `<head>` | Es la única forma de que el primer píxel ya salga con el tema correcto. |
| `localStorage` para el tema, `sessionStorage` para el código OTP | La preferencia de tema debe sobrevivir; un código de verificación **no** debe sobrevivir a la pestaña. |
| `min-h-0` en el nav del menú | Sin eso el menú se desborda en vez de desplazar y las últimas opciones quedan inalcanzables. |
| `Forbidden` se dibuja, no se redirige | Para que el 403 aparezca dentro del layout correcto. |
| `/verificar-correo` fuera de `AppLayout` | Evita un bucle de redirección con `ProtectedRoute`. |
| Códigos de permiso nunca visibles | Son información interna; solo sirven para decidir qué se ve. |
| `xsrfCookieName: null` y header manual | No depender de la versión de Axios instalada ni de su formato. |
| Un solo `GET` de cookie CSRF compartido | Evita pedirla N veces si salen varias escrituras a la vez. |
| Un 401 cierra sesión; un fallo de red no | Un problema de red no debe echar al usuario de la aplicación. |

### 18.4 Comentarios en el código

El código tiene comentarios explicativos, escritos sobre todo en español en componentes
y pantallas, y algunos en inglés en `api/` y `auth/`. Explican el **porqué** de decisiones
que no se deducen leyendo la línea (por ejemplo, por qué `min-h-0` es imprescindible o
por qué no se puede decodificar la cookie CSRF).

### 18.5 Seguridad

- `.env` está en `.gitignore` (junto a `.env.local` y `.env.*.local`) y **no está en
  ningún commit** del repositorio. Solo se sube `.env.example`, que no tiene secretos.
- La sesión viaja en cookie `HttpOnly`: JavaScript no puede leerla.
- Protección CSRF activa en todas las peticiones que escriben.
- Nunca se guardan tokens de usuario en el navegador.
- Los mensajes que ve el usuario pasan por `mensajeError()`, nunca son errores crudos.
- **Los textos no dan indicaciones técnicas.** Cuando no hay conexión se dice "No pudimos
  conectarnos. Inténtalo de nuevo en un momento.", y no "Revisa que el backend esté
  corriendo". El diagnóstico técnico se queda en los comentarios del código, que es
  donde corresponde: el usuario no puede actuar sobre ello, y el desarrollador sí.

---

## 19. Cómo probar el proyecto

### 19.1 Rutas públicas (con `npm run dev` corriendo)

| Ruta | Resultado esperado |
|---|---|
| <http://localhost:5173/login> | 200 — formulario de acceso |
| <http://localhost:5173/registro> | 200 — formulario de registro |
| <http://localhost:5173/recuperar> | 200 — recuperación de contraseña |

> `/verificar-correo` **también** devuelve 200, pero al abrirla sin sesión
> `ProtectedRoute` te manda a `/login`. Es el comportamiento correcto.

### 19.2 Probar el modo oscuro

1. Abre <http://localhost:5173/login>.
2. Mira el aspecto: debe seguir el tema de tu sistema.
3. Entra a la aplicación y pulsa el botón sol/luna de la barra superior.
4. **Recarga con `F5`:** no debe haber ningún parpadeo.
5. Abre las herramientas del navegador (`F12`) → pestaña *Elementos* → `<html>`: debe
   tener `class="dark"` si el tema está oscuro.
6. En *Consola*, ejecuta `localStorage.getItem('spgth-tema')`: debe devolver
   `'oscuro'` o `'claro'`.
7. Cambia el tema del sistema operativo **sin** haber pulsado el botón: la app debe
   seguir al sistema.
8. Pulsa el botón para elegir el tema a mano, cambia el del sistema: la app **no** debe
   cambiar.

### 19.3 Probar el menú y la barra de desplazamiento

1. Entra como un usuario con **todos** los permisos: el menú queda largo.
2. Comprueba que el logo "SPGTH" de arriba **no se mueve** al desplazarse.
3. La barra del menú debe ser verde institucional, 6 px, sin canal visible.
4. Pasa el ratón por encima: la barra se vuelve verde sólido, sin cambiar de grosor.
5. Haz lo mismo en el contenido de la derecha.
6. Cambia a modo oscuro: la barra del contenido pasa de verde oscuro a verde claro.

### 19.4 Probar la compilación

```bash
npm run build
npm run preview
```

Abre la dirección que indique (por defecto <http://localhost:4173>) y comprueba que se
ve igual que en desarrollo, incluido el modo oscuro sin parpadeo.

---

## 20. Compilación y despliegue

### 20.1 Generar la versión de producción

```bash
npm run build
```

Crea la carpeta `dist/` con:

```text
dist/
├── index.html
└── assets/
    ├── index-<hash>.css
    └── index-<hash>.js
```

### 20.2 Publicar

Sube **el contenido de `dist/`** a cualquier servidor web estático: Nginx, Apache,
Netlify, Vercel, Cloudflare Pages o el hosting del SENA.

### 20.3 Configurar el servidor para una SPA

Como es una aplicación de una sola página, **toda** dirección desconocida debe devolver
`index.html` para que React pueda leer la ruta. En Nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Sin esto, recargar en `/documentos` daría error 404 del servidor, aunque la app
funcione.

### 20.4 Variables de entorno en producción

`VITE_*` se compila **dentro** del bundle en el momento de compilar. Si en producción
las direcciones son distintas, hay que definirlas **antes** de `npm run build` y volver
a compilar:

```bash
VITE_API_URL=https://api.ejemplo.gov.co/api npm run build
```

Cambiar el `.env` **después** de compilar no tiene ningún efecto hasta que se compile de
nuevo.

---

## 21. Solución de problemas frecuentes

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| Al entrar en `/login` se ve un aviso de que no pudimos conectarnos. | El backend Laravel no está corriendo, o está en otra dirección. | Levanta el backend, revisa `VITE_API_URL` en `.env` y reinicia `npm run dev`. |
| El login devuelve 401 aunque la contraseña sea correcta. | Se abrió la app en `127.0.0.1` y la sesión/cookies viven en `localhost`. | Usa siempre **<http://localhost:5173>**, nunca `127.0.0.1`. |
| Errores 419 (*CSRF token mismatch*). | Cookie `XSRF-TOKEN` ausente o no decodificada. | Comprueba `VITE_CSRF_URL` (sin `/api`) y que el backend tenga la sesión configurada. Borra las cookies del sitio y vuelve a entrar. |
| El tema oscuro parpadea al recargar. | El script de `index.html` se movió o cargó tarde. | Debe estar en `<head>` **antes** del `<script type="module">`. |
| El tema no se guarda al recargar. | El navegador bloquea el almacenamiento (modo privado estricto). | El código lo captura con `try/catch`: el tema funciona igual mientras la pestaña siga abierta. |
| El tema no cambia al cambiar el del sistema. | Hay una elección manual guardada. | Es lo esperado. No hay botón para volver a "seguir al sistema": hay que borrar `spgth-tema` de `localStorage` o volver a elegir a mano. |
| Una opción del menú no aparece. | Al usuario no le corresponde ese permiso; el backend lo manda. | Es correcto. Si debería aparecer, revisa los permisos del usuario en el backend. |
| El menú no hace scroll y las últimas opciones se cortan. | Falta `min-h-0` en el `<nav>` del `Sidebar`. | Ya está aplicado; si falla, revisa que no se haya perdido la clase. |
| Los textos salen con caracteres raros (Ã, Â). | Problema de codificación: el archivo se guardó en UTF-8 con BOM o en otra codificación. | Los archivos del proyecto están en **UTF-8 sin BOM**. No los guardes con "ANSI"/"Latin-1". |
| El aviso de `only-export-components` en el lint. | Preexistente en `AuthContext.jsx`. | Ignóralo o separa el contexto en su propio archivo. No afecta a la app. |
| `npm install` falla o no encuentra paquetes. | Caché de npm dañada o sin acceso a red. | `npm install` de nuevo; si persiste, borra `node_modules` y `package-lock.json` y reinstala. |

---

## 22. Glosario de términos

| Término | Significado sencillo |
|---|---|
| **Accesibilidad (a11y)** | Poder usar la app también con teclado o lector de pantalla. |
| **ARIA** | Atributos que describen un elemento para los lectores de pantalla (`aria-label`, `role="alert"`). |
| **Build** | Convertir el código de desarrollo en archivos optimizados para internet. |
| **Cache busting** | Poner un hash en el nombre del archivo para que el navegador descargue la versión nueva. |
| **Contraste (ratio)** | Medida de legibilidad entre texto y fondo. Por debajo de 4.5:1 el texto normal no cumple. |
| **Cookie `HttpOnly`** | Cookie que el navegador envía sola y que JavaScript no puede leer. |
| **CSRF** | Protección contra formularios falsos enviados desde otros sitios. |
| **DOM** | La estructura de la página tal como la ve el navegador. |
| **Envoltura / Wrapper** | Componente que rodea a otros para darles comportamiento común. |
| **Estado global** | Datos compartidos por toda la app sin pasarlos por props. |
| **Fake / código muerto** | Código que existe en el repo pero que nadie usa. Ya no queda ninguno: se borraron `App.jsx`, `App.css` y `src/assets/`. |
| **Flash (FOUC)** | Parpadeo al cargar por aplicar el tema tarde. Se evita con el script de `index.html`. |
| **Hash** | Identificador corto en el nombre de un archivo compilado. |
| **Hook** | Función de React para estado o efectos (`useAuth`, `useTema`, `useCuentaAtras`). |
| **HTTP 401 / 403 / 419 / 429** | 401 sin sesión · 403 sin permiso · 419 CSRF inválido · 429 demasiadas peticiones. |
| **`HttpOnly`** | Ver "Cookie `HttpOnly`". |
| **Lint** | Revisión automática del código. |
| **Máscara (`mask-image`)** | Truco para pintar un SVG de cualquier color. |
| **`min-h-0`** | Permite que un elemento flexible en columna pueda encogerse y generar barra de desplazamiento. |
| **OTP** | Código de un solo uso, de 6 dígitos, para verificar el correo. |
| **Permiso** | Derecho como `documentos:validar` que decide qué pantallas se ven. |
| **Props** | Datos que un componente padre pasa a un hijo. |
| **Sanctum** | Paquete de Laravel para sesiones por cookie con protección CSRF. |
| **SPA** | Aplicación de una sola página. |
| **Token** | Texto secreto que identifica una sesión (aquí viaja en cookie, no en `localStorage`). |
| **UI** | *User Interface*: la parte visual. |
| **Utilidad (Tailwind)** | Clase pequeña y reutilizable de estilo (`p-2`, `text-sm`). |

---

## 23. Historial de la rama

Rama de trabajo actual: **`feature/branding-sena`**, publicada en GitHub.

| Commit | Mensaje | Qué aporta |
|---|---|---|
| `47a34da` | `feat: autenticacion por sesion con cookie de Laravel Sanctum` | Sustituye la autenticación por token en el navegador por sesión con cookie `HttpOnly`. |
| `c2eeada` | `feat: paleta institucional SENA en la pantalla de login` | Colores, tipografía y logo del SENA en el acceso. |
| `2880345` | `feat: incorpora la identidad visual institucional SENA` | Logosímbolo, Work Sans, favicon, `lang="es"`, logo del menú. |
| `e22ce52` | `feat: armoniza los formularios publicos con la paleta SENA` | Login, registro, recuperar y verificar correo con el mismo estilo. |
| `73200ad` | `fix: completa el .gitignore tras reanclar la rama sobre main` | `.env` y derivados fuera del control de versiones. |
| `2784657` | `fix: oculta los permisos en las vistas y habilita el scroll del menu lateral` | Quita los 17 sitios que mostraban el código de permiso; hace que el menú desplace. |
| `747f360` | `feat: anade modo oscuro y toggle de tema` | Paleta oscura, script anti-parpadeo, `useTema`, `ThemeToggle` y variantes `dark:` en toda la app. |
| `48518ad` | `feat: estiliza las barras de desplazamiento con la paleta SENA` | `.scroll-sena-lateral` y `.scroll-sena-contenido`, con variante oscura. |
| `ef183f5` | `fix: elimina la clase dark duplicada en el formulario de registro` | Limpieza de una clase repetida en `Registro.jsx`. |
| `97b0d8c` | `fix: neutraliza el mensaje de error de conexion para el usuario` | Quita las indicaciones técnicas ("Revisa que el backend esté corriendo") de los dos mensajes de falta de conexión. |
| `0ec54ed` | `chore: elimina el codigo muerto de la plantilla de Vite` | Borra `App.jsx`, `App.css` y `src/assets/`. El CSS compilado baja de 19.83 kB a 17.91 kB. |

**Cómo se comprobó cada commit:** `npm run lint` sin errores, `npm run build`
correcto, rutas respondiendo 200 y revisión manual del resultado en el navegador.

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

## 25. `config/menu.js`: el menú y su filtrado

Este archivo de 46 líneas gobierna **todo el menú lateral**. No es solo una lista de
textos: cada entrada declara el permiso que la habilita.

### 25.1 Los tres tipos de entrada

```js
// 1. Una opción simple: va directa a una pantalla
{ id: 'inicio', label: 'Inicio', to: '/', permiso: 'dashboard:ver' }

// 2. Un módulo con hijos: se dibuja como acordeón
{
  id: 'convocatorias',
  label: 'Convocatorias',
  children: [
    { label: 'Listado', to: '/convocatorias', permiso: 'convocatorias:ver' },
    { label: 'Nueva convocatoria', to: '/convocatorias/nueva', permiso: 'convocatorias:gestionar' },
  ],
}

// 3. Notificaciones: NO está aquí (ver 25.5)
```

### 25.2 Las 13 entradas, una por una

| id | Lo que ve el usuario | Ruta | Permiso que lo habilita |
|---|---|---|---|
| `inicio` | Inicio | `/` | `dashboard:ver` |
| `convocatorias` | Convocatorias › Listado | `/convocatorias` | `convocatorias:ver` |
| `convocatorias` | Convocatorias › Nueva convocatoria | `/convocatorias/nueva` | `convocatorias:gestionar` |
| `documentos` | Gestión Documental › Listado | `/documentos` | `documentos:ver` |
| `documentos` | Gestión Documental › Cargar documento | `/documentos/cargar` | `documentos:cargar` |
| `documentos` | Gestión Documental › Validación | `/documentos/validacion` | `documentos:validar` |
| `evaluacion` | Evaluación › Aspirantes | `/evaluacion` | `evaluacion:ver` |
| `evaluacion` | Evaluación › Evaluar | `/evaluacion/evaluar` | `evaluacion:evaluar` |
| `seleccion` | Selección › Ranking | `/seleccion` | `seleccion:ver` |
| `seleccion` | Selección › Decidir | `/seleccion/decidir` | `seleccion:decidir` |
| `usuarios` | Usuarios y Roles | `/usuarios` | `usuarios:gestionar` |
| `reportes` | Reportes | `/reportes` | `reportes:ver` |
| `supervision` | Supervisión académica | `/supervision` | `supervision:gestionar` |
| `mis-postulaciones` | Mis postulaciones | `/mis-postulaciones` | `propio:postulaciones` |
| `mis-documentos` | Mis documentos | `/mis-documentos` | `propio:documentos` |
| `mis-evaluaciones` | Mis evaluaciones | `/mis-evaluaciones` | `propio:evaluaciones` |

### 25.3 Los cuatro módulos con hijos

| Módulo | Hijos | Regla importante |
|---|---|---|
| Convocatorias | 2 | El padre **desaparece** si no queda ningún hijo visible. |
| Gestión Documental | 3 | Necesitas los 3 permisos para ver los 3. |
| Evaluación | 2 | — |
| Selección | 2 | — |

### 25.4 Cómo se filtra (`Sidebar.jsx`)

```js
// Deja solo lo que el usuario puede ver, incluyendo los hijos
function filtrarMenu(items, can) {
  return items
    .map((item) => {
      if (item.children) {
        const hijos = item.children.filter((hijo) => can(hijo.permiso))
        return hijos.length > 0 ? { ...item, children: hijos } : null
      }
      return can(item.permiso) ? item : null
    })
    .filter(Boolean)
}
```

La clave está en esa línea:

```js
return hijos.length > 0 ? { ...item, children: hijos } : null
```

**Un módulo sin hijos visibles desaparece entero.** Si eres instructor y no tienes
`documentos:validar` pero sí `documentos:ver`, no verás «Validación»… y si no tuvieras
ninguno de los tres, no verías el módulo «Gestión Documental» tampoco. El botón del
acordeón nunca queda vacío.

**El menú se filtra dos veces, por dos capas distintas:**

| Capa | Dónde | Qué pasa |
|---|---|---|
| Menú lateral | `Sidebar.jsx` | La opción **no se dibuja**. |
| Ruta | `PermissionRoute.jsx` | Si alguien escribe la URL a mano, ve el **403**. |

La segunda capa es la importante: filtrar el menú es cortesía, no seguridad. Si solo
ocultaras el menú, cualquiera con la dirección podría entrar. `PermissionRoute` es la que
impide de verdad.

### 25.5 Por qué Notificaciones no está en el menú

```js
// Notificaciones no está aquí: se abre desde la campana del Topbar.
```

Es la única ruta protegida que **no** tiene entrada en el menú (`/notificaciones`, permiso
`propio:notificaciones`). Vive en la campana de la barra superior. Es una decisión de
diseño: las notificaciones son una acción secundaria, no una sección del sistema.

### 25.6 El acordeón de `SidebarItem.jsx`

```jsx
const hijoActivo = tieneHijos && item.children.some((hijo) => hijo.to === pathname)
const [abierto, setAbierto] = useState(hijoActivo)
```

**Un detalle de buena experiencia de usuario:** el acordeón arranca **abierto** si la
ruta actual es una de sus hijas. Si navegas por URL a `/documentos/cargar` y recargas, el
menú ya aparece desplegado en lugar de cerrado. Se calcula en el `useState` inicial, una
sola vez, así que no se abre y cierra solo.

Y el triángulo del botón es decorativo, por eso lleva `aria-hidden`:

```jsx
<span aria-hidden="true">{abierto ? '▾' : '▸'}</span>
```

Un lector de pantalla debe oír el estado por `aria-expanded={abierto}` del `<button>`, no por
el símbolo.

---

## 26. Los 17 módulos: rutas, permisos y archivos

Los 17 módulos son pantallas **previstas pero todavía sin construir**. Cada una tiene
exactamente 4 líneas y se ve así:

```jsx
import PaginaVacia from '../../components/ui/PaginaVacia'

export default function Dashboard() {
  return <PaginaVacia titulo="Inicio" />
}
```

Lo que muestran es una tarjeta con el título y la frase «Página en construcción».

### 26.1 Tabla completa

| # | Pantalla | Ruta | Permiso | Archivo | Carpeta |
|---|---|---|---|---|---|
| 1 | Inicio | `/` | `dashboard:ver` | `Dashboard.jsx` | `dashboard/` |
| 2 | Convocatorias | `/convocatorias` | `convocatorias:ver` | `ConvocatoriasListado.jsx` | `convocatorias/` |
| 3 | Nueva convocatoria | `/convocatorias/nueva` | `convocatorias:gestionar` | `ConvocatoriaNueva.jsx` | `convocatorias/` |
| 4 | Gestión Documental | `/documentos` | `documentos:ver` | `DocumentosListado.jsx` | `documentos/` |
| 5 | Cargar documento | `/documentos/cargar` | `documentos:cargar` | `DocumentoCargar.jsx` | `documentos/` |
| 6 | Validación de documentos | `/documentos/validacion` | `documentos:validar` | `DocumentoValidacion.jsx` | `documentos/` |
| 7 | Evaluación: aspirantes | `/evaluacion` | `evaluacion:ver` | `EvaluacionListado.jsx` | `evaluacion/` |
| 8 | Evaluar aspirante | `/evaluacion/evaluar` | `evaluacion:evaluar` | `EvaluacionEvaluar.jsx` | `evaluacion/` |
| 9 | Selección: ranking | `/seleccion` | `seleccion:ver` | `SeleccionRanking.jsx` | `seleccion/` |
| 10 | Decidir selección | `/seleccion/decidir` | `seleccion:decidir` | `SeleccionDecidir.jsx` | `seleccion/` |
| 11 | Usuarios y Roles | `/usuarios` | `usuarios:gestionar` | `Usuarios.jsx` | `usuarios/` |
| 12 | Reportes | `/reportes` | `reportes:ver` | `Reportes.jsx` | `reportes/` |
| 13 | Supervisión académica | `/supervision` | `supervision:gestionar` | `Supervision.jsx` | `supervision/` |
| 14 | Mis postulaciones | `/mis-postulaciones` | `propio:postulaciones` | `MisPostulaciones.jsx` | `aspirante/` |
| 15 | Mis documentos | `/mis-documentos` | `propio:documentos` | `MisDocumentos.jsx` | `aspirante/` |
| 16 | Mis evaluaciones | `/mis-evaluaciones` | `propio:evaluaciones` | `MisEvaluaciones.jsx` | `aspirante/` |
| 17 | Notificaciones | `/notificaciones` | `propio:notificaciones` | `Notificaciones.jsx` | `aspirante/` |

*(Son 17 pantallas de módulos más `Forbidden` y `NotFound`: 19 páginas en total bajo
`src/pages`, contando las 4 de `login/`.)*

### 26.2 Los dos grupos funcionales

| Grupo | Módulos | Quién los usa |
|---|---|---|
| **Gestión** (1 a 13) | Inicio, Convocatorias, Documentos, Evaluación, Selección, Usuarios, Reportes, Supervisión | Instructores y coordinadores. |
| **Aspirante** (14 a 17) | Mis postulaciones, Mis documentos, Mis evaluaciones, Notificaciones | Quien se postuló a un proceso. |

Los permisos del segundo grupo llevan el prefijo `propio:` (`propio:documentos`), que
significa «solo los documentos de **este** usuario». Es una convención para que un
aspirante nunca pueda pedir los documentos de otro.

### 26.3 Las dos páginas de error

No son módulos, pero están en `pages/`:

| Página | Cuándo se ve | Qué hace |
|---|---|---|
| `Forbidden.jsx` | Entras a una ruta sin su permiso | Muestra **403** y un botón «Volver al inicio». |
| `NotFound.jsx` | La ruta no existe en absoluto | Muestra **404** y un botón «Volver al inicio». |

`NotFound` está montado como ruta comodín (`path="*"`), que en `react-router` significa
«cualquier cosa que no haya coincidido antes». Por eso **siempre** hay una respuesta: no
existe el caso de pantalla en blanco.

> **Un detalle de `PermissionRoute` que conviene tener presente:** cuando falta un
> permiso, se renderiza `<Forbidden />` **en el sitio de la ruta**, dentro de
> `AppLayout`. Es decir, el 403 **sí** aparece con el menú lateral y la barra superior, lo
> cual es correcto: el usuario tiene sesión, solo le falta permiso para esa sección. Y
> **no hay** una ruta `/403`: `Forbidden` es un componente, no una página navegable.

### 26.4 Cómo se construye un módulo real (guía práctica)

Cuando te toca construir uno, el andamiaje ya está. Los pasos son:

1. **Crea el archivo** en su carpeta, con el mismo nombre que usa `router.jsx`.
2. **Cámbialo por el `PaginaVacia`**, empezando por el `return` dentro del componente.
3. **Carga los datos** con `useEffect` + `useState` (o el hook que necesites de `lib/`).
4. **Usa los tokens del tema** para que funcione en claro y oscuro a la vez:
   `text-slate-800 dark:text-sena-texto`, `bg-white dark:bg-sena-superficie`,
   `border-slate-200 dark:border-sena-borde`.
5. **No toques `menu.js` ni `router.jsx`**: la entrada y el permiso ya están.

Los colores a usar de referencia:

| Necesitas… | Modo claro | Modo oscuro |
|---|---|---|
| Fondo de tarjeta | `bg-white` | `dark:bg-sena-superficie` |
| Fondo de página | `bg-slate-50` | `dark:bg-sena-noche` |
| Texto principal | `text-slate-800` | `dark:text-sena-texto` |
| Texto secundario | `text-slate-500` | `dark:text-sena-texto-suave` |
| Borde | `border-slate-200` | `dark:border-sena-borde` |
| Botón principal | `bg-sena-oscuro` | el mismo |
| Enlace | `text-sena-oscuro` | el mismo |

---

## 27. Catálogo de componentes y utilidades

### 27.1 `components/` — el armazón de la aplicación

#### `Sidebar.jsx` (41 líneas)

El menú lateral. Tres responsabilidades:

1. Filtrar `config/menu.js` con los permisos del usuario.
2. Dibujar el logosímbolo y el nombre del sistema.
3. Proporcionar el `nav` con scroll (con el `min-h-0` que lo hace funcionar).

Clases clave: `w-64 shrink-0` (ancho fijo que no se encoge), `flex flex-col` (columna),
`h-screen overflow-hidden` (en `AppLayout`).

#### `SidebarItem.jsx` (45 líneas)

Una fila del menú. Se comporta de dos maneras según tenga hijos o no:

| Caso | Qué dibuja |
|---|---|
| Sin hijos | Un `NavLink` directo. |
| Con hijos | Un `<button>` que abre/cierra, y debajo los `NavLink` de los hijos. |

El color de la opción activa:

```js
const claseLink = ({ isActive }) =>
  `block rounded px-3 py-2 text-sm ${
    isActive ? 'bg-sena text-white' : 'text-slate-200 hover:bg-slate-700 hover:text-white'
  }`
```

`isActive` lo da `NavLink` automáticamente: React Router compara la URL actual con la del
enlace. Por eso no hay código manual de «¿estoy en esta página?».

#### `Topbar.jsx` (78 líneas)

La barra superior. De izquierda a derecha:

| Elemento | Cuándo aparece |
|---|---|
| Botón de tema | **Siempre** |
| Campana de notificaciones | Solo con el permiso `propio:notificaciones` |
| Nombre y rol del usuario | Siempre (toma `user?.name` del contexto) |
| Botón «Cerrar sesión» | Siempre |

El rol se traduce de clave a texto:

```js
// Convierte la clave del rol en un texto legible.
// Ej: 'revisor_documental' -> 'Revisor documental'
function etiqueta(clave) {
  const texto = clave.replace(/_/g, ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
```

Los dos iconos (campana y salir) son **SVG escritos a mano dentro del archivo**, no
librerías. Llevan `aria-hidden="true"` porque el texto del botón ya los describe.

#### `ThemeToggle.jsx` (50 líneas)

El botón sol/luna. Detalles de accesibilidad, todos ellos deliberados:

| Atributo | Para qué |
|---|---|
| `aria-pressed={oscuro}` | Un lector de pantalla anuncia si el modo está activo. |
| `aria-label` | Cambia según el estado: «Cambiar a modo claro» / «Cambiar a modo oscuro». |
| `title` | Igual que `aria-label`, para el tooltip del ratón. |
| `aria-hidden="true"` en los SVG | Los iconos son decorativos. |

El icono muestra **la acción contraria**: si estás en oscuro, ves el sol (para volver a
claro).

### 27.2 `components/ui/` — piezas reutilizables

#### `LogoSena.jsx` (23 líneas)

El logosímbolo, coloreable. La técnica es `mask-image`: el SVG se usa como **silueta** y
el color lo pone el fondo.

```jsx
export default function LogoSena({ className = 'h-10 w-10' }) {
  const mascara = {
    WebkitMaskImage: "url('/logo-sena.svg')",
    maskImage: "url('/logo-sena.svg')",
    // ...
  }
  return (
    <span role="img" aria-label="SENA" style={mascara}
      className={`inline-block shrink-0 bg-current ${className}`} />
  )
}
```

Se usa en dos sitios con tamaños distintos: `size-[52px]` en el menú y `h-16 w-16` en
la tarjeta del login.

| Propiedad | Significado |
|---|---|
| `role="img"` + `aria-label="SENA"` | Un lector de pantalla lo anuncia como la imagen del SENA. |
| `bg-current` | Toma el color de texto del contenedor. Por eso el mismo componente sirve en verde, blanco o negro. |
| `shrink-0` | No se aplasta al escribirlo. |

#### `PaginaVacia.jsx` (12 líneas)

El marcador de módulo sin construir. Acepta **una sola** prop, `titulo`.

> **Por qué no acepta el permiso:** hasta el commit `2784657` sí lo hacía, y las pantallas
> mostraban «Permiso requerido: `documentos:validar`» debajo del título. Se quitó porque
> es un detalle interno del enrutado que no le aporta nada a quien usa el sistema. El
> permiso sigue funcionando igual: lo revisa `PermissionRoute` en `router.jsx`.

#### `TarjetaAuth.jsx` (28 líneas)

El marco centrado de las 4 pantallas públicas: fondo con tinte celeste, tarjeta blanca
con franja verde, logosímbolo, «SPGTH» y el subtítulo.

Se extrajo a su propio componente en el commit `47a34da` porque estaba copiado dentro de
`AuthLayout.jsx`. Eso permitió que los commits de marca pintaran **las cuatro pantallas
tocando un solo archivo**.

### 27.3 `lib/` — utilidades sin interfaz

#### `useTema.js` (49 líneas)

El estado del tema. Explica todo el mecanismo del capítulo 12; lo esencial:

```js
// El script de index.html ya aplico la clase antes de montar React. Aqui se
// parte de lo que hay en el DOM en vez de recalcularlo, para que la app y el
// HTML inicial nunca discrepen.
const [oscuro, setOscuro] = useState(() =>
  document.documentElement.classList.contains('dark'),
)
```

**Ese comentario es el punto clave:** el hook **no lee `localStorage` para el estado
inicial**, lee lo que ya está en el DOM. Así el hook y el script de `index.html` no pueden
contradecirse.

| Devuelve | Qué es |
|---|---|
| `oscuro` | `true` si el tema oscuro está activo. |
| `alternar()` | Cambia el tema y lo guarda. |
| `siguiendo` | `true` mientras el usuario no haya elegido nada. |

`siguiendo` controla si se escucha al sistema: si el usuario nunca pulsó el botón, el
cambio de tema del sistema se ve; en cuanto pulsa, su elección manda y deja de escuchar.

#### `otpSesion.js` (47 líneas)

Gestiona los códigos de un solo uso (código de 6 dígitos del correo).

```js
export const MINUTOS_VALIDEZ = 10
const PREFIJO = 'spgth:otp:'
```

| Función | Qué hace |
|---|---|
| `leerOtp(pantalla)` | Devuelve el código vigente, o `null` si no hay o ya expiró. |
| `guardarOtp(pantalla, datos)` | Guarda el momento del envío. |
| `borrarOtp(pantalla)` | Lo elimina (al cambiar de correo o al terminar). |
| `enmascararEmail(email)` | `juan.perez@sena.edu.co` → `ju***@sena.edu.co` |

**Por qué `sessionStorage` y no `localStorage`:** el registro debe morir al cerrar la
pestaña. Un código de un solo uso no debería sobrevivir a la sesión de trabajo.

**Por qué existe el guardado:** cada envío **invalida** el anterior, y hay límite de 3 por
minuto y 10 por hora. Sin esto, un F5 en el paso 2 te dejaría sin poder entrar.

#### `useCuentaAtras.js` (15 líneas)

La cuenta atrás del botón tras un error 429.

```js
const iniciar = useCallback((n) => {
  setSegundos(Number.isFinite(n) && n > 0 ? Math.ceil(n) : 0)
}, [])
return { segundos, iniciar, bloqueado: segundos > 0 }
```

Devuelve tres cosas: `segundos` (el número que se muestra), `iniciar()` (lo pones en
marcha) y `bloqueado` (si el botón debe estar desactivado).

### 27.4 `auth/` — el gatekeeper

Los cuatro archivos y cómo se relacionan:

| Archivo | Rol | Tamaño |
|---|---|---|
| `AuthContext.jsx` | **La fuente de verdad.** Guarda el usuario y expone las acciones. | 77 |
| `useAuth.js` | El hook. Añade `can()` y `hasAny()` sobre lo del contexto. | 14 |
| `ProtectedRoute.jsx` | Puerta de sesión y de correo verificado. | 26 |
| `PermissionRoute.jsx` | Puerta de un permiso concreto. | 12 |

`useAuth.js` es un buen ejemplo de hook bien diseñado:

```js
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  }
  const permissions = context.user?.permissions ?? []
  const can = (permiso) => permissions.includes(permiso)
  const hasAny = (lista) => lista.some((permiso) => permissions.includes(permiso))
  return { ...context, can, hasAny }
}
```

Tres cosas a destacar:

1. **Falla fuerte y pronto.** Si alguien usa `useAuth()` fuera del `AuthProvider`, el error
   es explícito y en desarrollo, en vez de un `undefined` silencioso que revienta tres
   líneas más abajo.
2. **`?? []` en vez de `||`.** Si el usuario no tiene permiso, `permissions` es una lista
   vacía: `can()` devuelve `false` limpiamente.
3. **`hasAny` acepta una lista**, por eso `PermissionRoute` funciona igual con un permiso
   o con varios:

   ```jsx
   const lista = Array.isArray(permiso) ? permiso : [permiso]
   if (!hasAny(lista)) return <Forbidden />
   ```

   Hoy solo se usa con un permiso, pero el código ya soporta la lista.

---

## 28. Configuración, compilación y recursos

### 28.1 `package.json` — las 4 dependencias que importan

| Dependencia | Versión | Para qué |
|---|---|---|
| `react` | `^19.2.8` | La biblioteca de interfaz. |
| `react-dom` | `^19.2.8` | Monta React en el navegador. |
| `react-router-dom` | `^7.18.4` | Las rutas (URLs) y los `NavLink`. |
| `axios` | `^1.20.0` | Las peticiones HTTP al backend. |
| `tailwindcss` + `@tailwindcss/vite` | `^4.3.3` | Los estilos. |

Y las de desarrollo:

| Dependencia | Versión | Para qué |
|---|---|---|
| `vite` | `^8.3.0` | El servidor de desarrollo y el empaquetador. |
| `@vitejs/plugin-react` | `^6.1.1` | Hace que Vite entienda JSX. |
| `oxlint` | `^1.81.0` | El revisor de código. |
| `@types/react` | `^19.2.18` | Tipos de React (aunque no se use TypeScript). |

**El signo `^` significa «esta versión o superior».** Por eso `npm install` puede instalar
versiones más nuevas sin romper nada. Para fijar exactamente qué hay instalado está
`package-lock.json`, que **nunca se edita a mano**.

Los 4 scripts:

| Script | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo con recarga en caliente. |
| `npm run build` | Compila para producción en `dist/`. |
| `npm run lint` | Revisa el código con oxlint. |
| `npm run preview` | Sirve `dist/` como lo haría el servidor real. |

Y un detalle del que conviene ser consciente: `"private": true` impide a npm publicar el
paquete por error. Y `"type": "module"` indica que todo el proyecto usa módulos ES
(import/export), no el `require` antiguo.

### 28.2 `vite.config.js` (7 líneas)

```js
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Solo dos plugins. `react()` permite escribir JSX; `tailwindcss()` integra Tailwind con
Vite. **No hay ni una línea más**, y es lo correcto: mientras no haya variables globales
de Vite, el archivo no crece.

### 28.3 `.oxlintrc.json` (8 líneas)

```json
{
  "plugins": ["react", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

| Regla | Nivel | Qué vigila |
|---|---|---|
| `react/rules-of-hooks` | **error** | Que los hooks se llamen siempre en el mismo orden. Es la regla que más bugs fantasma evita. |
| `react/only-export-components` | **aviso** | Que un archivo de componentes no exporte también cosas que no son componentes. |

> **El aviso que verás al ejecutar `npm run lint`:**
> `src/auth/AuthContext.jsx:4:14 react(only-export-components)`. Es **esperado y está
> admitido**: el archivo tiene que exportar a la vez `AuthContext` y `AuthProvider`, y
> la opción `allowConstantExport` no cubre el caso. No es un error y no hay que
> arreglarlo. 0 errores, 1 aviso.

**Por qué oxlint y no ESLint:** es mucho más rápido (está escrito en Rust) y la
configuración es un JSON de 8 líneas en vez de un archivo de JavaScript.

### 28.4 `.gitignore` (25 líneas)

Qué se subdivide en cuatro bloques: registros, carpetas generadas, editores y **variables
de entorno**.

Lo importante es el último bloque:

```gitignore
.env
.env.local
.env.*.local
```

`.env` guarda las direcciones de tu backend. **Si se sube, queda en el historial para
siempre**, y borrarlo después no lo quita: hay que reescribir la historia. Los patrones
`*.local` cubren las variantes que algunos editores crean solas.

Y ojo con una cosa: la carpeta `src/assets/` **ya no existe**. Los archivos que había
dentro (`react.svg`, `vite.svg`, `hero.png`) se borraron en el commit `0ec54ed`.

### 28.5 `index.html` (37 líneas)

Solo dos tareas: el esqueleto de la página y el script anti-parpadeo. Lo demás lo pone Vite
al compilar.

```html
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Work+Sans:..." />
    <title>SPGTH — Simulador de Procesos de Gestión de Talento Humano</title>
    <!-- aquí va el script anti-parpadeo (capítulo 12) -->
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

| Etiqueta | Para qué |
|---|---|
| `lang="es"` | Le dice al navegador el idioma, para que el corrector ortográfico y los lectores de pantalla funcionen bien. |
| `preconnect` | Abre la conexión con Google Fonts **antes** de pedir la fuente, acelerando la carga. |
| `href="/favicon.svg"` | Empieza por `/` porque está en `public/`: se sirve desde la raíz, no desde `src/`. |
| `<div id="root">` | El hueco donde React dibuja. `main.jsx` busca exactamente este elemento. |

### 28.6 `public/` — y un archivo muerto

Todo lo que está en `public/` se **copia tal cual** a la carpeta de publicación. No se
procesa, no se le puede importar desde `src/`, y solo se referencia por URL.

| Archivo | Tamaño | Quién lo usa | Para qué |
|---|---|---|---|
| `logo-sena.svg` | 16 | `LogoSena.jsx` (como máscara) | El logosímbolo. Usa `fill="currentColor"`. |
| `favicon.svg` | 16 | `index.html` | El ícono de la pestaña. Es el mismo dibujo, pero con el **verde** fijo `#39A900` para que se vea en la pestaña blanca del navegador. |
| `icons.svg` | 24 | **Nadie** | ⚠ Resto de la plantilla de Vite. |

> **`public/icons.svg` es código muerto.** Se comprobó con una búsqueda en todo `src/`:
> ningún archivo lo menciona. Es otro resto de la plantilla que sobrevivió a las
> limpiezas. No molesta (el navegador nunca lo pide, así que ni pesa en la descarga), pero
> es basura en el repositorio. Se puede borrar sin tocar nada más, aunque eso ya sería un
> commit nuevo.

**La diferencia entre `logo-sena.svg` y `favicon.svg`, que son el mismo dibujo:**

| | `logo-sena.svg` | `favicon.svg` |
|---|---|---|
| `fill` | `currentColor` | `#39A900` fijo |
| Se usa como | Máscara (el color lo pone el CSS) | Imagen directa |
| Sirve para | Cualquier color: verde, blanco, negro | Solo el ícono de la pestaña |

### 28.7 ⚠ `README.md` tiene un problema

`README.md` son 12 líneas, pero **no describen este proyecto**. Sigue siendo el texto en
inglés de la plantilla de Vite:

```text
# React + Vite
This template provides a minimal setup to get React working in Vite with HMR...
```

Y tiene un problema añadido: **la última línea está guardada en UTF-16**, no en UTF-8:

```text
#  s i M u l a d o r - g e s t i o n ...
```

Eso provoca dos efectos: algunos editores lo ven con caracteres nulos o ilegibles
(por eso algunas herramientas lo detectan como archivo binario), y la línea se ve rota.

**Cómo arreglarlo** (cuando quieras, es un cambio aparte):

1. Borrar el `README.md` actual.
2. Escribir uno nuevo **guardado en UTF-8**, con: qué es el proyecto, requisitos, cómo
   instalar, cómo ejecutar, la estructura de carpetas y a quién dirigir las dudas. El
   contenido técnico ya está todo en esta documentación, así que se puede copiar de aquí.
3. `git add README.md && git commit -m "docs: reescribe el README en UTF-8"`.

Mientras tanto, esta documentación cubre todo lo que el README debería cubrir.

### 28.8 Resumen: qué se sube y qué no

| Elemento | ¿Se sube? | Por qué |
|---|---|---|
| Todo lo de `src/` | ✅ Sí | Es el código. |
| `public/` | ✅ Sí | Son los recursos. |
| `index.html`, `package.json`, `vite.config.js`, `.oxlintrc.json`, `.gitignore` | ✅ Sí | Configuración del proyecto, sin secretos. |
| `package-lock.json` | ✅ Sí | Fija las versiones. Es lo correcto. |
| `.env.example` | ✅ Sí | Plantilla sin secretos. |
| `.env` | ❌ **Nunca** | Puede contener datos del servidor. |
| `node_modules/` | ❌ No | Se regenera con `npm install`. |
| `dist/` | ❌ No | Se regenera con `npm run build`. |
| `*.log` | ❌ No | Registros de depuración. |
| `DOCUMENTACION_DETALLADA.md`, `HISTORIA_DEL_PROYECTO.md` | ❌ No | Documentación personal, excluida con `.git/info/exclude`. |

---

**Fin de la documentación.** Escribe, lee y vuelve aquí cuando necesites.
