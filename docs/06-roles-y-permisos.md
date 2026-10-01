# Roles y permisos


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
