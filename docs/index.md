# Empieza por aquí

Este es el índice de la documentación del **frontend**. Son 24 documentos sobre cómo
funciona el proyecto, por qué está escrito así y qué falta por terminar.

Si no sabes por dónde empezar, este es el orden recomendado:

| # | Documento | De qué va |
|---|---|---|
| 00 | [Qué es este proyecto](00-que-es-este-proyecto.md) | Qué hace, qué tiene y qué no tiene |
| 01 | [Instalación](01-instalacion.md) | Ponerlo a funcionar desde cero |
| 02 | [Cómo funciona una petición](02-como-funciona-una-peticion.md) | Qué pasa cuando el navegador pide algo |
| 03 | [Estructura del proyecto](03-estructura-del-proyecto.md) | Qué hay en cada carpeta, archivo por archivo |
| 04 | [Autenticación y sesiones](04-autenticacion.md) | Login, cookie de sesión, CSRF |
| 05 | [Códigos OTP](05-codigos-otp.md) | Verificación de correo y recuperación |
| 06 | [Roles y permisos](06-roles-y-permisos.md) | Quién puede ver qué |
| 07 | [Enrutado y protección de rutas](07-enrutado-y-proteccion.md) | Las 23 rutas y las guardas que las protegen |
| 08 | [El menú lateral](08-menu-lateral.md) | Cómo se construye y cómo se filtra |
| 09 | [Comunicación con el backend](09-comunicacion-con-el-backend.md) | Axios, errores y códigos HTTP |
| 10 | [Identidad visual SENA](10-identidad-visual-sena.md) | La paleta, el logotipo y sus reglas |
| 11 | [Modo claro y oscuro](11-modo-oscuro.md) | El conmutador de tema y cómo se evita el parpadeo |
| 12 | [Barras de desplazamiento](12-barras-de-desplazamiento.md) | Las barras con la paleta institucional |
| 13 | [Componentes y utilidades](13-componentes-y-utilidades.md) | Los 10 componentes y los 4 hooks |
| 14 | [Páginas y módulos](14-paginas-y-modulos.md) | Las 17 pantallas provisionales y cómo construir una |
| 15 | [Estilos con Tailwind CSS](15-estilos-tailwind.md) | Cómo funcionan los colores y las clases del proyecto |
| 16 | [Entorno y configuración](16-entorno-y-configuracion.md) | Las variables, los scripts y los recursos |
| 17 | [Compilación y despliegue](17-compilacion-y-despliegue.md) | Del código a producción |
| 18 | [Calidad, lint y pruebas](18-calidad-lint-y-pruebas.md) | El lint, sus reglas y el aviso conocido |
| 19 | [Convenciones del código](19-convenciones.md) | Cómo se escribe el código aquí |
| 20 | [Historial de los commits](20-historial-de-commits.md) | Los 21 commits, uno por uno |
| 21 | [Solución de problemas](21-solucion-de-problemas.md) | Los errores más frecuentes y su causa |
| 22 | [Glosario de términos](22-glosario.md) | Las palabras que se usan en el proyecto |
| 23 | [Pendientes](23-pendientes.md) | Lo que **no** está terminado |

## Por dónde empezar según lo que necesites

| Si quieres… | Lee |
|---|---|
| Entender el proyecto en general | 00, luego 02 |
| Levantarlo y probarlo | 01, luego 15 |
| Saber por qué un módulo no carga datos | 14, luego 09 |
| Entender la sesión y el login | 04, luego 05 |
| Saber quién ve qué | 06, luego 08 |
| Cambiar colores o el logotipo | 10, luego 11 |
| Añadir un módulo nuevo | 19 (sección 7), luego 14 |
| Entender una decisión de diseño | 20 |
| Saber qué falta por hacer | 23 |

## Arranque rápido

Si solo quieres levantarlo para curiosear:

```bash
# 1. Dependencias
npm install

# 2. Configuración
copy .env.example .env

# 3. Arrancar
npm run dev
```

El frontend queda en `http://localhost:5173`.

