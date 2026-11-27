import { useEffect, useState } from 'react'
import { guardarCalificacion, obtenerCalificaciones } from '../../api/seleccion'
import { mensajeError } from '../../api/mensajeError'
import Boton from '../ui/Boton'
import { MensajeError } from '../ui/Mensaje'
import EsqueletoCalificaciones from './EsqueletoCalificaciones'

export function razonSinEscritura(datos, puedeDecidir) {
  if (!puedeDecidir) return 'Tu rol puede consultar las calificaciones, pero no registrarlas.'
  if (!datos.configuracion.configurada) return null // se explica aparte: pendiente de configurar
  if (datos.resultado_adicional.estado === 'sin_actividades') return null // se explica aparte
  if (datos.estado_convocatoria !== 'en_proceso') {
    return 'Solo se pueden registrar calificaciones con la convocatoria en proceso.'
  }
  if (datos.estado_documental !== 'habilitado') {
    return 'El candidato ya no está habilitado documentalmente: sus notas se conservan, pero no se pueden registrar ni corregir hasta que lo esté.'
  }
  return null
}

// Lógica de PanelCalificaciones: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function usePanelCalificaciones({ convocatoriaId, postulacionId, puedeDecidir, recarga, onCambio, soloLectura = false }) {
  const clave = `${convocatoriaId}|${postulacionId}|${recarga}`
  const [intento, setIntento] = useState(0)
  const clavePedida = `${clave}|${intento}`
  const [estado, setEstado] = useState({ datos: null, claveDatos: null, claveError: null, error: '' })
  const [editando, setEditando] = useState(null) // id de la actividad en edición

  useEffect(() => {
    let vigente = true
    obtenerCalificaciones(convocatoriaId, postulacionId)
      .then((res) => {
        if (vigente) setEstado({ datos: res.data, claveDatos: clavePedida, claveError: null, error: '' })
      })
      .catch((e) => {
        if (vigente) setEstado((previo) => ({ ...previo, claveError: clavePedida, error: mensajeError(e) }))
      })
    return () => {
      vigente = false
    }
  }, [convocatoriaId, postulacionId, clavePedida])

  const reintentar = () => setIntento((n) => n + 1)

  // Lanza si falla (el formulario conserva lo escrito y pinta los errores); si sale bien, usa lo que devolvió el servidor.
  const guardar = async (actividadId, cuerpo) => {
    const res = await guardarCalificacion(convocatoriaId, postulacionId, actividadId, cuerpo)
    setEstado({ datos: res.data, claveDatos: clavePedida, claveError: null, error: '' })
    setEditando(null)
    onCambio?.({ id: postulacionId, estado_documental: res.data.estado_documental })
  }

  const { datos, error } = estado
  const datosVigentes = estado.claveDatos === clavePedida
  const fallo = !datosVigentes && estado.claveError === clavePedida
  const actualizando = datos != null && !datosVigentes && !fallo

  const avisoReintento = (
    <div className="flex flex-col items-start gap-3">
      <MensajeError>{error}</MensajeError>
      <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
        Reintentar
      </Boton>
    </div>
  )

  if (datos == null && fallo) return avisoReintento
  if (datos == null) {
    return <EsqueletoCalificaciones />
  }

  const resultado = datos.resultado_adicional
  const sinConfigurar = !datos.configuracion.configurada
  const sinActividades = resultado.estado === 'sin_actividades'
  const razon = soloLectura ? null : razonSinEscritura(datos, puedeDecidir)
  const puedeEscribir = !soloLectura && puedeDecidir && datosVigentes && datos.calificable && !sinConfigurar && !sinActividades

    return {
      actualizando,
      avisoReintento,
      clave,
      clavePedida,
      convocatoriaId,
      datos,
      datosVigentes,
      editando,
      error,
      estado,
      fallo,
      guardar,
      intento,
      onCambio,
      postulacionId,
      puedeDecidir,
      puedeEscribir,
      razon,
      recarga,
      reintentar,
      resultado,
      setEditando,
      setEstado,
      setIntento,
      sinActividades,
      sinConfigurar,
      soloLectura,
    }
}
