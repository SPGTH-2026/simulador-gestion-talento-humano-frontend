# Frontend en Docker (multi-repo)

Este repo aporta la **imagen del frontend**. El `docker-compose.yml` global
(DB + backend + frontend) vive fuera de este repo, igual que en el backend.

La imagen es de dos etapas: compila el bundle con Node y lo sirve con nginx.
Node no estÃ¡ en la imagen final.

## Build

```bash
docker build -t spgth-frontend:local .
```

## CÃ³mo funciona

El detalle que decide el diseÃ±o: **Vite incrusta `VITE_*` dentro del bundle en
el momento de compilar**, no en ejecuciÃ³n. No hay forma de leerlas al arrancar.

Por eso la imagen se compila con rutas **relativas**:

| Variable | Valor por defecto | Por quÃ© |
|---|---|---|
| `VITE_API_URL` | `/api` | Relativa, no absoluta |
| `VITE_CSRF_URL` | `/sanctum/csrf-cookie` | Relativa, no absoluta |
| `VITE_GOOGLE_URL` | `/api/auth/google/redirect` | Relativa, no absoluta |

nginx hace de proxy inverso de `/api` y `/sanctum` hacia el backend. El
navegador pide `/api/auth/login` al mismo origen desde el que cargÃ³ la pÃ¡gina.

Eso tiene tres ventajas frente a apuntar a `http://backend:80`:

1. **No hay CORS.** PeticiÃ³n del mismo origen, asÃ­ que ni `config/cors.php` ni
   `CORS_ALLOWED_ORIGINS` intervienen.
2. **La cookie de sesiÃ³n no se rompe.** `SameSite=Lax` es vÃ¡lido porque origen
   y destino son el mismo.
3. **Solo hay un puerto pÃºblico.** El backend no necesita `ports:`, y el
   callback de Google vuelve por el mismo camino que el resto de la API.
   Ver la secciÃ³n de OAuth mÃ¡s abajo, que es el Ãºnico sitio donde esto importa.

### Consecuencia: cambiar la URL del backend obliga a recompilar

```bash
docker build --no-cache -t spgth-frontend:local .
```

Si cambias la direcciÃ³n del backend **sin** recompilar, el bundle sigue
apuntando a la ruta de siempre. Reiniciar el contenedor no arregla nada.

Si necesitas una URL absoluta (por ejemplo, un backend en otro host), pÃ¡sala
al compilar y quita el proxy del nginx:

```bash
docker build \
  --build-arg VITE_API_URL=https://api.ejemplo.gov.co/api \
  --build-arg VITE_CSRF_URL=https://api.ejemplo.gov.co/sanctum/csrf-cookie \
  --build-arg VITE_GOOGLE_URL=https://api.ejemplo.gov.co/api/auth/google/redirect \
  -t spgth-frontend:local .
```

En ese caso el backend sÃ­ necesita `CORS_ALLOWED_ORIGINS` apuntando al
frontend, porque vuelven a ser orÃ­genes distintos.

## El login con Google y el callback

Este es el Ãºnico punto donde el proxy inverso se nota de verdad, asÃ­ que
conviene entenderlo antes de tocar nada.

`Login.jsx` no hace una peticiÃ³n: navega la pÃ¡gina entera.

```js
// src/pages/login/Login.jsx:47
const entrarConGoogle = () => {
  window.location.href = GOOGLE_URL   // /api/auth/google/redirect
}
```

La cadena es esta:

```
navegador  ->  /api/auth/google/redirect     (nginx, en el puerto pÃºblico)
          ->  Google                          (sale a internet)
Google     ->  GOOGLE_REDIRECT_URI            (vuelve)
          ->  FRONTEND_URL                    (el backend manda al login)
```

El paso que hay que configurar bien es el tercero. Google redirige a
`GOOGLE_REDIRECT_URI`, que es una variable **del backend**, y a
`http://localhost:8000/...` no llega nadie si el backend no estÃ¡ publicado.

Hay dos formas de arreglarlo.

### OpciÃ³n A: el callback vuelve por el frontend (recomendada)

```yaml
backend:
  environment:
    FRONTEND_URL: http://localhost:8080
    GOOGLE_REDIRECT_URI: http://localhost:8080/api/auth/google/callback
```

