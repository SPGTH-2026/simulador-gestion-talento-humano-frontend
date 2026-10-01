# Autenticación y sesiones


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
