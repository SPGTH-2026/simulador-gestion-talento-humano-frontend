# Entorno y configuración


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
