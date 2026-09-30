export function mensajeError(error) {
  // Sin respuesta: el backend está apagado o no hay red
  if (!error.response) {
    return 'No se pudo conectar con el servidor. Revisa que el backend esté corriendo.'
  }

  const { status, data } = error.response

  if (status === 429) {
    return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.'
  }

  // Laravel: { errors: { email: ['mensaje'], password: ['mensaje'] } }
  if (status === 422 && data?.errors) {
    const primerCampo = Object.values(data.errors)[0]
    return primerCampo?.[0] ?? 'Los datos enviados no son válidos.'
  }

  return data?.message ?? 'Ocurrió un error inesperado.'
}
