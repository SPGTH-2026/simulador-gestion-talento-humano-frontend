import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { crearConvocatoria, cambiarEstadoConvocatoria } from '../../api/convocatorias'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import ConvocatoriaWizard from '../../components/convocatorias/ConvocatoriaWizard'
import { useConfirmacion } from '../../hooks/useConfirmacion'

// Crear es el único caso donde el borrador nace sin id: el primer guardado
// exige el nombre y, al crearse, se continúa en /convocatorias/:id/editar
// (replace) para no dejar la pantalla de "nueva" en el historial.
export default function ConvocatoriaNueva() {
  const navigate = useNavigate()

  const [guardando, setGuardando] = useState(false)
  const [publicando, setPublicando] = useState(false)
  const [error, setError] = useState('')
  const [errores, setErrores] = useState({})
  const [sucio, setSucio] = useState(false)

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

  // 'etapa' es el paso en el que estaba quien guarda: la pantalla de edición se abre en ese mismo paso.
  const guardar = async (datos, etapa) => {
    if (!datos.nombre?.trim()) {
      setErrores({ nombre: 'Escribe el nombre de la convocatoria para guardar el borrador.' })
      return
    }

    setGuardando(true)
    setError('')
    setErrores({})

    try {
      const res = await crearConvocatoria(datos)
      setSucio(false)
      navigate(`/convocatorias/${res.data.id}/editar`, {
        replace: true,
        state: {
          etapa,
          exito: 'Borrador guardado. Puedes seguir completando los pasos desde aquí; la convocatoria ya existe.',
        },
      })
    } catch (e) {
      setErrores(erroresDeCampo(e))
      setError(mensajeError(e))
    } finally {
      setGuardando(false)
    }
  }

  const publicar = async (datos, etapa) => {
    if (!datos.nombre?.trim()) {
      setErrores({ nombre: 'Escribe el nombre de la convocatoria antes de publicar.' })
      return
    }

    setPublicando(true)
    setError('')
    setErrores({})

    try {
      const res = await crearConvocatoria(datos)
      const id = res.data.id

      try {
        await cambiarEstadoConvocatoria(id, { estado: 'publicada' })
        setSucio(false)
        navigate(`/convocatorias/${id}`, { replace: true })
      } catch (e) {
        // Se guardó, pero no se pudo publicar: seguir en /editar con los errores
        // por campo que devolvió la validación de publicación.
        navigate(`/convocatorias/${id}/editar`, {
          replace: true,
          state: {
            etapa,
            errores: erroresDeCampo(e),
            error: mensajeError(e),
            aviso:
              'La convocatoria quedó guardada como borrador con todo lo que escribiste, pero no se pudo publicar. ' +
              'Corrige lo que se indica y pulsa «Publicar convocatoria» de nuevo desde esta misma pantalla: no se crea otra.',
          },
        })
      }
    } catch (e) {
      setErrores(erroresDeCampo(e))
      setError(mensajeError(e))
    } finally {
      setPublicando(false)
    }
  }

  return (
    <ConvocatoriaWizard
      titulo="Nueva convocatoria"
      valoresIniciales={null}
      puedePublicar
      guardando={guardando}
      publicando={publicando}
      errores={errores}
      error={error}
      onCambio={() => setSucio(true)}
      onGuardar={guardar}
      onPublicar={publicar}
      onVolver={volver}
    />
  )
}
