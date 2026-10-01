# Códigos OTP

Un OTP es un código de seis dígitos que el backend envía por correo para confirmar que
una dirección de correo existe o para autorizar un cambio de contraseña.

Hay **dos flujos** distintos que usan el mismo mecanismo. Este documento explica los
dos, el código que comparten y las cuatro decisiones de seguridad que hay alrededor.

| Flujo | Pantalla | Para qué |
|---|---|---|
| Verificación de correo | `/verificar-correo` | Confirmar que el correo pertenece a quien dice |
| Recuperación de contraseña | `/recuperar` | Probar que quien cambia la contraseña es el dueño del correo |

---

## Las reglas, y dónde están decididas

Casi todas las reglas viven en el backend, en `OtpService`. El frontend solo las
conoce para poder hablar de ellas con precisión:

| Regla | Valor | Dónde se aplica |
|---|---|---|
| Vigencia del código | 10 minutos | `MINUTOS_VALIDEZ` en `src/lib/otpSesion.js` |
| Un solo uso | Se marca consumido al confirmarlo | El backend |
| Intentos por código | 3 como máximo | Backend |
| Envío por IP y correo | 3 por minuto y 10 por hora | Backend |
| Un código no sirve para otro flujo | `purpose` distinto por flujo | Backend |

> **El frontend repite el número de 10 minutos a propósito.** `otpSesion.js` lo declara
> como constante y lo muestra en pantalla. Si el backend cambiara el TTL, este archivo
> quedaría desfasado. Es una decisión consciente: es preferible un número que se repita
> en dos sitios a que la interfaz no diga cuánto queda.

## Cómo viaja el código

No viaja de ninguna forma especial. Son cinco llamadas normales a la API:

```js
// Pedir el código
await authApi.forgotPassword(email)        // POST /api/auth/forgot-password
await authApi.sendVerification()           // POST /api/auth/verification/send

// Confirmarlo
await authApi.resetPassword({ ... })       // POST /api/auth/reset-password
await authApi.confirmVerification(code)    // POST /api/auth/verification/confirm
```

El frontend nunca genera el código, nunca lo compara y nunca lo guarda en un servidor.
Solo lo pide, lo escribe y lo envía. Esa es la razón por la que **no tiene ningún
sentido** hacer validaciones propias del código más allá de "son seis dígitos".

## Los tres helpers de `src/lib/otpSesion.js`

Ese archivo tiene 55 líneas y tres funciones. Existe para resolver un problema
concreto: cada envío **invalida el código anterior** y hay un límite de 3 por minuto. Un
simple F5 en el paso 2 gastaría un envío y dejaría al usuario sin código.

### Guardar el estado del envío

```js
const PREFIJO = 'spgth:otp:'
const TTL_MS = MINUTOS_VALIDEZ * 60 * 1000

export function guardarOtp(pantalla, datos = {}) {
  try {
    sessionStorage.setItem(
      PREFIJO + pantalla,
      JSON.stringify({ ...datos, sentAt: Date.now() }),
    )
  } catch {
    // Mismo caso que arriba: no vale la pena romper la pantalla por esto.
  }
}
```

Se guarda un objeto con la marca de tiempo del envío:

```json
{ "email": "persona@sena.edu.co", "sentAt": 1759324800000 }
```

Cada pantalla tiene su propia clave: `spgth:otp:recuperar` y
`spgth:otp:verificar-correo`. Por eso las dos pueden convivir sin pisarse.

### Leerlo, comprobando que siga vigente

```js
export function leerOtp(pantalla) {
  try {
    const crudo = sessionStorage.getItem(PREFIJO + pantalla)
    if (!crudo) return null
    const registro = JSON.parse(crudo)
    if (typeof registro?.sentAt !== 'number') return null

    if (Date.now() - registro.sentAt > TTL_MS) {
      sessionStorage.removeItem(PREFIJO + pantalla)
      return null
    }
    return registro
  } catch {
    return null
  }
}
```

La comprobación de vigencia está en el cliente, y es **solo una optimización de
interfaz**. Si el registro está vencido, `leerOtp` devuelve `null` y la pantalla vuelve
al paso 1. El backend seguiría rechazando el código igual: su comprobación es la que
manda. Lo que evita esta función es gastarse un envío de más.

> **Por qué `sessionStorage` y no `localStorage`.** Los dos sobreviven a un F5, pero
> `localStorage` sobrevive también al cierre del navegador. El código de un alta o de
> un cambio de contraseña no debe seguir ahí mañana. `sessionStorage` muere con la
> pestaña, que es justo la vida útil que necesita.

### Enmascarar el correo

