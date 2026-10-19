// Mensajes de retroceso (error, éxito, aviso o información). El color sale de
// los alias semánticos de index.css, así que se lee igual en claro y oscuro.
const TONOS = {
  error: 'border-peligro/30 bg-peligro/10 text-peligro',
  exito: 'border-exito/30 bg-exito/10 text-exito',
  aviso: 'border-aviso/30 bg-aviso/10 text-aviso',
  info: 'border-sena-azul/20 bg-sena-cielo/20 text-sena-azul dark:border-sena-borde dark:bg-sena-superficie-alta dark:text-sena-texto',
}

export default function Mensaje({ tipo = 'error', className = '', children }) {
  const rol = tipo === 'exito' || tipo === 'info' ? 'status' : 'alert'

  return (
    <p
      role={rol}
      className={`rounded-md border p-3 text-sm ${TONOS[tipo] ?? TONOS.error} ${className}`.trim()}
    >
      {children}
    </p>
  )
}

export function MensajeError(props) {
  return <Mensaje tipo="error" {...props} />
}

export function MensajeExito(props) {
  return <Mensaje tipo="exito" {...props} />
}

export function MensajeAviso(props) {
  return <Mensaje tipo="aviso" {...props} />
}
