# Qué es este proyecto


---

## 1. ¿Qué es este proyecto?

Este repositorio es el **Frontend** del sistema **SPGTH** (Simulador de Procesos de
Gestión de Talento Humano).

**Frontend** = todo lo que el usuario ve y toca en el navegador: botones, formularios,
menús, colores, textos. **Backend** = el servidor que guarda la información y verifica
las contraseñas. En este caso el backend está hecho en **Laravel** y vive en **otro
repositorio**; aquí no hay servidor de base de datos ni rutas de API propias.

Objetivo: dar una interfaz moderna, con identidad institucional del **SENA**, por la que
una persona pueda registrarse, iniciar sesión, verificar su correo, recuperar su
contraseña y luego usar los módulos del simulador (convocatorias, documentos, evaluación,
selección,etc.), según los permisos que tenga asignados.

---

---

## 2. Conceptos mínimos para entenderlo

| Concepto | Explicación sencilla |
|---|---|
| **HTML** | La estructura de la página (títulos, párrafos, botones). Es el "esqueleto". |
| **CSS** | El aspecto: colores, tamaños, espacios, fuentes. |
| **JavaScript (JS)** | El comportamiento: qué pasa cuando el usuario hace clic o escribe. |
| **JSX** | Mezcla de HTML y JavaScript. Ejemplo: `<p className="rojo">Hola</p>`. |
| **React** | Librería que permite crear la interfaz por piezas reutilizables (componentes). |
| **Componente** | Una pieza de pantalla. Ej.: un botón, una tarjeta, un menú. Se reutiliza. |
| **Props** | Datos que un componente padre le pasa a un hijo. |
| **Estado (state)** | Información que puede cambiar mientras la app está abierta. Ej.: `{ oscuro: true }`. |
| **Hook** | Función de React para usar estado o efectos. Los de este proyecto son `useAuth`, `useTema`, `useCuentaAtras`. |
| **SPA** (*Single Page Application*) | App de una sola página: no se recarga todo al navegar, solo cambia la parte necesaria. |
| **Ruta** | Dirección interna de la app: `/login`, `/documentos`, etc. Decide qué pantalla se ve. |
| **Layout** | Plantilla base: el "esqueleto" que se repite (por ejemplo, menú lateral + barra superior + contenido). |
| **Vite** | Herramienta que sirve el código mientras lo desarrollo (rápido, recarga al guardar) y que lo compila para producción. |
| **Tailwind CSS** | Framework de estilos: se escribe con clases utilitarias (`bg-white`, `text-sm`) en vez de CSS propio. |
| **npm** | Gestor de paquetes: instala las librerías que el proyecto necesita. |
| **Node.js** | Programa que permite ejecutar JavaScript fuera del navegador. Necesario para `npm`. |
| **Build** | Convertir el código de desarrollo en archivos optimizados para internet (`dist/`). |
| **Autenticación** | Proceso de comprobar quién es el usuario (correo + contraseña). |
| **Sesión** | Estado de "ya estoy logueado" que el servidor recuerda por un tiempo. |
| **Cookie `HttpOnly`** | Archivo que el navegador guarda y envía solo, al que JavaScript **no** puede leer. Así se guarda la sesión de forma segura. |
| **CSRF** | Protección contra ataques que hacen enviar peticiones desde sitios falsos. |
| **Permiso** | Derecho que tiene un usuario (ej.: `documentos:validar`) para ver Certainas pantallas. |
| **localStorage** | Memoria del navegador que sobrevive al cerrar la app. Aquí guarda la preferencia de tema. |
| **sessionStorage** | Como el anterior, pero se borra al cerrar la pestaña. Aquí se recuerda que ya te enviaron un código. |
| **Contraste (ratio)** | Medida de legibilidad entre el color de un texto y su fondo. Si es muy baja, el texto no se lee. |
| **Linter** | Programa que revisa el código y avisa de errores o malas prácticas. |

---

---

## 3. Tecnologías utilizadas

Versiones exactas tomadas de `package.json`:

| Tecnología | Versión | Para qué sirve |
|---|---|---|
| **React** | `^19.2.8` | Construir la interfaz por componentes. |
| **react-dom** | `^19.2.8` | Montar React en la página (`main.jsx`). |
| **react-router-dom** | `^7.18.4` | Navegación y rutas (`router.jsx`). |
| **Vite** | `^8.3.0` | Servidor de desarrollo y compilador de producción. |
| **@vitejs/plugin-react** | `^6.1.1` | Permite que Vite entienda JSX. |
| **Tailwind CSS** | `^4.3.3` | Estilos con clases utilitarias. |
| **@tailwindcss/vite** | `^4.3.3` | Conecta Tailwind con Vite. |
| **Axios** | `^1.20.0` | Cliente HTTP para hablar con el backend. |
| **Oxlint** | `^1.81.0` | Revisión automática del código. |
| **Work Sans** | (Google Fonts) | Tipografía institucional del SENA. |
| **Laravel + Sanctum** | (otro repo) | Backend: usuarios, sesiones, permisos, códigos de verificación. |

---
