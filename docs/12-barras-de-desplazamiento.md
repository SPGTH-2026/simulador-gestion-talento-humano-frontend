# Barras de desplazamiento


---

## 13. Barras de desplazamiento personalizadas

Dos clases en `src/index.css`, aplicadas a los dos únicos contenedores que desplazan.

### 13.1 Qué se aplica y dónde

| Clase | Se aplica en | Elemento |
|---|---|---|
| `.scroll-sena-lateral` | `components/Sidebar.jsx` | el `<nav>` del menú |
| `.scroll-sena-contenido` | `layouts/AppLayout.jsx` | el `<main>` de contenido |

### 13.2 Características

- **Se declaran las dos cosas.** `scrollbar-width` + `scrollbar-color` (Firefox y
  navegadores modernos) **y** los pseudo-elementos `::-webkit-scrollbar` (Chrome, Edge,
  Safari, Opera). Con una sola de las dos, la barra se ve plana en unos navegadores o
  directamente no existe en otros.
- **Pista transparente** (`background: transparent`): no se ve el canal de la barra.
- **Grosor 6 px** y **pulgar redondeado** (`border-radius: 9999px`).
- El `hover` (y el `:focus-within`) sube la **opacidad**, no el grosor: cambiar el ancho
  de la barra alteraría el cálculo del diseño y la página "saltaría".

### 13.3 Colores elegidos por contraste

| Contexto | Fondo | Color del pulgar | Contraste |
|---|---|---|---|
| Menú lateral (tema claro) | `#1e293b` | `rgba(57,169,0,0.55)` → `#39a900` al pasar el ratón | **4.77:1** |
| Contenido (tema claro) | `#f8fafc` | `rgba(0,120,50,0.50)` → `#007832` al pasar el ratón | El verde claro daba solo 2.93:1, insuficiente |
| Contenido (tema oscuro) | `#00121f` | `rgba(57,169,0,0.60)` → `#39a900` al pasar el ratón | **6.19:1** |

Por eso el contenido claro usa el **verde oscuro** y el oscuro vuelve al verde
institucional: en el fondo oscuro el verde claro sí tiene contraste suficiente.

### 13.4 El detalle que hace funcionar el menú

En `Sidebar.jsx` el `<nav>` lleva `min-h-0`. Sin esa clase, un elemento flexible en
columna no baja de su altura mínima: el contenido se **desbordaría** hacia abajo en vez
de generar barra, y las últimas opciones quedarían inalcanzables cuando el usuario tiene
muchos permisos. Con `min-h-0` + `flex-1` + `overflow-y-auto`, el nav es el único que
desplaza y el logo de arriba queda fijo.

---
