import Icono from './Icono'
import Rueda from './Rueda'

// Foco visible del sistema (mismo anillo que las opciones de radio y los botones).
const FOCO =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena focus-visible:ring-offset-2 dark:focus-visible:ring-sena-acento dark:focus-visible:ring-offset-sena-superficie'

// Interruptor (switch) de dos estados: «activo» refleja el dato real que le pasa quien lo usa; el componente no guarda estado
// propio, así que si la operación se cancela o falla queda como estaba. Es un botón con role="switch" y aria-checked: Espacio y
// Enter lo cambian y el lector de pantalla anuncia su nombre y su estado.
//  - 'idNombre': id del elemento visible que lo nombra (p. ej. el nombre de la habilidad). Sin él se usa 'nombre' como aria-label.
//  - 'ocupado': el cambio se está guardando. NO se deshabilita (perdería el foco del teclado): se marca con aria-busy, ignora
//    los clics y muestra la rueda en la perilla. Quien lo usa pone el texto de estado («Guardando…») junto al control.
//  - 'bloqueado': la edición no está permitida ahora (regla del sistema u otra operación en curso). Usa aria-disabled, no
//    disabled, para conservar el foco; no tiene hover ni animación de pulsación y el cursor indica que no responde.
//  - 'ayudaId': texto que explica por qué está bloqueado.
// El estado no depende solo del color: la perilla va a la derecha y lleva una marca cuando está activo.
export default function Interruptor({ idNombre, nombre, activo, onChange, ocupado = false, bloqueado = false, ayudaId, className = '' }) {
  const inerte = ocupado || bloqueado
  const respondeAlPuntero = !inerte

  const pista = activo
    ? 'border-sena-oscuro bg-sena-oscuro dark:border-sena-acento dark:bg-sena-acento'
    : 'border-slate-500 bg-white dark:border-sena-texto-suave/70 dark:bg-sena-superficie'
  const efectosDePuntero = respondeAlPuntero
    ? `group-active:scale-[0.96] motion-reduce:group-active:scale-100 ${
        activo ? '' : 'group-hover:bg-sena-cielo/30 dark:group-hover:bg-sena-superficie-alta'
      }`
    : ''
  const perilla = activo
    ? 'translate-x-6 bg-white text-sena-oscuro dark:bg-sena-noche dark:text-sena-acento'
    : 'translate-x-0 bg-slate-500 text-white dark:bg-sena-texto-suave dark:text-sena-noche'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(activo)}
      aria-labelledby={idNombre}
      aria-label={idNombre ? undefined : nombre}
      aria-describedby={ayudaId}
      aria-busy={ocupado || undefined}
      aria-disabled={bloqueado || undefined}
      onClick={() => {
        if (!inerte) onChange(!activo)
      }}
      className={`group inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg ${FOCO} ${
        ocupado ? 'cursor-progress' : bloqueado ? 'cursor-not-allowed' : 'cursor-pointer'
      } ${className}`.trim()}
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-[color,background-color,border-color,scale] duration-150 motion-reduce:transition-none ${pista} ${efectosDePuntero} ${
          bloqueado && !ocupado ? 'opacity-50' : ''
        }`}
      >
        <span
          className={`absolute left-0.5 grid size-5 place-items-center rounded-full shadow-sm transition-transform duration-150 motion-reduce:transition-none ${perilla}`}
        >
          {ocupado ? <Rueda className="size-3" /> : activo ? <Icono nombre="check" className="size-3" /> : null}
        </span>
      </span>
    </button>
  )
}
