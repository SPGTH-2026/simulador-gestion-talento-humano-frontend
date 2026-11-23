import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { listaUsuarios, asignarRol } from '../../api/usuarios'
import { listaFichas } from '../../api/fichas'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { ROLES } from './constantesUsuarios'

// Lógica de Usuarios: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function useUsuarios() {
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

    return {
      actualizarFila,
      alternarActivo,
      busqueda,
      cargando,
      confirmar,
      editandoId,
      empezarEdicion,
      error,
      errorFichas,
      errorLista,
      errores,
      esInstructor,
      exito,
      fichas,
      filtroFicha,
      filtroRol,
      form,
      guardando,
      guardar,
      hayFiltros,
      intento,
      limpiarFiltros,
      meta,
      pagina,
      rolesPermitidos,
      setBusqueda,
      setCargando,
      setEditandoId,
      setError,
      setErrorFichas,
      setErrorLista,
      setErrores,
      setExito,
      setFichas,
      setFiltroFicha,
      setFiltroRol,
      setForm,
      setGuardando,
      setIntento,
      setMeta,
      setPagina,
      setTermino,
      setUsuarios,
      termino,
      user,
      usuarios,
    }
}
