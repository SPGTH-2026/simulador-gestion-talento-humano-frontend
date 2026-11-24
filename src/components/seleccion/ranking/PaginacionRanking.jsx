import Paginacion from '../../ui/Paginacion'

// Sección de PanelRanking. Recibe solo lo que muestra, por props.
export default function PaginacionRanking({ cambiarPagina, cargando, meta }) {
  return (
  <Paginacion
    meta={meta}
    singular="candidato listo"
    plural="candidatos listos"
    etiqueta="Paginación del ranking"
    ocupado={cargando}
    onPagina={cambiarPagina}
    className="px-1"
  />
  )
}
