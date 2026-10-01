# Glosario de términos


---

## 22. Glosario de términos

| Término | Significado sencillo |
|---|---|
| **Accesibilidad (a11y)** | Poder usar la app también con teclado o lector de pantalla. |
| **ARIA** | Atributos que describen un elemento para los lectores de pantalla (`aria-label`, `role="alert"`). |
| **Build** | Convertir el código de desarrollo en archivos optimizados para internet. |
| **Cache busting** | Poner un hash en el nombre del archivo para que el navegador descargue la versión nueva. |
| **Contraste (ratio)** | Medida de legibilidad entre texto y fondo. Por debajo de 4.5:1 el texto normal no cumple. |
| **Cookie `HttpOnly`** | Cookie que el navegador envía sola y que JavaScript no puede leer. |
| **CSRF** | Protección contra formularios falsos enviados desde otros sitios. |
| **DOM** | La estructura de la página tal como la ve el navegador. |
| **Envoltura / Wrapper** | Componente que rodea a otros para darles comportamiento común. |
| **Estado global** | Datos compartidos por toda la app sin pasarlos por props. |
| **Fake / código muerto** | Código que existe en el repo pero que nadie usa. Ya no queda ninguno: se borraron `App.jsx`, `App.css` y `src/assets/`. |
| **Flash (FOUC)** | Parpadeo al cargar por aplicar el tema tarde. Se evita con el script de `index.html`. |
| **Hash** | Identificador corto en el nombre de un archivo compilado. |
| **Hook** | Función de React para estado o efectos (`useAuth`, `useTema`, `useCuentaAtras`). |
| **HTTP 401 / 403 / 419 / 429** | 401 sin sesión · 403 sin permiso · 419 CSRF inválido · 429 demasiadas peticiones. |
| **`HttpOnly`** | Ver "Cookie `HttpOnly`". |
| **Lint** | Revisión automática del código. |
| **Máscara (`mask-image`)** | Truco para pintar un SVG de cualquier color. |
| **`min-h-0`** | Permite que un elemento flexible en columna pueda encogerse y generar barra de desplazamiento. |
| **OTP** | Código de un solo uso, de 6 dígitos, para verificar el correo. |
| **Permiso** | Derecho como `documentos:validar` que decide qué pantallas se ven. |
| **Props** | Datos que un componente padre pasa a un hijo. |
| **Sanctum** | Paquete de Laravel para sesiones por cookie con protección CSRF. |
| **SPA** | Aplicación de una sola página. |
| **Token** | Texto secreto que identifica una sesión (aquí viaja en cookie, no en `localStorage`). |
| **UI** | *User Interface*: la parte visual. |
| **Utilidad (Tailwind)** | Clase pequeña y reutilizable de estilo (`p-2`, `text-sm`). |

---
