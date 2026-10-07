import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { listaUsuarios, listaFichas, asignarRol } from '../../api/usuarios'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'

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
  { valor: 'revisor_documental', etiqueta: 'Revisor documental' },
  { valor: 'gestor_convocatorias', etiqueta: 'Gestor de convocatorias' },
]

const COLORES_ROL = {
  super_admin: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  instructor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  aprendiz: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  aspirante: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

const CLASE_INPUT =
  'rounded border border-sena-azul/20 p-2 font-normal text-sena-azul focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto'

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
  const [pagina, setPagina] = useState(1)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState({ role: '', subrole: 'general', active: true, ficha_id: '' })
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    listaFichas()
      .then((res) => setFichas(res.data))
      .catch(() => {}) // sin fichas la lista sigue sirviendo; el error lo da la tabla
  }, [])

  // El texto se aplaza 300 ms para no martillar el backend letra a letra.
  useEffect(() => {
    const t = setTimeout(() => {
      setBusqueda(termino)
      setPagina(1)
    }, 300)
    return () => clearTimeout(t)
  }, [termino])

  useEffect(() => {
    const control = new AbortController()

    // En los refetch de paginación/filtros la tabla conserva los datos viejos
    // mientras llegan los nuevos; por eso 'cargando' solo se activa en el montaje.
    listaUsuarios({
      page: pagina,
      search: busqueda || undefined,
      ficha_id: filtroFicha || undefined,
    })
      .then((res) => {
        setUsuarios(res.data)
        setMeta(res.meta)
        setError('')
      })
      .catch((e) => {
        if (e.name !== 'CanceledError') setError(mensajeError(e))
      })
      .finally(() => setCargando(false))

    return () => control.abort()
  }, [pagina, busqueda, filtroFicha])

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

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setErrores({})
    setExito('')

    const esAprendiz = form.role === 'aprendiz'
    const admiteFicha = form.role === 'aprendiz' || form.role === 'aspirante'

    try {
      await asignarRol(editandoId, {
        role: form.role,
        subrole: esAprendiz ? form.subrole : null,
        active: form.active,
        ficha_id: admiteFicha ? (form.ficha_id || null) : null,
      })
      setEditandoId(null)
      setExito('Rol actualizado correctamente.')
      setError('')
    } catch (err) {
      setErrores(erroresDeCampo(err))
      setError(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  const rolOrden = (rol) => (rol === 'aspirante' ? 0 : rol === 'aprendiz' ? 1 : rol === 'instructor' ? 2 : 3)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-sena-texto">Usuarios y Roles</h1>

        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Buscar por nombre o correo"
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            className={CLASE_INPUT + ' min-w-56'}
          />

          <select
            value={filtroFicha}
            onChange={(e) => {
              setFiltroFicha(e.target.value)
              setPagina(1)
            }}
            className={CLASE_INPUT}
          >
            <option value="">Todas las fichas</option>
            {fichas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.codigo} · {f.nombre_programa}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {exito && (
        <p
          role="status"
          className="rounded border border-sena/40 bg-sena/10 p-3 text-sm text-sena-oscuro dark:border-sena/50 dark:bg-sena/15 dark:text-sena-acento"
        >
          {exito}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-sena-borde dark:bg-sena-superficie">
        <table className="w-full min-w-175 text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-sena-borde dark:text-sena-texto-suave">
            <tr>
              <th className="p-3">Usuario</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Subrol</th>
              <th className="p-3">Ficha</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-sena-borde">
            {cargando && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500 dark:text-sena-texto-suave">
                  Cargando usuarios...
                </td>
              </tr>
            )}

            {!cargando &&
              usuarios.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500 dark:text-sena-texto-suave">
                    No hay usuarios que coincidan con los filtros.
                  </td>
                </tr>
              )}

            {!cargando &&
              [...usuarios]
                .sort((a, b) => rolOrden(a.role) - rolOrden(b.role))
                .map((u) =>
                  editandoId === u.id ? (
                    <tr key={u.id} className="bg-sena-cielo/30 dark:bg-sena-superficie-alta/30">
                      <td colSpan="6" className="p-3">
                        <form
                          onSubmit={guardar}
                          className="flex flex-wrap items-end gap-3 rounded border border-sena/30 p-3 dark:border-sena-borde"
                        >
                          <label className="flex flex-col gap-1 text-xs font-medium text-sena-azul dark:text-sena-texto">
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
                            {errores.role && (
                              <span className="text-xs text-red-600 dark:text-red-400">{errores.role}</span>
                            )}
                          </label>

                          {form.role === 'aprendiz' && (
                            <label className="flex flex-col gap-1 text-xs font-medium text-sena-azul dark:text-sena-texto">
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
                                <span className="text-xs text-red-600 dark:text-red-400">{errores.subrole}</span>
                              )}
                            </label>
                          )}

                          {(form.role === 'aprendiz' || form.role === 'aspirante') && (
                            <label className="flex flex-col gap-1 text-xs font-medium text-sena-azul dark:text-sena-texto">
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
                                <span className="text-xs text-red-600 dark:text-red-400">{errores.ficha_id}</span>
                              )}
                            </label>
                          )}

                          <label className="flex items-center gap-2 pb-2 text-xs font-medium text-sena-azul dark:text-sena-texto">
                            <input
                              type="checkbox"
                              checked={form.active}
                              onChange={(e) => setForm({ ...form, active: e.target.checked })}
                              className="h-4 w-4 accent-sena"
                            />
                            Activo
                          </label>

                          <div className="ml-auto flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditandoId(null)}
                              className="rounded border border-sena-azul/25 px-3 py-2 text-sm font-medium text-sena-azul hover:bg-sena-cielo/30 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={guardando}
                              className="rounded bg-sena-oscuro px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-sena-azul disabled:opacity-60"
                            >
                              {guardando ? 'Guardando...' : 'Guardar'}
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={u.id} className="hover:bg-sena-cielo/20 dark:hover:bg-sena-superficie-alta/20">
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 dark:text-sena-texto">{u.name}</div>
                        <div className="text-xs text-slate-500 dark:text-sena-texto-suave">{u.email}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${COLORES_ROL[u.role] ?? COLORES_ROL.aspirante}`}
                        >
                          {etiquetaRol(u.role)}
                        </span>
                      </td>
                      <td className="p-3 capitalize text-slate-700 dark:text-sena-texto">
                        {u.subrole ? etiquetaSubrol(u.subrole) : '—'}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-sena-texto">
                        {u.ficha ? `${u.ficha.codigo}` : '—'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.active
                              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {u.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => empezarEdicion(u)}
                          className="rounded border border-sena-azul/25 px-3 py-1.5 text-xs font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
                        >
                          Cambiar rol
                        </button>
                      </td>
                    </tr>
                  ),
                )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-sena-texto-suave">
        <span>
          Página {meta.current_page} de {Math.max(meta.last_page, 1)} · {meta.total} usuario(s)
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={meta.current_page <= 1}
            className="rounded border border-sena-azul/25 px-3 py-1.5 font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30 disabled:opacity-40 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
          >
            Anterior
          </button>
          <button
            onClick={() => setPagina((p) => Math.min(meta.last_page, p + 1))}
            disabled={meta.current_page >= meta.last_page}
            className="rounded border border-sena-azul/25 px-3 py-1.5 font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30 disabled:opacity-40 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}