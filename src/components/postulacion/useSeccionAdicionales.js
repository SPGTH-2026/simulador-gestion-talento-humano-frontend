import { useRef, useState } from 'react'
import { validarArchivoPostulacion } from '../../lib/archivosPostulacion'
import { MAX_DOCUMENTOS_ADICIONALES, MAX_TITULO_ADICIONAL, MAX_NOTA_ADICIONAL } from '../../lib/postulacionDocumentos'
import { subirAdicional, eliminarDocumento } from '../../api/postulacionesDocumentos'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import useAvisoTransitorio from '../../hooks/useAvisoTransitorio'

// Lógica de SeccionAdicionales: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function useSeccionAdicionales({ vista,
  editable,
  asegurar,
  onRecargar,
  onError,
  // Corrección vigente: el backend no admite agregar ni eliminar adicionales mientras dura.
  bloqueoCorreccion = false, }) {
  const adicionales = vista.adicionales ?? []
  // Adicionales recién subidos, para mostrarlos de inmediato sin esperar a onRecargar().
  const [adicionalesLocales, setAdicionalesLocales] = useState([])
  const adicionalesMostrar = [...adicionales, ...adicionalesLocales]

  const [titulo, setTitulo] = useState('')
  const [nota, setNota] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  // Porcentaje (0-100) de la subida del adicional que se está enviando.
  const [progresoEnvio, setProgresoEnvio] = useState(0)
  // ids de los adicionales con una petición en vuelo (una por fila).
  const [enVueloIds, setEnVueloIds] = useState(() => new Set())
  const refArchivo = useRef(null)
  // Confirmación breve tras agregar un adicional: se retira sola (un objeto nuevo reinicia el plazo).
  const [agregado, setAgregado] = useState(null)
  const pausaAgregado = useAvisoTransitorio(agregado, () => setAgregado(null))

  // Cuando la vista se actualiza (onRecargar terminó), limpiamos los locales.
  // Se reinicia durante el render (patrón de React para ajustar estado al cambiar una prop), no en un efecto.
  const [vistaPrevia, setVistaPrevia] = useState(vista)
  if (vista !== vistaPrevia) {
    setVistaPrevia(vista)
    setAdicionalesLocales([])
  }

  const tope = adicionalesMostrar.length >= MAX_DOCUMENTOS_ADICIONALES
  const puedeAgregar = editable && !tope && !bloqueoCorreccion

  const pidSeguro = async () => vista.postulacion?.id ?? (await asegurar()).postulacionId

  const marcarEnVuelo = (id, activo) =>
    setEnVueloIds((prev) => {
      const siguiente = new Set(prev)
      if (activo) siguiente.add(id)
      else siguiente.delete(id)
      return siguiente
    })

  const limpiar = () => {
    setTitulo('')
    setNota('')
    setArchivo(null)
    setErrores({})
    if (refArchivo.current) refArchivo.current.value = ''
  }

  const elegirArchivo = (elegido) => {
    const validacion = validarArchivoPostulacion(elegido)
    if (!validacion.ok) {
      setArchivo(null)
      setErrores((prev) => ({ ...prev, archivo: validacion.mensaje }))
      return
    }
    setArchivo(elegido)
    setErrores((prev) => {
      const siguiente = { ...prev }
      delete siguiente.archivo
      return siguiente
    })
  }

  const enviar = async (evento) => {
    evento.preventDefault()

    const nuevos = {}
    if (!titulo.trim()) nuevos.titulo = 'El título es obligatorio.'
    else if (titulo.trim().length > MAX_TITULO_ADICIONAL)
      nuevos.titulo = `El título no puede superar ${MAX_TITULO_ADICIONAL} caracteres.`
    if (nota.length > MAX_NOTA_ADICIONAL)
      nuevos.nota = `La nota no puede superar ${MAX_NOTA_ADICIONAL} caracteres.`
    if (!archivo) nuevos.archivo = 'Selecciona un archivo PDF.'

    if (Object.keys(nuevos).length > 0) {
      setErrores(nuevos)
      return
    }

    setEnviando(true)
    setProgresoEnvio(0)
    setAgregado(null)
    setErrores({})
    try {
      const { postulacionId } = await asegurar()
      const resultado = await subirAdicional(postulacionId, {
        titulo: titulo.trim(),
        nota: nota.trim(),
        archivo,
        alProgresar: setProgresoEnvio,
      })
      // Mostrar el nuevo adicional de inmediato, sin esperar a onRecargar().
      setAdicionalesLocales((prev) => [...prev, resultado])
      setAgregado({ titulo: titulo.trim() })
      limpiar()
      onRecargar() // sincroniza en segundo plano
    } catch (e) {
      const deCampo = erroresDeCampo(e)
      if (Object.keys(deCampo).length > 0) setErrores(deCampo)
      else onError(mensajeError(e))
    } finally {
      setEnviando(false)
    }
  }

  const confirmar = useConfirmacion()

  const eliminar = async (adicional) => {
    const ok = await confirmar({
      titulo: 'Eliminar documento adicional',
      mensaje: `¿Estás seguro de eliminar "${adicional.titulo}"?`,
      textoConfirmar: 'Eliminar',
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return
    marcarEnVuelo(adicional.id, true)
    try {
      await eliminarDocumento(await pidSeguro(), adicional.id)
      onRecargar()
    } catch (e) {
      onError(mensajeError(e))
    } finally {
      marcarEnVuelo(adicional.id, false)
    }
  }

  // "Ver": el PDF lo abre PanelDocumentosPostulacion (evento document:view).
  const ver = (adicional) =>
    window.dispatchEvent(new CustomEvent('document:view', {
      detail: { documentoId: adicional.archivo.id, nombre: adicional.archivo.nombre_original },
    }))

    return {
      adicionales,
      adicionalesLocales,
      adicionalesMostrar,
      agregado,
      archivo,
      asegurar,
      confirmar,
      editable,
      elegirArchivo,
      eliminar,
      enVueloIds,
      enviando,
      enviar,
      errores,
      limpiar,
      marcarEnVuelo,
      nota,
      onError,
      onRecargar,
      pausaAgregado,
      pidSeguro,
      progresoEnvio,
      puedeAgregar,
      refArchivo,
      setAdicionalesLocales,
      setAgregado,
      setArchivo,
      setEnVueloIds,
      setEnviando,
      setErrores,
      setNota,
      setProgresoEnvio,
      setTitulo,
      setVistaPrevia,
      titulo,
      tope,
      ver,
      vista,
      vistaPrevia,
    }
}