```js
export function enmascararEmail(email) {
  const [usuario, dominio] = String(email ?? '').split('@')
  if (!dominio) return email
  if (usuario.length <= 2) return `${usuario[0] ?? '*'}***@${dominio}`
  return `${usuario.slice(0, 2)}***@${dominio}`
}
```

`persona@sena.edu.co` se muestra como `pe***@sena.edu.co`. En el paso 2 del flujo de
recuperación el correo completo no aparece en pantalla: alguien que esté mirando por
sobre el hombro no debería poder leerlo entero. El dominio sí se ve, porque hace falta
para saber **a dónde** se envió el código.

> **La diferencia entre los dos flujos.** En recuperación se usa `enmascararEmail`. En
> verificación **no**, porque el correo ya está en la barra del navegador y en la sesión
> del usuario, y ahí se muestra `user.email` tal cual. Enmascarar algo que el usuario
> ya conoce solo le impediría confirmar que el código llegó a donde cree.

## El flujo de recuperación, paso a paso

`src/pages/login/RecuperarContrasena.jsx`, 286 líneas. Tiene dos pasos dentro del mismo
componente.

### El paso 1: el correo

Se pide el correo y se llama a `forgotPassword(correo)`. Aquí está la decisión de
seguridad más importante del archivo:

```js
await authApi.forgotPassword(correo)
// El backend responde IGUAL exista o no el correo (anti-enumeración), así que
// avanzamos siempre al paso 2 sin comprobar nada.
guardarOtp(PANTALLA, { email: correo })
setEmail(correo)
setPaso(2)
```

**El frontend no comprueba si el correo existe, y no debe comprobarlo.** El backend
responde exactamente lo mismo exista o no, y eso es intencionado: si la respuesta
diferente, el endpoint se convertiría en una forma de descubrir qué correos están
registrados en el sistema. La pantalla avanza siempre, y quien se equivocó en escribir
su correo se dará cuenta cuando el código no llegue.

### El paso 2: el código y la contraseña nueva

Tres campos: código, contraseña nueva y repetición. Hay dos validaciones **en el
navegador**, antes de gastar la petición:

```js
const REGLA_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

if (!REGLA_PASSWORD.test(password)) {
  setErrores({ password: 'Mínimo 8 caracteres, con letras y números.' })
  return
}
if (password !== confirmacion) {
  setErrores({ password: 'Las contraseñas no coinciden.' })
  return
}
```

| Comprobación | Qué atrapa |
|---|---|
| `REGLA_PASSWORD` | Lo que el backend rechazaría con un 422: menos de 8 caracteres, o sin letras, o sin números |
| `password !== confirmacion` | Un error de tecleo, que el backend no detectaría porque solo recibe un campo |

> **Por qué duplicar la regla del backend.** No para sustituirlo, sino para ahorrar un
> viaje de ida y vuelta. La expresión regular copia lo que el backend valida con
> `Password::min(8)->letters()->numbers()`. El backend sigue validando: esta es una
> cortesía, no una medida de seguridad. Si las dos se desincronizasen, el usuario vería
> un 422 en vez de un mensaje bajo el campo, y el resultado sería el mismo.

El campo del código limpia lo que se escribe:

```js
onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
```

`\D` quita todo lo que no es un dígito y `slice(0, 6)` recorta al máximo. Es la misma
expresión que usa el manejador al enviar, así que el valor que viaja es idéntico a lo
que se ve.

### Los dos botones del paso 2

| Botón | Qué hace |
|---|---|
| "Reenviar código" | Vuelve a llamar a `forgotPassword`. **Invalida** el código anterior |
| "Cambiar correo" | Borra el registro de `sessionStorage` y vuelve al paso 1 |

El reenvío no es un endpoint aparte. Es el mismo, porque en el backend "reenviar" y
"pedir" son la misma operación. Eso también significa que **el límite de 3 por minuto
aplica igual**: reenviar tres veces bloquea los tres botones.

## El flujo de verificación, paso a paso

`src/pages/login/VerificarCorreo.jsx`, 168 líneas. Un solo paso, pero con un detalle que
no existe en el otro flujo: **pide el código solo**.

```jsx
const yaPidio = useRef(false)

useEffect(() => {
  if (!authResolved || !user || user.email_verified) return
  if (yaPidio.current) return
  if (leerOtp(PANTALLA)) return

  yaPidio.current = true
  authApi
    .sendVerification()
    .then(() => guardarOtp(PANTALLA))
    .catch((err) => { /* mensaje + cuenta atrás */ })
}, [authResolved, user, iniciar])
```

Cuatro condiciones, y todas necesarias:

