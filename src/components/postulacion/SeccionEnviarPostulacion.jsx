import { useId, useState } from 'react'
import { enviarPostulacion } from '../../api/postulaciones'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'
import { CLASE_TARJETA, CLASE_TITULO_SECCION } from '../../lib/estilos'
import { idFilaDocumento } from '../../lib/postulacionDocumentos'
import { ID_SECCION_DATOS } from '../../lib/datosPersonales'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'

const ESTILO_TARJETA = `${CLASE_TARJETA} p-4`

const ESTILO_TITULO = CLASE_TITULO_SECCION

// Lleva a la fila del documento (o a los datos personales) y deja el foco en su primera acción disponible, para que
// quien navega con teclado no tenga que buscarla. Con movimiento reducido no hay desplazamiento animado.
function irA(id) {
  const destino = document.getElementById(id)
  if (!destino) return
  const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  destino.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'center' })
  destino.querySelector('button:not(:disabled), input:not(:disabled)')?.focus({ preventScroll: true })
}

// Los datos personales pueden estar en otra pestaña (oculta): se abre primero y luego se baja hasta la sección.
function irAPestanaDatos() {
  document.getElementById('tab-datos')?.click()
  setTimeout(() => irA(ID_SECCION_DATOS), 0)
}

// Envío del BORRADOR a 'postulada'. Solo se muestra mientras la postulación está
// en borrador y el paso es editable.
//
// El botón se deshabilita mientras falte algo obligatorio que la pantalla ya conoce (documentos obligatorios sin
// subir y los datos personales). Así no se abre la confirmación ni se envía una petición que el
// servidor va a rechazar. Hay UN solo aviso con los pendientes, y cada uno lleva a su fila.
//
// El servidor sigue validando. Si responde 422 con `faltantes[]` porque la información cambió después de cargar la
// página, se relee el estado y esos faltantes se suman al MISMO aviso (no se pinta un segundo recuadro). Los demás
// fallos (red, estado desactualizado) conservan su mensaje y el botón queda disponible para reintentar.
export default function SeccionEnviarPostulacion({ estado, onExito, onError, onRecargar }) {
  const postulacionId = estado.postulacion.id
  const idAviso = useId()
  const [enviando, setEnviando] = useState(false)
  // Faltantes del 422 junto con el estado en que se recibieron: valen mientras el estado no cambie; al releerlo, el
  // aviso pasa a calcularse solo con lo que la pantalla ya conoce.
  const [rechazo, setRechazo] = useState(null)

  // Obligatorios sin subir (los 'no_aplica', como la libreta de una mujer, no cuentan) y los datos personales pendientes.
  const pendientes = (estado.documentos ?? []).filter(
    (d) => d.obligatorio && d.estado !== 'subido' && d.estado !== 'no_aplica',
  )
  const avisoDatos = estado.datos_personales?.completo === false

  // Faltantes que dijo el servidor y la pantalla aún no lista (no repite los que ya están en `pendientes`).
  const nombresLocales = new Set(pendientes.map((d) => d.parametro.nombre))
  const delServidor =
    rechazo && rechazo.estado === estado
      ? rechazo.lista.filter((f) => !nombresLocales.has(f.nombre))
      : []
  const hayPendientes = pendientes.length > 0 || avisoDatos || delServidor.length > 0
  // El encabezado avisa del cambio mientras quede algo pendiente después de un rechazo del servidor.
  const desactualizado = Boolean(rechazo) && hayPendientes

  const confirmar = useConfirmacion()

  const enviar = async () => {
    // Con algo pendiente no se abre la confirmación ni se manda nada.
    if (enviando || hayPendientes) return
    const ok = await confirmar({
      titulo: 'Enviar postulación',
      mensaje:
        '¿Estás seguro de enviar tu postulación? Después de enviarla quedará marcada como "Postulada".',
      textoConfirmar: 'Enviar',
      textoCancelar: 'Cancelar',
    })
    if (!ok) return

    setEnviando(true)
    setRechazo(null)
    try {
      const postulacion = await enviarPostulacion(postulacionId)
      onExito(postulacion)
    } catch (e) {
      // 422 con la lista `faltantes`: el estado de la pantalla estaba desactualizado. Se relee y se muestra el
      // resumen actualizado en el aviso único.
      const lista = e.response?.data?.faltantes
      if (e.response?.status === 422 && Array.isArray(lista) && lista.length > 0) {
        setRechazo({ lista, estado })
        await onRecargar?.()
      } else {
        const deCampo = erroresDeCampo(e)
        onError(deCampo.documentos || deCampo.postulacion || mensajeError(e))
        // Estado desactualizado (ya no está en borrador, etc.): resincroniza. Un error de red no lo necesita.
        if (e.response) await onRecargar?.()
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className={ESTILO_TARJETA}>
      <h2 className={ESTILO_TITULO}>Enviar la postulación</h2>

      <p className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">
        Mientras no la envíes, tu postulación se guarda como borrador. Al enviarla
        pasa a "Postulada" y se valida que los documentos obligatorios estén
        completos.
      </p>

      {hayPendientes ? (
        // Un solo aviso. Si venía de un rechazo del servidor se anuncia como alerta; si no, es información.
        <div
          id={idAviso}
          role={desactualizado ? 'alert' : 'status'}
          className="mt-3 rounded-lg border border-aviso/30 bg-aviso/10 p-3 text-sm text-aviso"
        >
          <p className="flex items-start gap-2 font-semibold">
            <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0" />
            {desactualizado
              ? 'La información cambió y todavía falta esto. Revisa el resumen y vuelve a intentarlo:'
              : 'Antes de enviar, completa:'}
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {pendientes.map((documento) => (
              <li key={documento.parametro.id} className="flex flex-wrap items-center justify-between gap-x-3">
                <span>{documento.parametro.nombre}</span>
                <Boton
                  variante="enlace"
                  tamano="tactil"
                  onClick={() => irA(idFilaDocumento(documento.parametro.id))}
                  aria-label={`Ir al documento ${documento.parametro.nombre}`}
                >
                  Ir al documento
                </Boton>
              </li>
            ))}
            {delServidor.map((faltante) => (
              <li key={faltante.codigo ?? faltante.nombre}>
                {faltante.nombre}
                {faltante.motivo ? ` (${faltante.motivo})` : ''}
              </li>
            ))}
            {avisoDatos && (
              <li className="flex flex-wrap items-center justify-between gap-x-3">
                <span>Llena tus datos personales y autoriza su tratamiento para poder enviar la postulación.</span>
                <Boton variante="enlace" tamano="tactil" onClick={() => irAPestanaDatos()}>
                  Ir a Datos personales
                </Boton>
              </li>
            )}
          </ul>
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-2 text-sm text-exito">
          <Icono nombre="check" className="size-4 shrink-0" />
          Tus documentos obligatorios están completos. Ya puedes enviar la postulación.
        </p>
      )}

      <div className="mt-3">
        <Boton
          variante="primario"
          tamano="tactil"
          ocupado={enviando}
          disabled={hayPendientes}
          aria-describedby={hayPendientes ? idAviso : undefined}
          onClick={enviar}
        >
          {enviando ? 'Enviando…' : 'Enviar postulación'}
        </Boton>
      </div>
    </section>
  )
}