> **Usa siempre `localhost`, nunca `127.0.0.1`.** Las cookies de sesión distinguen una
> dirección de la otra, y si el frontend y el backend no coinciden en cómo se llaman
> a sí mismos, la sesión no funciona. Está explicado en
> [Entorno y configuración](16-entorno-y-configuracion.md).

### Requisitos

- **Node.js 20.19+** o **22.12+**
- **npm 10+**
- El **backend Laravel** en `http://localhost:8000`, en un repositorio aparte

### Los dos repositorios

Este repositorio es **solo el frontend**. El backend está en la carpeta hermana,
`Simulador-de-Procesos-de-Gestio-n-de-Talento-Humano`, y tiene su propia documentación
en `docs/`, con 14 documentos y 192 KB.

| Repositorio | Qué es | Su documentación |
|---|---|---|
| Este | La interfaz: React, rutas, permisos, colores | `docs/` (24 documentos) |
| El hermano | La API: Laravel, base de datos, correo | `docs/` (14 documentos) |

## Qué hace este frontend

**Ahora mismo, solo autenticación.** El frontend tiene 23 pantallas, pero 17 de ellas
son marcadores de posición que no piden nada al backend:

| Tipo | Nº | Estado |
|---|---|---|
| Autenticación | 4 | Funcionales: login, registro, recuperación, verificación |
| Módulos de negocio | 17 | Marcadores de posición |
| Página de error | 2 | Funcionales: 403 y 404 |

La identidad visual, el modo oscuro, los permisos, el menú y los dos flujos con código
**sí están terminados**. Lo que falta son los módulos, y está en
[Pendientes](23-pendientes.md).

## Decisiones que conviene conocer

Seis cosas que no son obvias, y que sí están documentadas en detalle:

| Decisión | Por qué |
|---|---|
| **Login con cookie, no con token** | La sesión viaja en una cookie `HttpOnly`: el JavaScript no puede leerla |
| **El CSRF lo pone el código, no axios** | Axios lo manda con un formato que Laravel no siempre acepta |
| **El registro no inicia sesión** | Hay que verificar el correo primero |
| **El fallo de red no cierra la sesión** | Un backend caído no significa que la sesión haya caducado |
| **Los permisos ocultan, no protegen** | La seguridad real la aplica el backend en cada endpoint |
| **`/verificar-correo` vive fuera del marco** | Si compartiera marco con las rutas de negocio, daría un bucle |

## La pila técnica

| Pieza | Versión |
|---|---|
| React | 19 |
| Vite | 8 |
| Tailwind CSS | 4 |
| React Router | 7 |
| Axios | 1 |
| oxlint | 1.x |

**No hay más dependencias.** Sin librería de componentes, sin librería de estado, sin
framework de estilos más allá de Tailwind, sin gestor de formularios, sin probador de
pruebas instalado. Todo lo demás es código propio.

## Estructura

```
src/
├── api/          ← la única puerta al backend (4 archivos)
├── auth/         ← sesión y permisos (4 archivos)
├── components/   ← interfaz reutilizable (3 archivos)
│   └── ui/       ← los componentes básicos (3 archivos)
├── config/       ← el menú con sus permisos (1 archivo)
├── layouts/      ← los dos marcos de pantalla (2 archivos)
├── lib/          ← utilidades puras (2 archivos)
├── pages/        ← 23 pantallas, agrupadas por módulo
│   ├── login/    ← 4 pantallas públicas
│   ├── errores/  ← 403 y 404
│   └── ...       ← 17 marcadores de posición
├── App.jsx       ← existe, pero está vacío
├── index.css     ← los tokens de color del proyecto
├── main.jsx      ← el arranque (14 líneas)
└── router.jsx    ← las 23 rutas (112 líneas)
```

Detalle completo en [Estructura del proyecto](03-estructura-del-proyecto.md).

## Cómo se genera esta documentación

La fuente son los archivos `.md` de `docs/`. Los `.docx` de la carpeta `documentos/` se
generan a partir de ellos:

```bash
python generar_docx.py              # todos
python generar_docx.py --manual     # y además el manual completo
```

**Si editas la documentación, edita el `.md` y vuelve a generar.** Editar el `.docx` a
mano se pierde en la siguiente generación.
