// Juego de íconos del marco de la aplicación (menú, barra superior y tema).
// Un solo estilo para todos: contorno de 1.5 px, esquinas redondeadas y
// 'currentColor', de modo que el color lo decide el contenedor (reposo, activo,
// hover, oscuro). Se dibujan aquí para no depender de una librería externa.
//
// Para añadir uno: agrega su trazo a TRAZOS y úsalo como <Icono nombre="..." />.
const TRAZOS = {
  // Menú principal
  inicio: 'M3.75 11.25 12 4l8.25 7.25V19a1 1 0 0 1-1 1H15v-5.25H9V20H4.75a1 1 0 0 1-1-1z',
  convocatorias:
    'M4.5 10.5v3a1 1 0 0 0 1 1H8l6 4V5.5l-6 4H5.5a1 1 0 0 0-1 1zM17 9.5a3.5 3.5 0 0 1 0 5',
  portafolios:
    'M3.75 7.5a1.5 1.5 0 0 1 1.5-1.5h4l2 2.25h7.5a1.5 1.5 0 0 1 1.5 1.5v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5z',
  evaluacion:
    'M9.75 3h4.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 9 5.25v-1.5A.75.75 0 0 1 9.75 3zM15 4.5h1.5A1.5 1.5 0 0 1 18 6v13.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5V6a1.5 1.5 0 0 1 1.5-1.5H9M9.25 13.25l2 2 3.75-4',
  seleccion: 'M5.25 21V4.5M5.25 4.5h10.5l-1.5 3.75 1.5 3.75H5.25',
  usuarios:
    'M15 19.5v-1.125a3.375 3.375 0 0 0-3.375-3.375h-1.5A3.375 3.375 0 0 0 6.75 18.375V19.5M10.875 12a2.625 2.625 0 1 0 0-5.25 2.625 2.625 0 0 0 0 5.25zM21 19.5v-.75a3 3 0 0 0-2.25-2.9M15.75 6.9a2.625 2.625 0 0 1 0 5.1',
  fichas:
    'M3.75 7.5A1.5 1.5 0 0 1 5.25 6h13.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5zM8.25 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM6 16.5c.4-1.2 1.3-1.5 2.25-1.5s1.85.3 2.25 1.5M13.5 10.5h3.75M13.5 13.5h3',
  reportes: 'M5 19.5V12M10 19.5V6M15 19.5v-9M20 19.5V4M3.75 19.5h17',
  supervision:
    'M2.25 12S5.5 5.25 12 5.25 21.75 12 21.75 12 18.5 18.75 12 18.75 2.25 12 2.25 12zM12 14.75a2.75 2.75 0 1 0 0-5.5 2.75 2.75 0 0 0 0 5.5z',
  // Mi espacio (vistas del aspirante)
  postulaciones: 'M4 12 20 4l-4 16-4.25-5.75zM11.75 14.25 20 4',
  documentos:
    'M7 3.75h7.5L19 8.25V19.25a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.75a1 1 0 0 1 1-1zM14 3.75V8.5h5M9 12.25h6M9 15.75h6',
  evaluaciones: 'M12 4.5l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z',
  // Estados y filtros (los usa el listado de Evaluación)
  check: 'm4.5 12.75 6 6 9-13.5',
  reloj: 'M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  filtro:
    'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z',
  // Controles del marco
  menu: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
  cerrar: 'M6 18 18 6M6 6l12 12',
  chevron: 'm19.5 8.25-7.5 7.5-7.5-7.5',
  campana:
    'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0',
  sol: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z',
  luna: 'M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z',
  // Control del carrusel de Inicio
  pausa: 'M9 5.5v13M15 5.5v13',
  reproducir: 'M8.5 5.75 18.5 12l-10 6.25z',
  // Campos de contraseña y errores de formulario (pantallas de acceso)
  ojoOculto:
    'M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88',
  alerta:
    'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z',
  salir:
    'M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9',
}

export default function Icono({ nombre, className = 'size-5' }) {
  const trazo = TRAZOS[nombre]
  // Un nombre desconocido no debe romper el menú: se omite el ícono.
  if (!trazo) return null

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={trazo} />
    </svg>
  )
}
