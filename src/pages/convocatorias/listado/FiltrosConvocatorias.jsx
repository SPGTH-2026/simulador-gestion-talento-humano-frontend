import Tarjeta from '../../../components/ui/Tarjeta'
import Campo from '../../../components/ui/Campo'
import CampoBusqueda from '../../../components/ui/CampoBusqueda'
import { CLASE_CAMPO } from '../../../lib/estilos'
import { ORDENES } from './constantesListado'

// Buscador y filtros del listado. El estado solo lo ve quien gestiona de verdad; la ficha, solo quien puede
// listar fichas. Cada cambio pasa por setValores, que escribe en la URL (así sobreviven recargar y "atrás").
//
// Distribución (según el ancho de la tarjeta, no el de la ventana):
//  - Fila 1: «Buscar» (toma el ancho sobrante) y, si el perfil puede filtrar por ficha, «Ficha» con un ancho útil de 15 a 24 rem.
//    Sin Ficha, «Buscar» ocupa toda la fila. Por debajo de 640 px se apilan.
//  - Fila 2: Estado (solo si aplica), Tipo, Modalidad y Ordenar por: 1 columna, 2 desde 520 px y todos en una fila desde 860 px
//    (4 con Estado, 3 sin él). Ningún control se comprime.
// La ficha se identifica por su código al principio de la opción («2896411 · Programa…»): el selector cerrado puede recortar el nombre
// del programa; al abrirlo se ve completo.
export default function FiltrosConvocatorias({ ctx }) {
  const { fichas, filtroEstado, filtroFicha, filtroModalidad, filtroTipo, gestionaEstricto, opcionesEstado,
    opcionesModalidad, opcionesTipo, orden, puedeFiltrarFicha, reemplazar, setTermino, setValores, termino } = ctx
  return (
      <Tarjeta className="@container p-4">
        <div role="search" aria-label="Buscar y filtrar convocatorias" className="flex flex-col gap-3">
          <div
            className={`grid gap-3 ${puedeFiltrarFicha ? '@min-[640px]:grid-cols-[minmax(0,1fr)_minmax(15rem,24rem)]' : ''}`}
          >
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

            {puedeFiltrarFicha && (
              <Campo etiqueta="Ficha">
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

          <div className={`grid gap-3 @min-[520px]:grid-cols-2 ${gestionaEstricto ? '@min-[860px]:grid-cols-4' : '@min-[860px]:grid-cols-3'}`}>
            {gestionaEstricto && (
              <Campo etiqueta="Estado">
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

            <Campo etiqueta="Tipo">
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

            <Campo etiqueta="Modalidad">
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

            <Campo etiqueta="Ordenar por">
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
          </div>
        </div>
      </Tarjeta>
  )
}
