# Componentes y utilidades


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
