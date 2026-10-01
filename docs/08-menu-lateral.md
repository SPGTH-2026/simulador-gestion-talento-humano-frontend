# El menú lateral


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