Google vuelve al puerto 8080, nginx reenvÃ­a `/api/auth/google/callback` al
backend, y la cookie de sesiÃ³n se guarda en `localhost:8080`, que es
justamente el origen desde el que la SPA llama a la API.

Solo hay un puerto publicado y el backend se puede quedar sin `ports:`.

> Google acepta `http://localhost:PUERTO/...` como excepciÃ³n a la regla de
> que las URIs de redirecciÃ³n tienen que ser HTTPS. En cuanto el despliegue
> deje de ser `localhost`, la URI pasa a necesitar un dominio con
> certificado.

### OpciÃ³n B: publicar el backend

```yaml
backend:
  ports:
    - "8000:80"
  environment:
    FRONTEND_URL: http://localhost:8080
    GOOGLE_REDIRECT_URI: http://localhost:8000/api/auth/google/callback
```

Funciona, porque las cookies no distinguen de puerto: la que se guarda en
`localhost:8000` tambiÃ©n se envÃ­a a `localhost:8080`. Pero abre un segundo
puerto y deja la API accesible desde fuera de nginx, que es justo lo que el
proxy inverso busca evitar.

**La que no funciona es dejar `GOOGLE_REDIRECT_URI` en `localhost:8000` sin
publicar el backend.** El login con contraseÃ±a sigue funcionando, porque va
por `/api` a travÃ©s de nginx, y el fallo aparece solo al pulsar "Entrar con
Google": Google no encuentra el callback. Si eso pasa, mira primero esta
variable.

## Ejemplo de servicio para tu compose global

```yaml
frontend:
  build:
    context: ./ruta/a/este/repo
  image: spgth-frontend:local
  ports:
    - "8080:80"
  depends_on:
    backend:
      condition: service_healthy
  environment:
    # Solo si el servicio del backend NO se llama 'backend'. Con el nombre
    # por defecto no hace falta declarar nada.
    SPGTH_API_UPSTREAM: http://backend:80
    SPGTH_SANCTUM_UPSTREAM: http://backend:80
```

## Lo que el backend necesita para que esto funcione

El frontend solo sirve la SPA; el backend sigue siendo el que autentica. En el
servicio `backend` del compose global, estas tres variables deben apuntar a la
direcciÃ³n **pÃºblica** del frontend, no al nombre del servicio de Docker:

```yaml
backend:
  environment:
    FRONTEND_URL: http://localhost:8080
    SANCTUM_STATEFUL_DOMAINS: localhost:8080
    CORS_ALLOWED_ORIGINS: http://localhost:8080
```

El puerto `8080` es solo un ejemplo: usa el que publiques en `ports`.

### Si la sesiÃ³n no se conserva

Es el Ãºnico problema real de este montaje, y hay que saber diagnosticarlo.

El login responde 200, pero al recargar salta al login otra vez, o
`GET /api/auth/me` devuelve 401. La causa es `SANCTUM_STATEFUL_DOMAINS`.
Sanctum decide si una peticiÃ³n trae sesiÃ³n por cookie comparando el `Referer`
o el `Origin` contra esa lista, asÃ­ que tiene que contener el origen exacto
del navegador.

Prueba primero con el host sin esquema, que es el formato que ya usa el
`DOCKER.md` del backend:

```yaml
SANCTUM_STATEFUL_DOMAINS: localhost:8080
```

Si sigue sin funcionar, usa la URL completa con esquema:

```yaml
SANCTUM_STATEFUL_DOMAINS: http://localhost:8080
```

CÃ³mo confirmarlo en el navegador, pestaÃ±a Network:

| PeticiÃ³n | Lo que hay que ver |
|---|---|
| `GET /sanctum/csrf-cookie` | 200 y la cabecera `Set-Cookie: XSRF-TOKEN` |
| `POST /api/auth/login` | 200 y la cabecera `Set-Cookie: laravel-session` |
| `GET /api/auth/me` | 200, con el usuario; 401 significa que la sesiÃ³n no se reconhece |
| Cabecera `Referer` del login | Debe ser `http://localhost:8080/...` |

Si la sesiÃ³n no se conserva, mira primero el `Referer` que envÃ­a el navegador:
si no es el que esperas, el problema estÃ¡ en la lista del backend, no en nginx.

