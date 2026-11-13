import { useState } from 'react'
import { CLASE_CAMPO } from '../../lib/estilos'
import Campo from './Campo'
import Icono from './Icono'

// Campo de contraseña con botón para mostrarla u ocultarla. El botón mide 44 px
// y va dentro del campo; el texto del campo deja ese espacio libre (pr-12).
export default function CampoClave({
  etiqueta,
  value,
  onChange,
  error,
  ayuda,
  name,
  autoComplete,
  required = false,
  className,
}) {
  const [visible, setVisible] = useState(false)

  return (
    <Campo etiqueta={etiqueta} error={error} ayuda={ayuda} className={className}>
      {({ id, describedby, invalid }) => (
        <div className="relative">
          <input
            id={id}
            type={visible ? 'text' : 'password'}
            name={name}
            value={value}
            onChange={onChange}
            autoComplete={autoComplete}
            required={required}
            aria-describedby={describedby}
            aria-invalid={invalid || undefined}
            className={`pr-12 ${CLASE_CAMPO}`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            aria-controls={id}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-md text-slate-600 hover:text-sena-azul dark:text-sena-texto-suave dark:hover:text-white"
          >
            <Icono nombre={visible ? 'ojoOculto' : 'supervision'} />
          </button>
        </div>
      )}
    </Campo>
  )
}
