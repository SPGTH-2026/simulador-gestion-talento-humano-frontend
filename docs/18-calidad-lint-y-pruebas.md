# Calidad, lint y pruebas


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
