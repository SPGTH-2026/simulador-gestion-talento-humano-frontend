import { useRef, useState } from 'react'
import { validarArchivoPostulacion } from '../../lib/archivosPostulacion'
import { MAX_SKILLS, normalizarSkill } from '../../lib/postulacionDocumentos'
import { declararSkill, eliminarSkill, subirCertificado, quitarCertificado } from '../../api/postulacionesDocumentos'
import { mensajeError, erroresDeCampo } from '../../api/mensajeError'
import { useConfirmacion } from '../../hooks/useConfirmacion'

// Lógica de SeccionSkills: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function useSeccionSkills({ vista,
  editable,
  asegurar,
  onRecargar, }) {
  const declaradas = vista.skills ?? []
  const requeridas = vista.skills_convocatoria ?? []

  const [error, setError] = useState('')
  // Clave de la operación a la que pertenece el error (la fila que lo causó): se pinta junto a ella y no al final de la sección.
  const [errorClave, setErrorClave] = useState(null)
  const fallarEn = (clave, mensaje) => {
    setError(mensaje)
    setErrorClave(clave)
  }
  // clave de la operación en vuelo: `req-...` | `skill-<id>` | `cert-<id>` | `quitarcert-<id>`
  const [enVuelo, setEnVuelo] = useState(null)
  // Porcentaje (0-100) de la subida del certificado en curso.
  const [progresoCert, setProgresoCert] = useState(0)
  // certificadosSubidos[skillId] = certificado recién subido, para mostrarlo de
  // inmediato sin esperar a que onRecargar() vuelva a traer todo el estado.
  const [certificadosSubidos, setCertificadosSubidos] = useState({})
  const refsCertificado = useRef({})
  // Cerrojo síncrono: 'enVuelo' es estado y solo cambia en el siguiente render; dos clics seguidos (o el interruptor y un
  // certificado) podrían colarse en ese intervalo y enviar la operación dos veces. La referencia lo impide.
  const cerrojo = useRef(false)

  // Ejecuta UNA operación a la vez: marca 'enVuelo', corre la tarea y la libera siempre. 'tarea' decide qué espera:
  // en declarar y quitar espera también la recarga del estado, así el indicador sigue hasta que la pantalla cambia.
  const ejecutar = async (clave, tarea, mensajeDe) => {
    if (cerrojo.current) return false
    cerrojo.current = true
    setEnVuelo(clave)
    setError('')
    setErrorClave(null)
    try {
      return (await tarea()) !== false
    } catch (e) {
      fallarEn(clave, mensajeDe(e))
      // Un fallo de red puede llegar DESPUÉS de que el servidor aplicó el cambio: se vuelve a leer el estado real
      // para que la pantalla no quede desfasada (y el siguiente clic no actúe sobre algo que ya no existe).
      try {
        await onRecargar()
      } catch {
        /* el panel ya muestra su propio error de lectura */
      }
      return false
    } finally {
      cerrojo.current = false
      setEnVuelo(null)
    }
  }

  // Cuando la vista se actualiza (onRecargar terminó), limpiamos los locales.
  // Se reinicia durante el render (patrón de React para ajustar estado al cambiar una prop), no en un efecto.
  const [vistaPrevia, setVistaPrevia] = useState(vista)
  if (vista !== vistaPrevia) {
    setVistaPrevia(vista)
    setCertificadosSubidos({})
  }

  const buscarDeclarada = (nombre) =>
    declaradas.find((s) => normalizarSkill(s.nombre) === normalizarSkill(nombre))

  const tope = declaradas.length >= MAX_SKILLS

  // Las skills que ya estaban declaradas antes (catálogo o propias) no se
  // pueden tocar: se muestran aparte y en solo lectura.
  const esVieja = (skill) => skill.origen !== 'convocatoria'
  const nombresRequeridas = new Set(requeridas.map((r) => normalizarSkill(r.nombre)))
  const viejas = declaradas.filter(
    (s) => esVieja(s) && !nombresRequeridas.has(normalizarSkill(s.nombre)),
  )

  // La postulación ya existe (la vista trae su id); si no, se crea el borrador
  // de forma silenciosa justo antes de guardar.
  const pidSeguro = async () => vista.postulacion?.id ?? (await asegurar()).postulacionId

  const declarar = (clave, formaDe) => {
    if (!editable) return false
    return ejecutar(
      clave,
      async () => {
        const { postulacionId, estado } = await asegurar()
        const forma = formaDe(estado)

        // Sin forma válida no se manda nada (el backend solo admite la skill
        // de la convocatoria, por id).
        if (!forma) return false

        await declararSkill(postulacionId, forma)
        // Se espera la recarga: el interruptor y «Cargar certificado» cambian cuando llega el estado real.
        await onRecargar()
        return true
      },
      (e) => {
        const deCampo = erroresDeCampo(e)
        return deCampo.convocatoria_skill_id || deCampo.nombre || deCampo.parametro_id || mensajeError(e)
      },
    )
  }

  const confirmar = useConfirmacion()

  const quitar = async (skill) => {
    if (!editable || cerrojo.current) return
    // Dice qué se elimina: la skill y, si la tiene, también su certificado (el servidor borra el archivo).
    const certificado = skill.certificado?.nombre_original
    const ok = await confirmar({
      titulo: 'Quitar skill',
      mensaje: skill.certificado
        ? `Se quitará la skill «${skill.nombre}» de tu postulación y también se eliminará el certificado que cargaste${certificado ? ` (${certificado})` : ''}. Podrás declararla de nuevo y volver a cargarlo.`
        : `Se quitará la skill «${skill.nombre}» de tu postulación. Podrás declararla de nuevo cuando quieras.`,
      textoConfirmar: 'Quitar',
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return
    await ejecutar(
      `skill-${skill.id}`,
      async () => {
        await eliminarSkill(await pidSeguro(), skill.id)
        await onRecargar()
      },
      mensajeError,
    )
  }

  const elegirCertificado = async (skill, archivo) => {
    const validacion = validarArchivoPostulacion(archivo)
    if (!validacion.ok) {
      fallarEn(`cert-${skill.id}`, validacion.mensaje)
      return
    }
    setProgresoCert(0)
    await ejecutar(
      `cert-${skill.id}`,
      async () => {
        // El envío informa su avance real; al 100 % el archivo ya está en el servidor y la barra pasa a
        // «Procesando…» hasta que responde. La respuesta trae el certificado guardado: con ella la franja ya
        // muestra el estado real, así que no se espera la recarga (corre en segundo plano).
        const resultado = await subirCertificado(await pidSeguro(), skill.id, archivo, setProgresoCert)
        if (resultado?.certificado) {
          setCertificadosSubidos((prev) => ({ ...prev, [skill.id]: resultado.certificado }))
        }
        onRecargar()
      },
      (e) => erroresDeCampo(e).archivo || mensajeError(e),
    )
  }

  const quitarCertificadoDe = async (skill) => {
    if (!editable || cerrojo.current) return
    const ok = await confirmar({
      titulo: 'Quitar certificado',
      mensaje: `¿Estás seguro de quitar el certificado de "${skill.nombre}"? La skill se conserva.`,
      textoConfirmar: 'Quitar',
      textoCancelar: 'Cancelar',
      peligro: true,
    })
    if (!ok) return
    await ejecutar(
      `quitarcert-${skill.id}`,
      async () => {
        await quitarCertificado(await pidSeguro(), skill.id)
        await onRecargar()
      },
      mensajeError,
    )
  }

  // "Ver" certificado: el PDF lo abre PanelDocumentosPostulacion (evento document:view).
  const verCertificadoDe = (skill) =>
    window.dispatchEvent(new CustomEvent('document:view', {
      detail: { skillId: skill.id, nombre: skill.certificado?.nombre_original, titulo: skill.nombre ? `Certificado: ${skill.nombre}` : undefined },
    }))

  const registrarRef = (id) => (el) => {
    refsCertificado.current[id] = el
  }

  // Acciones comunes de una fila ya declarada (certificado + quitar).
  const accionesDeclarada = (skill) =>
    skill
      ? {
          registrarRef: registrarRef(skill.id),
          onAdjuntar: () => refsCertificado.current[skill.id]?.click(),
          onDescargar: () => verCertificadoDe(skill),
          onQuitarCertificado: () => quitarCertificadoDe(skill),
          onArchivo: (archivo) => elegirCertificado(skill, archivo),
        }
      : {}

  // Si la convocatoria NO pide skills y el aspirante no tiene ninguna
  // declarada antes, la sección entera no se pinta: nada que ver con skills.
  if (requeridas.length === 0 && viejas.length === 0) {
    return null
  }

    return {
      accionesDeclarada,
      asegurar,
      buscarDeclarada,
      cerrojo,
      certificadosSubidos,
      confirmar,
      declaradas,
      declarar,
      editable,
      ejecutar,
      elegirCertificado,
      enVuelo,
      error,
      esVieja,
      nombresRequeridas,
      onRecargar,
      pidSeguro,
      progresoCert,
      quitar,
      quitarCertificadoDe,
      refsCertificado,
      registrarRef,
      requeridas,
      setCertificadosSubidos,
      setEnVuelo,
      setError,
      errorClave,
      fallarEn,
      setProgresoCert,
      setVistaPrevia,
      tope,
      verCertificadoDe,
      viejas,
      vista,
      vistaPrevia,
    }
}
