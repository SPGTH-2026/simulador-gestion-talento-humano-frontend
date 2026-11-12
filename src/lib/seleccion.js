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
