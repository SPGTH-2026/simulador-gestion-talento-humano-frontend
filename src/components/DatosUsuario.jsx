import { useAuth } from '../auth/useAuth'
import { CLASE_TEXTO_SUAVE } from '../lib/estilos'

// Convierte la clave del rol en un texto legible.
// Ej: 'revisor_documental' -> 'Revisor documental'
function etiqueta(clave) {
  if (!clave) return ''
  const texto = clave.replace(/_/g, ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Dos iniciales para el avatar: la primera letra del nombre y del apellido.
function iniciales(nombre) {
  if (!nombre) return '?'
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join('')
    .toUpperCase()
}

// Quién ha iniciado sesión: avatar con iniciales, nombre, rol y, para
// aspirantes y aprendices, su ficha. Lo usan la barra superior (desde 'sm') y
// el cajón de navegación en móvil, donde la barra no tiene espacio para él.
export default function DatosUsuario() {
  const { user } = useAuth()

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        role="img"
        aria-label={user?.name ?? 'Usuario'}
        className="grid size-9 shrink-0 place-items-center rounded-full bg-sena-azul text-sm font-semibold text-white dark:bg-sena-superficie-alta dark:ring-1 dark:ring-sena-texto-suave/40"
      >
        {iniciales(user?.name)}
      </span>
      <div className="min-w-0 text-left leading-tight">
        <p className="max-w-48 truncate text-sm font-semibold text-sena-azul dark:text-white">{user?.name}</p>
        <p className={`max-w-48 truncate text-xs ${CLASE_TEXTO_SUAVE}`}>
          {etiqueta(user?.role)}
          {user?.subrole ? ` · ${etiqueta(user.subrole)}` : ''}
        </p>
        {(user?.role === 'aspirante' || user?.role === 'aprendiz') && user?.ficha && (
          <p className={`max-w-48 truncate text-xs ${CLASE_TEXTO_SUAVE}`}>Ficha {user.ficha.codigo}</p>
        )}
      </div>
    </div>
  )
}
