import { useVistaDocumentos } from './useVistaDocumentos'
import { isValidElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { postularse, cambiarEstadoPostulacion } from '../../api/postulaciones'
import { useLecturaEstado } from './useLecturaEstado'
import { obtenerPerfil, obtenerCorreccion, enviarCorreccion, abrirArchivoEnPestana, mensajeErrorBlob } from '../../api/postulacionesDocumentos'
import { mensajeError } from '../../api/mensajeError'
import { useAuth } from '../../auth/useAuth'
import { estadoVentana } from '../../lib/ventanaPostulacion'
import { CODIGO_LIBRETA_MILITAR } from '../../lib/postulacionDocumentos'

// Lógica de PanelDocumentosPostulacion: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function usePanelDocumentosPostulacion({ postulacionId = null,
  convocatoria = null,
  documentosConvocatoria = null,
  skillsConvocatoriaNombres = null,
  miPostulacion = null,
  onEstadoChange,
  onPostulacionCreada,
  onEnviado,
  onVerDocumentos,
  modoCorreccion = false,
  onCorreccionEnviada, }) {
  const { user } = useAuth()
  const idInicial = postulacionId ?? miPostulacion?.id ?? null

  const [idPostulacion, setIdPostulacion] = useState(idInicial)
  const [estado, setEstado] = useState(null)
  const [error, setError] = useState('')
  const [perfil, setPerfil] = useState(null)
  const [reactivando, setReactivando] = useState(false)
  const [aviso, setAviso] = useState('')
  // Promesa de creación en vuelo: una sola creación de borrador a la vez.
  const creandoRef = useRef(null)
  // Corrección pedida por el evaluador (null si no hay ninguna pendiente).
  const [correccion, setCorreccion] = useState(null)
  const [enviandoCorreccion, setEnviandoCorreccion] = useState(false)

  useEffect(() => {
    let activo = true
    if (!idPostulacion || user?.role !== 'aspirante') return undefined
    obtenerCorreccion(idPostulacion)
      .then((c) => {
        if (activo) setCorreccion(c)
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [idPostulacion, user?.role])

  // Salen de la RONDA actual (la fija el servidor): los marcados al pedirla y los que ya cambiaron de archivo desde entonces.
  // Un archivo que ya existía antes de la solicitud no cuenta como corregido.
  const ronda = correccion?.correccion?.ronda_actual ?? null
  const marcados = useMemo(() => new Set((ronda?.documentos_marcados ?? []).map(Number)), [ronda])
  const reemplazados = useMemo(() => new Set((ronda?.documentos_reemplazados ?? []).map(Number)), [ronda])
  const infoCorreccion = correccion ? { marcados, reemplazados } : null
  // La vigencia la decide el servidor (estado de la ronda): pedida, sin responder, con plazo y postulación activos. La
  // pantalla no la recalcula, así coincide siempre con lo que el servidor va a aceptar.
  const correccionVigente = ronda?.estado === 'vigente'
  const corregidos = [...marcados].filter((id) => reemplazados.has(id)).length

  const enviarCorreccionAhora = async () => {
    setEnviandoCorreccion(true)
    setError('')
    try {
      await enviarCorreccion(idPostulacion)
      onCorreccionEnviada?.()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setEnviandoCorreccion(false)
    }
  }

  const aplicarEstado = useCallback(
    (data) => {
      setEstado(data)
      onEstadoChange?.(data)
    },
    [onEstadoChange],
  )

  const { leerEstado, registrarCreada, idVigente, yaLeido } = useLecturaEstado(aplicarEstado, idInicial)

  // Estado de la postulación (si existe). Se relee en cada id nuevo, salvo en un borrador recién creado: su estado ya se aplicó.
  useEffect(() => {
    if (!idPostulacion || yaLeido(idPostulacion)) return undefined

    let activo = true
    leerEstado(idPostulacion)
      .then(() => {
        if (activo) setError('')
      })
      .catch((e) => {
        if (activo) setError(mensajeError(e))
      })

    return () => {
      activo = false
    }
  }, [idPostulacion, leerEstado, yaLeido])

  // Perfil (sexo): es del usuario y funciona sin postulación.
  useEffect(() => {
    let activo = true
    obtenerPerfil()
      .then((data) => {
        if (activo) setPerfil(data)
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [])

  // Un solo escuchador para los botones "Ver" de TODAS las secciones (documentos
  // requeridos, adicionales y certificados de skills): el archivo se pide con la
  // sesión y se abre en una pestaña nueva desde el blob. Si falla (archivo
  // perdido, disco sin credenciales), el error se muestra aquí mismo.
  useEffect(() => {
    const abrirEnPestana = async (evento) => {
      const { documentoId, skillId, nombre } = evento.detail ?? {}
      if (!idPostulacion) return

      const ruta = documentoId
        ? `/postulaciones/${idPostulacion}/documentos/${documentoId}/archivo?inline=1`
        : skillId
          ? `/postulaciones/${idPostulacion}/skills/${skillId}/certificado/archivo?inline=1`
          : null

      if (!ruta) return

      setError('')

      try {
        await abrirArchivoEnPestana(ruta, { nombre })
      } catch (error) {
        const mensaje = await mensajeErrorBlob(error)
        setError(mensaje || mensajeError(error))
      }
    }

    window.addEventListener('document:view', abrirEnPestana)
    return () => window.removeEventListener('document:view', abrirEnPestana)
  }, [idPostulacion])
  const recargar = useCallback(() => {
    // El id sale del ref: tras crear el borrador, este «recargar» puede ser el del render anterior (sin id en su closure).
    const id = idVigente()
    if (!id) return Promise.resolve()
    // La corrección (qué documentos ya se reemplazaron) se relee JUNTO con el estado: así «N de M corregidos» y el botón de
    // enviar cambian a la vez que el documento, no unos segundos después.
    const correccionNueva =
      user?.role === 'aspirante'
        ? obtenerCorreccion(id)
            .then(setCorreccion)
            .catch(() => {})
        : Promise.resolve()
    return Promise.all([
      leerEstado(id)
        .then(() => setError(''))
        .catch((e) => setError(mensajeError(e))),
      correccionNueva,
    ])
  }, [idVigente, leerEstado, user?.role])

  // Borrador silencioso: garantiza una postulación y devuelve su id + el estado
  // fresco. Si ya existe (también si está retirada: editar no cambia el estado)
  // no hace nada. Una sola creación en vuelo: si falla, la acción que la pidió
  // muestra el error y NO sube nada.
  const asegurar = useCallback(() => {
    if (idPostulacion) {
      return Promise.resolve({ postulacionId: idPostulacion, estado })
    }
    if (creandoRef.current) return creandoRef.current

    const promesa = (async () => {
      const postulacion = await postularse(convocatoria?.id)
      onPostulacionCreada?.(postulacion)
      // Primero el estado y DESPUÉS el id. Si el id se pone antes, el panel
      // muestra "Cargando tus datos…" mientras llega el estado y desmonta la
      // sección de documentos en plena subida (se perdía el progreso y el archivo).
      const fresco = await leerEstado(postulacion.id).catch(() => null)
      registrarCreada(postulacion.id, Boolean(fresco))
      setIdPostulacion(postulacion.id)
      setError('')
      return { postulacionId: postulacion.id, estado: fresco }
    })().finally(() => {
      creandoRef.current = null
    })

    creandoRef.current = promesa
    return promesa
  }, [idPostulacion, estado, convocatoria, onPostulacionCreada, leerEstado, registrarCreada])

  // "Volver a postularme": PATCH estado 'postulada' (retirada -> postulada). El
  // backend valida ventana y obligatorios; si faltan, la postulación queda retirada.
  const volverAPostularme = async () => {
    if (reactivando) return
    setReactivando(true)
    setError('')
    setAviso('')
    try {
      await cambiarEstadoPostulacion(idPostulacion, 'postulada')
      await recargar()
      setAviso('Tu postulación quedó postulada de nuevo.')
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setReactivando(false)
    }
  }

  const sexo = perfil?.sexo ?? estado?.sexo ?? null
  const pideLibretaConv = (estado?.documentos ?? documentosConvocatoria ?? []).some(
    (d) => (d.parametro?.codigo ?? d.codigo) === CODIGO_LIBRETA_MILITAR,
  )
  const ventana = estado?.ventana ?? estadoVentana(convocatoria)

  const usevistadocumentosBloque = useVistaDocumentos({ convocatoria, correccionVigente, documentosConvocatoria, error, estado, idPostulacion, modoCorreccion, pideLibretaConv, sexo, skillsConvocatoriaNombres, user, ventana })
  // Mientras carga el estado (o si falla el acceso), useVistaDocumentos devuelve la propia pantalla (un elemento de React).
  if (isValidElement(usevistadocumentosBloque)) return usevistadocumentosBloque
  const { codigo, editable, editableSexo, esAspirante, esBorrador, esPropia, esRetirada, faltan, motivo, motivoVolver, puedeEscribir, puedeVolver, vista } = usevistadocumentosBloque
  const alGuardarSexo = (sexoNuevo) => {
    setPerfil((prev) => ({ ...(prev ?? {}), sexo: sexoNuevo }))
    setError('')
  }

    return {
      ...usevistadocumentosBloque,
      alGuardarSexo,
      aplicarEstado,
      asegurar,
      aviso,
      codigo,
      convocatoria,
      correccion,
      correccionVigente,
      corregidos,
      creandoRef,
      documentosConvocatoria,
      editable,
      editableSexo,
      enviandoCorreccion,
      enviarCorreccionAhora,
      error,
      esAspirante,
      esBorrador,
      esPropia,
      esRetirada,
      estado,
      faltan,
      idInicial,
      idPostulacion,
      infoCorreccion,
      marcados,
      miPostulacion,
      modoCorreccion,
      motivo,
      motivoVolver,
      onCorreccionEnviada,
      onEnviado,
      onEstadoChange,
      onPostulacionCreada,
      onVerDocumentos,
      perfil,
      pideLibretaConv,
      postulacionId,
      puedeEscribir,
      puedeVolver,
      reactivando,
      recargar,
      reemplazados,
      setAviso,
      setCorreccion,
      setEnviandoCorreccion,
      setError,
      setEstado,
      setIdPostulacion,
      setPerfil,
      setReactivando,
      sexo,
      skillsConvocatoriaNombres,
      user,
      ventana,
      vista,
      volverAPostularme,
    }
}
