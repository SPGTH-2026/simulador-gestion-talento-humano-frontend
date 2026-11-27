import { Link } from 'react-router-dom'
import LogoSena from '../ui/LogoSena'
import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'

// Marca completa de SPGTH, igual que en el menú de la aplicación: logosímbolo del SENA a 50 px (el Manual de Identidad Visual exige ese
// mínimo; verde en claro, blanco en oscuro), el nombre y su descripción. Lleva al inicio (o al acceso, sin sesión). En pantallas muy
// estrechas se omite la descripción para que los controles no se amontonen; el nombre y el logosímbolo siempre se ven.
export default function MarcaSpgth({ to, className = '' }) {
  return (
    <Link
      to={to}
      aria-label="SPGTH: ir al inicio"
      className={`flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena ${className}`.trim()}
    >
      <LogoSena className="size-[50px] shrink-0 text-sena dark:text-white" />
      <span className="min-w-0">
        <span className="block text-base font-bold leading-tight text-sena-azul dark:text-white">SPGTH</span>
        <span className={`hidden text-xs leading-snug sm:block ${CLASE_TEXTO_SUAVE}`}>Simulador de gestión de talento humano</span>
      </span>
    </Link>
  )
}
