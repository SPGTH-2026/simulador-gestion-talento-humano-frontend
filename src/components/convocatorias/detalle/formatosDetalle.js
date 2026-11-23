// Ayudas de formato del detalle de convocatoria: fechas, moneda, texto en líneas y valores vacíos.
export function formatearFecha(iso) {
  if (!iso) return '—'
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : iso
}

// COP sin decimales. Devuelve null si no hay valor (para el rango salarial).
export function moneda(valor) {
  if (valor == null) return null
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor)
}

// Texto libre -> líneas limpias. Los párrafos se pintan como <li> por línea,
// todo como texto; nunca dangerouslySetInnerHTML (React escapa el texto).
export function aLineas(texto) {
  return String(texto ?? '')
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean)
}

// ¿El campo trae algo visible? Se usa para ocultar las secciones vacías en vez
// de dejar etiquetas "—" sueltas.
export function hay(valor) {
  return String(valor ?? '').trim().length > 0
}
