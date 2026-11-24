import { useUsuarios } from './useUsuarios'
import { SUBROLES, TONOS_ROL, etiquetaRol, etiquetaSubrol } from './constantesUsuarios'
import Boton from '../../components/ui/Boton'
import Paginacion from '../../components/ui/Paginacion'
import Campo from '../../components/ui/Campo'
import CampoBusqueda from '../../components/ui/CampoBusqueda'
import Cargando from '../../components/ui/Cargando'
import Icono from '../../components/ui/Icono'
import EstadoVacio from '../../components/ui/EstadoVacio'
import Etiqueta from '../../components/ui/Etiqueta'
import { MensajeError, MensajeExito } from '../../components/ui/Mensaje'
import Tarjeta from '../../components/ui/Tarjeta'
import { CLASE_FILA, CLASE_CAMPO, CLASE_INPUT, CLASE_LABEL, CLASE_TABLA, CLASE_TBODY, CLASE_TD, CLASE_TH, CLASE_THEAD, CLASE_TITULO_PAGINA } from '../../lib/estilos'

export default function Usuarios() {
  const ctx = useUsuarios()
  const { alternarActivo, cargando, editandoId, empezarEdicion, error, errorFichas, errorLista, errores, exito, fichas, filtroFicha, filtroRol, form, guardando, guardar, hayFiltros, limpiarFiltros, meta, rolesPermitidos, setEditandoId, setFiltroFicha, setFiltroRol, setForm, setIntento, setPagina, setTermino, termino, user, usuarios } = ctx
  return (
    <div className="flex flex-col gap-4">
      <h1 className={CLASE_TITULO_PAGINA}>Usuarios y Roles</h1>

      {/* Mismo bloque de filtros que Convocatorias y Evaluación: buscador con lupa en su propia fila y, debajo,
          los selectores con su etiqueta y «Limpiar filtros» cuando hay alguno activo. */}
      <div role="search" aria-label="Filtrar usuarios" className="flex flex-col gap-3">
        <Campo etiqueta="Buscar por nombre o correo">
          <CampoBusqueda
            placeholder="Escribe para buscar…"
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
          />
        </Campo>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <Campo etiqueta="Rol" className="sm:w-52 sm:shrink-0">
            <select
              value={filtroRol}
              onChange={(e) => {
                setFiltroRol(e.target.value)
                setPagina(1)
              }}
              className={CLASE_CAMPO}
            >
              <option value="">Todos los roles</option>
              {rolesPermitidos.map((r) => (
                <option key={r.valor} value={r.valor}>
                  {r.etiqueta}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Ficha" className="sm:w-72 sm:shrink-0">
            <select
              value={filtroFicha}
              onChange={(e) => {
                setFiltroFicha(e.target.value)
                setPagina(1)
              }}
              className={CLASE_CAMPO}
            >
              <option value="">Todas las fichas</option>
              {fichas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.codigo} · {f.nombre_programa}
                </option>
              ))}
            </select>
          </Campo>

          {hayFiltros && (
            <Boton variante="contorno" tamano="flexible" onClick={limpiarFiltros} className="sm:shrink-0">
              <Icono nombre="cerrar" className="size-5 shrink-0" />
              Limpiar filtros
            </Boton>
          )}
        </div>
      </div>

      {error && <MensajeError>{error}</MensajeError>}
      {errorLista && <MensajeError>{errorLista}</MensajeError>}
      {errorFichas && (
        <MensajeError>No se pudieron cargar las fichas del filtro. {errorFichas}</MensajeError>
      )}
      {(errorLista || errorFichas) && (
        <div>
          <Boton variante="contorno" onClick={() => setIntento((n) => n + 1)}>
            Reintentar
          </Boton>
        </div>
      )}
      {exito && <MensajeExito>{exito}</MensajeExito>}

      <Tarjeta className="@container overflow-x-auto">
        <table className={`${CLASE_TABLA} min-w-175`}>
          <thead className={CLASE_THEAD}>
            <tr>
              <th className={CLASE_TH}>Usuario</th>
              <th className={CLASE_TH}>Rol</th>
              <th className={CLASE_TH}>Subrol</th>
              <th className={CLASE_TH}>Ficha</th>
              <th className={CLASE_TH}>Estado</th>
              <th className={`${CLASE_TH} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className={CLASE_TBODY}>
            {cargando && (
              <tr>
                <td colSpan="6">
                  <div className="sticky left-0 w-[100cqw]">
                    <Cargando>Cargando usuarios…</Cargando>
                  </div>
                </td>
              </tr>
            )}

            {!cargando && usuarios.length === 0 && (
              <tr>
                <td colSpan="6">
                  <EstadoVacio>No hay usuarios que coincidan con los filtros.</EstadoVacio>
                </td>
              </tr>
            )}

            {!cargando &&
              // El orden por rol lo da el servidor: ordenar aquí solo la página actual mezclaba roles entre páginas.
              usuarios.map((u) =>
                  editandoId === u.id ? (
                    <tr key={u.id} className="bg-sena-cielo/30 dark:bg-sena-superficie-alta/30">
                      <td colSpan="6" className={CLASE_TD}>
                        <form
                          onSubmit={guardar}
                          className="flex flex-wrap items-end gap-3 rounded-md border border-sena/30 p-3 dark:border-sena-borde"
                        >
                          <label className={CLASE_LABEL}>
                            Rol
                            <select
                              value={form.role}
                              onChange={(e) => setForm({ ...form, role: e.target.value })}
                              className={CLASE_INPUT}
                            >
                              {rolesPermitidos.map((r) => (
                                <option key={r.valor} value={r.valor}>
                                  {r.etiqueta}
                                </option>
                              ))}
                            </select>
                            {errores.role && <span className="text-xs text-peligro">{errores.role}</span>}
                          </label>

                          {form.role === 'aprendiz' && (
                            <label className={CLASE_LABEL}>
                              Subrol
                              <select
                                value={form.subrole}
                                onChange={(e) => setForm({ ...form, subrole: e.target.value })}
                                className={CLASE_INPUT}
                              >
                                {SUBROLES.map((s) => (
                                  <option key={s.valor} value={s.valor}>
                                    {s.etiqueta}
                                  </option>
                                ))}
                              </select>
                              {errores.subrole && (
                                <span className="text-xs text-peligro">{errores.subrole}</span>
                              )}
                            </label>
                          )}

                          {(form.role === 'aprendiz' || form.role === 'aspirante') && (
                            <label className={CLASE_LABEL}>
                              Ficha
                              <select
                                value={form.ficha_id}
                                onChange={(e) => setForm({ ...form, ficha_id: e.target.value })}
                                className={CLASE_INPUT}
                              >
                                <option value="">— Sin ficha —</option>
                                {fichas.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    {f.codigo} · {f.nombre_programa}
                                  </option>
                                ))}
                              </select>
                              {errores.ficha_id && (
                                <span className="text-xs text-peligro">{errores.ficha_id}</span>
                              )}
                            </label>
                          )}

                          {form.role === 'instructor' && (
                            <fieldset className="flex flex-col gap-2 text-sm text-sena-azul dark:text-sena-texto">
                              <legend className="font-medium">Fichas del instructor (al menos una)</legend>
                              {fichas.map((f) => (
                                <label key={f.id} className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={form.fichas.includes(String(f.id))}
                                    onChange={(e) =>
                                      setForm({
                                        ...form,
                                        fichas: e.target.checked
                                          ? [...form.fichas, String(f.id)]
                                          : form.fichas.filter((x) => x !== String(f.id)),
                                      })
                                    }
                                  />
                                  {f.codigo} · {f.nombre_programa}
                                </label>
                              ))}
                              {errores.fichas && <span className="text-xs text-peligro">{errores.fichas}</span>}
                            </fieldset>
                          )}

                          <label className="flex items-center gap-2 pb-2 text-sm font-medium text-sena-azul dark:text-sena-texto">
                            <input
                              type="checkbox"
                              checked={form.active}
                              onChange={(e) => setForm({ ...form, active: e.target.checked })}
                              className="h-4 w-4 accent-sena"
                            />
                            Activo
                          </label>

                          <div className="ml-auto flex gap-2">
                            <Boton variante="contorno" onClick={() => setEditandoId(null)}>
                              Cancelar
                            </Boton>
                            <Boton type="submit" disabled={guardando}>
                              {guardando ? 'Guardando...' : 'Guardar'}
                            </Boton>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={u.id} className={CLASE_FILA}>
                      <td className={CLASE_TD}>
                        <div className="font-semibold text-slate-800 dark:text-sena-texto">{u.name}</div>
                        <div className="text-xs text-slate-500 dark:text-sena-texto-suave">{u.email}</div>
                      </td>
                      <td className={CLASE_TD}>
                        <Etiqueta tono={TONOS_ROL[u.role] ?? 'neutral'}>{etiquetaRol(u.role)}</Etiqueta>
                      </td>
                      <td className={`${CLASE_TD} capitalize text-slate-700 dark:text-sena-texto`}>
                        {u.subrole ? etiquetaSubrol(u.subrole) : '—'}
                      </td>
                      <td className={`${CLASE_TD} text-slate-700 dark:text-sena-texto`}>
                        {u.ficha ? `${u.ficha.codigo}` : '—'}
                      </td>
                      <td className={CLASE_TD}>
                        <Etiqueta tono={u.active ? 'exito' : 'peligro'}>
                          {u.active ? 'Activo' : 'Inactivo'}
                        </Etiqueta>
                      </td>
                      <td className={`${CLASE_TD} text-right`}>
                        <div className="flex justify-end gap-2">
                          {/* Nadie cambia su propio rol ni se inhabilita a sí mismo: en su fila no hay acciones. */}
                          {u.id === user?.id || u.role === 'super_admin' ? (
                            <span className="py-1.5 text-xs text-slate-500 dark:text-sena-texto-suave">
                              {u.id === user?.id ? 'Tu cuenta' : 'Cuenta de super admin'}
                            </span>
                          ) : (
                            <>
                              <Boton variante="contorno" tamano="tactil" onClick={() => empezarEdicion(u)}>
                                Cambiar rol
                              </Boton>
                              <Boton
                                variante={u.active ? 'peligro' : 'contorno'}
                                tamano="tactil"
                                onClick={() => alternarActivo(u)}
                              >
                                {u.active ? 'Inhabilitar' : 'Reactivar'}
                              </Boton>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ),
                )}
          </tbody>
        </table>
      </Tarjeta>

      <Paginacion
        meta={meta}
        singular="usuario"
        plural="usuarios"
        etiqueta="Paginación de usuarios"
        onPagina={setPagina}
        className="px-1"
      />
    </div>
  )
}
