# Estilos con Tailwind CSS

Este proyecto usa **Tailwind CSS 4** y nada más. No hay CSS a mano en los componentes,
no hay `CSS Modules`, no hay styled-components. Todo el estilo son clases en el
atributo `className`.

Y hay un detalle que cambia todo respecto a Tailwind 3: **no hay `tailwind.config.js`**.
La versión 4 se configura desde el propio archivo CSS.

---

## 1. El archivo CSS del proyecto

Prácticamente todo el CSS del proyecto está en **un solo archivo**:
`src/index.css`, de 97 líneas. No hay ningún otro `.css` en `src/`.

Las 97 líneas son cuatro cosas:

| Líneas | Qué es |
|---|---|
| 1 | El `@import` que carga el motor de Tailwind |
| 3–35 | La paleta institucional, en un bloque `@theme` |
| 37–41 | La variante `dark:` |
| 43–97 | Los estilos de las barras de desplazamiento |

## 2. Las tres directivas que hay que conocer

### `@import "tailwindcss"`

La primera línea del archivo. Carga el motor. Sin ella, ninguna clase de Tailwind
existe.

```css
@import "tailwindcss";
```

> **Este archivo es el punto de entrada que Vite necesita.** En la configuración de
> Vite hay un plugin de Tailwind, pero la ruta real de entrada sigue siendo esta línea.
> Todo lo que se escriba debajo es CSS normal y se procesa con el motor encima.

### `@theme`: donde se declaran los colores

Este es el bloque que define la identidad visual del proyecto:

```css
@theme {
  --font-sans: "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;

  --color-sena: #39a900;          /* Verde institucional, color principal del logotipo */
  --color-sena-oscuro: #007832;   /* Verde oscuro */
  --color-sena-azul: #00304d;     /* Azul oscuro */
  --color-sena-violeta: #71277a;  /* Violeta */
  --color-sena-amarillo: #fdc300; /* Amarillo */
  --color-sena-cielo: #50e5f9;    /* Azul claro */
}
```

La diferencia con Tailwind 3 es esta: **declarar la variable y además generar las
utilidades es lo mismo**. No hay que registrar el color en dos sitios.

| Variable | Clases que genera |
|---|---|
| `--color-sena` | `bg-sena`, `text-sena`, `border-sena` |
| `--color-sena-azul` | `bg-sena-azul`, `text-sena-azul`, `border-sena-azul` |
| `--color-sena-acento` | `bg-sena-acento`, `text-sena-acento` |

Y además **acepta modificadores de opacidad**, sin definir nada:

```jsx
<div className="border-sena/20" />   {/* 20% de opacidad */}
<div className="bg-sena/10" />      {/* 10% de opacidad */}
<div className="text-sena-azul/80" />
```

Eso es lo que permite los fondos translúcidos del mensaje de éxito en el login, sin
tener que declarar un color nuevo.

> **Los colores no son un capricho.** El comentario del propio archivo dice de dónde
> salen: el *Manual de Identidad Visual SENA 2024* (Resolución 1825 de 2024), capítulo
> "Arquitectura del color". El tipográfico es Work Sans, que se carga desde
> `index.html`. Si alguien cambia un valor de esta paleta, debería cambiarlo porque el
> manual dice otra cosa, no porque le parezca mejor.

### `@custom-variant`: cómo se activa el modo oscuro

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Esta línea es la que hace que `dark:` funcione **por clase en `<html>`**, y no por
preferencia del sistema.

| Enfoque | Qué hace | Por qué no se usa |
|---|---|---|
| Por defecto en Tailwind | `dark:` responde a `prefers-color-scheme`, o sea, al sistema | El botón del tema no podría forzarlo |
| Con `@custom-variant` | `dark:` responde a que `<html>` tenga `class="dark"` | El botón decide, y funciona siempre |

El comentario del archivo lo explica: *"Sin esto, Tailwind resuelve `dark:` con
`prefers-color-scheme` y el botón no haría nada mientras el sistema no cambiara."*

El que pone la clase es `useTema.js`, antes de que se pinte nada. Está en
[Modo claro y oscuro](11-modo-oscuro.md).

