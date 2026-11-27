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
import Boton from '../../components/ui/Boton'
import Icono from '../../components/ui/Icono'
import { CLASE_TARJETA_PLANA } from '../../lib/estilos'
import CabeceraWizard from '../../components/convocatorias/CabeceraWizard'
import { CargaInicial, Hueco } from '../../components/ui/Esqueleto'

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
  // Confirmación del último guardado y aviso de qué quedó guardado si la publicación falló. Pueden llegar de Nueva.
  const [exito, setExito] = useState(location.state?.exito ?? '')
  const [aviso, setAviso] = useState(location.state?.aviso ?? '')
  const [errores, setErrores] = useState(location.state?.errores ?? {})
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

  // Guardar conserva el paso y la pantalla: confirma con un mensaje (con «Volver al listado») en lugar de sacar a la
  // persona de donde estaba trabajando.
  const guardar = async (datos) => {
    setGuardando(true)
    setError('')
    setErrores({})
    setExito('')
    setAviso('')

    try {
      const res = await actualizarConvocatoria(id, datos)
      setDetalle(res.data)
      setSucio(false)
      setExito('Cambios guardados. Puedes seguir editando o volver al listado.')
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
    setErrores({})
    setExito('')
    setAviso('')

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
        setAviso(
          'Los cambios se guardaron, pero la convocatoria sigue en borrador porque no se pudo publicar. ' +
            'Corrige lo que se indica y pulsa «Publicar convocatoria» de nuevo.',
        )
      }
    } catch (e) {
      setErrores(erroresDeCampo(e))
      setError(mensajeError(e))
    } finally {
      setPublicando(false)
    }
  }

  if (cargando) {
    // Volver y el título no dependen de la API: se ven mientras carga, y solo el contenido es esqueleto.
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
        <CabeceraWizard titulo="Editar convocatoria" subtitulo="" onVolver={volver} />
        {/* Misma forma que el asistente: tarjeta de pasos y tarjeta del paso con sus campos (etiqueta + campo). */}
        <CargaInicial texto="Cargando convocatoria…">
          <div className="flex flex-col gap-4">
            <div className={`${CLASE_TARJETA_PLANA} flex flex-col gap-3 p-4`}>
              <Hueco className="h-3 w-2/5" />
              <Hueco className="h-1.5 w-full rounded-full" />
            </div>
            <div className={`${CLASE_TARJETA_PLANA} flex flex-col gap-5 p-4 sm:p-6`}>
              <Hueco className="h-5 w-1/3" />
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Hueco className="h-3 w-1/4" />
                  <Hueco className="h-11 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </CargaInicial>
      </div>
    )
  }

  if (errorCarga || !detalle) {
    return (
      <div className="flex flex-col gap-4">
        <p role="alert" className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errorCarga || 'No se encontró la convocatoria.'}
        </p>
        <Boton variante="fantasma" tamano="tactil" className="self-start"
          onClick={() => navigate('/convocatorias')}>
          <Icono nombre="flechaIzquierda" className="size-4" />
          Volver
        </Boton>
      </div>
    )
  }

  const estado = detalle.estado?.codigo
  const soloLectura = estado === 'en_proceso' || estado === 'cerrada'
  // Con CUALQUIER postulación (también borrador) los documentos no se agregan
  // ni quitan. El backend lo rechaza con 422 si se intentan cambiar.
  const bloquearDocumentos = Boolean(detalle.tiene_postulaciones)

  return (
    <div className="flex flex-col gap-4">
      <ConvocatoriaWizard
        titulo="Editar convocatoria"
        valoresIniciales={detalle}
        soloLectura={soloLectura}
        bloquearDocumentos={bloquearDocumentos}
        puedePublicar={estado === 'borrador'}
        etapaInicial={location.state?.etapa ?? 1}
        exito={exito}
        aviso={aviso}
        guardando={guardando}
        publicando={publicando}
        errores={errores}
        error={error}
        onCambio={() => {
          setSucio(true)
          setExito('')
        }}
        onGuardar={guardar}
        onPublicar={publicar}
        onVolver={volver}
      />
    </div>
  )
}
