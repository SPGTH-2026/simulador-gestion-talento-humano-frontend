# syntax=docker/dockerfile:1

# Etapa 1: compilar el bundle con Vite.
#
# Se usa bookworm-slim (glibc) y no alpine a propósito: @tailwindcss/oxide trae
# binarios nativos y el juego de musl no es idéntico al de tu máquina. Compilar
# con la misma libc que usas en local evita sorpresas. El tamaño no importa,
# porque esta etapa no llega a la imagen final.
FROM node:24-bookworm-slim AS build

WORKDIR /app

# Primero solo los manifiestos. Esta capa se reutiliza mientras no cambien,
# así que 'docker build' tras tocar un .jsx no reinstala 300 MB de node_modules.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Vite incrusta estas variables DENTRO del bundle en el momento de compilar.
# No hay forma de leerlas en ejecución: por eso son ARG y no un ENV normal.
# Consecuencia práctica: si cambia la dirección del backend, hay que
# RECOMPILAR la imagen; no basta con reiniciar el contenedor.
#
# Los valores por defecto son rutas relativas porque nginx hace de proxy
# inverso: el navegador llama a /api en el mismo origen que la página, y así
# no hay CORS ni problemas de SameSite con la cookie de sesión. Ver DOCKER.md.
ARG VITE_API_URL=/api
ARG VITE_CSRF_URL=/sanctum/csrf-cookie
ARG VITE_GOOGLE_URL=/api/auth/google/redirect

ENV VITE_API_URL=$VITE_API_URL \
    VITE_CSRF_URL=$VITE_CSRF_URL \
    VITE_GOOGLE_URL=$VITE_GOOGLE_URL

# Falla la construcción si el código no compila. Es lo que se quiere en CI.
RUN npm run build


# Etapa 2: servir los estáticos con nginx. Node no llega aquí.
FROM nginx:alpine AS runtime

# Dirección del backend dentro de la red de Docker. El nombre del servicio es
# el que se use en el compose global; con 'depends_on' + 'service_healthy' no
# hace falta tocarlo. La plantilla de nginx sustituye estas dos variables al
# arrancar el contenedor.
ENV SPGTH_API_UPSTREAM=http://backend:80 \
    SPGTH_SANCTUM_UPSTREAM=http://backend:80

COPY --from=build /app/dist /usr/share/nginx/html

# La imagen oficial de nginx sustituye /etc/nginx/templates/*.template por
# envsubst al arrancar. Por eso la configuración es una plantilla y no un
# .conf fijo: así una misma imagen sirve para distintos backends.
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80

# wget viene en busybox, así que no hace falta instalar nada. La ruta /healthz
# la responde el propio nginx, sin tocar PHP ni el bundle.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -qO- http://127.0.0.1/healthz || exit 1

# STOPSIGNAL viene de la imagen base. NoCMD o ENTRYPOINT: la imagen oficial ya
# trae su entrypoint, que es el que renderiza la plantilla.