## 3. Los colores del modo oscuro

El bloque `@theme` declara también los del modo oscuro, con nombres que no empiezan por
`dark` sino que los sustituyen:

| Variable | Color | Para qué |
|---|---|---|
| `--color-sena-noche` | `#00121f` | El fondo más profundo |
| `--color-sena-superficie` | `#00304d` | La superficie de las tarjetas |
| `--color-sena-superficie-alta` | `#0a3a5c` | Superficie elevada, al pasar el ratón |
| `--color-sena-borde` | `#14506f` | Los bordes en oscuro |
| `--color-sena-texto` | `#e8f0f7` | El texto principal |
| `--color-sena-texto-suave` | `#9fb8cc` | El texto secundario |
| `--color-sena-acento` | `#5fdd0a` | El acento que sí llega a 4.5:1 |

> **Por qué hay dos verdes.** El verde institucional `#39a900` **no llega al contraste
> mínimo** para texto normal sobre la superficie oscura: da 4.48:1, y el estándar pide
> 4.5:1. Por eso para texto en oscuro se usa `--color-sena-acento` (`#5fdd0a`), que da
> 7.73:1. El `#39a900` se sigue usando para elementos grandes, bordes y rellenos, donde
> el estándar es más permisivo.

### Los ratios de contraste, comprobados

El archivo documenta los cuatro casos. Están medidos, no estimados:

| Combinación | Ratio | Cumple |
|---|---|---|
| Texto principal `#e8f0f7` sobre `#00304d` | 11.92:1 | Sí, muy holgado |
| Texto secundario `#9fb8cc` sobre `#00304d` | 6.67:1 | Sí |
| Verde `#39a900` sobre `#00304d` | 4.48:1 | **No**, para texto normal |
| Acento `#5fdd0a` sobre `#00304d` | 7.73:1 | Sí |

> **La jerarquía del fondo también es una decisión.** El fondo general (`#00121f`) es
> más profundo que la tarjeta (`#00304d`). Al revés, la tarjeta "flotaría" menos. Es un
> detalle sutil que se nota cuando está mal.

## 4. Cómo se escribe una clase en el proyecto

Como las utilidades se generan solas, en un componente se ve así:

```jsx
<label className="flex flex-col gap-1 text-sm font-medium text-sena-azul dark:text-sena-texto">
  Correo
  <input
    type="email"
    className="rounded border border-sena-azul/20 p-2 font-normal text-sena-azul
               focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40
               dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto"
  />
</label>
```

Ese `className` tiene cuatro cosas que se repiten en todo el proyecto:

| Parte | Para qué |
|---|---|
| `flex flex-col gap-1` | La disposición del `label` y su texto |
| `text-sm font-medium text-sena-azul dark:text-sena-texto` | El texto en claro y en oscuro |
| `focus:ring-2 focus:ring-sena/40` | El anillo de foco, que es un requisito de accesibilidad |
| `dark:border-sena-borde dark:bg-sena-noche` | Los ajustes de la superficie en oscuro |

### El patrón del campo de formulario

Todos los campos del proyecto llevan los mismos cuatro grupos de clases. Es lo que
hace que los cuatro formularios de autenticación se vean iguales, y es el motivo por el
que el commit `e22ce52` no tocó 44 líneas: la mayor parte del estilo ya venía de serie.

> **El `focus:ring-2` no es decorativo.** Sin un indicador de foco visible, alguien que
> navega con teclado no sabe dónde está. Está en los cuatro formularios y es una
> decisión de accesibilidad, no de gusto.

## 5. El CSS que sí es a mano

Hay dos cosas que Tailwind no puede hacer, y por eso están escritas en CSS plano al
final de `index.css`.

### Las barras de desplazamiento

Son pseudo-elementos: `::-webkit-scrollbar`, `::-webkit-scrollbar-thumb`. Tailwind no
genera utilidades para ellos, así que se escriben a mano. Ver
[Barras de desplazamiento](12-barras-de-desplazamiento.md).

### La variante `dark` y el bloque `@theme`

