# Modo claro y oscuro


---

## 12. Modo claro/oscuro

Funciona con **tres piezas** que se reparten el trabajo.

### 12.1 Pieza 1 — el script anti-parpadeo (`index.html`)

Está dentro de `<head>` y **antes** del `<script type="module">` de Vite, así que se
ejecuta antes de que se pinte nada en pantalla:

```js
;(function () {
  try {
    var guardado = localStorage.getItem('spgth-tema')
    var oscuro = guardado
      ? guardado === 'oscuro'
      : window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.classList.toggle('dark', oscuro)
    document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light'
  } catch (e) {}
})()
```

Qué hace, paso a paso:

1. Lee la preferencia guardada en `localStorage`, clave **`spgth-tema`**.
   - Si hay valor: `'oscuro'` activa el modo oscuro, `'claro'` lo desactiva.
   - Si no hay valor (primera visita): pregunta al sistema operativo.
2. Pone o quita la clase `dark` en `<html>`.
3. Ajusta `colorScheme`, que es la propiedad que hace que los controles nativos del
   navegador (cuadros de texto, barras de desplazamiento del sistema) también se pinten
   oscuros. Sin esto, el tema quedaría "a medias".
4. Todo va dentro de `try/catch`: si el navegador tiene el almacenamiento bloqueado, la
   app **no** se rompe.

**¿Por qué esto es necesario?** Sin este script, el navegador pintaría primero el fondo
por defecto (blanco) y un instante después React aplicaría el modo oscuro. Ese parpadeo
se llama *flash* o **FOUC**. Con el script, la clase `dark` ya está puesta en el primer
píxel.

### 12.2 Pieza 2 — la variante `dark` de Tailwind (`src/index.css`)

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Por defecto Tailwind resuelve `dark:` con `prefers-color-scheme` (la preferencia del
sistema). Eso **no** sirve aquí, porque el botón tiene que poder forzar el tema en
cualquier momento. Esta línea cambia el significado de `dark:` a "cuando el elemento
está dentro de `.dark`". Así, `dark:bg-sena-superficie` responde a la clase que puso el
script, no al sistema.

### 12.3 Pieza 3 — el hook `lib/useTema.js`

```js
const { oscuro, alternar, siguiendo } = useTema()
```

| Valor | Significa |
|---|---|
| `oscuro` | `true` si el tema activo es el oscuro. |
| `alternar()` | Cambia el tema, lo aplica al DOM y lo guarda. |
| `siguiendo` | `true` mientras no haya elección manual (estamos escuchando al sistema). |

Cómo está construido:

- **Estado inicial:** lee `document.documentElement.classList.contains('dark')`, es
  decir, **lee lo que ya está en el DOM** en lugar de recalcularlo. Si el hook
  recalculara por su cuenta, podría discrepar del script en el primer render.
- **Al pulsar el botón:** invierte el estado, aplica la clase y el `colorScheme` al DOM,
  guarda `'oscuro'` o `'claro'` en `localStorage` y pone `siguiendo = false`.
- **Escucha al sistema:** con un `useEffect` se suscribe al evento `change` de
  `matchMedia('(prefers-color-scheme: dark)')`. Si el sistema pasa a oscuro, la app se
  pone oscura al instante. Y viceversa.

**La regla de oro:** la elección manual **manda** sobre el sistema. Una vez que la
persona pulsa el botón, la app deja de seguir al sistema operativo.

### 12.4 El botón (`components/ThemeToggle.jsx`)

- Solo aparece en la **barra superior** (`Topbar`), no en las pantallas públicas.
- Dibuja un SVG de sol (24×24 px de caja, trazo de 1.5) o de luna, según el estado.
- Accesible: `aria-pressed` refleja el estado, y `aria-label` + `title` cambian entre
  "Cambiar a modo oscuro" y "Cambiar a modo claro". Los SVG llevan `aria-hidden` para
  que el lector de pantalla anuncie solo el botón, no el dibujo.

### 12.5 Comportamiento esperado

| Situación | Qué pasa |
|---|---|
| Primera visita (sin preferencia guardada) | Se respeta el tema del sistema. |
| Se pulsa el botón | Se guarda la preferencia y deja de seguir al sistema. |
| Se recarga la página | El script aplica el tema antes de pintar: **sin parpadeo**. |
| Se cambia el tema del sistema y **no** hay preferencia manual | La app cambia sola. |
| Se cambia el tema del sistema y **sí** hay preferencia manual | La app **no** cambia. |

---
