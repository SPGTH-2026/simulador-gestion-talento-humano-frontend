// Páginas informativas (Acerca de, Términos, Privacidad y Cookies). Están DESACTIVADAS por defecto: las rutas solo existen cuando la
// variable de entorno VITE_PAGINAS_INFORMATIVAS vale exactamente 'true' al arrancar o construir (se lee en router.jsx; hoy, solo en
// el aislado de revisión). Sin ella no hay rutas ni contenido: quien las visite ve «página no encontrada». Sus textos son borradores
// con datos pendientes y no están aprobados por nadie.
export const PAGINAS_INFORMATIVAS = [
  { ruta: '/acerca-de', titulo: 'Acerca de SPGTH' },
  { ruta: '/terminos', titulo: 'Términos de uso' },
  { ruta: '/privacidad', titulo: 'Privacidad y tratamiento de datos' },
  { ruta: '/cookies', titulo: 'Información sobre cookies' },
]
