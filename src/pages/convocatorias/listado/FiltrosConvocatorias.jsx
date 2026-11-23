import Tarjeta from '../../../components/ui/Tarjeta'
import Campo from '../../../components/ui/Campo'
import CampoBusqueda from '../../../components/ui/CampoBusqueda'
import { CLASE_CAMPO } from '../../../lib/estilos'
import { ORDENES } from './constantesListado'

// Buscador y filtros del listado. El estado solo lo ve quien gestiona de verdad; la ficha, solo quien puede
// listar fichas. Cada cambio pasa por setValores, que escribe en la URL (así sobreviven recargar y "atrás").
export default function FiltrosConvocatorias({ ctx }) {
  const { fichas, filtroEstado, filtroFicha, filtroModalidad, filtroTipo, gestionaEstricto, opcionesEstado,
    opcionesModalidad, opcionesTipo, orden, puedeFiltrarFicha, reemplazar, setTermino, setValores, termino } = ctx
  return (
      <Tarjeta className="p-4">
        <div role="search" aria-label="Buscar y filtrar convocatorias" className="flex flex-col gap-3">
          {/* El buscador ocupa siempre su propia fila y los filtros van debajo, que
              se reparten según el espacio. Antes el buscador subía junto a los
              filtros en pantallas anchas; con los filtros de tipo, modalidad y
              orden ya no cabían en una línea, se partían en dos filas y el
              buscador (alineado abajo) dejaba un hueco arriba a la izquierda. */}
          <div className="flex flex-col gap-3">
            <Campo
              etiqueta={gestionaEstricto ? 'Buscar por nombre, código o cargo' : 'Buscar por nombre o cargo'}
            >
              {({ id, describedby }) => (
                <CampoBusqueda
                  id={id}
                  placeholder="Escribe para buscar…"
                  value={termino}
                  onChange={(e) => setTermino(e.target.value)}
                  aria-describedby={describedby}
                />
              )}
            </Campo>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            {gestionaEstricto && (
              <Campo etiqueta="Estado" className="sm:w-52 sm:shrink-0">
                {({ id }) => (
                  <select
                    id={id}
                    value={filtroEstado}
                    onChange={(e) => setValores({ estado: e.target.value, page: '' }, { reemplazar })}
                    className={CLASE_CAMPO}
                  >
                    <option value="">Todos los estados</option>
                    {opcionesEstado.map((o) => (
                      <option key={o.codigo} value={o.codigo}>
                        {o.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </Campo>
            )}

            <Campo etiqueta="Tipo" className="sm:w-48 sm:shrink-0">
              {({ id }) => (
                <select
                  id={id}
                  value={filtroTipo}
                  onChange={(e) => setValores({ tipo: e.target.value, page: '' }, { reemplazar })}
                  className={CLASE_CAMPO}
                >
                  <option value="">Todos los tipos</option>
                  {opcionesTipo.map((o) => (
                    <option key={o.codigo} value={o.codigo}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            <Campo etiqueta="Modalidad" className="sm:w-48 sm:shrink-0">
              {({ id }) => (
                <select
                  id={id}
                  value={filtroModalidad}
                  onChange={(e) => setValores({ modalidad: e.target.value, page: '' }, { reemplazar })}
                  className={CLASE_CAMPO}
                >
                  <option value="">Todas las modalidades</option>
                  {opcionesModalidad.map((o) => (
                    <option key={o.codigo} value={o.codigo}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            <Campo etiqueta="Ordenar por" className="sm:w-48 sm:shrink-0">
              {({ id }) => (
                <select
                  id={id}
                  value={orden}
                  onChange={(e) =>
                    setValores(
                      { orden: e.target.value === 'reciente' ? '' : e.target.value, page: '' },
                      { reemplazar },
                    )
                  }
                  className={CLASE_CAMPO}
                >
                  {ORDENES.map((o) => (
                    <option key={o.valor} value={o.valor}>
                      {o.texto}
                    </option>
                  ))}
                </select>
              )}
            </Campo>

            {puedeFiltrarFicha && (
              <Campo etiqueta="Ficha" className="sm:min-w-0 sm:max-w-sm sm:flex-1">
                {({ id }) => (
                  <select
                    id={id}
                    value={filtroFicha}
                    onChange={(e) => setValores({ ficha: e.target.value, page: '' }, { reemplazar })}
                    className={CLASE_CAMPO}
                  >
                    <option value="">Todas las fichas</option>
                    {fichas.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.codigo} · {f.nombre_programa}
                      </option>
                    ))}
                  </select>
                )}
              </Campo>
            )}
            </div>
          </div>
        </div>
      </Tarjeta>
  )
}
