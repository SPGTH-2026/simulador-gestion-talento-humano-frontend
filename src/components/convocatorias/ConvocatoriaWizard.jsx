import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { crearDocumentoCatalogo, listaParametros } from '../../api/convocatorias'
import { mensajeError } from '../../api/mensajeError'
import { listaFichas } from '../../api/fichas'
import {
  DOCUMENTOS_OBLIGATORIOS,
  esObligatorioFijo,
  etiquetasDocumento,
} from '../../lib/documentosConvocatoria'
import EtiquetaEstado from './EtiquetaEstado'
import Boton from '../ui/Boton'
import Campo from '../ui/Campo'
import Etiqueta from '../ui/Etiqueta'
import Mensaje, { MensajeAviso, MensajeError, MensajeExito } from '../ui/Mensaje'
import PasosAsistente from './PasosAsistente'
import Tarjeta from '../ui/Tarjeta'
import {
  CLASE_CAJA_SUAVE,
  CLASE_INPUT,
  CLASE_SUBTITULO_PAGINA,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_SUAVE,
  CLASE_TITULO_PAGINA,
} from '../../lib/estilos'
import { formatearFecha, hoyEnBogota } from '../../lib/ventanaPostulacion'
import Icono from '../ui/Icono'

const ETAPAS = [
  { numero: 1, nombre: 'Información general', descripcion: 'Datos básicos del cargo y sus condiciones laborales.' },
  { numero: 2, nombre: 'Descripción', descripcion: 'Qué hará la persona que ocupe el cargo.' },
  { numero: 3, nombre: 'Requisitos', descripcion: 'Formación, experiencia y competencias que se esperan.' },
  { numero: 4, nombre: 'Skills', descripcion: 'Habilidades técnicas que pide la convocatoria. Este paso es opcional.' },
  { numero: 5, nombre: 'Fechas', descripcion: 'Cuándo abre y cierra la convocatoria, y cuándo se evalúa.' },
  {
    numero: 6,
    nombre: 'Documentos',
    descripcion: 'Qué debe entregar el aspirante y cuánto pesa cada documento en la evaluación.',
  },
]

// A qué etapa pertenece cada campo, para saltar al primer error del servidor.
const ETAPA_DE_CAMPO = {
  nombre: 1,
  cargo: 1,
  area: 1,
  vacantes: 1,
  ficha: 1,
  ficha_id: 1,
  tipo_convocatoria: 1,
  tipo_empleo: 1,
  tipo_contrato: 1,
  modalidad: 1,
  tipo_convocatoria_id: 1,
  tipo_empleo_id: 1,
  tipo_contrato_id: 1,
  modalidad_id: 1,
  salario_min: 1,
  salario_max: 1,
  descripcion: 2,
  funciones: 2,
  responsabilidades: 2,
  perfil_requerido: 2,
  formacion: 3,
  experiencia: 3,
  competencias: 3,
  conocimientos_especificos: 3,
  skills: 4,
  fecha_apertura: 5,
  fecha_cierre: 5,
  fecha_evaluacion: 5,
  documentos: 6,
}

// Qué se exige para PUBLICAR (el contrato actual del servidor: validarPublicacion). Para guardar un BORRADOR solo se
// exige el nombre (más la ficha si hay varias) y que lo escrito sea coherente (vacantes, salarios, fechas y porcentajes).
// Los pasos se pueden recorrer con un borrador incompleto: lo que falta se señala, no se bloquea.
const REQUERIDOS_PUBLICAR = {
  cargo: 'Escribe el cargo.',
  area: 'Escribe el área.',
  descripcion: 'Escribe la descripción del cargo.',
  fecha_apertura: 'Elige la fecha de apertura.',
  fecha_cierre: 'Elige la fecha de cierre.',
}

// Cómo se nombra cada dato en el resumen de lo que falta.
const ROTULO_CAMPO = {
  nombre: 'Nombre',
  ficha_id: 'Ficha',
  cargo: 'Cargo',
  area: 'Área',
  vacantes: 'Número de vacantes',
  salario_max: 'Rango salarial',
  descripcion: 'Descripción del cargo',
  fecha_apertura: 'Fecha de apertura',
  fecha_cierre: 'Fecha de cierre',
  fecha_evaluacion: 'Fecha de evaluación',
  documentos: 'Porcentajes de los documentos',
}

const TEMAS_CLASIFICACION = ['tipo_convocatoria', 'tipo_empleo', 'tipo_contrato', 'modalidad']

// Última etapa del asistente (Documentos).
const ULTIMA_ETAPA = 6

// Tope de skills de una convocatoria: el mismo que impone el backend
// (config/convocatorias.php: skills_max).
const MAX_SKILLS = 20

// Longitud máxima del nombre de una skill (skills_max del backend).
const MAX_SKILL_LONGITUD = 100

// Reparte el 100 % en partes iguales entre los documentos de la lista. El último absorbe el redondeo para que la suma
// sea exactamente 100.
function repartoIgual(documentos) {
  const total = documentos.length
  if (total === 0) return {}
  const base = Math.floor((100 / total) * 100) / 100
  const mapa = {}
  let acumulado = 0
  documentos.forEach((codigo, indice) => {
    const valor = indice === total - 1 ? Math.round((100 - acumulado) * 100) / 100 : base
    acumulado += valor
    mapa[codigo] = String(valor)
  })
  return mapa
}

function soloDigitos(valor) {
  return String(valor).replace(/\D/g, '')
}

function formatearMiles(digitos) {
  if (!digitos) return ''
  return Number(digitos).toLocaleString('es-CO')
}

