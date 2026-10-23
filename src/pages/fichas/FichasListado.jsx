import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import {
  listaFichas,
  crearFicha,
  actualizarFicha,
  eliminarFicha,
  asignarInstructor,
  quitarInstructor,
} from '../../api/fichas'
import { listaUsuarios } from '../../api/usuarios'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import Cargando from '../../components/ui/Cargando'
import EstadoVacio from '../../components/ui/EstadoVacio'
import Etiqueta from '../../components/ui/Etiqueta'
import { MensajeError, MensajeExito } from '../../components/ui/Mensaje'
import Tarjeta from '../../components/ui/Tarjeta'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import {
  CLASE_FILA,
  CLASE_INPUT,
  CLASE_TABLA,
  CLASE_TBODY,
  CLASE_TD,
  CLASE_TH,
  CLASE_THEAD,
} from '../../lib/estilos'

const ESTADOS = [
  { valor: 'activa', etiqueta: 'Activa' },
  { valor: 'cerrada', etiqueta: 'Cerrada' },
]

const FORM_VACIO = { codigo: '', nombre_programa: '', estado: 'activa' }

// 'nueva' marca la fila del formulario de alta; un id, la edición de esa ficha.
const NUEVA = 'nueva'

export default function FichasListado() {
  const { user } = useAuth()
  // Solo el super admin reparte los grupos: asignar/quitar instructor.
  const esSuperAdmin = user?.role === 'super_admin'

  const [fichas, setFichas] = useState([])
  const [instructores, setInstructores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const [editandoId, setEditandoId] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  // Instructor elegido por ficha: { [fichaId]: usuarioId }
  const [elegido, setElegido] = useState({})
  const [asignandoId, setAsignandoId] = useState(null)

  const recargar = () =>
    listaFichas()
      .then((res) => {
        setFichas(res.data)
        setError('')
      })
      .catch((e) => setError(mensajeError(e)))

  useEffect(() => {
    recargar().finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    if (!esSuperAdmin) return

    // El backend pagina de 20 en 20: aquí se listan los instructores del
    // primer bloque, que es el que el super admin puede asignar.
    listaUsuarios({ role: 'instructor' })
      .then((res) => setInstructores(res.data))
      .catch(() => {}) // si no se pueden listar, el resto de la página sigue
  }, [esSuperAdmin])

  const empezarAlta = () => {
    setEditandoId(NUEVA)
    setForm(FORM_VACIO)
    setErrores({})
    setExito('')
  }

  const empezarEdicion = (ficha) => {
    setEditandoId(ficha.id)
    setForm({
      codigo: ficha.codigo,
      nombre_programa: ficha.nombre_programa,
      estado: ficha.estado,
    })
    setErrores({})
    setExito('')
  }

  const cancelar = () => {
    setEditandoId(null)
    setErrores({})
  }

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setErrores({})
    setExito('')

    const cuerpo = {
      codigo: form.codigo,
      nombre_programa: form.nombre_programa,
      estado: form.estado,
    }

    try {
      if (editandoId === NUEVA) {
        await crearFicha(cuerpo)
        setExito('Ficha creada correctamente. Ya eres su dueño.')
      } else {
        await actualizarFicha(editandoId, cuerpo)
        setExito('Ficha actualizada correctamente.')
      }
      setEditandoId(null)
      await recargar()
    } catch (err) {
      setErrores(erroresDeCampo(err))
      setError(mensajeError(err))
    } finally {
      setGuardando(false)
    }
  }

  const confirmar = useConfirmacion()

  const eliminar = async (ficha) => {
    const ok = await confirmar({
      titulo: 'Eliminar ficha',
      mensaje: `¿Estás seguro de eliminar la ficha "${ficha.codigo}"?`,
      textoConfirmar: 'Eliminar',
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return

    try {
      await eliminarFicha(ficha.id)
      setExito('Ficha eliminada correctamente.')
      setError('')
      await recargar()
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  const asignar = async (ficha) => {
    const usuarioId = elegido[ficha.id]
    if (!usuarioId) return

    setAsignandoId(ficha.id)
    try {
      await asignarInstructor(ficha.id, Number(usuarioId))
      setExito('Instructor asignado a la ficha.')
      setError('')
      setElegido({ ...elegido, [ficha.id]: '' })
      await recargar()
    } catch (err) {
      setError(mensajeError(err))
    } finally {
      setAsignandoId(null)
    }
  }

  const quitar = async (ficha, instructor) => {
    const ok = await confirmar({
      titulo: 'Quitar instructor',
      mensaje: `¿Estás seguro de quitar a ${instructor.name} de la ficha "${ficha.codigo}"?`,
      textoConfirmar: 'Quitar',
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return

    try {
      await quitarInstructor(ficha.id, instructor.id)
      setExito('Instructor quitado de la ficha.')
      setError('')
      await recargar()
    } catch (err) {
      setError(mensajeError(err))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-sena-texto">Fichas</h1>
          <p className="text-sm text-slate-500 dark:text-sena-texto-suave">
            La ficha que registras queda a tu nombre: tú la gestionas.
          </p>
        </div>

        {editandoId !== NUEVA && (
          <Boton onClick={empezarAlta}>Nueva ficha</Boton>
        )}
      </div>

      {error && <MensajeError>{error}</MensajeError>}
      {exito && <MensajeExito>{exito}</MensajeExito>}

      <Tarjeta className="overflow-x-auto">
        <table className={`${CLASE_TABLA} min-w-200`}>
          <thead className={CLASE_THEAD}>
            <tr>
              <th className={CLASE_TH}>Ficha</th>
              <th className={CLASE_TH}>Estado</th>
              <th className={CLASE_TH}>Dueño</th>
              <th className={CLASE_TH}>Instructores</th>
              <th className={CLASE_TH}>Convocatorias</th>
              <th className={CLASE_TH}>Personas</th>
              <th className={`${CLASE_TH} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className={CLASE_TBODY}>
            {cargando && (
              <tr>
                <td colSpan="7">
                  <Cargando>Cargando fichas...</Cargando>
                </td>
              </tr>
            )}

            {!cargando && editandoId === NUEVA && (
              <tr className="bg-sena-cielo/30 dark:bg-sena-superficie-alta/30">
                <td colSpan="7" className={CLASE_TD}>
                  <form onSubmit={guardar} className="flex flex-wrap items-end gap-3">
                    <Campo etiqueta="Código" requerido error={errores.codigo}>
                      <input
                        type="text"
                        value={form.codigo}
                        onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                        className={CLASE_INPUT}
                        placeholder="3173334"
                      />
                    </Campo>

                    <Campo etiqueta="Programa" requerido error={errores.nombre_programa}>
                      <input
                        type="text"
                        value={form.nombre_programa}
                        onChange={(e) => setForm({ ...form, nombre_programa: e.target.value })}
                        className={CLASE_INPUT}
                        placeholder="Análisis y Desarrollo de Software"
                      />
                    </Campo>

                    <Campo etiqueta="Estado" error={errores.estado}>
                      <select
                        value={form.estado}
                        onChange={(e) => setForm({ ...form, estado: e.target.value })}
                        className={CLASE_INPUT}
                      >
                        {ESTADOS.map((estado) => (
                          <option key={estado.valor} value={estado.valor}>
                            {estado.etiqueta}
                          </option>
                        ))}
                      </select>
                    </Campo>

                    <div className="ml-auto flex gap-2">
                      <Boton variante="secundario" onClick={cancelar}>
                        Cancelar
                      </Boton>
                      <Boton type="submit" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Crear ficha'}
                      </Boton>
                    </div>
                  </form>
                </td>
              </tr>
            )}

            {!cargando && fichas.length === 0 && editandoId !== NUEVA && (
              <tr>
                <td colSpan="7">
                  <EstadoVacio>No hay fichas registradas.</EstadoVacio>
                </td>
              </tr>
            )}

            {!cargando &&
              fichas.map((ficha) =>
                editandoId === ficha.id ? (
                  <tr key={ficha.id} className="bg-sena-cielo/30 dark:bg-sena-superficie-alta/30">
                    <td colSpan="7" className={CLASE_TD}>
                      <form onSubmit={guardar} className="flex flex-wrap items-end gap-3">
                        <Campo etiqueta="Código" requerido error={errores.codigo}>
                          <input
                            type="text"
                            value={form.codigo}
                            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                            className={CLASE_INPUT}
                          />
                        </Campo>

                        <Campo etiqueta="Programa" requerido error={errores.nombre_programa}>
                          <input
                            type="text"
                            value={form.nombre_programa}
                            onChange={(e) => setForm({ ...form, nombre_programa: e.target.value })}
                            className={CLASE_INPUT}
                          />
                        </Campo>

                        <Campo etiqueta="Estado" error={errores.estado}>
                          <select
                            value={form.estado}
                            onChange={(e) => setForm({ ...form, estado: e.target.value })}
                            className={CLASE_INPUT}
                          >
                            {ESTADOS.map((estado) => (
                              <option key={estado.valor} value={estado.valor}>
                                {estado.etiqueta}
                              </option>
                            ))}
                          </select>
                        </Campo>

                        <div className="ml-auto flex gap-2">
                          <Boton variante="secundario" onClick={cancelar}>
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
                  <tr key={ficha.id} className={CLASE_FILA}>
                    <td className={CLASE_TD}>
                      <div className="font-semibold text-slate-800 dark:text-sena-texto">
                        {ficha.codigo}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-sena-texto-suave">
                        {ficha.nombre_programa}
                      </div>
                    </td>

                    <td className={CLASE_TD}>
                      <Etiqueta tono={ficha.estado === 'activa' ? 'exito' : 'neutral'}>
                        {ficha.estado === 'activa' ? 'Activa' : 'Cerrada'}
                      </Etiqueta>
                    </td>

                    <td className={`${CLASE_TD} text-slate-700 dark:text-sena-texto`}>
                      {ficha.creado_por ? ficha.creado_por.name : '—'}
                    </td>

                    <td className={CLASE_TD}>
                      <div className="flex flex-wrap items-center gap-1">
                        {ficha.instructores.length === 0 && (
                          <span className="text-xs text-slate-500 dark:text-sena-texto-suave">
                            Sin instructores
                          </span>
                        )}

                        {ficha.instructores.map((instructor) => (
                          <span
                            key={instructor.id}
                            className="inline-flex items-center gap-1 rounded-full bg-sena-cielo/40 px-2 py-0.5 text-xs font-medium text-sena-azul dark:bg-sena-superficie-alta dark:text-sena-texto"
                          >
                            {instructor.name}
                            {esSuperAdmin && (
                              <button
                                type="button"
                                onClick={() => quitar(ficha, instructor)}
                                className="font-bold text-peligro"
                                title="Quitar de la ficha"
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>

                      {esSuperAdmin && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <select
                            value={elegido[ficha.id] ?? ''}
                            onChange={(e) => setElegido({ ...elegido, [ficha.id]: e.target.value })}
                            className={CLASE_INPUT}
                          >
                            <option value="">— Instructor —</option>
                            {instructores
                              .filter((i) => !ficha.instructores.some((asignado) => asignado.id === i.id))
                              .map((instructor) => (
                                <option key={instructor.id} value={instructor.id}>
                                  {instructor.name}
                                </option>
                              ))}
                          </select>
                          <Boton
                            variante="secundario"
                            tamano="sm"
                            onClick={() => asignar(ficha)}
                            disabled={asignandoId === ficha.id || !elegido[ficha.id]}
                          >
                            Asignar
                          </Boton>
                        </div>
                      )}
                    </td>

                    <td className={`${CLASE_TD} text-slate-700 dark:text-sena-texto`}>
                      {ficha.convocatorias_count}
                    </td>

                    <td className={`${CLASE_TD} text-slate-700 dark:text-sena-texto`}>
                      {ficha.usuarios_count}
                    </td>

                    <td className={`${CLASE_TD} text-right`}>
                      <div className="flex justify-end gap-2">
                        {ficha.puede_gestionar && (
                          <>
                            <Boton variante="secundario" tamano="sm" onClick={() => empezarEdicion(ficha)}>
                              Editar
                            </Boton>
                            <Boton variante="peligro" tamano="sm" onClick={() => eliminar(ficha)}>
                              Eliminar
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
    </div>
  )
}
