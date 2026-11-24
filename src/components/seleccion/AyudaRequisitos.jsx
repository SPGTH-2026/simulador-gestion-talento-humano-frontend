import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { requisitosListo } from '../../lib/pasosSeleccion'

// Ayuda desplegable (cerrada por defecto) con los requisitos reales para que un candidato quede «listo». Es referencia, no la
// acción: el motivo concreto que bloquea a un candidato se dice donde se le muestra, y esto explica la regla completa.
// <details> da teclado (Enter/Espacio), foco y lectura de pantalla sin código propio.
export default function AyudaRequisitos({ modo, className = '' }) {
  return (
    <details className={`group ${className}`}>
      <summary
        className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-1 text-sm font-medium ${CLASE_TEXTO_FUERTE} underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena`}
      >
        ¿Qué necesita un candidato para quedar listo?
      </summary>
      <p className={`px-1 pb-1 pt-0.5 text-sm ${CLASE_TEXTO_SUAVE}`}>{requisitosListo(modo)}</p>
    </details>
  )
}
