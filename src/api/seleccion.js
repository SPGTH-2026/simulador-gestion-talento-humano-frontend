import client from './client'

// Módulo de Selección. Todas las rutas viven bajo /seleccion y el backend decide
// el alcance (fichas del usuario) y los permisos: el frontend solo los refleja.

// GET /api/seleccion/convocatorias?page=&estado=&convocatoria=&atencion=
//   -> { data: [{ id, codigo, nombre, cargo, estado: { codigo, nombre }, vacantes, candidatos }],
//        meta: { current_page, last_page, per_page, total } }
// 'candidatos': postulaciones en estado postulada (el mismo total del panel de candidatos; puede ser 0).
// 'estado': publicada | en_proceso | cerrada; se aplica antes de paginar. 'convocatoria': una sola, por id (enlaces
// directos fuera de la primera página). 'atencion=1': solo las que requieren atención del seleccionador (en proceso,
// con algún candidato listo para Ranking y sin lista de finalistas); NO pagina: devuelve hasta 4 con
// meta: { limite, hay_mas } y 'listos' en cada fila.
// 'codigo' llega en null para quien no gestiona convocatorias (p. ej. el
// seleccionador): se identifica por 'nombre'. Sin borradores.
export const listaConvocatoriasSeleccion = (params) =>
  client.get('/seleccion/convocatorias', { params }).then((res) => res.data)

// GET /api/seleccion/convocatorias/{id}/candidatos?page=
//   -> { data: [{ id, aspirante, estado_documental, cumplimiento }], meta: {...} }
// estado_documental: pendiente | habilitado | no_habilitado | requiere_revision.
// cumplimiento: entero 0-100 o null (null = sin dato; 0 es un porcentaje válido).
export const candidatosConvocatoria = (convocatoriaId, params) =>
  client.get(`/seleccion/convocatorias/${convocatoriaId}/candidatos`, { params }).then((res) => res.data)

// GET /api/seleccion/convocatorias/{id}/configuracion
//   -> { data: { convocatoria_id, estado_convocatoria, editable, configurada, bloqueada,
//        opcion, entrevista: { activa, peso }, prueba_tecnica: { activa, peso },
//        actualizada_por, actualizada_en } }
// opcion: null (pendiente de configurar) | sin_actividades | solo_entrevista |
//         solo_prueba_tecnica | ambas.
export const obtenerConfiguracion = (convocatoriaId) =>
  client.get(`/seleccion/convocatorias/${convocatoriaId}/configuracion`).then((res) => res.data)

// PUT /api/seleccion/convocatorias/{id}/configuracion
//   body { entrevista_activa, prueba_tecnica_activa, peso_entrevista?, peso_prueba_tecnica? }
//   Devuelve la configuración guardada (mismo formato del GET). 422 con
//   errores por campo si los pesos no son válidos o la convocatoria no admite cambios.
export const guardarConfiguracion = (convocatoriaId, datos) =>
  client.put(`/seleccion/convocatorias/${convocatoriaId}/configuracion`, datos).then((res) => res.data)

// GET /api/seleccion/convocatorias/{c}/candidatos/{p}/referencia-documental
//   -> { data: { postulacion_id, aspirante, estado_documental, cumplimiento,
//        evaluaciones: [{ id, evaluador, cumplimiento, resultado, actualizada_en }],
//        referencia: null | { id, evaluacion_id, evaluador, cumplimiento, resultado,
//          justificacion, designada_por, designada_en, vigente } } }
// Solo Instructor y Superadministrador (el backend responde 403 al resto).
export const obtenerReferencia = (convocatoriaId, postulacionId) =>
  client
    .get(`/seleccion/convocatorias/${convocatoriaId}/candidatos/${postulacionId}/referencia-documental`)
    .then((res) => res.data)

// POST (mismo recurso) body { evaluacion_id, justificacion }. 201 con el mismo formato del GET;
// 422 por campo (justificacion, evaluacion_id, postulacion).
export const designarReferencia = (convocatoriaId, postulacionId, datos) =>
  client
    .post(`/seleccion/convocatorias/${convocatoriaId}/candidatos/${postulacionId}/referencia-documental`, datos)
    .then((res) => res.data)

// GET /api/seleccion/convocatorias/{c}/candidatos/{p}/calificaciones
//   -> { data: { postulacion_id, aspirante, estado_documental, calificable,
//        configuracion: { configurada, bloqueada }, estado_convocatoria,
//        actividades: { entrevista|prueba_tecnica: { activa, peso, estado: desactivada|pendiente|registrada,
//          calificacion: null | { nota, fecha_realizacion, observacion, registrada_por, registrada_en,
//            actualizada_en, correcciones: [{ nota_anterior, nota_nueva, fecha_anterior, fecha_nueva,
//              observacion_anterior, observacion_nueva, motivo, corregida_por, corregida_en }] } } },
//        progreso: { requeridas, registradas, pendientes, completo },
//        resultado_adicional: { estado: pendiente_de_configurar|sin_actividades|incompleto|completo, valor } } }
// Las notas viajan como texto con dos decimales ("8.50").
export const obtenerCalificaciones = (convocatoriaId, postulacionId) =>
  client
    .get(`/seleccion/convocatorias/${convocatoriaId}/candidatos/${postulacionId}/calificaciones`)
    .then((res) => res.data)

