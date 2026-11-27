import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { eliminarFicha, listaFichas } from '../../api/fichas'
import { mensajeError } from '../../api/mensajeError'
import useAvisoTransitorio from '../../hooks/useAvisoTransitorio'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { ordenarPorCodigo } from './constantesFichas'

// Lógica de la pantalla de fichas: carga, los diálogos (crear, editar, instructores) y eliminar. Es solo presentación: las
// operaciones y los permisos son los de siempre (GET /api/fichas devuelve todas las fichas del alcance, sin paginar).
export function useFichasListado() {
  const { user } = useAuth()
  const confirmar = useConfirmacion()
  // Solo el super admin reparte los grupos; el backend lo vuelve a exigir.
  const esSuperAdmin = user?.role === 'super_admin'

  const [fichas, setFichas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')
  // Éxito: aviso breve que se retira solo (patrón de la app). Error: se queda hasta la siguiente acción.
  const [exito, setExito] = useState(null) // { texto }
  const [errorAccion, setErrorAccion] = useState('')
  const pausaExito = useAvisoTransitorio(exito, () => setExito(null))
  // null | { tipo: 'ficha', ficha: objeto | null (alta) } | { tipo: 'instructores', fichaId }
  const [dialogo, setDialogo] = useState(null)
  const [eliminandoId, setEliminandoId] = useState(null)
  const enVuelo = useRef(false)

  const traer = () =>
    listaFichas()
      .then((res) => {
        setFichas(res.data)
        setErrorCarga('')
      })
      .catch((err) => setErrorCarga(mensajeError(err)))
      .finally(() => setCargando(false))

  useEffect(() => {
    traer()
  }, [])

  // La respuesta del backend trae la ficha ya presentada (con sus instructores y cantidades): se refleja sin recargar todo.
  const aplicarFicha = (ficha) =>
    setFichas((actuales) => ordenarPorCodigo(actuales.some((f) => f.id === ficha.id) ? actuales.map((f) => (f.id === ficha.id ? ficha : f)) : [...actuales, ficha]))

  const abrirAlta = () => setDialogo({ tipo: 'ficha', ficha: null })
  const abrirEdicion = (ficha) => setDialogo({ tipo: 'ficha', ficha })
  const abrirInstructores = (ficha) => setDialogo({ tipo: 'instructores', fichaId: ficha.id })
  const cerrarDialogo = () => setDialogo(null)

  const alGuardar = (ficha, editando) => {
    aplicarFicha(ficha)
    setDialogo(null)
    setErrorAccion('')
    setExito({ texto: editando ? 'Ficha actualizada correctamente.' : 'Ficha creada correctamente. Ya eres su dueño.' })
  }

  // Devuelve true si la ficha se eliminó (la pantalla usa eso para devolver el foco: el botón desaparece con la tarjeta).
  const eliminar = async (ficha) => {
    if (enVuelo.current) return false
    const ok = await confirmar({
      titulo: 'Eliminar ficha',
      mensaje: `¿Estás seguro de eliminar la ficha "${ficha.codigo}"?`,
      textoConfirmar: 'Eliminar',
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok || enVuelo.current) return false
    enVuelo.current = true
    setEliminandoId(ficha.id)
    setExito(null)
    setErrorAccion('')
    try {
      await eliminarFicha(ficha.id)
      setFichas((actuales) => actuales.filter((f) => f.id !== ficha.id))
      setExito({ texto: 'Ficha eliminada correctamente.' })
      return true
    } catch (err) {
      // Por ejemplo, 422 si tiene convocatorias o personas: el mensaje del backend se muestra tal cual.
      setErrorAccion(mensajeError(err))
      return false
    } finally {
      setEliminandoId(null)
      enVuelo.current = false
    }
  }

  const fichaDelDialogo = dialogo?.tipo === 'instructores' ? fichas.find((f) => f.id === dialogo.fichaId) : null

  return {
    abrirAlta, abrirEdicion, abrirInstructores, alGuardar, aplicarFicha, cargando, cerrarDialogo, dialogo, eliminandoId, eliminar, errorCarga, esSuperAdmin,
    errorAccion, exito, fichaDelDialogo, fichas, pausaExito,
  }
}
