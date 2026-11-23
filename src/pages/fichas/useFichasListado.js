import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { listaFichas, crearFicha, actualizarFicha, eliminarFicha, asignarInstructor, quitarInstructor } from '../../api/fichas'
import { listaUsuarios } from '../../api/usuarios'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'
import { useConfirmacion } from '../../hooks/useConfirmacion'

export const FORM_VACIO = { codigo: '', nombre_programa: '', estado: 'activa' }

export const NUEVA = 'nueva'

// Lógica de FichasListado: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function useFichasListado() {
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

    // El backend pagina: se piden todas las páginas de instructores (no solo la primera de 20), porque el super admin
    // puede asignar cualquiera de ellos. Si una página falla, el resto de la pantalla sigue funcionando.
    let vigente = true
    const cargarTodos = async () => {
      const acumulados = []
      let pagina = 1
      let ultima = 1
      do {
        const res = await listaUsuarios({ role: 'instructor', per_page: 100, page: pagina })
        acumulados.push(...(res.data ?? []))
        ultima = res.meta?.last_page ?? 1
        pagina += 1
      } while (pagina <= ultima)
      return acumulados
    }
    cargarTodos()
      .then((lista) => {
        if (vigente) setInstructores(lista)
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
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

    return {
      asignandoId,
      asignar,
      cancelar,
      cargando,
      confirmar,
      editandoId,
      elegido,
      eliminar,
      empezarAlta,
      empezarEdicion,
      error,
      errores,
      esSuperAdmin,
      exito,
      fichas,
      form,
      guardando,
      guardar,
      instructores,
      quitar,
      recargar,
      setAsignandoId,
      setCargando,
      setEditandoId,
      setElegido,
      setError,
      setErrores,
      setExito,
      setFichas,
      setForm,
      setGuardando,
      setInstructores,
      user,
    }
}