// PUT .../calificaciones/{entrevista|prueba_tecnica} body { nota, fecha_realizacion (AAAA-MM-DD),
//   observacion?, motivo? }. 201 si crea y 200 si corrige o reenvía igual; devuelve el mismo formato
//   del GET. Corregir una nota registrada exige 'motivo'. 422 por campo.
export const guardarCalificacion = (convocatoriaId, postulacionId, actividad, datos) =>
  client
    .put(`/seleccion/convocatorias/${convocatoriaId}/candidatos/${postulacionId}/calificaciones/${actividad}`, datos)
    .then((res) => res.data)

// GET /api/seleccion/convocatorias/{c}/ranking?page=
//   -> { data: [{ postulacion_id, aspirante, posicion, resultado_adicional, cumplimiento_documental,
//        sugerencia, finalista }],
//        meta: { current_page, last_page, per_page, total, modo, version, vacantes, postuladas, listos,
//          no_listos, objetivo: { valor, configurado, efectivo }, sugeridos, empate_en_corte,
//          lista_confirmada } }
// Solo llegan los candidatos listos, ya ordenados y con su posición: el servidor decide el orden, los
// empates (misma posición) y la sugerencia. modo: pendiente_de_configurar | sin_actividades |
// con_actividades. Sin actividades 'posicion', 'resultado_adicional' y 'sugerencia' llegan en null.
// sugerencia: sugerido | empate_en_corte | no_sugerido | null. 'version' identifica este ranking.
// empate_en_corte: null | { posicion, resultado, postulaciones: [ids] }.
// lista_confirmada: null | { version, confirmada_en, total, requiere_revision }.
export const rankingConvocatoria = (convocatoriaId, params) =>
  client.get(`/seleccion/convocatorias/${convocatoriaId}/ranking`, { params }).then((res) => res.data)

// PUT .../ranking/objetivo body { objetivo: entero 1-500 | null (vuelve a 2 x vacantes) }
//   -> { data: { objetivo, configurado, efectivo, vacantes, version } }. 422 si no está en proceso.
export const fijarObjetivoFinalistas = (convocatoriaId, objetivo) =>
  client.put(`/seleccion/convocatorias/${convocatoriaId}/ranking/objetivo`, { objetivo }).then((res) => res.data)

// GET .../finalistas?page=  (la página pagina el historial de versiones)
//   -> { data: { actual: null | { version, modo, objetivo, motivo, confirmada_por, confirmada_en,
//          requiere_revision, revisar: [{ postulacion_id, motivo: ya_no_elegible|cambio_resultado }],
//          finalistas: [{ postulacion_id, aspirante, posicion, resultado_adicional }] },
//        versiones: [{ version, modo, total, motivo, confirmada_por, confirmada_en }] },
//        meta: { current_page, last_page, per_page, total } }
export const finalistasConvocatoria = (convocatoriaId, params) =>
  client.get(`/seleccion/convocatorias/${convocatoriaId}/finalistas`, { params }).then((res) => res.data)

// POST .../finalistas body { version (la del ranking leído), postulacion_ids, justificacion? (10-500) }.
//   201 crea una versión nueva; 200 devuelve la vigente si es idéntica. Misma forma que 'actual'.
//   409 { codigo: 'ranking_desactualizado' } si el ranking cambió; 422 por campo (justificacion,
//   postulacion_ids, convocatoria). La justificación es obligatoria sin actividades, con empate en el
//   corte o si la lista difiere de la sugerida. Devuelve { data, creada } (creada = 201).
export const confirmarFinalistas = (convocatoriaId, datos) =>
  client
    .post(`/seleccion/convocatorias/${convocatoriaId}/finalistas`, datos)
    .then((res) => ({ data: res.data.data, creada: res.status === 201 }))

