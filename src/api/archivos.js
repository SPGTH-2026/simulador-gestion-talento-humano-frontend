import client from './client'

// Pide un archivo del backend (con la sesión) como Blob. Admite AbortSignal para cancelar si el visor se cierra o cambia de documento.
// Las rutas son las autorizadas de siempre (propia del aspirante o de revisión por ficha); aquí no se inventa ninguna.
export const obtenerArchivo = (ruta, { signal } = {}) =>
  client.get(ruta, { responseType: 'blob', signal }).then((res) => res.data)
