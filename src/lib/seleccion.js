// Reglas de presentación del módulo de Selección. Los estados y los permisos los
// decide el backend: aquí solo se rotulan.

// Estado documental de un candidato (lo calcula el servidor a partir de las
// evaluaciones y de la referencia que designó el instructor).
export const ESTADO_DOCUMENTAL = {
  pendiente: { texto: 'Pendiente', tono: 'neutral', icono: 'reloj' },
  habilitado: { texto: 'Habilitado', tono: 'exito', icono: 'check' },
  no_habilitado: { texto: 'No habilitado', tono: 'peligro', icono: 'cerrar' },
  requiere_revision: { texto: 'Requiere revisión', tono: 'aviso', icono: 'alerta' },
}

// Un estado que no conocemos se muestra tal cual, sin inventarle un significado.
export const estadoDocumental = (codigo) =>
  ESTADO_DOCUMENTAL[codigo] ?? { texto: codigo ?? 'Sin dato', tono: 'neutral', icono: 'reloj' }

// null es ausencia de dato; 0 es un porcentaje válido ("0 %").
export const textoCumplimiento = (valor) => (valor == null ? null : `${valor} %`)

// Las cuatro opciones de configuración de las actividades presenciales.
export const OPCIONES_ACTIVIDADES = [
  { id: 'sin_actividades', etiqueta: 'Sin actividades', ayuda: 'Solo cuenta la habilitación documental.', entrevista: false, prueba: false },
  { id: 'solo_entrevista', etiqueta: 'Solo entrevista', ayuda: 'La entrevista pesa 100 %.', entrevista: true, prueba: false },
  { id: 'solo_prueba_tecnica', etiqueta: 'Solo prueba técnica', ayuda: 'La prueba técnica pesa 100 %.', entrevista: false, prueba: true },
  { id: 'ambas', etiqueta: 'Entrevista y prueba técnica', ayuda: 'Los dos pesos deben sumar 100 %.', entrevista: true, prueba: true },
]

export const opcionPorId = (id) => OPCIONES_ACTIVIDADES.find((o) => o.id === id) ?? null

// Nombre con el que se identifica una convocatoria. El código (CONV-AAAA-NNN) es
// un dato de gestión y llega en null para quien no gestiona convocatorias.
export const tituloConvocatoria = (c) => c?.nombre ?? 'Convocatoria sin nombre'

// Estados por los que se filtra el listado de Selección (el servidor excluye los borradores), en el orden del proceso.
export const ESTADOS_FILTRO = [
  { codigo: 'publicada', nombre: 'Publicada' },
  { codigo: 'en_proceso', nombre: 'En proceso' },
  { codigo: 'cerrada', nombre: 'Cerrada' },
]
export const estadoFiltroValido = (codigo) => (ESTADOS_FILTRO.some((e) => e.codigo === codigo) ? codigo : '')

// «0 candidatos», «1 candidato»: el cero se dice siempre (es un dato, no una ausencia).
export const textoCandidatos = (n) => `${n} ${n === 1 ? 'candidato' : 'candidatos'}`

// Solo el Instructor y el Superadministrador designan la evaluación de referencia. Los aprendices con
// seleccion:decidir (general y seleccionador) pueden calificar, pero no resolver evaluaciones en conflicto.
export const puedeDesignarReferencia = (user, can) =>
  ['instructor', 'super_admin'].includes(user?.role) && can('seleccion:decidir')

export const ACTIVIDADES = [
  { id: 'entrevista', etiqueta: 'Entrevista' },
  { id: 'prueba_tecnica', etiqueta: 'Prueba técnica' },
]

// Las notas llegan como "8.50"; en pantalla se leen con coma ("8,50"). null = sin dato.
export const textoNota = (valor) => (valor == null ? null : String(valor).replace('.', ','))

// Lo que escribe la persona ("8,5", "8.50") a lo que acepta el servidor ("8.5").
export const notaParaServidor = (texto) => String(texto ?? '').trim().replace(',', '.')

// Resultado adicional: pendiente de configurar y sin actividades son cosas distintas, y ninguna es un 0.
export const ESTADO_RESULTADO = {
  pendiente_de_configurar: 'Pendiente de configurar',
  sin_actividades: 'Sin actividades',
  incompleto: 'Pendiente: faltan notas',
  completo: 'Completo',
}

export const RESULTADO_EVALUACION = {
  habilitado: { texto: 'Habilitado', tono: 'exito', icono: 'check' },
  no_habilitado: { texto: 'No habilitado', tono: 'peligro', icono: 'cerrar' },
}

// Fecha de hoy en America/Bogota (AAAA-MM-DD): el servidor no admite fechas futuras en esa zona.
export const hoyBogota = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

export const formatoFecha = (iso) =>
  iso ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'America/Bogota' }).format(new Date(iso.length === 10 ? `${iso}T12:00:00-05:00` : iso)) : ''

// El backend responde en español los mensajes propios de Selección, pero las reglas estándar de Laravel
// (mínimo, máximo, obligatorio) llegan en inglés: se traducen aquí, sin tocar el resto de los mensajes.
export const traducirError = (mensaje) => {
  if (typeof mensaje !== 'string') return mensaje
  const minimo = mensaje.match(/must be at least (\d+) characters/)
  if (minimo) return `Debe tener al menos ${minimo[1]} caracteres.`
  const maximo = mensaje.match(/(?:must not be greater than|may not be greater than) (\d+) characters/)
  if (maximo) return `No puede superar los ${maximo[1]} caracteres.`
  if (/field is required/.test(mensaje)) return 'Este campo es obligatorio.'
  return mensaje
}

export const traducirErrores = (errores) =>
  Object.fromEntries(Object.entries(errores).map(([campo, mensaje]) => [campo, traducirError(mensaje)]))

// Ranking y finalistas. El orden, las posiciones y la sugerencia los decide el servidor: aquí solo se rotulan.
export const SUGERENCIA = {
  sugerido: { texto: 'Sugerido', tono: 'exito', icono: 'check' },
  empate_en_corte: { texto: 'Empate en el corte', tono: 'aviso', icono: 'alerta' },
  no_sugerido: { texto: 'No sugerido', tono: 'neutral', icono: null },
}

export const MOTIVO_REVISION = {
  ya_no_elegible: 'Ya no es elegible: dejó de estar listo.',
  cambio_resultado: 'Cambió su resultado, sus notas o su habilitación.',
}

// Resultado adicional: texto con dos decimales ("8.50"); null es ausencia de nota.
export const textoResultado = (valor) => (valor == null ? null : String(valor))

export const formatoFechaHora = (iso) =>
  iso ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date(iso)) : ''
