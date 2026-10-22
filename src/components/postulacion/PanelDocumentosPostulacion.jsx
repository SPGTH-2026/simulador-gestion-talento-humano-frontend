import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { postularse, cambiarEstadoPostulacion } from '../../api/postulaciones'
import {
  estadoDocumentos,
  obtenerPerfil,
  abrirArchivoEnPestana,
  mensajeErrorBlob,
} from '../../api/postulacionesDocumentos'
import { mensajeError } from '../../api/mensajeError'
import { estadoVentana } from '../../lib/ventanaPostulacion'
import { CODIGO_LIBRETA_MILITAR, motivoNoEditable } from '../../lib/postulacionDocumentos'
import { CLASE_CAJA_SUAVE } from '../../lib/estilos'
import IndicadorCompletitud from './IndicadorCompletitud'
import SeccionSexo from './SeccionSexo'
import SeccionDocumentosRequeridos from './SeccionDocumentosRequeridos'
import SeccionSkills from './SeccionSkills'
import SeccionAdicionales from './SeccionAdicionales'
import SeccionEnviarPostulacion from './SeccionEnviarPostulacion'

// Panel reutilizable del paso único "llenar todo en la convocatoria" (doc 33).
//
// Funciona en dos escenarios:
//   1) SIN postulación (detalle de la convocatoria): dibuja las secciones desde
//      detalle.documentos / detalle.skills con todo en pendiente / No. La primera
//      acción de guardado dispara el BORRADOR SILENCIOSO (POST postularse; si la
//      postulación estuviera retirada, PATCH estado 'borrador'), relee el estado
//      y continúa la acción. Solo mirar o elegir el sexo NO crea nada.
//   2) CON postulación (paso /postulaciones/:id/documentos): usa el GET de estado
//      como fuente de verdad.
//
// El estado del panel (GET /postulaciones/{id}/documentos) es la única fuente;
// se comparte con quien lo monta vía onEstadoChange (p. ej. para el encabezado).
export default function PanelDocumentosPostulacion({
  postulacionId = null,
  convocatoria = null,
  documentosConvocatoria = null,
  skillsConvocatoriaNombres = null,
  miPostulacion = null,
  onEstadoChange,
  onPostulacionCreada,
  onEnviado,
  onVerDocumentos,
}) {
  const idInicial = postulacionId ?? miPostulacion?.id ?? null

  const [idPostulacion, setIdPostulacion] = useState(idInicial)
  const [estado, setEstado] = useState(null)
  const [error, setError] = useState('')
  const [perfil, setPerfil] = useState(null)
  const [reabriendo, setReabriendo] = useState(false)
  // Promesa de creación en vuelo: una sola creación de borrador a la vez.
  const creandoRef = useRef(null)

  const aplicarEstado = useCallback(
    (data) => {
      setEstado(data)
      onEstadoChange?.(data)
    },
    [onEstadoChange],
  )

  // Estado de la postulación (si existe). Se relee en cada id nuevo.
  useEffect(() => {
    if (!idPostulacion) return undefined

    let activo = true
    estadoDocumentos(idPostulacion)
      .then((data) => {
        if (!activo) return
        aplicarEstado(data)
        setError('')
      })
      .catch((e) => {
        if (activo) setError(mensajeError(e))
      })

    return () => {
      activo = false
    }
  }, [idPostulacion, aplicarEstado])

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
        ? /postulaciones//documentos//archivo
        : skillId
          ? /postulaciones//skills//certificado/archivo
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
    if (!idPostulacion) return Promise.resolve()
    return estadoDocumentos(idPostulacion)
      .then((data) => {
        aplicarEstado(data)
        setError('')
      })
      .catch((e) => setError(mensajeError(e)))
  }, [idPostulacion, aplicarEstado])

  // Borrador silencioso: garantiza una postulación y devuelve su id + el estado
  // fresco. Si ya existe (y no está retirada) no hace nada. Una sola creación en
  // vuelo (promesa compartida): si falla, la acción que la pidió muestra el error
  // y NO sube nada.
  const asegurar = useCallback(() => {
    const reabrir = Boolean(idPostulacion) && estado?.postulacion?.estado?.codigo === 'retirada'
    if (idPostulacion && !reabrir) {
      return Promise.resolve({ postulacionId: idPostulacion, estado })
    }
    if (creandoRef.current) return creandoRef.current

    const promesa = (async () => {
      const postulacion = idPostulacion
        ? await cambiarEstadoPostulacion(idPostulacion, 'borrador')
        : await postularse(convocatoria?.id)
      onPostulacionCreada?.(postulacion)
      setIdPostulacion(postulacion.id)
      const fresco = await estadoDocumentos(postulacion.id)
      aplicarEstado(fresco)
      setError('')
      return { postulacionId: postulacion.id, estado: fresco }
    })().finally(() => {
      creandoRef.current = null
    })

    creandoRef.current = promesa
    return promesa
  }, [idPostulacion, estado, convocatoria, onPostulacionCreada, aplicarEstado])

  const reabrirPostulacion = async () => {
    if (reabriendo) return
    setReabriendo(true)
    setError('')
    try {
      await cambiarEstadoPostulacion(idPostulacion, 'borrador')
      await recargar()
    } catch (e) {
      setError(mensajeError(e))
    } finally {
      setReabriendo(false)
    }
  }

  const sexo = perfil?.sexo ?? estado?.sexo ?? null
  const pideLibretaConv = (estado?.documentos ?? documentosConvocatoria ?? []).some(
    (d) => (d.parametro?.codigo ?? d.codigo) === CODIGO_LIBRETA_MILITAR,
  )
  const ventana = estado?.ventana ?? estadoVentana(convocatoria)

  // Vista normalizada que consumen las secciones: el estado real si existe, o
  // una síntesis desde detalle.documentos / detalle.skills si aún no hay
  // postulación (todo pendiente / No).
  const vista = useMemo(() => {
    if (estado) return { ...estado, sexo }

    const sexoMujer = sexo?.codigo === 'mujer'
    const documentos = (documentosConvocatoria ?? []).map((d) => ({
      parametro: { id: d.id, codigo: d.codigo, nombre: d.nombre },
      obligatorio: Boolean(d.obligatorio),
      estado: d.codigo === CODIGO_LIBRETA_MILITAR && sexoMujer ? 'no_aplica' : 'pendiente',
      archivo: null,
    }))
    const completo = documentos.every((d) => !d.obligatorio || d.estado === 'no_aplica')

    return {
      postulacion: { id: null, estado: { codigo: null, nombre: null } },
      convocatoria: convocatoria
        ? { id: convocatoria.id, nombre: convocatoria.nombre }
        : null,
      ventana,
      editable: ventana === 'abierta',
      completo,
      requiere_sexo: pideLibretaConv && !sexo,
      sexo,
      documentos,
      adicionales: [],
      skills: [],
      skills_convocatoria: (skillsConvocatoriaNombres ?? []).map((nombre) => ({
        id: null,
        nombre,
      })),
    }
  }, [estado, sexo, ventana, convocatoria, documentosConvocatoria, skillsConvocatoriaNombres, pideLibretaConv])

  // Sin estado todavía: mientras llega el GET, o el error de acceso.
  if (idPostulacion && !estado && !error) {
    return (
      <p className="text-slate-500 dark:text-sena-texto-suave">Cargando tus datos...</p>
    )
  }
  if (idPostulacion && !estado && error) {
    return (
      <p
        role="alert"
        className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
      >
        {error}
      </p>
    )
  }

  const editable = Boolean(vista.editable)
  const motivo = motivoNoEditable(vista)
  const codigo = vista.postulacion?.estado?.codigo
  const esBorrador = codigo === 'borrador'
  const esRetirada = codigo === 'retirada'
  const editableSexo = ventana === 'abierta'

  const alGuardarSexo = (sexoNuevo) => {
    setPerfil((prev) => ({ ...(prev ?? {}), sexo: sexoNuevo }))
    setError('')
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}

      {motivo && (
        <p className="rounded bg-sena-cielo/20 p-3 text-sm text-slate-700 dark:bg-sena-superficie-alta dark:text-sena-texto-suave">
          {motivo}
        </p>
      )}

      {esRetirada && (
        <div className={`${CLASE_CAJA_SUAVE} flex flex-wrap items-center gap-2 p-3`}>
          <button
            type="button"
            disabled={reabriendo || ventana !== 'abierta'}
            title={ventana !== 'abierta' ? motivo : undefined}
            onClick={reabrirPostulacion}
            className="rounded bg-sena-oscuro px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sena-azul disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reabriendo ? 'Reabriendo...' : 'Reabrir postulación'}
          </button>
          {onVerDocumentos && (
            <button
              type="button"
              onClick={() => onVerDocumentos(vista.postulacion.id)}
              className="rounded border border-sena-azul/25 px-4 py-2 text-sm font-medium text-sena-azul hover:bg-sena-cielo/30 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie"
            >
              Ver documentos
            </button>
          )}
        </div>
      )}

      <IndicadorCompletitud estado={vista} />

      <SeccionSexo
        sexo={sexo}
        editable={editableSexo}
        onGuardado={alGuardarSexo}
        onError={setError}
      />

      <SeccionDocumentosRequeridos
        vista={vista}
        editable={editable}
        sexo={sexo}
        asegurar={asegurar}
        onRecargar={recargar}
        onError={setError}
      />

      <SeccionSkills
        vista={vista}
        editable={editable}
        asegurar={asegurar}
        onRecargar={recargar}
        onError={setError}
      />

      <SeccionAdicionales
        vista={vista}
        editable={editable}
        asegurar={asegurar}
        onRecargar={recargar}
        onError={setError}
      />

      {esBorrador && editable && (
        <SeccionEnviarPostulacion
          estado={vista}
          onExito={() => onEnviado?.()}
          onError={setError}
          onRecargar={recargar}
        />
      )}
    </div>
  )
}
