// Etiqueta de estado/rol. El color va atado a un tono semántico, no al texto.
// 'azul' es el tono institucional no verde (información/publicada); el verde
// (exito) queda para los estados positivos.
const TONOS = {
  neutral: 'bg-sena-hundido text-slate-600 dark:bg-sena-superficie-alta dark:text-sena-texto-suave',
  azul: 'bg-sena-cielo/40 text-sena-azul dark:bg-sena-superficie-alta dark:text-sena-texto',
  exito: 'bg-exito/10 text-exito',
  aviso: 'bg-aviso/10 text-aviso',
  peligro: 'bg-peligro/10 text-peligro',
}

export default function Etiqueta({ tono = 'neutral', className = '', children }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        TONOS[tono] ?? TONOS.neutral
      } ${className}`.trim()}
    >
      {children}
    </span>
  )
}
