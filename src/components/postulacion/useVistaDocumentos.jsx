import { useMemo } from 'react'
import { CODIGO_LIBRETA_MILITAR, motivoNoEditable } from '../../lib/postulacionDocumentos'
import { EsqueletoDetalle } from '../ui/Esqueleto'

// Bloque de usePanelDocumentosPostulacion movido a su propio hook. Recibe sus dependencias en `deps`.
export function useVistaDocumentos(deps) {
  const { convocatoria, correccionVigente, documentosConvocatoria, error, estado, idPostulacion, modoCorreccion, pideLibretaConv, sexo, skillsConvocatoriaNombres, user, ventana } = deps
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
      <EsqueletoDetalle texto="Cargando tus datos…" bloques={2} />
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

  // Solo el aspirante dueño escribe. Sin postulación todavía, quien se postula
  // es el propio usuario; con postulación, debe ser suya (user_id).
  const esAspirante = user?.role === 'aspirante'
  const esPropia = !vista.postulacion?.user_id || vista.postulacion.user_id === user?.id
  const puedeEscribir = esAspirante && esPropia

  // En la pantalla de corrección solo se edita mientras la corrección está vigente.
  const editable = Boolean(vista.editable) && puedeEscribir && (!modoCorreccion || correccionVigente)
  const motivo = motivoNoEditable(vista)
  const codigo = vista.postulacion?.estado?.codigo
  const esBorrador = codigo === 'borrador'
  const esRetirada = codigo === 'retirada'
  const editableSexo = ventana === 'abierta' && puedeEscribir
  const faltan = (vista.documentos ?? [])
    .filter((d) => d.obligatorio && d.estado !== 'subido' && d.estado !== 'no_aplica')
    .map((d) => d.parametro.nombre)
  const puedeVolver = editable && faltan.length === 0
  const motivoVolver = !editable
    ? motivo
    : faltan.length > 0
      ? `Falta cargar: ${faltan.join(', ')}.`
      : ''

  return {
    codigo,
    editable,
    editableSexo,
    esAspirante,
    esBorrador,
    esPropia,
    esRetirada,
    faltan,
    motivo,
    motivoVolver,
    puedeEscribir,
    puedeVolver,
    vista,
  }
}
