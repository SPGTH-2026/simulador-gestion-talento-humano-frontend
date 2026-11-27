import client from './client'

// Citaciones de Selección (entrevista o prueba técnica). Todo bajo /seleccion para el personal y /citaciones para el aspirante;
// el backend decide permisos y alcance. La fecha y la hora van y vienen en hora de Colombia (se guardan en UTC).

// GET /api/seleccion/convocatorias/{c}/candidatos/{p}/citaciones
//   -> { data: { actividades: [{ id, etiqueta }], razon: string | null, citaciones: [Cita con historial] } }
// 'actividades' solo trae las activas de la convocatoria ([] = sin actividades: no se ofrecen citas). 'razon': por qué ahora no se
// puede programar (o null).
export const citacionesDeCandidato = (convocatoriaId, postulacionId) =>
  client.get(`/seleccion/convocatorias/${convocatoriaId}/candidatos/${postulacionId}/citaciones`).then((res) => res.data)

// POST .../citaciones  body { actividad, fecha: 'AAAA-MM-DD', hora: 'HH:MM', lugar_o_enlace, indicaciones? }
//   -> 201 con la cita, o 200 si se reenvió exactamente lo mismo (no duplica). 422 con errores por campo.
export const programarCita = (convocatoriaId, postulacionId, datos) =>
  client.post(`/seleccion/convocatorias/${convocatoriaId}/candidatos/${postulacionId}/citaciones`, datos).then((res) => res.data)

// PUT .../citaciones/{id}  body { fecha, hora, lugar_o_enlace, indicaciones? }  -> reprograma una cita programada.
export const reprogramarCita = (convocatoriaId, postulacionId, citacionId, datos) =>
  client.put(`/seleccion/convocatorias/${convocatoriaId}/candidatos/${postulacionId}/citaciones/${citacionId}`, datos).then((res) => res.data)

// POST .../citaciones/{id}/cancelar  body { motivo }  (mínimo 10 caracteres)
export const cancelarCita = (convocatoriaId, postulacionId, citacionId, motivo) =>
  client
    .post(`/seleccion/convocatorias/${convocatoriaId}/candidatos/${postulacionId}/citaciones/${citacionId}/cancelar`, { motivo })
    .then((res) => res.data)

// GET /api/citaciones  ->  { data: [Cita + { convocatoria }] }  (solo las del aspirante; sin historial interno)
// Cita: { id, postulacion_id, actividad, actividad_etiqueta, estado: 'programada' | 'cancelada', fecha_hora (UTC), fecha, hora,
//   zona_horaria, lugar_o_enlace, es_enlace, indicaciones, motivo_cancelacion }
export const misCitaciones = () => client.get('/citaciones').then((res) => res.data)
