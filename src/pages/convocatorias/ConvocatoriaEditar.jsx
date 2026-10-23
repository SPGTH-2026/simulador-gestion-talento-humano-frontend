import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  detalleConvocatoria,
  actualizarConvocatoria,
  cambiarEstadoConvocatoria,
} from '../../api/convocatorias'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import ConvocatoriaWizard from '../../components/convocatorias/ConvocatoriaWizard'
import { useConfirmacion } from '../../hooks/useConfirmacion'

// Borrador y publicada se editan completos; en_proceso y cerrada son de solo
// lectura. Al publicar desde aquí se guarda (PATCH) y, si todo va bien, se
// cambia el estado; si el cambio de estado falla, se permanece en esta pantalla
// mostrando los errores por campo.
export default function ConvocatoriaEditar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [detalle, setDetalle] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [publicando, setPublicando] = useState(false)
  const [error, setError] = useState(location.state?.error ?? '')
  const [errores, setErrores] = useState(location.state?.errores ?? {})
  const [info, setInfo] = useState('')
  const [sucio, setSucio] = useState(false)

  useEffect(() => {
    let activo = true
    detalleConvocatoria(id)
      .then((res) => {
        if (!activo) return
        setDetalle(res.data)
        setErrorCarga('')
      })
      .catch((e) => {
        if (activo) setErrorCarga(mensajeError(e))
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [id])

  useEffect(() => {
    if (!sucio) return
    const avisar = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [sucio])

  const confirmar = useConfirmacion()

  const volver = async () => {
    if (sucio) {
      const ok = await confirmar({
        titulo: 'Cambios sin guardar',
        mensaje: 'Tienes cambios sin guardar. ¿Estás seguro de salir? Se perderán.',
        textoConfirmar: 'Salir',
        textoCancelar: 'Seguir editando',
      })
      if (!ok) return
    }
    navigate('/convocatorias')
  }

  const guardar = async (datos) => {
    setGuardando(true)
    setError('')
    setInfo('')
    setErrores({})

    try {
      const res = await actualizarConvocatoria(id, datos)
      setDetalle(res.data)
      setSucio(false)
      setInfo('Se guardaron los cambios.')
    } catch (e) {
      setErrores(erroresDeCampo(e))
      setError(mensajeError(e))
    } finally {
      setGuardando(false)
    }
  }

  const publicar = async (datos) => {
    setPublicando(true)
    setError('')
    setInfo('')
    setErrores({})

    try {
      const res = await actualizarConvocatoria(id, datos)
      setDetalle(res.data)
      setSucio(false)

      try {
        await cambiarEstadoConvocatoria(id, { estado: 'publicada' })
        navigate(`/convocatorias/${id}`, { replace: true })
      } catch (e) {
        // El guardado ya quedó; el error (p. ej. faltan campos) se muestra aquí.
        setErrores(erroresDeCampo(e))
        setError(mensajeError(e))
      }
    } catch (e) {
      setErrores(erroresDeCampo(e))
      setError(mensajeError(e))
    } finally {
      setPublicando(false)
    }
  }

  if (cargando) {
    return <p className="text-slate-500 dark:text-sena-texto-suave">Cargando convocatoria...</p>
  }

  if (errorCarga || !detalle) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorCarga || 'No se encontró la convocatoria.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/convocatorias')}
          className="self-start rounded border border-sena-azul/25 px-4 py-2 text-sm font-medium text-sena-azul hover:bg-sena-cielo/30 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
        >
          ← Volver
        </button>
      </div>
    )
  }

  const estado = detalle.estado?.codigo
  const soloLectura = estado === 'en_proceso' || estado === 'cerrada'
  // Regla H: publicada con postulaciones → documentos bloqueados (el backend
  // también los rechaza con 422 si se intentan cambiar).
  const bloquearDocumentos = estado === 'publicada' && (detalle.postulantes ?? 0) > 0

  return (
    <div className="flex flex-col gap-4">
      {info && (
        <p className="rounded bg-green-100 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          {info}
        </p>
      )}

      <ConvocatoriaWizard
        titulo="Editar convocatoria"
        valoresIniciales={detalle}
        soloLectura={soloLectura}
        bloquearDocumentos={bloquearDocumentos}
        puedePublicar={estado === 'borrador'}
        guardando={guardando}
        publicando={publicando}
        errores={errores}
        error={error}
        onCambio={() => setSucio(true)}
        onGuardar={guardar}
        onPublicar={publicar}
        onVolver={volver}
      />
    </div>
  )
}
