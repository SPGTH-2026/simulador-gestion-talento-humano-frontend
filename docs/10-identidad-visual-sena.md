# Identidad visual SENA


---

## 11. Identidad visual SENA

El proyecto sigue el **Manual de Identidad Visual SENA 2024** (Resolución 1825 de 2024).
Todo está declarado en `src/index.css`, en el bloque `@theme` de Tailwind v4.

### 11.1 Colores del modo claro

| Token | HEX | Uso |
|---|---|---|
| `--color-sena` | `#39a900` | Verde institucional, el color principal del logosímbolo. Botones, acentos, franja de la tarjeta, ítem activo del menú. |
| `--color-sena-oscuro` | `#007832` | Verde oscuro. Botones primarios y estados `hover`. |
| `--color-sena-azul` | `#00304d` | Azul oscuro institucional. Títulos y textos de los formularios. |
| `--color-sena-violeta` | `#71277a` | Violeta institucional (complementario). |
| `--color-sena-amarillo` | `#fdc300` | Amarillo institucional. |
| `--color-sena-cielo` | `#50e5f9` | Azul claro. Fondo suave detrás de la tarjeta de login. |

Gracias a `@theme`, cada uno genera clases: `bg-sena`, `text-sena-azul`,
`border-sena-cielo`… y admite opacidad con la barra: `bg-sena/10`.

### 11.2 Colores del modo oscuro

Derivados del azul institucional. Se eligieron **por contraste medido**, no por gusto:

| Token | HEX | Uso | Contraste sobre `#00304d` |
|---|---|---|---|
| `--color-sena-noche` | `#00121f` | Fondo general, más profundo que las tarjetas. | — |
| `--color-sena-superficie` | `#00304d` | Tarjetas, barra superior, menús. | — |
| `--color-sena-superficie-alta` | `#0a3a5c` | Estados `hover`. | — |
| `--color-sena-borde` | `#14506f` | Bordes para separar. | — |
| `--color-sena-texto` | `#e8f0f7` | Texto principal. | **11.92:1** |
| `--color-sena-texto-suave` | `#9fb8cc` | Texto secundario. | **6.67:1** |
| `--color-sena-acento` | `#5fdd0a` | Acento verde para texto y enlaces. | **7.73:1** |

**Por qué un verde "acento" distinto.** El verde institucional `#39a900` da **4.48:1**
sobre `#00304d`: se queda muy justo por debajo del 4.5:1 que exige la norma de
accesibilidad para texto normal. Se usa tal cual en superficies grandes (franja, botón
sólido, ítem activo) y para **texto** se cambia a `#5fdd0a`, que sí cumple con holgura.

### 11.3 Tipografía

- **Work Sans** (tipografía institucional), cargada desde Google Fonts en `index.html`.
- Declarada en `@theme` como `--font-sans`, con alternativas del sistema por si el
  navegador no puede bajar la fuente: `-apple-system`, `BlinkMacSystemFont`,
  `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`, `sans-serif`.

### 11.4 Logosímbolo

- Archivo: `public/logo-sena.svg`.
- `components/ui/LogoSena.jsx` lo pinta con `mask-image`, así que **hereda el color del
  texto** y se puede reutilizar en cualquier color: `text-sena` en la tarjeta clara,
  blanco sobre el menú.
- En la tarjeta de acceso mide **64×64 px** (`h-16 w-16`), centrado encima del título.
- En el menú lateral mide **52×52 px** (`size-[52px]`), por encima del mínimo de 50 px que
  exige el manual, y sin deformar la geometría original. Va con el texto "SPGTH" al lado.

---
