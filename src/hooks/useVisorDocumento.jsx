import { useCallback, useState } from 'react'
import VisorDocumento from '../components/ui/VisorDocumento'

// Estado del visor de documentos de una pantalla: `abrir(ruta, { titulo, nombre })` lo muestra y `visor` es el elemento
// que la pantalla pinta (o null). Cerrarlo no toca nada más de la pantalla: formularios, selección y posición se conservan.
export default function useVisorDocumento() {
  const [abierto, setAbierto] = useState(null)
  const cerrar = useCallback(() => setAbierto(null), [])
  const abrir = useCallback((ruta, { titulo, nombre } = {}) => setAbierto({ ruta, titulo, nombre }), [])
  const visor = abierto ? <VisorDocumento key={abierto.ruta} {...abierto} onCerrar={cerrar} /> : null
  return { abrir, visor }
}
