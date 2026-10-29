import Etiqueta from './Etiqueta'

// Obligatoriedad de un documento de convocatoria. El backend solo entrega
// `obligatorio` (bool); el estado del documento (pendiente/subido/no_aplica)
// se muestra aparte. 'Obligatorio' usa el tono institucional azul y 'Opcional'
// el neutro, para no confundirlos con los estados de la postulación.
export default function EtiquetaDocumento({ obligatorio = false, className = '' }) {
  return (
    <Etiqueta tono={obligatorio ? 'azul' : 'neutral'} className={className}>
      {obligatorio ? 'Obligatorio' : 'Opcional'}
    </Etiqueta>
  )
}