// GET .../decisiones?page=  (seleccion:ver)
//   -> { data: [{ postulacion_id, aspirante, posicion, en_lista, estado: pendiente|seleccionado|no_seleccionado,
//          decision: null | { resultado, motivo, lista_version, decidida_por, decidida_en },
//          requiere_revision, motivo_revision: null | fuera_de_lista | ya_no_elegible | cambio_resultado,
//          confirmada: null | { lista_version, posicion, resultado },
//          actual: null | { listo, posicion, resultado, estado_documental, cumplimiento_documental },
//          sustento: null | { lista_version, confirmada_en, pertenece, posicion, resultado } }],
//        meta: { current_page, last_page, per_page, total, estado_convocatoria, pendientes,
//          cupos: { vacantes_totales, cupos_ocupados, cupos_disponibles },
//          lista: null | { version, total, requiere_revision, modo, confirmada_por, confirmada_en } } }
// Son los finalistas de la lista vigente MÁS las personas con decisión que ya salieron de ella (en_lista: false,
// posicion: null). Ordenadas por posición; las de fuera de lista van al final. Los cupos son los de la convocatoria
// entera, no los de la página.
// Evidencia de cada fila (tres cosas distintas, no mezclarlas):
//  - 'confirmada': lo que CONSERVÓ la lista vigente al confirmarse (posición y resultado; null si la fila no está en ella).
//    El desglose por actividad NO se congela: solo existen estos dos datos.
//  - 'actual': cómo está HOY según el Ranking vivo (null si la postulación ya no está postulada). 'posicion' y 'resultado'
//    son null sin actividades configuradas o si el candidato no está listo.
//  - 'sustento': la fila de la lista cuya versión quedó registrada en la DECISIÓN (null sin decisión). 'pertenece' es false
//    si esa versión no contiene al candidato: pasa al liberar un cupo, que registra la versión vigente aunque ya no lo
//    incluya; entonces 'posicion' y 'resultado' son null y no hay nada que mostrar de esa versión.
// 'resultado' llega como texto con dos decimales ("8.70") y 'posicion' como entero o null.
export const decisionesConvocatoria = (convocatoriaId, params) =>
  client.get(`/seleccion/convocatorias/${convocatoriaId}/decisiones`, { params }).then((res) => res.data)

// PUT .../decisiones/{p} (seleccion:decidir) body { resultado: seleccionado|no_seleccionado, justificacion (10-500),
//   lista_version }. 'lista_version' es la de meta.lista que se consultó y es OBLIGATORIA salvo al liberar un cupo
//   (rectificar seleccionado -> no_seleccionado), donde el servidor la ignora y usa la vigente. Solo con la convocatoria
//   en proceso. 201 si crea y 200 si rectifica o reenvía lo mismo (sin evento nuevo).
//   -> { data: { postulacion_id, aspirante, estado, decision, cupos } }
//   409 con { message, codigo }: sin_cupos (+ cupos), lista_no_confirmada, lista_reemplazada (+ lista_version_actual),
//   lista_requiere_revision (+ revisar). 422 por campo (justificacion, lista_version, postulacion, convocatoria,
//   resultado). Un 409 deja todo sin guardar: se refresca y se revisa antes de volver a confirmar.
export const guardarDecision = (convocatoriaId, postulacionId, datos) =>
  client
    .put(`/seleccion/convocatorias/${convocatoriaId}/decisiones/${postulacionId}`, datos)
    .then((res) => ({ data: res.data.data, creada: res.status === 201 }))

// GET .../decisiones/{p}/historial?page=  (seleccion:ver). Del evento más reciente al más antiguo.
//   -> { data: [{ resultado_anterior: null | seleccionado | no_seleccionado, resultado_nuevo, motivo, lista_version,
//          registrado_por, registrado_en }], meta: { current_page, last_page, per_page, total } }
export const historialDecision = (convocatoriaId, postulacionId, params) =>
  client
    .get(`/seleccion/convocatorias/${convocatoriaId}/decisiones/${postulacionId}/historial`, { params })
    .then((res) => res.data)

// GET /api/seleccion/convocatorias/{c}/comparacion?postulaciones[]=…  (seleccion:ver; SOLO LECTURA)
//   De 2 a 5 postulaciones distintas de ESA convocatoria (422 si el número o la distinción fallan; 404 si alguna es de otra
//   convocatoria o la convocatoria es de otra ficha; 403 sin permiso). Una sola petición para todas.
//   -> { data: [{ postulacion_id, aspirante, fecha_postulacion,
//          confirmada: null | { lista_version, posicion, resultado },     // lo que CONSERVÓ la lista vigente
//          revision: null | ya_no_elegible | cambio_resultado,            // si esa fila requiere revisión
//          actual: null | { listo, posicion, resultado },                 // HOY según el Ranking (null si ya no está postulada)
//          documental: { estado, cumplimiento },
//          evaluacion: null | { referencia: null | { evaluador, designada_por, vigente },
//                               evaluaciones: [{ evaluador, cumplimiento, resultado }] },  // solo Instructor y Superadmin
//          actividades: { entrevista|prueba_tecnica: { estado: desactivada|pendiente|registrada, nota, fecha_realizacion,
//                          observacion, registrada_por } },                // notas VIGENTES (no una copia histórica)
//          skills: { requeridas: [{ nombre, declarada, certificado_cargado }], adicionales } }],
//        meta: { modo: pendiente_de_configurar|sin_actividades|con_actividades,
//          actividades: { entrevista|prueba_tecnica: { activa, peso } },
//          lista: null | { version, confirmada_en, requiere_revision },
//          evaluador_visible, skills_requeridas } }
// 'certificado_cargado' solo dice que hay un archivo cargado; NO es una validación. Nunca viaja el archivo ni su ruta.
// 'resultado' llega como texto con dos decimales ("8.70"). Con sin_actividades no hay puesto ni resultado (null).
export const compararCandidatos = (convocatoriaId, postulaciones) =>
  client
    .get(`/seleccion/convocatorias/${convocatoriaId}/comparacion`, { params: { postulaciones } })
    .then((res) => res.data)
