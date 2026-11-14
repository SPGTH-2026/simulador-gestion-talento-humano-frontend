import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { listaUsuarios, asignarRol } from '../../api/usuarios'
import { listaFichas } from '../../api/fichas'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'
import { useConfirmacion } from '../../hooks/useConfirmacion'
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
import {
  CLASE_FILA,
  CLASE_CAMPO,
  CLASE_INPUT,
  CLASE_LABEL,
  CLASE_TABLA,
  CLASE_TBODY,
  CLASE_TD,
  CLASE_TH,
  CLASE_THEAD, CLASE_TITULO_PAGINA } from '../../lib/estilos'

const ROLES = [
  { valor: 'super_admin', etiqueta: 'Super admin' },
  { valor: 'instructor', etiqueta: 'Instructor' },
  { valor: 'aprendiz', etiqueta: 'Aprendiz' },
  { valor: 'aspirante', etiqueta: 'Aspirante' },
]

const SUBROLES = [
  { valor: 'general', etiqueta: 'General' },
  { valor: 'evaluador', etiqueta: 'Evaluador' },
  { valor: 'seleccionador', etiqueta: 'Seleccionador' },
  { valor: 'gestor_convocatorias', etiqueta: 'Gestor de convocatorias' },
]

// Tonos del sistema para los chips de rol y de estado de la cuenta.
const TONOS_ROL = {
  super_admin: 'peligro',
  instructor: 'aviso',
  aprendiz: 'azul',
  aspirante: 'neutral',
}

function etiquetaRol(rol) {
  return ROLES.find((r) => r.valor === rol)?.etiqueta ?? rol
}

function etiquetaSubrol(subrol) {
  return SUBROLES.find((s) => s.valor === subrol)?.etiqueta ?? subrol
}

export default function Usuarios() {
  const { user } = useAuth()
  const esInstructor = user?.role === 'instructor'

  const [usuarios, setUsuarios] = useState([])
  const [fichas, setFichas] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })

  const [termino, setTermino] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [filtroFicha, setFiltroFicha] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [pagina, setPagina] = useState(1)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [errorLista, setErrorLista] = useState('') // fallo al cargar la tabla (se puede reintentar)
  const [errorFichas, setErrorFichas] = useState('')
  const [intento, setIntento] = useState(0)
  const [exito, setExito] = useState('')

  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState({ role: '', subrole: 'general', active: true, ficha_id: '' })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let activo = true
    listaFichas()
      .then((res) => {
        if (!activo) return
        setFichas(res.data)
        setErrorFichas('')
      })
      .catch((e) => {
        // La lista sigue sirviendo sin fichas, pero el fallo se avisa con su motivo.
        if (activo) setErrorFichas(mensajeError(e))
      })
    return () => {
      activo = false
    }
  }, [intento])

  // El texto se aplaza 300 ms para no martillar el backend letra a letra.
  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(termino)
      setPagina(1)
    }, 300)
    return () => clearTimeout(t)
  }, [termino])

  useEffect(() => {
    // Si la consulta cambia antes de que llegue la respuesta (otro filtro, otra página), la respuesta vieja
    // se descarta: así no pisa a la nueva.
    let vigente = true

    // En los refetch de paginación/filtros la tabla conserva los datos viejos
    // mientras llegan los nuevos; por eso 'cargando' solo se activa en el montaje.
    listaUsuarios({
      page: pagina,
      search: busqueda || undefined,
      ficha_id: filtroFicha || undefined,
      role: filtroRol || undefined,
    })
      .then((res) => {
        if (!vigente) return
        setUsuarios(res.data)
        setMeta(res.meta)
        setErrorLista('')
      })
      .catch((e) => {
        if (vigente) setErrorLista(mensajeError(e))
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [pagina, busqueda, filtroFicha, filtroRol, intento])

  // El instructor no gestiona instructores ni super admins (matriz del backend).
  const rolesPermitidos = esInstructor
    ? ROLES.filter((r) => r.valor === 'aprendiz' || r.valor === 'aspirante')
    : ROLES

  const empezarEdicion = (u) => {
    setEditandoId(u.id)
    setForm({
      role: u.role,
      subrole: u.subrole ?? 'general',
      active: u.active,
      ficha_id: u.ficha?.id ? String(u.ficha.id) : '',
    })
    setErrores({})
  }

  // Reemplaza solo esa fila con la respuesta del servidor: así la etiqueta de
  // estado cambia al confirmar, sin recargar la lista ni mover la paginación.
  // Se conserva postulaciones_count, que el PATCH no devuelve.
  const actualizarFila = (usuarioNuevo) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.id === usuarioNuevo.id ? { ...u, ...usuarioNuevo } : u)),
    )
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setErrores({})
    setExito('')

    const esAprendiz = form.role === 'aprendiz'
    const admiteFicha = form.role === 'aprendiz' || form.role === 'aspirante'

    try {
      const respuesta = await asignarRol(editandoId, {
        role: form.role,
        subrole: esAprendiz ? form.subrole : null,
        active: form.active,
        ficha_id: admiteFicha ? (form.ficha_id || null) : null,
      })
      actualizarFila(respuesta.data)
      setEditandoId(null)
      setExito('Usuario actualizado correctamente.')
      setError('')
    } catch (err) {
      setErrores(erroresDeCampo(err))
      setError(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  // Inhabilitar (active = false) o reactivar, sin cambiar rol ni ficha. Usa la
  // misma forma de envío que el formulario para que el backend valide igual.
  const confirmar = useConfirmacion()

  const alternarActivo = async (u) => {
    const inhabilitar = u.active
    const ok = await confirmar({
      titulo: inhabilitar ? 'Inhabilitar usuario' : 'Reactivar usuario',
      mensaje: inhabilitar
        ? `¿Estás seguro de inhabilitar a ${u.name}? No podrá iniciar sesión y sus postulaciones se ocultarán hasta que lo reactives.`
        : `¿Estás seguro de reactivar a ${u.name}? Volverá a poder iniciar sesión.`,
      textoConfirmar: inhabilitar ? 'Inhabilitar' : 'Reactivar',
      textoCancelar: 'Cancelar',
      peligro: inhabilitar,
    })
    if (!ok) return

    setError('')
    setExito('')
    try {
      const respuesta = await asignarRol(u.id, {
        role: u.role,
        subrole: u.role === 'aprendiz' ? u.subrole : null,
        active: !u.active,
        ficha_id: u.role === 'aprendiz' || u.role === 'aspirante' ? (u.ficha?.id ?? null) : null,
      })
      actualizarFila(respuesta.data)
      setExito(inhabilitar ? 'Usuario inhabilitado.' : 'Usuario reactivado.')
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  const hayFiltros = Boolean(termino || filtroFicha || filtroRol)
  // Limpiar quita búsqueda y filtros de una vez, al instante, y vuelve a la primera página.
  const limpiarFiltros = () => {
    setTermino('')
    setBusqueda('')
    setFiltroFicha('')
    setFiltroRol('')
    setPagina(1)
  }

  const rolOrden = (rol) => (rol === 'aspirante' ? 0 : rol === 'aprendiz' ? 1 : rol === 'instructor' ? 2 : 3)

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
              [...usuarios]
                .sort((a, b) => rolOrden(a.role) - rolOrden(b.role))
                .map((u) =>
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
                          {u.id === user?.id ? (
                            <span className="py-1.5 text-xs text-slate-500 dark:text-sena-texto-suave">Tu cuenta</span>
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
