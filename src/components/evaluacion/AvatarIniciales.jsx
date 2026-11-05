export default function AvatarIniciales({ nombre, size = 'md' }) {
  const texto = typeof nombre === 'string' ? nombre : (nombre?.name ?? nombre?.nombre ?? '')
  const inicial = (texto || '?').trim().charAt(0).toUpperCase() || '?'
  const sizes = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-14 w-14 text-xl',
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-sena-azul font-bold text-white ${sizes[size]}`}
      aria-hidden="true"
    >
      {inicial}
    </div>
  )
}
