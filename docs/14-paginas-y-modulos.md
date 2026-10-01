# Páginas y módulos


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
