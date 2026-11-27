import Etiqueta from '../ui/Etiqueta'
import { Hueco } from '../ui/Esqueleto'
import { opcionPorId } from '../../lib/seleccion'

// Modalidad de actividades de la convocatoria, en la cabecera. Distingue una convocatoria SIN CONFIGURAR (tono de aviso: falta
// una decisión) de una configurada «Sin actividades» (neutral: es una decisión tomada). Mientras se consulta deja un hueco
// del mismo tamaño; si la consulta falla no dice nada (no se afirma lo que no se sabe).
export default function ChipModalidad({ fase, configurada, opcion }) {
  if (fase === 'cargando') return <Hueco className="h-6 w-40 rounded-full" />
  if (fase === 'error') return null
  if (!configurada) return <Etiqueta tono="aviso">Modalidad: sin configurar</Etiqueta>

  const o = opcionPorId(opcion)
  if (!o) return null
  return <Etiqueta tono={opcion === 'sin_actividades' ? 'neutral' : 'azul'}>Modalidad: {o.etiqueta.toLowerCase()}</Etiqueta>
}
