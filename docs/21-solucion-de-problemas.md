# Solución de problemas


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
