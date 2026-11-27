// Páginas informativas y legales (Acerca de, Términos, Privacidad, Cookies e «Información legal»). Están DESACTIVADAS por defecto: solo
// existen (rutas y enlaces) cuando la variable de entorno VITE_PAGINAS_INFORMATIVAS vale exactamente 'true' al arrancar o construir.
// Hoy solo se activa en el aislado de revisión: sus textos son borradores sin aprobar y nada se muestra en producción.

/** ¿Están activas las páginas informativas? Se lee al llamarla (la prueba puede cambiar la variable). */
export const paginasInformativasActivas = () => import.meta.env.VITE_PAGINAS_INFORMATIVAS === 'true'

export const RUTA_INFORMACION_LEGAL = '/informacion-legal'
export const RUTA_ACERCA_DE = '/acerca-de'
export const RUTA_PRIVACIDAD = '/privacidad'

/** 'corto' es el nombre para la navegación estrecha (cabecera y pie); 'titulo' el de la página y de los enlaces largos. */
/** Textos legales: se enlazan juntos desde «Información legal» y desde el pie de las pantallas de acceso. */
export const PAGINAS_LEGALES = [
  { ruta: '/terminos', titulo: 'Términos de uso', corto: 'Términos', resumen: 'Qué es SPGTH, quién puede usarlo y cómo funcionan las cuentas.' },
  { ruta: RUTA_PRIVACIDAD, titulo: 'Privacidad y datos personales', corto: 'Privacidad', resumen: 'Qué datos se tratan, para qué, quién puede verlos y cómo consultarlos.' },
  { ruta: '/cookies', titulo: 'Cookies', corto: 'Cookies', resumen: 'Qué guarda SPGTH en tu navegador y qué servicios externos intervienen.' },
]

/** «Acerca de SPGTH» es informativo y va aparte de los textos legales. */
export const PAGINA_ACERCA_DE = { ruta: RUTA_ACERCA_DE, titulo: 'Acerca de SPGTH', corto: 'Acerca de', resumen: 'De qué trata el proyecto y qué simula.' }

/** Todas, en el orden de la navegación del marco informativo (Acerca de primero). */
export const PAGINAS_INFORMATIVAS = [PAGINA_ACERCA_DE, ...PAGINAS_LEGALES]
