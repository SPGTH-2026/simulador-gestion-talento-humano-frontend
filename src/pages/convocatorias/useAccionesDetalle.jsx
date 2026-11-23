import { cambiarEstadoConvocatoria } from '../../api/convocatorias'
import { mensajeError } from '../../api/mensajeError'
import { estadoVentana, textoVentana } from '../../lib/ventanaPostulacion'
import Boton from '../../components/ui/Boton'
import { esEditable, pasoDeEstado } from '../../lib/convocatorias'

// Bloque de useContenidoDetalle movido a su propio hook. Recibe sus dependencias en `deps`.
export function useAccionesDetalle(deps) {
  const { accionando, confirmar, detalle, navigate, puedeGestionar, setAccionando, setDetalle, setErrorAccion, user } = deps
  // Sin detalle todavía (la página lo carga): no hay acciones que calcular. Los valores son neutros.
  if (!detalle) {
    return { accionInferior: null, accionesGestion: null, avanzarEstado: () => {}, editable: false, esAspirantePublicada: false, estadoPostulacion: null, hayAcciones: false, irADocumentos: () => {}, mostrarPanel: false, paso: null, ventana: null }
  }
  // Visibilidad del panel: para el aspirante, en una convocatoria publicada. El
  // panel permite llenar TODO (sexo, documentos, skills, extras y envío) en la
  // misma página, sin cambiar de vista. La ventana cerrada no lo bloquea: el
  // propio panel queda en solo lectura con el motivo.
  // El panel se monta para TODO aspirante en una convocatoria publicada, tenga
  // o no postulación: sin ella el propio panel dibuja las secciones en pendiente
  // y crea el BORRADOR SILENCIOSO en la primera acción de guardado. Así la
  // pestaña Documentos es el espacio real de la postulación desde el inicio.
  const esAspirantePublicada =
    user?.role === 'aspirante' && detalle.estado?.codigo === 'publicada'
  const estadoPostulacion = detalle.mi_postulacion?.estado?.codigo ?? null
  const mostrarPanel = esAspirantePublicada

  const ventana = estadoVentana(detalle)

  // ── Acción de la barra inferior ───────────────────────────────────────
  // Solo para el aspirante que puede postularse: instructor, super admin y el
  // resto de roles no ven barra. NO es una segunda vía de postulación — no llama
  // a la API ni crea nada (el borrador lo crea el panel, de forma silenciosa, en
  // su primera acción de guardado). Aquí solo se salta a la pestaña Documentos,
  // donde vive el panel.
  const irADocumentos = () => document.getElementById('tab-documentos')?.click()

  let accionInferior = null
  if (esAspirantePublicada) {
    // Ventana cerrada o todavía sin abrir: se muestra el botón DESHABILITADO con
    // el motivo visible, para que el aspirante entienda por qué no puede seguir.
    const cerrada = ventana !== 'abierta'
    if (estadoPostulacion === 'postulada') {
      accionInferior = {
        etiqueta: 'Ver mis documentos',
        motivo: cerrada ? textoVentana(detalle) : '',
        ayuda: 'Tu postulación ya se envió. Puedes consultar y descargar los documentos que adjuntaste.',
        deshabilitado: false,
        onClick: irADocumentos,
        insignia: true,
      }
    } else if (estadoPostulacion === 'retirada') {
      // La reapertura la decide el panel (y el backend): aquí solo se salta.
      accionInferior = {
        etiqueta: 'Reabrir postulación',
        motivo: cerrada ? textoVentana(detalle) : '',
        ayuda: 'Retiraste esta postulación. Reábrela para volver a completar tus documentos.',
        deshabilitado: cerrada,
        onClick: irADocumentos,
        insignia: true,
      }
    } else {
      // Sin postulación o con una en borrador: la acción es la misma y siempre
      // lleva a la pestaña Documentos. El texto corto evita repetir "Siguiente".
      accionInferior = {
        etiqueta: 'Continuar a documentos',
        motivo: cerrada ? textoVentana(detalle) : '',
        ayuda:
          estadoPostulacion === 'borrador'
            ? 'Tu postulación está en borrador. Complétala y envíala desde la pestaña Documentos.'
            : 'Completa tus datos y adjunta los documentos en la pestaña Documentos.',
        deshabilitado: cerrada,
        onClick: irADocumentos,
        insignia: estadoPostulacion === 'borrador',
      }
    }
  }

  // ── Vista de gestión: acciones según el estado ────────────────────────
  // Solo quien tiene 'convocatorias:gestionar'. Son las MISMAS acciones del
  // listado (editar y el candado de un paso), con las reglas de estado ya
  // escritas: no se inventan transiciones.
  const paso = pasoDeEstado(detalle.estado?.codigo)
  const editable = esEditable(detalle)

  const avanzarEstado = async () => {
    if (!paso) return
    const ok = await confirmar({
      titulo: paso.etiqueta,
      mensaje: `¿Cerrar la convocatoria «${detalle.nombre}»? Esta acción avanza su estado y no se puede deshacer.`,
      textoConfirmar: paso.etiqueta,
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return

    setAccionando(true)
    setErrorAccion('')

    try {
      const res = await cambiarEstadoConvocatoria(detalle.id, { estado: paso.destino })
      setDetalle(res.data)
    } catch (e) {
      setErrorAccion(mensajeError(e))
    } finally {
      setAccionando(false)
    }
  }

  // Mismas acciones y misma jerarquía que las tarjetas del listado: primero
  // consultar (aquí ya se está), luego editar y por último cerrar. Van DENTRO de la cabecera del detalle (junto
  // al título y al estado), no en una fila suelta encima.
  const hayAcciones = puedeGestionar && (editable || paso)
  const accionesGestion = hayAcciones ? (
    <div className="flex flex-wrap items-center gap-2">
      {editable && (
        <Boton
          variante="contorno"
          tamano="tactil"
          className="flex-1 sm:flex-none"
          onClick={() => navigate(`/convocatorias/${detalle.id}/editar`)}
        >
          Editar
        </Boton>
      )}

      {paso && (
        <Boton
          variante="peligroSuave"
          tamano="tactil"
          className="flex-1 sm:flex-none"
          ocupado={accionando}
          onClick={avanzarEstado}
        >
          {accionando ? 'Cerrando…' : paso.etiqueta}
        </Boton>
      )}
    </div>
  ) : null

  return {
    accionInferior,
    accionesGestion,
    avanzarEstado,
    editable,
    esAspirantePublicada,
    estadoPostulacion,
    hayAcciones,
    irADocumentos,
    mostrarPanel,
    paso,
    ventana,
  }
}
