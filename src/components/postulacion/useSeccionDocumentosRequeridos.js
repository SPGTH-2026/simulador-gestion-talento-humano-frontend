import { useRef, useState } from 'react'
import { validarArchivoPostulacion } from '../../lib/archivosPostulacion'
import { subirDocumento, eliminarDocumento } from '../../api/postulacionesDocumentos'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { reglasCorreccionDocumento } from '../../lib/reglasCorreccionDocumentos'

// Lógica de SeccionDocumentosRequeridos: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function useSeccionDocumentosRequeridos({ vista,
  editable,
  sexo,
  asegurar,
  onRecargar,
  onError,
  correccion = null,
  soloCorreccion = false,
  // Hay una corrección vigente: el backend solo deja reemplazar los documentos marcados y no permite eliminar.
  bloqueoCorreccion = false, }) {
  const documentos = vista.documentos ?? []
  const sexoMujer = sexo?.codigo === 'mujer'
  const sinSexo = !sexo?.codigo
  // Documentos que el evaluador marcó con "Corregir" (correccion.marcados).
  const hayMarcados = documentos.some((d) => correccion?.marcados?.has(d.parametro.id))
  // Reglas por documento según la corrección vigente (mismas que aplica el servidor).
  const reglasDe = (parametroId) =>
    reglasCorreccionDocumento({ bloqueoCorreccion, marcado: Boolean(correccion?.marcados?.has(parametroId)) })

  // códigos de los documentos con una petición EN VUELO. Un Set permite que
  // varias filas trabajen a la vez sin pisarse (una operación por documento).
  const [enVuelo, setEnVuelo] = useState(() => new Set())
  // progreso[clave] = porcentaje (0-100) de la subida en curso de ese documento.
  const [progreso, setProgreso] = useState({})
  // archivosSubidos[clave] = documento recién subido, para mostrarlo de inmediato
  // sin esperar a que onRecargar() vuelva a traer todo el estado.
  const [archivosSubidos, setArchivosSubidos] = useState({})
  // errores[clave] = mensaje de validación o del backend.
  // 'clave' es el código del documento o, si es nuevo y no tiene, su id.
  const [errores, setErrores] = useState({})
  const refsInput = useRef({})

  // Cuando la vista se actualiza (onRecargar terminó), limpiamos los archivos locales: el estado del servidor ya los
  // incluye. Se reinicia durante el render (patrón de React), no en un efecto.
  const [vistaPrevia, setVistaPrevia] = useState(vista)
  if (vista !== vistaPrevia) {
    setVistaPrevia(vista)
    if (vista?.documentos) setArchivosSubidos({})
  }

  const marcarEnVuelo = (codigo, activo) =>
    setEnVuelo((prev) => {
      const siguiente = new Set(prev)
      if (activo) siguiente.add(codigo)
      else siguiente.delete(codigo)
      return siguiente
    })

  const limpiarError = (codigo) =>
    setErrores((prev) => {
      const siguiente = { ...prev }
      delete siguiente[codigo]
      return siguiente
    })

  // La postulación ya existe (la fila tiene archivo o la vista trae su id);
  // si no, el borrador se crea de forma silenciosa justo antes de guardar.
  const pidSeguro = async () => vista.postulacion?.id ?? (await asegurar()).postulacionId

  const elegirArchivo = async (clave, parametro, archivo) => {
    const regla = reglasDe(parametro.id)
    if (regla.bloqueadoReemplazo) {
      setErrores((prev) => ({ ...prev, [clave]: regla.motivoReemplazo }))
      return
    }
    const validacion = validarArchivoPostulacion(archivo)
    if (!validacion.ok) {
      setErrores((prev) => ({ ...prev, [clave]: validacion.mensaje }))
      return
    }

    marcarEnVuelo(clave, true)
    setProgreso((prev) => ({ ...prev, [clave]: 0 }))
    limpiarError(clave)
    try {
      const { postulacionId } = await asegurar()
      const resultado = await subirDocumento(postulacionId, parametro, archivo, (porcentaje) =>
        setProgreso((prev) => ({ ...prev, [clave]: porcentaje })),
      )
      // Mostrar el archivo de inmediato, sin esperar a onRecargar().
      setArchivosSubidos((prev) => ({ ...prev, [clave]: resultado }))
      // Se espera la relectura del estado: el indicador sigue hasta que la pantalla (y el botón de enviar) reflejan
      // el documento, en vez de soltarse antes y dejar un intervalo con datos viejos.
      await onRecargar()
    } catch (e) {
      // 422 por archivo, tipo de documento o libreta militar: se pinta en la fila.
      const deCampo = erroresDeCampo(e)
      const mensaje = deCampo.codigo || deCampo.parametro_id || deCampo.archivo || mensajeError(e)
      setErrores((prev) => ({ ...prev, [clave]: mensaje }))
    } finally {
      marcarEnVuelo(clave, false)
      // El avance solo existe mientras se sube: así eliminar después no muestra una barra vieja.
      setProgreso((prev) => {
        const siguiente = { ...prev }
        delete siguiente[clave]
        return siguiente
      })
    }
  }

  const confirmar = useConfirmacion()

  const eliminar = async (documento, codigo, parametroId) => {
    const regla = reglasDe(parametroId)
    if (regla.eliminarBloqueado) {
      onError(regla.motivoEliminar)
      return
    }
    const nombre = documento?.archivo?.nombre_original ?? documento?.nombre_original
    const ok = await confirmar({
      titulo: 'Eliminar documento',
      mensaje: nombre
        ? `¿Estás seguro de eliminar "${nombre}"? Podrás volver a cargarlo.`
        : '¿Estás seguro de eliminar este documento? Podrás volver a cargarlo.',
      textoConfirmar: 'Eliminar',
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return

    marcarEnVuelo(codigo, true)
    limpiarError(codigo)
    try {
      await eliminarDocumento(await pidSeguro(), documento.id)
      await onRecargar()
    } catch (e) {
      onError(mensajeError(e))
    } finally {
      marcarEnVuelo(codigo, false)
    }
  }

  // "Ver": el PDF lo abre PanelDocumentosPostulacion (evento document:view).
  const ver = (documento, titulo) =>
    window.dispatchEvent(new CustomEvent('document:view', {
      detail: { documentoId: documento.id, nombre: documento.nombre_original, titulo },
    }))

    return {
      archivosSubidos,
      asegurar,
      confirmar,
      correccion,
      documentos,
      editable,
      elegirArchivo,
      eliminar,
      enVuelo,
      errores,
      hayMarcados,
      limpiarError,
      marcarEnVuelo,
      onError,
      onRecargar,
      pidSeguro,
      progreso,
      refsInput,
      reglasDe,
      setArchivosSubidos,
      setEnVuelo,
      setErrores,
      setProgreso,
      setVistaPrevia,
      sexo,
      sexoMujer,
      sinSexo,
      soloCorreccion,
      ver,
      vista,
      vistaPrevia,
    }
}
