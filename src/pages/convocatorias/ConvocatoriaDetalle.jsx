import { useParams } from 'react-router-dom'


// Vista de solo lectura propia (componente DetalleConvocatoria.jsx). El wizard
// queda únicamente para Nueva/Editar y no se toca aquí.
export default function ConvocatoriaDetalle() {
  const { id } = useParams()

  // key={id} re-monta el contenido al navegar de una convocatoria a otra sin
  // salir de la ruta (React Router conserva la instancia): así el estado
  // simulado de archivos y el resumen 404 nunca quedan cruzados entre ids.
  return <ContenidoDetalle key={id} id={id} />
}

import ContenidoDetalle from './ContenidoDetalle'
