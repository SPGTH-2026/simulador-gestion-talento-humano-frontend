import { CLASE_LABEL } from '../../lib/estilos'

// Campo de formulario: etiqueta (con * si es obligatorio), el control y, si
// llega, el mensaje de error debajo.
export default function Campo({ etiqueta, requerido = false, error, className = '', children }) {
  return (
    <label className={`${CLASE_LABEL} ${className}`.trim()}>
      <span>
        {etiqueta}
        {requerido && <span className="text-peligro"> *</span>}
      </span>
      {children}
      {error && <span className="text-xs text-peligro">{error}</span>}
    </label>
  )
}