Un caso aparte: si el login con contraseÃ±a funciona y el de Google no, el
problema no es la sesiÃ³n sino `GOOGLE_REDIRECT_URI`. EstÃ¡ descrito en la
secciÃ³n de OAuth de arriba.

## Notas

- **Fallback de la SPA**: `try_files ... /index.html`. Sin esto, recargar en
  `/procesos` o en `/login` da 404, porque esos archivos no existen en disco.
- **CachÃ©**: los archivos de `/assets/` llevan hash en el nombre y se cachean
  un aÃ±o con `immutable`. `index.html` nunca se cachea, para que un despliegue
  nuevo se vea sin `Ctrl+F5`.
- **DNS**: nginx resuelve `backend` en cada peticiÃ³n, no al arrancar. Por eso
  `docker compose up` funciona aunque el backend tarde mÃ¡s en arrancar.
- **Healthcheck**: `GET /healthz` lo responde el propio nginx. Comprueba que el
  frontend estÃ¡ vivo, no que todo el sistema lo estÃ©.
- **Fuentes**: Work Sans se carga desde el CDN de Google en `index.html`. Si el
  despliegue es sin salida a internet, hay que selfhostearla: no es cosa de
  esta imagen.
- **HTTPS**: aquÃ­ no hay nada. Si lo sirves detrÃ¡s de un proxy que termina TLS,
  el `X-Forwarded-Proto` ya viaja, y el backend necesita confiar en proxies
  (`trustProxies`) para emitir cookies `Secure`.

## Desarrollo: sigue usando `npm run dev`

Docker no sustituye al servidor de Vite para iterar. El ciclo local:

```bash
npm install
npm run dev
```

El `.env` local sigue apuntando a `http://localhost:8000/api`, que es
correcto para desarrollo. La imagen de Docker es para el despliegue integrado,
donde el backend se llama por nombre de servicio.

Que los dos montajes den hashes distintos de bundle es lo esperado, y es la
prueba de que los `VITE_*` se estÃ¡n aplicando de verdad:

| Montaje | Hash del JS | Rutas incrustadas |
|---|---|---|
| `npm run build` | usa tu `.env` | `http://localhost:8000/api` |
| `docker build` | usa los `ARG` | `/api` |

## TamaÃ±o de la imagen

| Cosa | TamaÃ±o |
|---|---|
| `spgth-frontend:local` | 25 MB comprimida, ~94 MB en disco |
| `nginx:alpine`, que es la base | 25 MB comprimida |
| Lo que aporta el frontend | **392 KB** de HTML y 52 KB de config |
| `index.html` | 1,6 KB |
| `assets/index-*.js` | 345 KB (109 KB con gzip) |
| `assets/index-*.css` | 18 KB (4 KB con gzip) |

Node no estÃ¡ en la imagen final: solo existe en la etapa de compilaciÃ³n, que
se descarta. Los 392 KB son el bundle entero.

## QuÃ© se ha comprobado

La imagen se construyÃ³ y se probÃ³ contra un backend real, no solo como
configuraciÃ³n:

| ComprobaciÃ³n | Resultado |
|---|---|
| `docker build` | 123 mÃ³dulos, 345 KB de JS |
| Arranca sin que exista el backend | 0 reinicios |
| `GET /login`, `/procesos`, rutas profundas | 200, sirve la SPA |
| `GET /assets/no-existe.js` | 404, no devuelve HTML |
| `Cache-Control` de `/assets/*` | `max-age=31536000, immutable` |
| `Cache-Control` de `index.html` | `no-cache, no-store` |
| Cabeceras de seguridad en la pÃ¡gina | presentes |
| gzip en el bundle | activo, 345 KB â†’ 109 KB |
| Proxy a `/api` y `/sanctum` por nombre de servicio | llega el JSON y las cookies |
| `Set-Cookie: laravel-session` reenviada | llega al navegador |
| Un 404 del backend | se propaga, no se convierte en la SPA |
| Backend apagado | la SPA sigue sirviendo, la API da 502 |
| Cadena de Google (redirect â†’ Google â†’ callback) | completa por el puerto 8080 |
| Rutas incrustadas en el bundle | `/api`, sin `localhost:8000` |
| `.env` local dentro de la imagen | no estÃ¡ |
| Contexto de build | 196 KB, gracias al `.dockerignore` |

