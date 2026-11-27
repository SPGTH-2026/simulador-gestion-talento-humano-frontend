import { CargaInicial, EsqueletoDetalle, EsqueletoTabla } from '../../ui/Esqueleto'

// Estado de carga del ranking (primera página): las cifras del resumen y la tabla, con las columnas que ya se saben que tendrá.
//  - Elegir: si quien mira puede elegir y la convocatoria no está cerrada a la elección (permiso y estado ya conocidos).
//  - Puesto y Resultado: solo con actividades; la modalidad llega de la cabecera. Mientras no se conoce no se dibujan.
//  - Documental: siempre.
export default function CargandoRanking({ puedeElegir = false, conPuesto = false }) {
  const columnas = [
    ...(puedeElegir ? [{ texto: 'Elegir', tipo: 'casilla', clase: '' }] : []),
    { texto: 'Aspirante', tipo: 'persona' },
    ...(conPuesto
      ? [
          { texto: 'Puesto', clase: 'hidden text-right @min-[560px]:block' },
          { texto: 'Resultado', clase: 'hidden text-right @min-[560px]:block' },
        ]
      : []),
    { texto: 'Documental', clase: 'hidden text-right @min-[560px]:block' },
  ]
  // Anchos de la tabla real: casillas 4.25 rem, Puesto 4.5, Resultado 6, Documental 7 y Aspirante el resto. Tailwind necesita las
  // clases completas: se elige entre las cuatro combinaciones posibles.
  const plantilla = {
    'false-false': 'grid-cols-[minmax(0,1fr)] @min-[560px]:grid-cols-[minmax(0,1fr)_7rem]',
    'true-false': 'grid-cols-[4.25rem_minmax(0,1fr)] @min-[560px]:grid-cols-[4.25rem_minmax(0,1fr)_7rem]',
    'false-true': 'grid-cols-[minmax(0,1fr)] @min-[560px]:grid-cols-[minmax(0,1fr)_4.5rem_6rem_7rem]',
    'true-true': 'grid-cols-[4.25rem_minmax(0,1fr)] @min-[560px]:grid-cols-[4.25rem_minmax(0,1fr)_4.5rem_6rem_7rem]',
  }[`${puedeElegir}-${conPuesto}`]

  return (
    <CargaInicial texto="Cargando ranking…" className="flex flex-col gap-3">
      <div className="@container flex flex-col gap-3">
        <EsqueletoDetalle metricas={4} bloques={0} />
        <EsqueletoTabla filas={5} encabezados={columnas} plantilla={plantilla} />
      </div>
    </CargaInicial>
  )
}
