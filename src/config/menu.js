// Cada opción pide UN permiso. Los módulos con hijos se muestran
// si al usuario le queda al menos un hijo visible.
// Notificaciones no está aquí: se abre desde la campana del Topbar.
// Mientras la pantalla de Notificaciones no tenga funciones ni backend, la campana no se muestra.
export const NOTIFICACIONES_DISPONIBLES = false

// 'icono' es solo presentación (ver components/ui/Icono.jsx): no cambia
// permisos ni destinos. Los hijos no llevan ícono.
export const menu = [
  { id: 'inicio', label: 'Inicio', icono: 'inicio', to: '/', permiso: 'dashboard:ver' },

  {
    id: 'convocatorias',
    label: 'Convocatorias',
    icono: 'convocatorias',
    children: [
      { label: 'Listado', to: '/convocatorias', permiso: 'convocatorias:ver' },
      { label: 'Nueva convocatoria', to: '/convocatorias/nueva', permiso: 'convocatorias:gestionar' },
    ],
  },

  {
    id: 'portafolios',
    label: 'Portafolios',
    icono: 'portafolios',
    permiso: 'usuarios:gestionar',
    to: '/documentos',
  },

  {
    id: 'evaluacion',
    label: 'Evaluación',
    icono: 'evaluacion',
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
    icono: 'seleccion',
    children: [
      { label: 'Preselección', to: '/seleccion/preseleccion', permiso: 'seleccion:ver' },
      { label: 'Ranking', to: '/seleccion', permiso: 'seleccion:ver' },
      { label: 'Decidir', to: '/seleccion/decidir', permiso: 'seleccion:decidir' },
    ],
  },


  { id: 'usuarios', label: 'Usuarios y Roles', icono: 'usuarios', to: '/usuarios', permiso: 'usuarios:gestionar' },
  { id: 'fichas', label: 'Fichas', icono: 'fichas', to: '/fichas', permiso: 'usuarios:gestionar' },
  // 'disponible: false': la pantalla existe (ruta y permiso siguen en el router) pero todavía no tiene funciones ni
  // backend, así que el menú no la ofrece. Para mostrarla de nuevo basta quitar esa línea.
  { id: 'reportes', label: 'Reportes', icono: 'reportes', to: '/reportes', permiso: 'reportes:ver', disponible: false },

  // Vistas del aspirante
  { id: 'mis-postulaciones', label: 'Mis postulaciones', icono: 'postulaciones', to: '/mis-postulaciones', permiso: 'propio:postulaciones' },
  { id: 'mis-documentos', label: 'Mis documentos', icono: 'documentos', to: '/mis-documentos', permiso: 'propio:documentos' },
  { id: 'mis-evaluaciones', label: 'Mis evaluaciones', icono: 'evaluaciones', to: '/mis-evaluaciones', permiso: 'propio:evaluaciones' },
]
