import { useId } from 'react'
import { CLASE_LABEL } from '../../lib/estilos'
import Icono from './Icono'

// Campo de formulario: etiqueta (con * si es obligatorio), el control y, si
// llega, el mensaje de error debajo.
//
// Dos formas de uso:
//  - Con un nodo como hijo (la de siempre): la etiqueta envuelve al control.
//  - Con una función como hijo: recibe { id, describedby, invalid } para
//    ponérselos al control. Así el error y la ayuda quedan asociados al campo
//    (aria-describedby / aria-invalid) y no forman parte de su nombre. Las
//    pantallas de acceso usan esta forma.
export default function Campo({
  etiqueta,
  requerido = false,
  error,
  ayuda,
  className = '',
  children,
}) {
  const id = useId()

  if (typeof children !== 'function') {
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

  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`
  const describedby = [ayuda && idAyuda, error && idError].filter(Boolean).join(' ') || undefined

  return (
    <div className={`${CLASE_LABEL} ${className}`.trim()}>
      <label htmlFor={id}>
        {etiqueta}
        {requerido && <span className="text-peligro"> *</span>}
      </label>
      {children({ id, describedby, invalid: Boolean(error) })}
      {ayuda && (
        <span id={idAyuda} className="text-sm font-normal text-slate-600 dark:text-sena-texto-suave">
          {ayuda}
        </span>
      )}
      {error && (
        // Texto + ícono: el error nunca depende solo del color. role="alert"
        // lo anuncia cuando aparece al enviar.
        <span
          id={idError}
          role="alert"
          className="flex items-start gap-1.5 text-sm font-medium text-peligro"
        >
          <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </span>
      )}
    </div>
  )
}
