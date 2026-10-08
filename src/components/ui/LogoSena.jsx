// El logosímbolo se pinta con mask-image en vez de <img> porque un SVG
// externo no hereda `currentColor` del documento. Así el mismo archivo sirve
// para la versión verde, blanca o negra según el color de texto del contenedor.
export default function LogoSena({ className = 'h-10 w-10' }) {
  const mascara = {
    WebkitMaskImage: "url('/logo-sena.svg')",
    maskImage: "url('/logo-sena.svg')",
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
  }

  return (
    <span
      role="img"
      aria-label="SENA"
      style={mascara}
      className={`inline-block shrink-0 bg-current ${className}`}
    />
  )
}