import { useEffect, useRef, useState } from 'react'
import { asignarInstructor, quitarInstructor } from '../../api/fichas'
import { mensajeError } from '../../api/mensajeError'
import { listaUsuarios } from '../../api/usuarios'
import useAvisoTransitorio from '../../hooks/useAvisoTransitorio'
import { useConfirmacion } from '../../hooks/useConfirmacion'

// El backend pagina los usuarios: se piden todas las páginas de instructores (no solo la primera), porque el super admin puede
// asignar a cualquiera. Si una página falla, se avisa y se puede reintentar: no se muestra una lista incompleta como si fuera completa.
async function traerInstructores() {
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

// Lógica del diálogo de instructores de una ficha. Solo el super admin carga la lista de candidatos y puede asignar o quitar;
// el backend vuelve a comprobarlo (403 para cualquier otro), esto solo evita ofrecer lo que no corresponde.
export function useInstructoresFicha({ ficha, puedeGestionar, onActualizada }) {
  const confirmar = useConfirmacion()
  const [candidatos, setCandidatos] = useState([])
  const [cargando, setCargando] = useState(puedeGestionar)
  const [errorCarga, setErrorCarga] = useState('')
  const [elegido, setElegido] = useState('')
  const [asignando, setAsignando] = useState(false)
  const [quitandoId, setQuitandoId] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')
  // Éxito: aviso breve que se retira solo. El error se queda hasta la siguiente acción.
  const [exito, setExito] = useState(null) // { texto }
  const pausaExito = useAvisoTransitorio(exito, () => setExito(null))
  const enVuelo = useRef(false)
  // Al asignar o quitar, el botón pulsado se deshabilita o desaparece: el foco pasa al resumen de la lista.
  const refResumen = useRef(null)

  const cargar = () =>
    traerInstructores()
      .then((lista) => {
        setCandidatos(lista)
        setErrorCarga('')
      })
      .catch((err) => setErrorCarga(mensajeError(err)))
      .finally(() => setCargando(false))

  useEffect(() => {
    if (puedeGestionar) cargar()
  }, [puedeGestionar])

  const reintentar = () => {
    setCargando(true)
    setErrorCarga('')
    cargar()
  }

  const asignados = new Set(ficha.instructores.map((i) => i.id))
  const disponibles = candidatos.filter((c) => !asignados.has(c.id))

  const asignar = async () => {
    if (!elegido || enVuelo.current) return
    enVuelo.current = true
    setAsignando(true)
    setErrorAccion('')
    setExito(null)
    try {
      const res = await asignarInstructor(ficha.id, Number(elegido))
      onActualizada(res.data)
      setElegido('')
      setExito({ texto: 'Instructor asignado a la ficha.' })
      refResumen.current?.focus()
    } catch (err) {
      setErrorAccion(mensajeError(err))
      refResumen.current?.focus()
    } finally {
      setAsignando(false)
      enVuelo.current = false
    }
  }

  const quitar = async (instructor) => {
    if (enVuelo.current) return
    const ok = await confirmar({
      titulo: 'Quitar instructor',
      mensaje: `¿Estás seguro de quitar a ${instructor.name} de la ficha "${ficha.codigo}"?`,
      textoConfirmar: 'Quitar',
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok || enVuelo.current) return
    enVuelo.current = true
    setQuitandoId(instructor.id)
    setErrorAccion('')
    setExito(null)
    try {
      const res = await quitarInstructor(ficha.id, instructor.id)
      onActualizada(res.data)
      setExito({ texto: 'Instructor quitado de la ficha.' })
      refResumen.current?.focus()
    } catch (err) {
      // Incluye la regla «un instructor no puede quedarse sin ficha»: el mensaje del backend se muestra tal cual.
      setErrorAccion(mensajeError(err))
      refResumen.current?.focus()
    } finally {
      setQuitandoId(null)
      enVuelo.current = false
    }
  }

  const ocupado = asignando || quitandoId !== null

  return { exito, pausaExito, refResumen, asignar, asignando, cargando, disponibles, elegido, errorAccion, errorCarga, ocupado, quitandoId, quitar, reintentar, setElegido }
}
