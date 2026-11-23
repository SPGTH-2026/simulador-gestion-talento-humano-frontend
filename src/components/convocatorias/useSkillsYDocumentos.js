import { useRef, useState } from 'react'
import { crearDocumentoCatalogo } from '../../api/convocatorias'
import { mensajeError } from '../../api/mensajeError'
import { DOCUMENTOS_OBLIGATORIOS, esObligatorioFijo } from '../../lib/documentosConvocatoria'
import { MAX_SKILLS, claveSkill, repartoIgual } from './convocatoriaWizardUtils'
import { sumaDePonderaciones, valorPonderacion } from './convocatoriaWizardValidacion'

// Skills y documentos del formulario de convocatoria: agregar y quitar skills (libres o del catálogo), elegir
// documentos, crear uno nuevo en el catálogo y repartir o escribir sus porcentajes. Recibe el formulario y su setter.
export default function useSkillsYDocumentos({ form, setForm, catalogos, setCatalogos }) {
  // Skill de TEXTO LIBRE (la que escribe el gestor) y su error.
  const [nuevaSkill, setNuevaSkill] = useState('')
  const [errorSkill, setErrorSkill] = useState('')

  // Documento NUEVO del catálogo (especialización, maestría, diplomado...).
  const [nuevoDocumento, setNuevoDocumento] = useState('')
  const [errorDocumento, setErrorDocumento] = useState('')
  const [guardandoDocumento, setGuardandoDocumento] = useState(false)
  // Cerrojo síncrono: Enter en el campo y el botón pueden llegar antes de que React pinte el botón ocupado y enviar dos veces.
  const guardandoRef = useRef(false)
  const [mostrarNuevoDocumento, setMostrarNuevoDocumento] = useState(false)
  // 'Repartir en partes iguales' deja el reparto en automático: al marcar, quitar o agregar un documento se vuelve a repartir
  // solo (si no, el documento nuevo quedaba sin porcentaje y no se podía guardar). Escribir un porcentaje a mano lo apaga.
  const [repartoAuto, setRepartoAuto] = useState(false)

  // Agrega una skill de TEXTO LIBRE (la que el gestor escribe). Las del
  // catálogo se agregan con alternarSkillCatalogo.
  const agregarSkill = (texto) => {
    const valor = String(texto ?? '').trim()
    if (!valor) return
    if (valor.length > 100) {
      setErrorSkill('Cada skill debe tener máximo 100 caracteres.')
      return
    }
    if (form.skills.length >= MAX_SKILLS) {
      setErrorSkill(`No puedes registrar más de ${MAX_SKILLS} skills.`)
      return
    }
    if (form.skills.some((s) => claveSkill(s.nombre) === claveSkill(valor))) {
      setErrorSkill('Esa skill ya está agregada.')
      return
    }
    setErrorSkill('')
    setForm((prev) => ({ ...prev, skills: [...prev.skills, { nombre: valor, parametro_id: null }] }))
    setNuevaSkill('')
  }

  const quitarSkill = (nombre) => {
    const clave = claveSkill(nombre)
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => claveSkill(s.nombre) !== clave),
    }))
  }

  // Selecciona o deselecciona una skill del CATÁLOGO. El parametro_id se
  // guarda en la convocatoria: el backend toma el nombre del catálogo.
  const alternarSkillCatalogo = (parametro) => {
    const clave = claveSkill(parametro.nombre)
    const yaEsta = form.skills.some((s) => claveSkill(s.nombre) === clave)

    if (yaEsta) {
      setErrorSkill('')
      setForm((prev) => ({
        ...prev,
        skills: prev.skills.filter((s) => claveSkill(s.nombre) !== clave),
      }))
      return
    }

    if (form.skills.length >= MAX_SKILLS) {
      setErrorSkill(`No puedes registrar más de ${MAX_SKILLS} skills.`)
      return
    }

    setErrorSkill('')
    setForm((prev) => ({
      ...prev,
      skills: [...prev.skills, { nombre: parametro.nombre, parametro_id: parametro.id }],
    }))
  }

  const alternarDocumento = (identificador) => {
    // Los obligatorios fijos no se pueden quitar.
    if (esObligatorioFijo(identificador)) return
    setForm((prev) => {
      const documentos = prev.documentos.includes(identificador)
        ? prev.documentos.filter((c) => c !== identificador)
        : [...prev.documentos, identificador]
      return { ...prev, documentos, ...(repartoAuto ? { ponderaciones: repartoIgual(documentos) } : {}) }
    })
  }

  // Crea un documento NUEVO en el catálogo y lo suma (marcado) a esta
  // convocatoria. El gestor luego le pone su porcentaje como a cualquier otro.
  const agregarDocumentoCatalogo = async () => {
    if (guardandoRef.current) return
    const nombre = nuevoDocumento.trim()

    if (nombre.length < 3) {
      setErrorDocumento('Escribe un nombre de al menos 3 caracteres.')
      return
    }

    guardandoRef.current = true
    setGuardandoDocumento(true)
    setErrorDocumento('')

    try {
      const creado = await crearDocumentoCatalogo(nombre)
      const identificador = creado.codigo ?? creado.id

      setCatalogos((prev) => ({
        ...(prev ?? {}),
        tipo_documento: [...(prev?.tipo_documento ?? []), creado],
      }))

      setForm((prev) => {
        const documentos = prev.documentos.includes(identificador) ? prev.documentos : [...prev.documentos, identificador]
        return { ...prev, documentos, ...(repartoAuto ? { ponderaciones: repartoIgual(documentos) } : {}) }
      })

      setNuevoDocumento('')
    } catch (e) {
      setErrorDocumento(mensajeError(e))
    } finally {
      guardandoRef.current = false
      setGuardandoDocumento(false)
    }
  }

  // Catálogo de skills (tema skill_catalogo): es lo que el gestor puede
  // seleccionar. Las skills que NO vienen del catálogo (las escribió el gestor)
  // se listan aparte para poder quitarlas.
  const skillsCatalogo = catalogos?.skill_catalogo ?? []

  const skillEstaAgregada = (nombre) => {
    const clave = claveSkill(nombre)
    return form.skills.some((s) => claveSkill(s.nombre) === clave)
  }

  const skillsLibres = form.skills.filter((s) => !s.parametro_id)

  // Obligatorios fijos (siempre marcados y bloqueados) y opcionales que decide el gestor. El catálogo del backend trae
  // nombre e id reales, así que los fijos se ven siempre, incluso en convocatorias viejas que no los traen guardados.
  const catalogoDocumentos = catalogos?.tipo_documento ?? []
  const documentosObligatorios = DOCUMENTOS_OBLIGATORIOS
    .map((codigo) => catalogoDocumentos.find((d) => d.codigo === codigo))
    .filter(Boolean)
  const documentosOpcionales = catalogoDocumentos.filter((d) => !esObligatorioFijo(d.codigo))

  // ── Ponderación (%) de los documentos en la evaluación ──────────────
  // El porcentaje lo define el gestor para CADA convocatoria; no es un valor
  // global. Vacío = no configurado y la evaluación reparte el 100 % en partes
  // iguales (comportamiento histórico).
  const ponderacionDe = (codigo) => valorPonderacion(form, codigo)

  const cambiarPonderacion = (codigo, valor) => {
    // Solo números (con hasta dos decimales) y máximo 100.
    const limpio = String(valor).replace(/[^\d.]/g, '').slice(0, 6)
    setRepartoAuto(false)
    setForm((prev) => ({
      ...prev,
      ponderaciones: { ...prev.ponderaciones, [codigo]: limpio },
    }))
  }

  // Reparte el 100 % en partes iguales entre los documentos elegidos. El
  // último absorbe el redondeo para que la suma sea exactamente 100.
  const repartirPonderaciones = () => {
    if (form.documentos.length === 0) return
    setRepartoAuto(true)
    setForm((prev) => ({ ...prev, ponderaciones: repartoIgual(prev.documentos) }))
  }

  const sumaPonderaciones = () => sumaDePonderaciones(form)

  return {
    agregarDocumentoCatalogo,
    agregarSkill,
    alternarDocumento,
    alternarSkillCatalogo,
    cambiarPonderacion,
    documentosObligatorios,
    documentosOpcionales,
    errorDocumento,
    errorSkill,
    guardandoDocumento,
    mostrarNuevoDocumento,
    nuevaSkill,
    nuevoDocumento,
    ponderacionDe,
    quitarSkill,
    repartirPonderaciones,
    repartoAuto,
    setErrorDocumento,
    setMostrarNuevoDocumento,
    setNuevaSkill,
    setNuevoDocumento,
    skillEstaAgregada,
    skillsCatalogo,
    skillsLibres,
    sumaPonderaciones,
  }
}
