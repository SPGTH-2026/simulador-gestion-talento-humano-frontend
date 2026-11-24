import { useEffect, useId, useRef, useState } from 'react'
import { designarReferencia, obtenerReferencia } from '../../api/seleccion'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import Boton from '../ui/Boton'
import { MensajeError } from '../ui/Mensaje'
import { EsqueletoDetalle } from '../ui/Esqueleto'
import { estadoDocumental, traducirError, traducirErrores } from '../../lib/seleccion'

// Lógica de PanelReferencia: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function usePanelReferencia({ convocatoriaId, postulacionId, activo, onCambio }) {
  const idGrupo = useId()
  const [abierta, setAbierta] = useState(false)
  if (activo && !abierta) setAbierta(true)

  const [estado, setEstado] = useState({ fase: 'cargando', datos: null, error: '' })
  const [intento, setIntento] = useState(0)
  const [elegida, setElegida] = useState(null)
  const [justificacion, setJustificacion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardada, setGuardada] = useState(false)
  const montado = useRef(false)

  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  useEffect(() => {
    if (!abierta) return undefined
    let vigente = true
    obtenerReferencia(convocatoriaId, postulacionId)
      .then((res) => {
        if (vigente) setEstado({ fase: 'listo', datos: res.data, error: '' })
      })
      .catch((e) => {
        if (vigente) setEstado((previo) => ({ ...previo, fase: 'error', error: mensajeError(e) }))
      })
    return () => {
      vigente = false
    }
  }, [abierta, convocatoriaId, postulacionId, intento])

  const reintentar = () => {
    setEstado((previo) => ({ ...previo, fase: 'cargando', error: '' }))
    setIntento((n) => n + 1)
  }

  if (!abierta) return null
  const { fase, datos, error } = estado

  if (fase === 'error' && !datos) {
    return (
      <div className="flex flex-col items-start gap-3">
        <MensajeError>{error}</MensajeError>
        <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
          Reintentar
        </Boton>
      </div>
    )
  }
  if (!datos) {
    return (
      <EsqueletoDetalle texto="Cargando evaluaciones…" bloques={2} />
    )
  }

  const { evaluaciones, referencia } = datos
  const doc = estadoDocumental(datos.estado_documental)
  // El servidor solo admite designar cuando hay varias evaluaciones elegibles o cuando la referencia dejó de ser vigente.
  const invalidada = referencia != null && !referencia.vigente
  const necesita = evaluaciones.length > 1 || invalidada
  const puedeGuardar = necesita && elegida != null && justificacion.trim().length > 0

  const editarJustificacion = (e) => {
    setJustificacion(e.target.value)
    setErrores((previo) => ({ ...previo, justificacion: undefined }))
    setErrorGeneral('')
    setGuardada(false)
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!puedeGuardar || guardando) return
    if (justificacion.trim().length < 10) {
      setErrores({ justificacion: 'La justificación debe tener al menos 10 caracteres.' })
      return
    }
    setGuardando(true)
    setErrores({})
    setErrorGeneral('')
    setGuardada(false)
    try {
      const res = await designarReferencia(convocatoriaId, postulacionId, {
        evaluacion_id: elegida,
        justificacion: justificacion.trim(),
      })
      if (!montado.current) return
      setEstado({ fase: 'listo', datos: res.data, error: '' })
      setElegida(null)
      setJustificacion('')
      setGuardada(true)
      // La fila y el detalle toman lo que devolvió el servidor, no un cálculo local.
      onCambio?.({
        id: postulacionId,
        estado_documental: res.data.estado_documental,
        cumplimiento: res.data.cumplimiento,
        referenciaCambio: true,
      })
    } catch (err) {
      if (!montado.current) return
      const porCampo = erroresDeCampo(err)
      const conocidos = ['justificacion', 'evaluacion_id']
      setErrores(traducirErrores(Object.fromEntries(Object.entries(porCampo).filter(([k]) => conocidos.includes(k)))))
      const sueltos = Object.entries(porCampo).filter(([k]) => !conocidos.includes(k))
      setErrorGeneral(sueltos.length > 0 ? traducirError(sueltos[0][1]) : Object.keys(porCampo).length === 0 ? mensajeError(err) : '')
    } finally {
      if (montado.current) setGuardando(false)
    }
  }

    return {
      abierta,
      activo,
      convocatoriaId,
      datos,
      doc,
      editarJustificacion,
      elegida,
      error,
      errorGeneral,
      errores,
      estado,
      evaluaciones,
      fase,
      guardada,
      guardando,
      guardar,
      idGrupo,
      intento,
      invalidada,
      justificacion,
      montado,
      necesita,
      onCambio,
      postulacionId,
      puedeGuardar,
      referencia,
      reintentar,
      setAbierta,
      setElegida,
      setErrorGeneral,
      setErrores,
      setEstado,
      setGuardada,
      setGuardando,
      setIntento,
      setJustificacion,
    }
}
