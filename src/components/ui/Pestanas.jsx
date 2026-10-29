import { useRef, useState } from 'react'

// Pestañas accesibles del sistema visual. Se centralizan aquí porque el patrón
// (roles ARIA, navegación por teclado, paneles siempre montados y foco visible)
// es fácil de romper al reescribirlo en cada página.
//
// Contrato:
//   - 'pestanas': [{ id, etiqueta, contenido, icono? }]. El 'id' debe ser único
//     y apto para un id de HTML (se usa en aria-controls/aria-labelledby).
//   - 'etiquetaAccesible': nombre del tablist (aria-label).
//   - 'activaId' / 'onCambiar': uso CONTROLADO opcional, para que quien monta
//     (p. ej. la barra inferior del detalle) pueda saltar a una pestaña. Sin
//     ellos, la primitiva maneja su propia pestaña activa.
//
// TODOS los paneles quedan montados y los inactivos se ocultan con el atributo
// `hidden`. Es deliberado: el panel de postulación guarda archivos y estado en
// vuelo, y desmontarlo al cambiar de pestaña los perdería. `hidden` quita el
// panel del árbol de accesibilidad y del orden de tabulación, así que oculto no
// es alcanzable con teclado ni con lector de pantalla.
//
// Teclado: ← → mueven el foco (cíclico), Home/End van al primero/último.
export default function Pestanas({
  pestanas,
  etiquetaAccesible = 'Secciones',
  activaId,
  onCambiar,
}) {
  const [activaInterna, setActivaInterna] = useState(pestanas[0]?.id ?? null)
  const refs = useRef({})

  if (pestanas.length === 0) return null

  // Controlado si llega activaId; si no, estado propio.
  const activa = activaId ?? activaInterna
  const seleccionar = (idPestana) => {
    setActivaInterna(idPestana)
    onCambiar?.(idPestana)
  }

  // El índice se recalcula en cada render: si la pestaña activa ya no existe
  // (por ejemplo el usuario cambió de convocatoria), se cae a la primera.
  const indiceActivo = Math.max(
    0,
    pestanas.findIndex((p) => p.id === activa),
  )

  const enfocar = (indice) => {
    const destino = pestanas[indice]
    if (!destino) return
    seleccionar(destino.id)
    refs.current[destino.id]?.focus()
  }

  const alTeclear = (e, indice) => {
    const ultimo = pestanas.length - 1
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        enfocar(indice === ultimo ? 0 : indice + 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        enfocar(indice === 0 ? ultimo : indice - 1)
        break
      case 'Home':
        e.preventDefault()
        enfocar(0)
        break
      case 'End':
        e.preventDefault()
        enfocar(ultimo)
        break
      default:
        break
    }
  }

  const idActivo = pestanas[indiceActivo]?.id

  return (
    <div className="flex flex-col gap-4">
      {/* La barra se desplaza dentro de su propio contenedor: en móvil las
          pestañas se deslizan sin arrastrar la página entera. */}
      <div
        role="tablist"
        aria-label={etiquetaAccesible}
        className="flex gap-1 overflow-x-auto border-b border-sena-linea/80 dark:border-sena-borde/60"
      >
        {pestanas.map((pestana, indice) => {
          const seleccionada = pestana.id === idActivo
          return (
            <button
              key={pestana.id}
              ref={(el) => {
                refs.current[pestana.id] = el
              }}
              type="button"
              role="tab"
              id={`tab-${pestana.id}`}
              aria-selected={seleccionada}
              aria-controls={`panel-${pestana.id}`}
              tabIndex={seleccionada ? 0 : -1}
              onClick={() => seleccionar(pestana.id)}
              onKeyDown={(e) => alTeclear(e, indice)}
              className={`-mb-px flex shrink-0 items-center gap-2 rounded-t-md border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/40 ${
                seleccionada
                  ? 'border-sena text-sena-azul dark:border-sena dark:text-sena-texto'
                  : 'border-transparent text-slate-600 hover:border-sena-linea hover:text-sena-azul dark:text-sena-texto-suave dark:hover:border-sena-borde dark:hover:text-sena-texto'
              }`}
            >
              {pestana.icono && (
                <span className="shrink-0" aria-hidden="true">
                  {pestana.icono}
                </span>
              )}
              {pestana.etiqueta}
            </button>
          )
        })}
      </div>

      {/* Un tabpanel por pestaña, TODOS montados; solo el activo se ve. */}
      {pestanas.map((pestana) => {
        const seleccionada = pestana.id === idActivo
        return (
          <div
            key={pestana.id}
            role="tabpanel"
            id={`panel-${pestana.id}`}
            aria-labelledby={`tab-${pestana.id}`}
            tabIndex={0}
            hidden={!seleccionada}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/40"
          >
            {pestana.contenido}
          </div>
        )
      })}
    </div>
  )
}
