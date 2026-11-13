import { menu } from '../config/menu'

// Qué bloques de Inicio le corresponden al usuario. Se autoriza con permisos,
// pero también con el rol y el alcance REAL del endpoint: los permisos
// 'propio:*' los tienen también el instructor y el super admin, y eso no los
// convierte en aspirantes. Cada petición de Inicio sale solo si su bloque está
// activo, así que nadie dispara una llamada que el backend rechazaría.
export function perfilInicio(user, can) {
  const rol = user?.role
  const aspirante = rol === 'aspirante'

  return {
    // Aspirante: sus postulaciones, las convocatorias que puede ver y sus
    // resultados. GET /postulaciones trae SIEMPRE solo las del autenticado.
    postulaciones: aspirante && can('propio:postulaciones'),
    convocatoriasAspirante: aspirante && can('convocatorias:ver'),
    resultados: aspirante && can('propio:evaluaciones'),
    // Gestión de convocatorias: gestor, aprendiz general, instructor y super
    // admin. El backend limita la lista al alcance de fichas de cada uno.
    gestion: can('convocatorias:gestionar'),
    // GET /mis-evaluaciones devuelve SOLO las evaluaciones que hizo el propio
    // aprendiz. Para el instructor y el super admin devuelve las de todo su
    // alcance (no se pueden separar las suyas), así que ahí no se usa.
    evaluando: rol === 'aprendiz' && can('evaluacion:evaluar') && can('propio:evaluaciones'),
    // Los aspirantes ya tienen sus enlaces dentro de cada bloque.
    accesos: !aspirante,
  }
}

// Destinos del menú que el usuario puede abrir, con el ícono de su grupo. El
// menú es la única fuente de rutas y permisos: aquí no hay otra lista. Se
// omite Inicio (ya se está en él) y las vistas personales del aspirante.
export function destinosDelMenu(can) {
  return menu
    .filter((item) => item.id !== 'inicio' && !item.id.startsWith('mis-'))
    .flatMap((item) => {
      if (item.children) {
        return item.children
          .filter((hijo) => can(hijo.permiso))
          .map((hijo) => ({ to: hijo.to, label: hijo.label, grupo: item.label, icono: item.icono }))
      }
      return can(item.permiso) ? [{ to: item.to, label: item.label, grupo: null, icono: item.icono }] : []
    })
}

// A quién pertenece la lista de convocatorias de gestión. El texto se rotula
// según el alcance real del rol, para no mostrar datos ajenos como propios.
export function alcanceConvocatorias(user) {
  if (user?.role === 'super_admin') return 'Convocatorias de todas las fichas.'
  if (user?.role === 'instructor') return 'Convocatorias de las fichas que tienes a cargo.'
  return 'Convocatorias de tu ficha.'
}

// Cuántos elementos se muestran por lista. Inicio solo adelanta lo más útil;
// el resto está en el listado de cada módulo.
export const MAX_ELEMENTOS = 5