function formInicial(valores) {
  return {
    nombre: valores?.nombre ?? '',
    codigo: valores?.codigo ?? '',
    cargo: valores?.cargo ?? '',
    area: valores?.area ?? '',
    vacantes: valores?.vacantes != null ? String(valores.vacantes) : '1',
    ficha_id: valores?.ficha?.id ? String(valores.ficha.id) : '',
    tipo_convocatoria: valores?.tipo_convocatoria?.codigo ?? '',
    tipo_empleo: valores?.tipo_empleo?.codigo ?? '',
    tipo_contrato: valores?.tipo_contrato?.codigo ?? '',
    modalidad: valores?.modalidad?.codigo ?? '',
    salario_min: valores?.salario_min != null ? String(Math.round(valores.salario_min)) : '',
    salario_max: valores?.salario_max != null ? String(Math.round(valores.salario_max)) : '',
    descripcion: valores?.descripcion ?? '',
    funciones: valores?.funciones ?? '',
    responsabilidades: valores?.responsabilidades ?? '',
    perfil_requerido: valores?.perfil_requerido ?? '',
    formacion: valores?.formacion ?? '',
    experiencia: valores?.experiencia ?? '',
    competencias: valores?.competencias ?? '',
    conocimientos_especificos: valores?.conocimientos_especificos ?? '',
    fecha_apertura: valores?.fecha_apertura?.slice(0, 10) ?? '',
    fecha_cierre: valores?.fecha_cierre?.slice(0, 10) ?? '',
    fecha_evaluacion: valores?.fecha_evaluacion?.slice(0, 10) ?? '',
    // Las skills se guardan como {nombre, parametro_id}: parametro_id apunta
    // al catálogo (tema skill_catalogo) y es null en el texto libre. Al
    // editar se lee 'skills_detalle' (con el id del catálogo); si la
    // convocatoria es vieja y solo trae 'skills' (nombres), se usa esa lista.
    skills: normalizarSkillsIniciales(valores),
    // En creación se siembran los obligatorios fijos (el backend los agrega
    // igual); en edición mandan los documentos reales del backend. Sembrarlos
    // aquí no cuenta como cambio: es el estado inicial del formulario.
    documentos: Array.isArray(valores?.documentos)
      ? valores.documentos.map((d) => d.codigo ?? d.id)
      : [...DOCUMENTOS_OBLIGATORIOS],
    // Porcentaje (%) de cada documento en la evaluación de ESTA convocatoria,
    // indexado por su identificador (código de catálogo o id si es un documento
    // nuevo). Vacío = no configurado (reparto equitativo).
    ponderaciones: Object.fromEntries(
      (Array.isArray(valores?.documentos) ? valores.documentos : [])
        .filter((d) => d && (d.codigo != null || d.id != null) && d.ponderacion != null)
        .map((d) => [d.codigo ?? d.id, String(d.ponderacion)]),
    ),
  }
}

function indexarCatalogos(grupos) {
  const mapa = {}
  for (const grupo of grupos ?? []) {
    mapa[grupo.tema] = grupo.parametros ?? []
  }
  return mapa
}

// Skills del formulario: siempre {nombre, parametro_id}. Acepta las tres
// formas que pueden venir del backend (skills_detalle, skills con objetos o
// skills con nombres sueltos) para que una convocatoria vieja siga editable.
function normalizarSkillsIniciales(valores) {
  const detalle = Array.isArray(valores?.skills_detalle) ? valores.skills_detalle : null

  if (detalle) {
    return detalle
      .filter((s) => s && s.nombre)
      .map((s) => ({
        nombre: String(s.nombre).trim(),
        parametro_id: s.parametro_id ?? null,
      }))
  }

  const simples = Array.isArray(valores?.skills) ? valores.skills : []

  return simples
    .map((s) => (typeof s === 'string' ? { nombre: s.trim(), parametro_id: null } : s))
    .filter((s) => s && s.nombre)
    .map((s) => ({ nombre: String(s.nombre).trim(), parametro_id: s.parametro_id ?? null }))
}

