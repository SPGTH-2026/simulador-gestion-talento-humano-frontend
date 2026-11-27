import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { textoVacio } from '../../lib/notificaciones'

// Lista vacía del filtro activo. Con «No leídas» vacío dice «Estás al día» (sin afirmar que no hay historial; los filtros de arriba llevan al
// resto). 'compacto' reduce el espacio (panel); en la página se usa con más aire.
export default function VacioNotificaciones({ filtro, compacto = false }) {
  const texto = textoVacio(filtro)
  return (
    <div className={`flex flex-col items-center gap-1 px-3 text-center ${compacto ? 'py-5' : 'py-10'}`}>
      <p className={`${compacto ? 'text-sm' : 'text-base'} font-semibold ${CLASE_TEXTO_FUERTE}`}>{texto.titulo}</p>
      <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>{texto.descripcion}</p>
    </div>
  )
}
