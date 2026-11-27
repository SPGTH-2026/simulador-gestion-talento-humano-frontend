// Datos del proyecto comunicados por el equipo y usados en las páginas informativas. Son hechos confirmados por el equipo, no
// texto jurídico aprobado.
export const CORREO_CONTACTO = 'spgth2026@gmail.com'

export function EnlaceContacto() {
  return (
    <a className="font-semibold text-sena-oscuro underline underline-offset-4 dark:text-sena-acento" href={`mailto:${CORREO_CONTACTO}`}>
      {CORREO_CONTACTO}
    </a>
  )
}
