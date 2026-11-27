import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'

// Resumen de instructores como texto normal (sin fondo): los primeros nombres, uno por línea y recortados con «…» si no caben, y
// «+N más» con el resto. La lista completa, con correos, está en el diálogo de instructores (botón de icono de la misma fila).
export default function ResumenInstructores({ instructores, maximo }) {
  if (instructores.length === 0) return <span className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Sin instructores</span>
  const visibles = instructores.slice(0, maximo)
  const resto = instructores.length - visibles.length
  return (
    <ul className="flex min-w-0 flex-col gap-0.5 text-sm text-slate-700 dark:text-sena-texto">
      {visibles.map((instructor) => (
        <li key={instructor.id} className="min-w-0">
          <span className="block truncate" title={instructor.name}>
            {instructor.name}
          </span>
        </li>
      ))}
      {resto > 0 && <li className={CLASE_TEXTO_SUAVE}>{`+${resto} más`}</li>}
    </ul>
  )
}
