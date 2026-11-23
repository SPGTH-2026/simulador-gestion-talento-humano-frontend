import Paginacion from '../../ui/Paginacion'

// Sección de PanelRanking. Recibe el estado y las acciones del componente en la prop ctx.
export default function PaginacionRanking({ ctx }) {
  const { cambiarPagina, cargando, meta } = ctx
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
