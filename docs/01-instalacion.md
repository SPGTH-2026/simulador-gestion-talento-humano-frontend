# Instalación


---

## 5. Instalación paso a paso

### 5.1 Requisitos previos

| Programa | Para qué | Descarga |
|---|---|---|
| **Node.js** (LTS, 20 o superior) | Ejecutar `npm` y Vite | <https://nodejs.org> |
| **Git** | Clonar el repositorio | <https://git-scm.com> |
| **VS Code** (recomendado) | Editar el código | <https://code.visualstudio.com> |

Comprueba que están instalados (PowerShell o terminal):

```bash
node --version
npm --version
git --version
```

Cada uno debe mostrar un número, por ejemplo `v22.11.0`, `10.9.0`, `2.47.1`.

### 5.2 Clonar el proyecto

```bash
git clone https://github.com/SPGTH-2026/simulador-gestion-talento-humano-frontend.git
cd simulador-gestion-talento-humano-frontend
```

### 5.3 Instalar las dependencias

```bash
npm install
```

Descarga todo lo de `node_modules/`. La primera vez puede tardar 1–2 minutos. Después,
las siguientes instalaciones son casi instantáneas.

### 5.4 Crear tu archivo de configuración

```bash
# Windows (PowerShell o CMD)
copy .env.example .env

# Linux o macOS
cp .env.example .env
```

### 5.5 Levantar el servidor de desarrollo

```bash
npm run dev
```

Salida esperada:

```text
  VITE v8.3.1  ready in 300 ms
  ➜  Local:   http://localhost:5173/
```

Abre **<http://localhost:5173/login>** en el navegador.

> ⚠️ **Usa siempre `localhost`, nunca `127.0.0.1`.** Las cookies de sesión distinguen
> el nombre del host y las dos direcciones **no** comparten sesión. Explicado en el
> [capítulo 21](#21-solución-de-problemas-frecuentes).

### 5.6 (Opcional) Levantar el backend

Este repositorio es solo el frontend. Para que el login funcione hace falta el proyecto
Laravel corriendo en `http://localhost:8000`. Sin él, la app carga pero muestra el aviso
"No pudimos conectarnos. Inténtalo de nuevo en un momento."

---

---

## 19. Cómo probar el proyecto

### 19.1 Rutas públicas (con `npm run dev` corriendo)

| Ruta | Resultado esperado |
|---|---|
| <http://localhost:5173/login> | 200 — formulario de acceso |
| <http://localhost:5173/registro> | 200 — formulario de registro |
| <http://localhost:5173/recuperar> | 200 — recuperación de contraseña |

> `/verificar-correo` **también** devuelve 200, pero al abrirla sin sesión
> `ProtectedRoute` te manda a `/login`. Es el comportamiento correcto.

### 19.2 Probar el modo oscuro

1. Abre <http://localhost:5173/login>.
2. Mira el aspecto: debe seguir el tema de tu sistema.
3. Entra a la aplicación y pulsa el botón sol/luna de la barra superior.
4. **Recarga con `F5`:** no debe haber ningún parpadeo.
5. Abre las herramientas del navegador (`F12`) → pestaña *Elementos* → `<html>`: debe
   tener `class="dark"` si el tema está oscuro.
6. En *Consola*, ejecuta `localStorage.getItem('spgth-tema')`: debe devolver
   `'oscuro'` o `'claro'`.
7. Cambia el tema del sistema operativo **sin** haber pulsado el botón: la app debe
   seguir al sistema.
8. Pulsa el botón para elegir el tema a mano, cambia el del sistema: la app **no** debe
   cambiar.

### 19.3 Probar el menú y la barra de desplazamiento

1. Entra como un usuario con **todos** los permisos: el menú queda largo.
2. Comprueba que el logo "SPGTH" de arriba **no se mueve** al desplazarse.
3. La barra del menú debe ser verde institucional, 6 px, sin canal visible.
4. Pasa el ratón por encima: la barra se vuelve verde sólido, sin cambiar de grosor.
5. Haz lo mismo en el contenido de la derecha.
6. Cambia a modo oscuro: la barra del contenido pasa de verde oscuro a verde claro.

### 19.4 Probar la compilación

```bash
npm run build
npm run preview
```

Abre la dirección que indique (por defecto <http://localhost:4173>) y comprueba que se
ve igual que en desarrollo, incluido el modo oscuro sin parpadeo.

---
