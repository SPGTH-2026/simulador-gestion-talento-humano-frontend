# Compilación y despliegue


---

## 20. Compilación y despliegue

### 20.1 Generar la versión de producción

```bash
npm run build
```

Crea la carpeta `dist/` con:

```text
dist/
├── index.html
└── assets/
    ├── index-<hash>.css
    └── index-<hash>.js
```

### 20.2 Publicar

Sube **el contenido de `dist/`** a cualquier servidor web estático: Nginx, Apache,
Netlify, Vercel, Cloudflare Pages o el hosting del SENA.

### 20.3 Configurar el servidor para una SPA

Como es una aplicación de una sola página, **toda** dirección desconocida debe devolver
`index.html` para que React pueda leer la ruta. En Nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Sin esto, recargar en `/documentos` daría error 404 del servidor, aunque la app
funcione.

### 20.4 Variables de entorno en producción

`VITE_*` se compila **dentro** del bundle en el momento de compilar. Si en producción
las direcciones son distintas, hay que definirlas **antes** de `npm run build` y volver
a compilar:

```bash
VITE_API_URL=https://api.ejemplo.gov.co/api npm run build
```

Cambiar el `.env` **después** de compilar no tiene ningún efecto hasta que se compile de
nuevo.

---
