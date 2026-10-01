# Enrutado y protección de rutas


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
