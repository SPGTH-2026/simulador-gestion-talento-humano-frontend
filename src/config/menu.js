// Cada opción pide UN permiso. Los módulos con hijos se muestran
// si al usuario le queda al menos un hijo visible.
// Notificaciones no está aquí: se abre desde la campana del Topbar.
export const menu = [
  { id: 'inicio', label: 'Inicio', to: '/', permiso: 'dashboard:ver' },

  {
    id: 'convocatorias',
    label: 'Convocatorias',
    children: [
      { label: 'Listado', to: '/convocatorias', permiso: 'convocatorias:ver' },
      { label: 'Nueva convocatoria', to: '/convocatorias/nueva', permiso: 'convocatorias:gestionar' },
    ],
  },

  {
    id: 'portafolios',
    label: 'Portafolios',
    permiso: 'usuarios:gestionar',
    to: '/documentos',
  },

  {
    id: 'evaluacion',
    label: 'Evaluación',
    // Fuerza el acordeón aunque solo tenga un hijo, para que se vea
    // "Evaluar aspirantes" como submódulo y no como enlace directo.
    acordeon: true,
    children: [
      { label: 'Evaluar aspirantes', to: '/evaluacion', permiso: 'evaluacion:ver' },
    ],
  },

  {
    id: 'seleccion',
    label: 'Selección',
    children: [
      { label: 'Ranking', to: '/seleccion', permiso: 'seleccion:ver' },
      { label: 'Decidir', to: '/seleccion/decidir', permiso: 'seleccion:decidir' },
    ],
  },


  { id: 'usuarios', label: 'Usuarios y Roles', to: '/usuarios', permiso: 'usuarios:gestionar' },
  { id: 'fichas', label: 'Fichas', to: '/fichas', permiso: 'usuarios:gestionar' },
  { id: 'reportes', label: 'Reportes', to: '/reportes', permiso: 'reportes:ver' },
  { id: 'supervision', label: 'Supervisión', to: '/supervision', permiso: 'supervision:gestionar' },

  // Vistas del aspirante
  { id: 'mis-postulaciones', label: 'Mis postulaciones', to: '/mis-postulaciones', permiso: 'propio:postulaciones' },
  { id: 'mis-documentos', label: 'Mis documentos', to: '/mis-documentos', permiso: 'propio:documentos' },
  { id: 'mis-evaluaciones', label: 'Mis evaluaciones', to: '/mis-evaluaciones', permiso: 'propio:evaluaciones' },
]