// Clave de comparación de una skill: sin mayúsculas ni espacios sobrantes.
function claveSkill(nombre) {
  return String(nombre ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export default function ConvocatoriaWizard({
  titulo = 'Nueva convocatoria',
  valoresIniciales = null,
  soloLectura = false,
  bloquearDocumentos = false,
  puedePublicar = true,
  // Paso con el que se abre (al guardar un borrador se vuelve a abrir en el mismo paso).
  etapaInicial = 1,
  errores = {},
  error = '',
  // 'exito': confirmación de un guardado. 'aviso': qué quedó guardado cuando algo falló después.
  exito = '',
  aviso = '',
  guardando = false,
  publicando = false,
  onGuardar,
  onPublicar,
  onVolver,
  onCambio,
}) {
  const esNueva = valoresIniciales == null

  const [etapa, setEtapa] = useState(etapaInicial)
  // Qué se intentó (guardar o publicar) y falló por faltantes: solo entonces se marcan en rojo los campos.
  const [intento, setIntento] = useState(null)
  // Cada cambio de este número vuelve a llevar el foco al campo o título pedido en 'enfocar'.
  const [pulsoFoco, setPulsoFoco] = useState(0)
  const enfocar = useRef(null)
  const bloqueMensajes = useRef(null)
  // En móvil la lista de lo que falta empieza plegada: ocupaba media pantalla antes del formulario.
  const [resumenAbierto, setResumenAbierto] = useState(false)
  const idResumen = useId()
  const [form, setForm] = useState(() => formInicial(valoresIniciales))
  const [catalogos, setCatalogos] = useState(null)
  // Si el catálogo no carga, el motivo se muestra con la opción de reintentar:
  // sin él los selectores quedarían vacíos sin explicación.
  const [errorCatalogo, setErrorCatalogo] = useState('')
  const [intentoCatalogo, setIntentoCatalogo] = useState(0)
  const [fichas, setFichas] = useState([])
  const [nuevaSkill, setNuevaSkill] = useState('')
  const [errorSkill, setErrorSkill] = useState('')

  // Documento NUEVO del catálogo (especialización, maestría, diplomado...).
  const [nuevoDocumento, setNuevoDocumento] = useState('')
  const [errorDocumento, setErrorDocumento] = useState('')
  const [guardandoDocumento, setGuardandoDocumento] = useState(false)
  const [mostrarNuevoDocumento, setMostrarNuevoDocumento] = useState(false)
  // 'Repartir en partes iguales' deja el reparto en automático: al marcar, quitar o agregar un documento se vuelve a repartir
  // solo (si no, el documento nuevo quedaba sin porcentaje y no se podía guardar). Escribir un porcentaje a mano lo apaga.
  const [repartoAuto, setRepartoAuto] = useState(false)

  // Evita marcar "cambios sin guardar" por la carga inicial del catálogo.
  const formPrevio = useRef(form)
  const saltarSucio = useRef(false)

  // Catálogo completo (agrupado por tema) para poblar selects, skills y documentos.
  useEffect(() => {
    let activo = true
    listaParametros()
      .then((res) => {
        if (!activo) return
        setCatalogos(indexarCatalogos(res.data))
        setErrorCatalogo('')
      })
      .catch((e) => {
        // El formulario igual se muestra (el backend valida), pero se avisa del
        // fallo con su motivo real y se permite reintentar.
        if (!activo) return
        setCatalogos((previo) => previo ?? {})
        setErrorCatalogo(mensajeError(e))
      })
    return () => {
      activo = false
    }
  }, [intentoCatalogo])

  // Fichas del alcance del usuario. Solo se piden al crear: si tiene una sola,
  // el backend la hereda de la sesión; si tiene varias, hay que elegir en cuál
  // se crea la convocatoria.
  useEffect(() => {
    if (!esNueva) return

    let activo = true
    listaFichas()
      .then((res) => {
        if (activo) setFichas(res.data ?? [])
      })
      .catch(() => {
        // Sin fichas el formulario igual se muestra; el backend avisa.
        if (activo) setFichas([])
      })
    return () => {
      activo = false
    }
  }, [esNueva])

  // Valor por defecto de las clasificaciones al crear.
  useEffect(() => {
    if (!catalogos || !esNueva) return
    saltarSucio.current = true
    setForm((prev) => {
      const siguiente = { ...prev }
      for (const tema of TEMAS_CLASIFICACION) {
        if (!siguiente[tema]) {
          const porDefecto = (catalogos[tema] ?? []).find((p) => p.es_defecto)
          if (porDefecto?.codigo) siguiente[tema] = porDefecto.codigo
        }
      }
      return siguiente
    })
  }, [catalogos, esNueva])

  // Avisa al contenedor de que hay cambios (para el aviso de "sin guardar" y para retirar la confirmación de un guardado
  // anterior). Se compara con el último formulario visto, y no con "primer render": en desarrollo React ejecuta los
  // efectos dos veces al montar y eso marcaba cambios (y borraba la confirmación) sin que nadie escribiera.
  useEffect(() => {
    if (formPrevio.current === form) return
    formPrevio.current = form
    if (saltarSucio.current) {
      saltarSucio.current = false
      return
    }
    onCambio?.()
    // onCambio es estable en los contenedores; no se incluye para no re-disparar.
  }, [form])

  // Si el servidor devuelve errores por campo, salta a la etapa del primero.
  // Los errores de skills llegan con la clave 'skills' (conjunto) o 'skills.N'
  // (un ítem): se busca la etapa por la clave base.
  useEffect(() => {
    const campos = Object.keys(errores ?? {})
    if (campos.length === 0) return
    const base = campos[0].split('.')[0]
    const destino = ETAPA_DE_CAMPO[campos[0]] ?? ETAPA_DE_CAMPO[base]
    if (destino) {
      setEtapa(destino)
      enfocar.current = campos[0]
      setPulsoFoco((n) => n + 1)
    }
    // Solo cuando cambian los errores entrantes.
  }, [errores])

  // El servidor manda; si no, lo que falta solo se muestra tras intentar guardar o publicar, y se recalcula al escribir.
  const errorDe = (campo) =>
    errores[campo] ?? (intento === 'publicar' ? erroresPub[campo] : intento === 'guardar' ? erroresBor[campo] : undefined)

  // Los errores de skills se agrupan: pueden venir en 'skills' y en
  // 'skills.0', 'skills.1'... (el backend los separa por conjunto e ítem).
  const errorDeSkills = useMemo(() => {
    const partes = []
    for (const [campo, mensaje] of Object.entries(errores ?? {})) {
      if (campo !== 'skills' && !campo.startsWith('skills.')) continue
      if (Array.isArray(mensaje)) partes.push(...mensaje.filter(Boolean))
      else if (mensaje) partes.push(String(mensaje))
    }
    return partes.join(' ')
  }, [errores])

  const cambiar = (campo) => (e) => {
    const valor = e.target.value
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const cambiarSalario = (campo) => (e) => {
    const digitos = soloDigitos(e.target.value).slice(0, 12)
    setForm((prev) => ({ ...prev, [campo]: digitos }))
  }

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
    const nombre = nuevoDocumento.trim()

    if (nombre.length < 3) {
      setErrorDocumento('Escribe un nombre de al menos 3 caracteres.')
      return
    }

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
      setGuardandoDocumento(false)
    }
  }

  // Catálogo de skills (tema skill_catalogo): es lo que el gestor puede
  // seleccionar. Antes se mostraban sugerencias del tema 'skill_tecnica';
  // ahora el catálogo es la única fuente (no se borra nada de la base de
  // datos: ese tema sigue existiendo y sirve para otras cosas).
  const skillsCatalogo = catalogos?.skill_catalogo ?? []

  const skillEstaAgregada = (nombre) => {
    const clave = claveSkill(nombre)
    return form.skills.some((s) => claveSkill(s.nombre) === clave)
  }

  // Skills que NO vienen del catálogo (las escribió el gestor): se listan
  // aparte para poder quitarlas. Las del catálogo ya se ven marcadas en su
  // casilla.
  const skillsLibres = form.skills.filter((s) => !s.parametro_id)

  // Etapa 5: obligatorios fijos (siempre marcados y bloqueados) y opcionales
  // que decide el gestor. El catálogo del backend trae nombre e id reales, así
  // que los fijos se ven siempre, incluso en convocatorias viejas que no los
  // traen guardados.
  const catalogoDocumentos = catalogos?.tipo_documento ?? []
  // Identificador estable de un documento: su código de catálogo o, si es un
  // documento NUEVO (sin código), su id.
  const identificadorDocumento = (documento) => documento.codigo ?? documento.id
  const documentosObligatorios = DOCUMENTOS_OBLIGATORIOS
    .map((codigo) => catalogoDocumentos.find((d) => d.codigo === codigo))
    .filter(Boolean)
  const documentosOpcionales = catalogoDocumentos.filter(
    (d) => !esObligatorioFijo(d.codigo),
  )

  // Regla H: publicada con postulaciones deja los documentos bloqueados (además
  // del bloqueo global por estado de solo lectura).
  const documentosBloqueados = soloLectura || bloquearDocumentos

  // ── Ponderación (%) de los documentos en la evaluación ──────────────
  // El porcentaje lo define el gestor para CADA convocatoria; no es un valor
  // global. Vacío = no configurado y la evaluación reparte el 100 % en partes
  // iguales (comportamiento histórico).
  const ponderacionDe = (codigo) => form.ponderaciones[codigo] ?? ''

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

  const sumaPonderaciones = () =>
    form.documentos.reduce((acc, codigo) => acc + (Number(ponderacionDe(codigo)) || 0), 0)

  // Devuelve el mensaje de error o null. Sin porcentajes configurados es válido.
  const validarPonderaciones = () => {
    const configurados = form.documentos.filter(
      (codigo) => String(ponderacionDe(codigo)).trim() !== '',
    )

    if (configurados.length === 0) return null

    if (configurados.length !== form.documentos.length) {
      return 'Define el porcentaje de todos los documentos: deben sumar 100%.'
    }

    const suma = sumaPonderaciones()
    if (Math.abs(suma - 100) > 0.01) {
      return `Los porcentajes de los documentos deben sumar 100% (suman ${Math.round(suma * 100) / 100}%).`
    }

    return null
  }

  // ── Validación: borrador y publicación ──────────────────────────────
  // Devuelve { campo: mensaje }. Nada de esto bloquea recorrer los pasos.
  const calcularErroresBorrador = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Escribe el nombre de la convocatoria.'
    if (esNueva && fichas.length > 1 && !form.ficha_id) e.ficha_id = 'Elige la ficha de la convocatoria.'

    if (form.vacantes !== '' && !(Number.isInteger(Number(form.vacantes)) && Number(form.vacantes) >= 1)) {
      e.vacantes = 'Las vacantes deben ser un número entero de 1 o más.'
    }
    if (form.salario_min !== '' && form.salario_max !== '' && Number(form.salario_max) < Number(form.salario_min)) {
      e.salario_max = 'El salario máximo debe ser mayor o igual que el mínimo.'
    }
    if (form.fecha_apertura && form.fecha_cierre && form.fecha_cierre < form.fecha_apertura) {
      e.fecha_cierre = 'La fecha de cierre debe ser posterior o igual a la de apertura.'
    }
    const errorPonderaciones = validarPonderaciones()
    if (errorPonderaciones) e.documentos = errorPonderaciones
    return e
  }

  const calcularErroresPublicacion = () => {
    const e = calcularErroresBorrador()
    for (const [campo, mensaje] of Object.entries(REQUERIDOS_PUBLICAR)) {
      if (!String(form[campo] ?? '').trim()) e[campo] ??= mensaje
    }
    // Solo el cierre se valida contra hoy (contrato RF-CON-011). Una apertura pasada es válida: la convocatoria queda abierta
    // al publicarla; se avisa en el paso 5 (avisosFechas) pero no se bloquea.
    const hoy = hoyEnBogota()
    if (form.fecha_cierre && form.fecha_cierre < hoy) {
      e.fecha_cierre ??= 'La fecha de cierre no puede estar en el pasado.'
    }
    return e
  }

  const editable = !soloLectura
  // Avisos informativos del paso 5. No cuentan como pendientes ni bloquean guardar o publicar: el contrato admite estos
  // casos y solo conviene que la persona sepa qué efecto tienen.
  const avisosFechas = []
  if (editable) {
    const hoyAviso = hoyEnBogota()
    if (puedePublicar && form.fecha_apertura && form.fecha_apertura < hoyAviso) {
      avisosFechas.push({
        clave: 'apertura',
        tono: 'info',
        texto: `La apertura (${formatearFecha(form.fecha_apertura)}) ya pasó: la convocatoria quedará abierta a los aspirantes apenas la publiques.`,
      })
    }
    if (form.fecha_evaluacion && form.fecha_cierre && form.fecha_evaluacion < form.fecha_cierre) {
      avisosFechas.push({
        clave: 'evaluacion-antes-cierre',
        tono: 'info',
        texto: `La evaluación empieza el ${formatearFecha(form.fecha_evaluacion)}, antes del cierre: desde ese día quienes ya enviaron su postulación no podrán editarla ni reemplazar documentos. Los aspirantes podrán seguir postulándose hasta el ${formatearFecha(form.fecha_cierre)}.`,
      })
    }
    if (form.fecha_evaluacion && form.fecha_apertura && form.fecha_evaluacion < form.fecha_apertura) {
      avisosFechas.push({
        clave: 'evaluacion-antes-apertura',
        tono: 'aviso',
        texto: 'La fecha de evaluación es anterior a la apertura. Revisa que sea la correcta.',
      })
    }
  }
  // Al publicar, el selector del CIERRE no ofrece días pasados (hoy en Colombia): es lo que exige el servidor. La apertura sí
  // admite una fecha pasada. Al editar una convocatoria ya publicada no hay mínimo.
  const minimoFecha = puedePublicar && editable ? hoyEnBogota() : undefined
  const erroresBor = editable ? calcularErroresBorrador() : {}
  const erroresPub = editable && puedePublicar ? calcularErroresPublicacion() : erroresBor
  // Lo que falta para publicar, agrupado por paso: guía permanente (también en un borrador recién creado).
  const pendientes = Object.keys(erroresPub).sort((x, y) => (ETAPA_DE_CAMPO[x] ?? 9) - (ETAPA_DE_CAMPO[y] ?? 9))
  const pendientesDeEtapa = (numero) => pendientes.filter((c) => ETAPA_DE_CAMPO[c] === numero).length
  const erroresDelIntento = intento === 'publicar' ? erroresPub : intento === 'guardar' ? erroresBor : {}

  // Lleva al primer paso con un error y deja el foco en su campo.
  const irAlPrimerError = (lista) => {
    const campo = Object.keys(lista).sort((x, y) => (ETAPA_DE_CAMPO[x] ?? 9) - (ETAPA_DE_CAMPO[y] ?? 9))[0]
    if (!campo) return
    enfocar.current = campo
    setEtapa(ETAPA_DE_CAMPO[campo] ?? etapa)
    setPulsoFoco((n) => n + 1)
  }

  const irACampo = (campo) => {
    enfocar.current = campo
    setEtapa(ETAPA_DE_CAMPO[campo] ?? etapa)
    setPulsoFoco((n) => n + 1)
  }

  const irAEtapa = (nueva) => {
    enfocar.current = '__titulo'
    setEtapa(nueva)
    setPulsoFoco((n) => n + 1)
  }

  const siguiente = () => irAEtapa(Math.min(ULTIMA_ETAPA, etapa + 1))
  const anterior = () => irAEtapa(Math.max(1, etapa - 1))

  // Foco tras cambiar de paso o saltar a un error: el campo con error o, si no se encuentra, el título del paso. Solo
  // toca el DOM (no estado), así que no provoca un segundo render.
  useEffect(() => {
    if (!enfocar.current) return
    const objetivo = enfocar.current
    enfocar.current = null
    const el =
      (objetivo !== '__titulo' && document.querySelector(`[data-campo="${objetivo}"]`)) ||
      document.getElementById(`paso-titulo-${etapa}`)
    if (!el) return
    el.focus({ preventScroll: true })
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [pulsoFoco, etapa])

  // La confirmación o el aviso del guardado puede quedar fuera de pantalla (el guardado se pulsa al final del paso).
  useEffect(() => {
    if (exito || aviso) bloqueMensajes.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [exito, aviso])

  const construirPayload = () => ({
    nombre: form.nombre.trim(),
    cargo: form.cargo.trim() || null,
    area: form.area.trim() || null,
    descripcion: form.descripcion.trim() || null,
    vacantes: form.vacantes === '' ? 1 : Number(form.vacantes),
    salario_min: form.salario_min === '' ? null : Number(form.salario_min),
    salario_max: form.salario_max === '' ? null : Number(form.salario_max),
    funciones: form.funciones.trim() || null,
    responsabilidades: form.responsabilidades.trim() || null,
    perfil_requerido: form.perfil_requerido.trim() || null,
    formacion: form.formacion.trim() || null,
    experiencia: form.experiencia.trim() || null,
    competencias: form.competencias.trim() || null,
    conocimientos_especificos: form.conocimientos_especificos.trim() || null,
    tipo_convocatoria: form.tipo_convocatoria || null,
    tipo_empleo: form.tipo_empleo || null,
    tipo_contrato: form.tipo_contrato || null,
    modalidad: form.modalidad || null,
    fecha_apertura: form.fecha_apertura || null,
    fecha_cierre: form.fecha_cierre || null,
    fecha_evaluacion: form.fecha_evaluacion || null,
    // Cada skill viaja con su parametro_id (catálogo) o sin él (texto libre).
    skills: form.skills.map((s) => ({
      nombre: s.nombre,
      parametro_id: s.parametro_id ?? null,
    })),
    documentos: form.documentos.map((identificador) => {
      const peso = String(form.ponderaciones[identificador] ?? '').trim()

      return {
        // Los documentos del catálogo viajan por código; los nuevos, por id.
        ...(typeof identificador === 'number'
          ? { id: identificador }
          : { codigo: identificador }),
        // null = sin configurar en esta convocatoria (reparto equitativo).
        ponderacion: peso === '' ? null : Number(peso),
      }
    }),
    // La ficha solo se manda al crear y solo si el usuario tiene más de una:
    // con una sola, el backend la hereda de la sesión. Al editar no se envía:
    // la convocatoria ya tiene ficha y no se puede mover.
    ...(esNueva && fichas.length > 1 ? { ficha_id: form.ficha_id || null } : {}),
  })

  // Guardar un borrador exige poco (ver REQUERIDOS_PUBLICAR); publicar, todo lo demás. Si falta algo se queda aquí, se
  // marca y se lleva al primer error. Solo lo que pasa la validación sale hacia el servidor.
  const guardar = () => {
    if (Object.keys(erroresBor).length > 0) {
      setIntento('guardar')
      irAlPrimerError(erroresBor)
      return
    }
    setIntento(null)
    onGuardar?.(construirPayload(), etapa)
  }
  const publicar = () => {
    if (Object.keys(erroresPub).length > 0) {
      setIntento('publicar')
      irAlPrimerError(erroresPub)
      return
    }
    setIntento(null)
    onPublicar?.(construirPayload(), etapa)
  }

  const campo = (campo) => ({
    value: form[campo],
    onChange: cambiar(campo),
    disabled: soloLectura,
    className: CLASE_INPUT,
    'data-campo': campo,
    'aria-invalid': errorDe(campo) ? true : undefined,
  })

  // Una fila del paso de documentos: casilla, nombre, etiquetas y su porcentaje.
  // El % solo se habilita cuando el documento está incluido en la convocatoria.
  const filaDocumento = (documento, fijo = false) => {
    const identificador = identificadorDocumento(documento)
    const incluido = fijo || form.documentos.includes(identificador)
    const deshabilitado = !incluido || documentosBloqueados

    return (
      <div
        key={documento.id}
        className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 p-3 dark:border-sena-borde"
      >
        <label className="flex flex-1 items-center gap-2 text-sm text-slate-700 dark:text-sena-texto">
          <input
            type="checkbox"
            checked={incluido}
            onChange={() => alternarDocumento(identificador)}
            readOnly={fijo}
            disabled={fijo || documentosBloqueados}
            className="h-4 w-4 accent-sena"
          />
          <span>{documento.nombre}</span>
          {etiquetasDocumento(documento.codigo).map((etiqueta) => (
            <Etiqueta key={etiqueta} tono="neutral">
              {etiqueta}
            </Etiqueta>
          ))}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={ponderacionDe(identificador)}
            onChange={(e) => cambiarPonderacion(identificador, e.target.value)}
            disabled={deshabilitado}
            aria-label={`Porcentaje de ${documento.nombre}`}
            placeholder="—"
            className={`${CLASE_INPUT} w-24 text-right`}
          />
          <span className="text-sm text-slate-500 dark:text-sena-texto-suave">%</span>
        </div>
      </div>
    )
  }

  // Contenido de cada paso. El formulario entero vive en un solo estado: al avanzar o retroceder no se pierde nada.
  const contenidoEtapas = {
    1: (
      <div className="flex flex-col gap-8">
        <section aria-labelledby="grupo-cargo" className="flex flex-col gap-4">
          <h3 id="grupo-cargo" className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
            Datos del cargo
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Campo etiqueta="Nombre de la convocatoria" requerido error={errorDe('nombre')} className="md:col-span-2">
              <input type="text" maxLength={150} {...campo('nombre')} />
            </Campo>

            <Campo etiqueta="Cargo" requerido error={errorDe('cargo')}>
              <input type="text" maxLength={120} {...campo('cargo')} />
            </Campo>

            <Campo etiqueta="Área" requerido error={errorDe('area')}>
              <input type="text" maxLength={120} {...campo('area')} />
            </Campo>

            {/* La ficha solo se elige si hay varias en el alcance del usuario.
                Al editar se muestra la de la convocatoria, pero no se cambia. */}
            {(esNueva ? fichas.length > 1 : Boolean(valoresIniciales?.ficha)) && (
              <Campo
                etiqueta="Ficha"
                requerido={esNueva}
                error={errorDe('ficha_id') ?? errorDe('ficha')}
              >
                <select
                  data-campo="ficha_id"
                  aria-invalid={errorDe('ficha_id') ? true : undefined}
                  value={esNueva ? form.ficha_id : String(valoresIniciales?.ficha?.id ?? '')}
                  onChange={cambiar('ficha_id')}
                  disabled={soloLectura || !esNueva}
                  className={CLASE_INPUT}
                >
                  <option value="">— Selecciona la ficha —</option>
                  {(esNueva ? fichas : [valoresIniciales.ficha]).map((ficha) => (
                    <option key={ficha.id} value={ficha.id}>
                      {ficha.codigo} · {ficha.nombre_programa}
                    </option>
                  ))}
                </select>
              </Campo>
            )}

            <Campo etiqueta="Número de vacantes" error={errorDe('vacantes')}>
              <input type="number" min={1} {...campo('vacantes')} />
            </Campo>

            {/* El código lo asigna el sistema al crear: solo se muestra cuando ya existe. */}
            {form.codigo && (
              <Campo etiqueta="Código">
                <input type="text" value={form.codigo} disabled readOnly className={CLASE_INPUT} />
              </Campo>
            )}
          </div>
        </section>

        <section aria-labelledby="grupo-condiciones" className="flex flex-col gap-4">
          <h3 id="grupo-condiciones" className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
            Condiciones laborales
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Campo etiqueta="Tipo de convocatoria" error={errorDe('tipo_convocatoria')}>
              <select {...campo('tipo_convocatoria')}>
                <option value="">— Selecciona —</option>
                {(catalogos?.tipo_convocatoria ?? []).map((p) => (
                  <option key={p.id} value={p.codigo}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo etiqueta="Tipo de empleo" error={errorDe('tipo_empleo')}>
              <select {...campo('tipo_empleo')}>
                <option value="">— Selecciona —</option>
                {(catalogos?.tipo_empleo ?? []).map((p) => (
                  <option key={p.id} value={p.codigo}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo etiqueta="Tipo de contrato" error={errorDe('tipo_contrato')}>
              <select {...campo('tipo_contrato')}>
                <option value="">— Selecciona —</option>
                {(catalogos?.tipo_contrato ?? []).map((p) => (
                  <option key={p.id} value={p.codigo}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo etiqueta="Modalidad" error={errorDe('modalidad')}>
              <select {...campo('modalidad')}>
                <option value="">— Selecciona —</option>
                {(catalogos?.modalidad ?? []).map((p) => (
                  <option key={p.id} value={p.codigo}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo
              etiqueta="Rango salarial (COP)"
              error={errorDe('salario_min') ?? errorDe('salario_max')}
              className="md:col-span-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Mínimo"
                  value={formatearMiles(form.salario_min)}
                  onChange={cambiarSalario('salario_min')}
                  disabled={soloLectura}
                  className={`${CLASE_INPUT} min-w-0`}
                />
                <span className="text-slate-400">—</span>
                <input
                  type="text"
                  inputMode="numeric"
                  data-campo="salario_max"
                  aria-invalid={errorDe('salario_max') ? true : undefined}
                  placeholder="Máximo"
                  value={formatearMiles(form.salario_max)}
                  onChange={cambiarSalario('salario_max')}
                  disabled={soloLectura}
                  className={`${CLASE_INPUT} min-w-0`}
                />
              </div>
            </Campo>
          </div>
        </section>
      </div>
    ),
    2: (
      <div className="flex flex-col gap-4">
        <Campo etiqueta="Descripción del cargo" requerido error={errorDe('descripcion')}>
          <textarea rows={4} {...campo('descripcion')} />
        </Campo>

        <Campo etiqueta="Funciones principales" error={errorDe('funciones')}>
          <textarea rows={4} {...campo('funciones')} />
        </Campo>

        <Campo etiqueta="Responsabilidades" error={errorDe('responsabilidades')}>
          <textarea rows={4} {...campo('responsabilidades')} />
        </Campo>

        <Campo etiqueta="Perfil requerido" error={errorDe('perfil_requerido')}>
          <textarea rows={4} {...campo('perfil_requerido')} />
        </Campo>
      </div>
    ),
    3: (
      <div className="flex flex-col gap-4">
        <Campo etiqueta="Formación académica requerida" error={errorDe('formacion')}>
          <textarea rows={3} {...campo('formacion')} />
        </Campo>

        <Campo etiqueta="Experiencia requerida" error={errorDe('experiencia')}>
          <textarea rows={3} {...campo('experiencia')} />
        </Campo>

        <Campo etiqueta="Competencias" error={errorDe('competencias')}>
          <textarea rows={3} {...campo('competencias')} />
        </Campo>

        <Campo etiqueta="Conocimientos específicos" error={errorDe('conocimientos_especificos')}>
          <textarea rows={3} {...campo('conocimientos_especificos')} />
        </Campo>
      </div>
    ),
    4: (
      <div className="flex flex-col gap-4">
        {/* Del catálogo: MISMO patrón que la etapa de Documentos (casillas
            en una rejilla). La casilla marcada es la skill guardada. */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
            Del catálogo
          </h3>
          <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
            Marca las habilidades técnicas que pide la convocatoria.
          </p>

          {skillsCatalogo.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-sena-texto-suave">
              No hay skills en el catálogo.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {skillsCatalogo.map((opcion) => (
                <label
                  key={opcion.id}
                  className="flex items-center gap-2 rounded border border-slate-200 p-3 text-sm text-slate-700 dark:border-sena-borde dark:text-sena-texto"
                >
                  <input
                    type="checkbox"
                    checked={skillEstaAgregada(opcion.nombre)}
                    onChange={() => alternarSkillCatalogo(opcion)}
                    disabled={soloLectura}
                    className="h-4 w-4 accent-sena"
                  />
                  <span>{opcion.nombre}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Texto libre: se escribe y se agrega. Solo se listan las que NO
            vienen del catálogo (las del catálogo ya se ven marcadas). */}
        {(!soloLectura || skillsLibres.length > 0) && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
              Agregar otra habilidad
            </h3>

            {!soloLectura && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevaSkill}
                  maxLength={MAX_SKILL_LONGITUD}
                  placeholder="Escribe una habilidad y presiona Enter"
                  onChange={(e) => setNuevaSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      agregarSkill(nuevaSkill)
                    }
                  }}
                  className={CLASE_INPUT + ' flex-1'}
                />
                <Boton onClick={() => agregarSkill(nuevaSkill)}>Agregar</Boton>
              </div>
            )}

            {skillsLibres.length > 0 && (
              <ul className="flex flex-col divide-y divide-slate-100 dark:divide-sena-borde">
                {skillsLibres.map((s) => (
                  <li
                    key={`${s.nombre}-${s.parametro_id ?? 'libre'}`}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <span className="min-w-0 break-words text-sm text-slate-700 dark:text-sena-texto">
                      {s.nombre}
                    </span>
                    {!soloLectura && (
                      <Boton
                          variante="peligroSuave"
                          aria-label={`Quitar ${s.nombre}`}
                          onClick={() => quitarSkill(s.nombre)}
                        >
                          Quitar
                        </Boton>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {form.skills.length > 0 && (
          <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
            {form.skills.length} de {MAX_SKILLS} skills agregadas.
          </p>
        )}

        {errorSkill && (
          <span className="text-xs text-red-600 dark:text-red-400">{errorSkill}</span>
        )}
        {errorDeSkills && (
          <span className="text-xs text-red-600 dark:text-red-400">{errorDeSkills}</span>
        )}
      </div>
    ),
    5: (
      <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Campo etiqueta="Fecha de apertura" requerido error={errorDe('fecha_apertura')}>
          <input type="date" {...campo('fecha_apertura')} />
        </Campo>

        <Campo etiqueta="Fecha de cierre" requerido error={errorDe('fecha_cierre')}>
          <input
            type="date"
            min={form.fecha_apertura && minimoFecha && form.fecha_apertura > minimoFecha ? form.fecha_apertura : minimoFecha}
            {...campo('fecha_cierre')}
          />
        </Campo>

        <Campo etiqueta="Fecha de evaluación" error={errorDe('fecha_evaluacion')}>
          <input type="date" {...campo('fecha_evaluacion')} />
        </Campo>
      </div>

      <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
        La fecha de evaluación es opcional: es el día en que empieza la evaluación de los candidatos. Desde esa fecha, quienes
        ya enviaron su postulación no pueden editarla ni reemplazar documentos. Recibir postulaciones nuevas depende solo de
        las fechas de apertura y de cierre.
      </p>

      {avisosFechas.map((a) => (
        <Mensaje key={a.clave} tipo={a.tono}>
          {a.texto}
        </Mensaje>
      ))}
      </div>
    ),    6: (
      <div className="flex flex-col gap-3">
        {/* Encabezado del paso con la acción de cargar un documento nuevo. */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500 dark:text-sena-texto-suave">
              Los cuatro primeros son obligatorios y no se pueden quitar. Los
              demás los eliges tú.
            </p>
            <p className="text-xs text-slate-400 dark:text-sena-texto-suave">
              Solo se aceptan archivos PDF.
            </p>
          </div>
          {!documentosBloqueados && (
            <Boton
              variante="contorno"
              tamano="tactil"
              onClick={() => {
                setMostrarNuevoDocumento((v) => !v)
                setErrorDocumento('')
              }}
            >
              Agregar nuevo documento
            </Boton>
          )}
        </div>

        {/* Alta de un documento que no está en el catálogo (especialización,
            maestría, diplomado...). Queda disponible para esta y otras
            convocatorias. */}
        {mostrarNuevoDocumento && !documentosBloqueados && (
          <div className="flex flex-col gap-2 rounded-lg border border-sena-azul/30 bg-white p-3 dark:border-sena-borde dark:bg-sena-superficie">
            <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
              Agrega un requisito que no está en el catálogo (por ejemplo
              Especialización o Maestría). Se sumará a esta convocatoria; luego
              le asignas su porcentaje.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={nuevoDocumento}
                onChange={(e) => setNuevoDocumento(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    agregarDocumentoCatalogo()
                  }
                }}
                maxLength={80}
                placeholder="Nombre del documento (ej. Especialización en SST)"
                className="min-w-56 flex-1 rounded border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto"
              />
              <Boton tamano="tactil" onClick={agregarDocumentoCatalogo} disabled={guardandoDocumento}>
                {guardandoDocumento ? 'Guardando…' : 'Agregar'}
              </Boton>
              <Boton
                variante="contorno"
                tamano="tactil"
                onClick={() => {
                  setMostrarNuevoDocumento(false)
                  setNuevoDocumento('')
                  setErrorDocumento('')
                }}
              >
                Cancelar
              </Boton>
            </div>
            {errorDocumento && (
              <span className="text-xs text-red-600 dark:text-red-400">{errorDocumento}</span>
            )}
          </div>
        )}

        {/* Porcentajes de la evaluación: propios de esta convocatoria. */}
        <div className="rounded-lg border border-sena-azul/20 bg-sena-cielo/20 p-3 dark:border-sena-borde dark:bg-sena-superficie-alta/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-sena-texto">
                Porcentaje de cada documento en la evaluación
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-sena-texto-suave">
                Define el peso de cada documento para calificar esta
                convocatoria. Si los dejas vacíos, todos valen lo mismo.
                {repartoAuto && ' El reparto es automático: se rehace solo al marcar o quitar documentos; si escribes un porcentaje a mano, deja de serlo.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`text-sm font-semibold ${
                  Math.abs(sumaPonderaciones() - 100) <= 0.01 && sumaPonderaciones() > 0
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-amber-700 dark:text-amber-300'
                }`}
              >
                Suma: {Math.round(sumaPonderaciones() * 100) / 100}%
              </span>
              {!documentosBloqueados && (
                <Boton variante="contorno" tamano="flexible" onClick={repartirPonderaciones}>
                  Repartir en partes iguales
                </Boton>
              )}
            </div>
          </div>
        </div>

        {errorDe('documentos') && (
          <span className="text-xs text-red-600 dark:text-red-400">{errorDe('documentos')}</span>
        )}
        {bloquearDocumentos && (
          <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
            La convocatoria ya tiene postulaciones: los documentos no se pueden cambiar.
          </p>
        )}

        {documentosObligatorios.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
              Obligatorios (no se pueden quitar)
            </h3>
            <div className="flex flex-col gap-2">
              {documentosObligatorios.map((d) => filaDocumento(d, true))}
            </div>
          </div>
        )}

        {documentosOpcionales.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
              Opcionales
            </h3>
            <div className="flex flex-col gap-2">
              {documentosOpcionales.map((d) => filaDocumento(d))}
            </div>
          </div>
        )}
      </div>
    ),
  }

  // Estado de cada paso para la lista lateral: 'rojos' (a corregir: el último intento falló o el servidor lo rechazó),
  // 'faltan' (lo que aún se necesita para publicar) y 'completo' (el paso exige algo y ya lo tiene).
  const pasos = ETAPAS.map((e) => {
    const rojos =
      Object.keys(errores ?? {}).filter((c) => (ETAPA_DE_CAMPO[c] ?? ETAPA_DE_CAMPO[c.split('.')[0]]) === e.numero).length +
      Object.keys(erroresDelIntento).filter((c) => ETAPA_DE_CAMPO[c] === e.numero).length
    const faltan = puedePublicar && editable ? pendientesDeEtapa(e.numero) : 0
    const exige = [1, 2, 5].includes(e.numero)
    return {
      numero: e.numero,
      nombre: e.nombre,
      rojos,
      faltan,
      completo: exige && puedePublicar && editable && faltan === 0 && rojos === 0,
      opcional: [3, 4, 6].includes(e.numero),
    }
  })
  const etapaActual = ETAPAS.find((e) => e.numero === etapa) ?? ETAPAS[0]
  const subtitulo = esNueva
    ? 'Completa los seis pasos. Puedes guardar un borrador en cualquier momento y publicar cuando esté lista.'
    : soloLectura
      ? 'Consulta los datos de la convocatoria.'
      : 'Edita los datos de la convocatoria y guarda los cambios cuando termines.'

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <header className="flex flex-col">
        <Boton variante="fantasma" tamano="tactil" onClick={onVolver} className="-ml-4 self-start">
          <Icono nombre="flechaIzquierda" className="size-4" />
          Volver al listado
        </Boton>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className={CLASE_TITULO_PAGINA}>{titulo}</h1>
          {valoresIniciales?.estado && (
            <EtiquetaEstado codigo={valoresIniciales.estado.codigo} nombre={valoresIniciales.estado.nombre} />
          )}
        </div>
        <p className={CLASE_SUBTITULO_PAGINA}>{subtitulo}</p>
      </header>

      <div ref={bloqueMensajes} className="flex scroll-mt-4 flex-col gap-3 empty:hidden">
        {exito && (
          <MensajeExito className="flex flex-wrap items-center justify-between gap-2">
            <span>{exito}</span>
            <Boton variante="contorno" tamano="tactil" onClick={onVolver}>
              Volver al listado
            </Boton>
          </MensajeExito>
        )}
        {aviso && <MensajeAviso>{aviso}</MensajeAviso>}
        {error && <MensajeError>{error}</MensajeError>}
      </div>

      {intento && Object.keys(erroresDelIntento).length > 0 && (
        <MensajeError>
          {intento === 'publicar' ? 'No se puede publicar todavía' : 'No se puede guardar todavía'}: revisa los pasos
          marcados ({Object.keys(erroresDelIntento).length}{' '}
          {Object.keys(erroresDelIntento).length === 1 ? 'dato' : 'datos'}).
        </MensajeError>
      )}

      {errorCatalogo && (
        <MensajeError className="flex flex-wrap items-center justify-between gap-2">
          <span>No se pudieron cargar las listas del formulario. {errorCatalogo}</span>
          <Boton
            type="button"
            variante="contorno"
            onClick={() => {
              setErrorCatalogo('')
              setIntentoCatalogo((n) => n + 1)
            }}
          >
            Reintentar
          </Boton>
        </MensajeError>
      )}

      {soloLectura && (
        <MensajeAviso>
          Esta convocatoria está {valoresIniciales?.estado?.nombre ?? 'cerrada'} y solo se puede
          consultar.
        </MensajeAviso>
      )}

      {/* Escritorio: los pasos a la izquierda (fijos al desplazar) y el formulario a la derecha. Móvil: los pasos
          pasan arriba, plegados. */}
      <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
        <aside className="flex flex-col gap-3 lg:sticky lg:top-0">
          <PasosAsistente pasos={pasos} actual={etapa} onElegir={irAEtapa} />

          {/* Lo que falta para publicar: guía permanente, no bloquea. Cada elemento lleva al campo. */}
          {puedePublicar && editable && (
            <section aria-label="Lo que falta para publicar" className={`${CLASE_CAJA_SUAVE} flex flex-col gap-1 p-3`}>
              <div className="flex items-center justify-between gap-2">
                <h2 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
                  {pendientes.length > 0 ? `Para publicar falta (${pendientes.length})` : 'Todo listo para publicar'}
                </h2>
                {pendientes.length > 0 && (
                  <Boton
                    variante="fantasma"
                    className="shrink-0 lg:hidden"
                    aria-expanded={resumenAbierto}
                    aria-controls={idResumen}
                    onClick={() => setResumenAbierto((a) => !a)}
                  >
                    {resumenAbierto ? 'Ocultar' : 'Ver'}
                  </Boton>
                )}
              </div>
              {pendientes.length > 0 ? (
                <>
                  <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Puedes guardar el borrador y completarlo después.</p>
                  <ul id={idResumen} className={`${resumenAbierto ? 'flex' : 'hidden'} flex-col items-start lg:flex`}>
                    {pendientes.map((c) => (
                      <li key={c}>
                        <Boton variante="enlace" tamano="flexible" className="text-left" onClick={() => irACampo(c)}>
                          {ROTULO_CAMPO[c] ?? c} · paso {ETAPA_DE_CAMPO[c]}
                        </Boton>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Ya están los datos que se exigen. Revisa los pasos y publica.</p>
              )}
            </section>
          )}
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <Tarjeta as="section" aria-labelledby={`paso-titulo-${etapa}`} className="p-4 sm:p-6">
            <header className="mb-6 flex flex-col gap-1">
              <h2
                id={`paso-titulo-${etapa}`}
                tabIndex={-1}
                className={`scroll-mt-4 text-lg font-bold focus:outline-none ${CLASE_TEXTO_FUERTE}`}
              >
                {etapaActual.nombre}
              </h2>
              <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
                Paso {etapa} de {ULTIMA_ETAPA} · {etapaActual.descripcion}
              </p>
            </header>
            {contenidoEtapas[etapa]}
          </Tarjeta>

        {/* En móvil la barra queda fija al borde inferior (como en el detalle): Anterior y Siguiente en una fila y Guardar
            debajo. Desde 'sm' vuelve a ser una fila normal, con Anterior a la izquierda y el resto a la derecha. */}
        <div className="grid grid-cols-2 gap-2 max-lg:sticky max-lg:-bottom-5 max-lg:z-10 max-lg:rounded-2xl max-lg:border max-lg:border-sena-linea max-lg:bg-white max-lg:p-2.5 max-lg:shadow-[0_-6px_16px_-8px_rgba(0,0,0,0.25)] dark:max-lg:border-sena-borde/70 dark:max-lg:bg-sena-superficie sm:flex sm:flex-wrap sm:items-center sm:justify-between">
          <Boton variante="contorno" onClick={anterior} disabled={etapa === 1} className={`${etapa === ULTIMA_ETAPA ? 'order-2' : 'order-1'} sm:order-none`}>
            <Icono nombre="flechaIzquierda" className="size-4" />
            Anterior
          </Boton>

          <div className="contents sm:flex sm:flex-wrap sm:gap-2">
            {/* Al CREAR se guarda un borrador (la convocatoria nace en borrador); al EDITAR se guardan cambios sobre una
                convocatoria que ya existe. En los dos casos el paso actual se conserva. */}
            {!soloLectura && (
              <Boton
                variante="contorno"
                onClick={guardar}
                ocupado={guardando}
                disabled={publicando}
                className={`order-3 sm:order-none sm:col-span-1 ${etapa === ULTIMA_ETAPA ? '' : 'col-span-2'}`}
              >
                {guardando ? 'Guardando…' : esNueva ? 'Guardar borrador' : 'Guardar cambios'}
              </Boton>
            )}

            {etapa < ULTIMA_ETAPA && (
              <Boton onClick={siguiente} className="order-2 sm:order-none">
                Siguiente
                <Icono nombre="flechaDerecha" className="size-4" />
              </Boton>
            )}

            {etapa === ULTIMA_ETAPA && puedePublicar && !soloLectura && (
              <Boton onClick={publicar} ocupado={publicando} disabled={guardando} className="order-1 col-span-2 sm:order-none sm:col-span-1">
                {publicando ? 'Publicando…' : 'Publicar convocatoria'}
              </Boton>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
