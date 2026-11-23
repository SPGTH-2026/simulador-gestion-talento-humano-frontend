import { useState } from 'react'
import { CLASE_CAMPO } from '../../lib/estilos'
import Campo from './Campo'
import Icono from './Icono'

// Campo de contraseña con botón para mostrarla u ocultarla. El botón mide 44 px
// y va dentro del campo; el texto del campo deja ese espacio libre (pr-12).
//
// El botón solo aparece cuando hay algo escrito: con el campo vacío no hay nada
// que mostrar u ocultar. El espacio (pr-12) se reserva siempre, así que el texto
// no se corre al aparecer. Al vaciar el campo se vuelve a ocultar la contraseña:
// quien escriba otra después no la verá en claro sin haberlo pedido.
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
  const hayTexto = (value ?? '').length > 0

  // Ajuste durante el render (no en un efecto): se evita un cuadro con la
  // contraseña a la vista justo después de vaciar el campo.
  if (!hayTexto && visible) setVisible(false)

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
          {hayTexto && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={visible}
              aria-controls={id}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-md text-slate-600 transition-[color,scale] duration-150 hover:text-sena-azul active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100 dark:text-sena-texto-suave dark:hover:text-white"
            >
              <Icono nombre={visible ? 'ojoOculto' : 'ojo'} />
            </button>
          )}
        </div>
      )}
    </Campo>
  )
}
