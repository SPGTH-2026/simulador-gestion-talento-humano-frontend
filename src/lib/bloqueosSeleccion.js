import { rutaConfiguracion } from './pasosSeleccion'

// Qué le impide a un candidato estar «listo para elegir como finalista». Los bloqueos los calcula el servidor (misma regla
// que el Ranking); aquí solo se ponen en palabras y se decide qué acción ofrecer según el permiso de quien mira. Un código
// que no se conoce se ignora: nunca se deduce un motivo que el servidor no dijo.

const ACTIVIDAD = { entrevista: 'entrevista', prueba_tecnica: 'prueba técnica' }

const lista = (items) => (items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`)

// Cada bloqueo → { codigo, texto (frase completa), corto (para el resumen de una línea), accion }.
// accion: { tipo: 'ruta', to, texto } lleva a otra pestaña conservando la convocatoria; { tipo: 'detalle', pestana, texto } abre el
// detalle del candidato en esa pestaña. Solo se ofrece si quien mira puede hacerla.
const DESCRIPCIONES = {
  configuracion_pendiente: (b, ctx) => ({
    texto: 'La convocatoria aún no tiene configuradas sus actividades.',
    corto: 'Falta configurar las actividades',
    accion: ctx.puedeDecidir ? { tipo: 'ruta', to: rutaConfiguracion(ctx.convocatoriaId), texto: 'Ir a la configuración' } : null,
  }),
  documentos_obligatorios: (b) => {
    const nombres = (b.faltantes ?? []).map((f) => f.nombre)
    return {
      texto: `Faltan documentos obligatorios: ${lista(nombres)}.`,
      corto: nombres.length === 1 ? `Falta ${nombres[0]}` : `Faltan ${nombres.length} documentos obligatorios`,
      accion: null,
    }
  },
  habilitacion_pendiente: () => ({
    texto: 'Aún no tiene un resultado documental finalizado.',
    corto: 'Sin resultado documental',
    accion: null,
  }),
  no_habilitado: () => ({
    texto: 'El resultado documental no lo habilita.',
    corto: 'No habilitado documentalmente',
    accion: null,
  }),
  referencia_requerida: (b, ctx) => ({
    texto: 'Tiene varias evaluaciones documentales: falta designar la referencia.',
    corto: 'Falta designar la referencia documental',
    accion: ctx.puedeDesignar ? { tipo: 'detalle', pestana: 'referencia', texto: 'Designar referencia' } : null,
  }),
  referencia_invalidada: (b, ctx) => ({
    texto: 'La referencia documental quedó invalidada: hay que designarla de nuevo.',
    corto: 'Referencia documental invalidada',
    accion: ctx.puedeDesignar ? { tipo: 'detalle', pestana: 'referencia', texto: 'Designar de nuevo' } : null,
  }),
  revision_documental: () => ({
    texto: 'Requiere una revisión documental que designa un instructor.',
    corto: 'Requiere revisión documental',
    accion: null,
  }),
  notas_pendientes: (b, ctx) => {
    const pendientes = (b.actividades ?? []).map((a) => ACTIVIDAD[a] ?? a)
    return {
      texto: pendientes.length ? `Faltan las notas de ${lista(pendientes)}.` : 'Faltan notas por registrar.',
      corto: pendientes.length ? `Falta la nota de ${lista(pendientes)}` : 'Faltan notas',
      // Las notas solo se registran con el candidato habilitado: con un bloqueo documental no se ofrece la acción.
      accion: ctx.puedeDecidir && !ctx.documentalBloqueado ? { tipo: 'detalle', pestana: 'calificaciones', texto: 'Registrar notas' } : null,
    }
  },
}

// ctx: { convocatoriaId, puedeDecidir, puedeDesignar }. Devuelve solo los bloqueos que se conocen, en el orden del servidor.
const BLOQUEOS_DOCUMENTALES = ['habilitacion_pendiente', 'no_habilitado', 'referencia_requerida', 'referencia_invalidada', 'revision_documental']

export function describirBloqueos(bloqueos, ctx) {
  const documentalBloqueado = (bloqueos ?? []).some((b) => BLOQUEOS_DOCUMENTALES.includes(b.codigo))
  return (bloqueos ?? [])
    .filter((b) => DESCRIPCIONES[b.codigo])
    .map((b) => ({ codigo: b.codigo, ...DESCRIPCIONES[b.codigo](b, { ...ctx, documentalBloqueado }) }))
}