Ya explicados arriba. Son directivas del propio motor de Tailwind 4.

## 6. La lista de clases prohibidas

Tailwind trae colores por defecto además de los del proyecto: `bg-blue-900`,
`text-slate-500`, `text-red-600`. Están disponibles, y hay varios sitios donde se usan
a propósito.

| Grupo de clases | Cuándo está permitido |
|---|---|
| `sena-*` | Todo lo que sea identidad institucional. Es el 90% del proyecto |
| `red-*` | Errores: mensajes de error de red, de validación, de permisos |
| `slate-*` | Solo dentro de `PaginaVacia.jsx`, que es un marcador temporal de los módulos sin construir |
| `blue-*` | Nada. Es el color que traía la plantilla de Vite y se borró con `App.css` |

La regla práctica: **si no es un error y no es un marcador temporal, es `sena-*`.** Un
`bg-blue-900` en una pantalla de negocio es un descuido, y en una aplicación
institucional con manual de identidad no es un detalle menor.

Para comprobar que no se ha colado ningún color ajeno:

```bash
npm run build
```

Y buscar `bg-blue`, `text-gray`, `bg-gray` en `src/`. No debería salir nada fuera de
`PaginaVacia.jsx`.

## 7. Los dos fragmentos de CSS a mano, completos

Para tenerlos a mano, las barras de desplazamiento son esto:

```css
.scroll-sena-lateral {
  scrollbar-width: thin;
  scrollbar-color: rgba(57, 169, 0, 0.55) transparent;
}
.scroll-sena-lateral::-webkit-scrollbar { width: 6px; }
.scroll-sena-lateral::-webkit-scrollbar-track { background: transparent; }
.scroll-sena-lateral::-webkit-scrollbar-thumb {
  background-color: rgba(57, 169, 0, 0.55);
  border-radius: 9999px;
}
.scroll-sena-lateral:is(:hover, :focus-within)::-webkit-scrollbar-thumb {
  background-color: #39a900;
}
```

Y para el contenido, lo mismo con el verde oscuro, más su versión en modo oscuro:

```css
.scroll-sena-contenido {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 120, 50, 0.5) transparent;
}
/* ...::-webkit-scrollbar* con los mismos valores... */

.dark .scroll-sena-contenido {
  scrollbar-color: rgba(57, 169, 0, 0.6) transparent;
}
.dark .scroll-sena-contenido::-webkit-scrollbar-thumb {
  background-color: rgba(57, 169, 0, 0.6);
}
.dark .scroll-sena-contenido:is(:hover, :focus-within)::-webkit-scrollbar-thumb {
  background-color: #39a900;
}
```

Tres cosas que el comentario del archivo explica y que no son evidentes:

| Decisión | Por qué |
|---|---|
| Las propiedades estándar **y** las de webkit | Solo con las estándar la barra se ve plana; solo con las de webkit no funciona en Firefox |
| El hover cambia la opacidad, no el grosor | El ancho forma parte del cálculo del layout, y no se puede animar |
| El verde cambia según el fondo | Sobre el menú da 4.77:1 y cumple; sobre fondo claro da 2.93:1 y no, así que ahí va el verde oscuro |

## 8. Cómo se añade un color nuevo

Si hace falta un color que no está en la paleta, el orden correcto es:

1. Añadir la variable en el bloque `@theme` de `src/index.css`, con su comentario
   diciendo de dónde sale.
2. Comprobar el contraste contra las superficies en las que se va a usar, y anotarlo.
3. Usar la utilidad generada: `bg-`, `text-` o `border-` con el nombre nuevo.

Lo que **no** hay que hacer es inventar el color en el `className`:

```jsx
{/* Mal */}   <div className="bg-[#1a7f37]" />
{/* Mal */}   <div className="bg-[#1a7f37]/20" />
{/* Bien */}  <div className="bg-sena-oscuro" />
{/* Bien */}  <div className="bg-sena-oscuro/20" />
```

Un color escrito a mano en el `className` no se puede cambiar de tema, no aparece en
ninguna lista, y dos pantallas con "el mismo verde" acabarán con dos valores distintos.