| Condición | Por qué |
|---|---|
| `!authResolved \|\| !user` | Todavía no se sabe quién es: pedir un código sería en balde |
| `user.email_verified` | Ya está confirmado, no hay nada que enviar |
| `yaPidio.current` | En desarrollo `StrictMode` monta dos veces. Sin el `ref`, se enviarían dos códigos |
| `leerOtp(PANTALLA)` | Ya hay un código vigente: un F5 no debe gastar un envío |

> **`useRef` y no `useState` para la guarda.** Un `useState` provocaría un render
> extra y, en modo estricto, la comprobación ocurriría después de ese render: el doble
> envío ya habría pasado. Un `ref` se escribe y se lee en la misma vuelta.

### El paso que evita un bucle infinito

Después de confirmar, el componente no navega a ninguna parte. Hace algo más sutil:

```js
await authApi.confirmVerification(code)
// Traemos el usuario actualizado para que email_verified sea true y el
// guard deje pasar. Sin esto ProtectedRoute nos devolvería a esta misma
// página en un bucle.
await refrescar()
borrarOtp(PANTALLA)
setCode('')
```

`refrescar()` vuelve a llamar a `GET /api/auth/me` y actualiza el usuario del contexto.
Sin eso, `user.email_verified` seguiría siendo `false`, `ProtectedRoute` volvería a
mandar a `/verificar-correo` y la página se recargaría sola en un bucle. El comentario
del código explica el porqué, que es justo el tipo de comentario que sobrevive a los
meses.

Cuando el componente se monta y el correo ya está verificado, sale de ahí:

```jsx
if (user.email_verified) {
  return <Navigate to="/" replace />
}
```

Eso también cubre el caso de confirmar el código en otra pestaña del navegador.

## El botón de reenviar y la cuenta atrás

Los dos flujos comparten la misma pieza: `useCuentaAtras`, de 20 líneas.

```js
export function useCuentaAtras() {
  const [segundos, setSegundos] = useState(0)

  useEffect(() => {
    if (segundos <= 0) return
    const id = setTimeout(() => setSegundos((s) => Math.max(0, s - 1)), 1000)
    return () => clearTimeout(id)
  }, [segundos])

  const iniciar = useCallback((n) => {
    setSegundos(Number.isFinite(n) && n > 0 ? Math.ceil(n) : 0)
  }, [])

  return { segundos, iniciar, bloqueado: segundos > 0 }
}
```

Devuelve tres cosas: los segundos que quedan, cómo iniciar la cuenta y un `bloqueado`
que los botones usan para deshabilitarse. La cuenta se implementa con **un `setTimeout`
de un segundo**, no con `setInterval`: el efecto se limpia en cada vuelta, así que no
se acumulan temporizadores.

Los segundos **no se inventan**. Salen de la cabecera que devuelve el backend:

```js
const retryAfter = Number(headers['retry-after'] ?? headers['Retry-After'])
if (Number.isFinite(retryAfter) && retryAfter > 0) {
  return Math.ceil(retryAfter)
}
```

Y si no viene esa cabecera, se cae a `X-RateLimit-Reset`, que es una marca de tiempo
y hay que restarle la hora actual. Por eso el mensaje al usuario puede ser tan concreto:

> Demasiados intentos. Espera 30 s e inténtalo de nuevo.

> **Por qué existe `reintento.js` en un archivo aparte.** `segundosReintento` no necesita
> React ni el contexto de autenticación: solo mira un objeto de error de axios. Podría
> vivir en `mensajeError.js`, pero ese archivo traduce errores a frases para la
> persona, y esto es lógica de cabeceras. Separados, cada uno hace una cosa.

## La lista de comprobación de los dos flujos

Antes de dar por terminado cualquier cambio en estas pantallas:

| Comprobación | Cómo |
|---|---|
| El F5 no gasta un envío | Recargar en el paso 2 y comprobar que no pide código nuevo |
| El código se limpia solo | Escribir letras en el campo: no deben aparecer |
| La cuenta atrás coincide con el backend | Provocar un 429 y comparar los segundos con la cabecera |
| El correo se enmascara en recuperación | Comprobar que el paso 2 no muestra el correo completo |
| Confirmar el código no da bucle | Confirmar y observar que entra a la aplicación |
| El enlace "Cambiar correo" limpia el estado | Volver al paso 1 y comprobar que pide código |
| El 422 se muestra bajo el campo correcto | Enviar un código incorrecto |
| Cambiar el correo a otro y reenviar | No debe quedar el registro del correo anterior |

Detalle de cómo escribir estas pruebas en [Calidad, lint y pruebas](18-calidad-lint-y-pruebas.md),
y el estado real de las pruebas en [Pendientes](23-pendientes.md).
