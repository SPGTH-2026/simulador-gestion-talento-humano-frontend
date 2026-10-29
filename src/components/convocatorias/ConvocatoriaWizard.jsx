import { useEffect, useMemo, useRef, useState } from 'react'
import { listaParametros } from '../../api/convocatorias'
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
import { MensajeAviso, MensajeError } from '../ui/Mensaje'
import Tarjeta from '../ui/Tarjeta'
import { CLASE_INPUT } from '../../lib/estilos'

const ETAPAS = [
  { numero: 1, nombre: 'Información general' },
  { numero: 2, nombre: 'Descripción' },
  { numero: 3, nombre: 'Requisitos' },
  { numero: 4, nombre: 'Skills' },
  { numero: 5, nombre: 'Fechas' },
  { numero: 6, nombre: 'Documentos' },
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

// Campos que se marcan en rojo al pulsar "Siguiente" (no bloquean el avance);
// el servidor los exige de verdad al publicar. La etapa de Skills (4) es
// opcional: no marca ningún campo.
const OBLIGATORIOS_ETAPA = {
  1: ['nombre', 'cargo', 'area'],
  2: ['descripcion'],
  5: ['fecha_apertura', 'fecha_cierre'],
}

const TEMAS_CLASIFICACION = ['tipo_convocatoria', 'tipo_empleo', 'tipo_contrato', 'modalidad']

// Última etapa del asistente (Documentos).
const ULTIMA_ETAPA = 6

// Tope de skills de una convocatoria: el mismo que impone el backend
// (config/convocatorias.php: skills_max).
const MAX_SKILLS = 20

// Longitud máxima del nombre de una skill (skills_max del backend).
const MAX_SKILL_LONGITUD = 100

// Botón de "Quitar" de una skill de texto libre.
const CLASE_QUITAR =
  'rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50'

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
      ? valores.documentos.map((d) => d.codigo)
      : [...DOCUMENTOS_OBLIGATORIOS],
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
  errores = {},
  error = '',
  guardando = false,
  publicando = false,
  onGuardar,
  onPublicar,
  onVolver,
  onCambio,
}) {
  const esNueva = valoresIniciales == null

  const [etapa, setEtapa] = useState(1)
  const [form, setForm] = useState(() => formInicial(valoresIniciales))
  const [catalogos, setCatalogos] = useState(null)
  const [fichas, setFichas] = useState([])
  const [erroresLocales, setErroresLocales] = useState({})
  const [nuevaSkill, setNuevaSkill] = useState('')
  const [errorSkill, setErrorSkill] = useState('')

  // Evita marcar "cambios sin guardar" por la carga inicial del catálogo.
  const primerRender = useRef(true)
  const saltarSucio = useRef(false)

  // Catálogo completo (agrupado por tema) para poblar selects, skills y documentos.
  useEffect(() => {
    let activo = true
    listaParametros()
      .then((res) => {
        if (activo) setCatalogos(indexarCatalogos(res.data))
      })
      .catch(() => {
        // Sin catálogos el formulario igual se muestra; el backend valida.
        if (activo) setCatalogos({})
      })
    return () => {
      activo = false
    }
  }, [])

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

  // Avisa al contenedor de que hay cambios (para el aviso de "sin guardar").
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false
      return
    }
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
    if (destino) setEtapa(destino)
    // Solo cuando cambian los errores entrantes.
  }, [errores])

  const errorDe = (campo) => erroresLocales[campo] ?? errores[campo]

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

  const limpiarErrorLocal = (campo) => {
    setErroresLocales((prev) => {
      if (!prev[campo]) return prev
      const copia = { ...prev }
      delete copia[campo]
      return copia
    })
  }

  const cambiar = (campo) => (e) => {
    const valor = e.target.value
    setForm((prev) => ({ ...prev, [campo]: valor }))
    limpiarErrorLocal(campo)
  }

  const cambiarSalario = (campo) => (e) => {
    const digitos = soloDigitos(e.target.value).slice(0, 12)
    setForm((prev) => ({ ...prev, [campo]: digitos }))
    limpiarErrorLocal(campo)
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

  const alternarDocumento = (codigo) => {
    // Los obligatorios fijos no se pueden quitar.
    if (esObligatorioFijo(codigo)) return
    setForm((prev) => ({
      ...prev,
      documentos: prev.documentos.includes(codigo)
        ? prev.documentos.filter((c) => c !== codigo)
        : [...prev.documentos, codigo],
    }))
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
  const documentosObligatorios = DOCUMENTOS_OBLIGATORIOS
    .map((codigo) => catalogoDocumentos.find((d) => d.codigo === codigo))
    .filter(Boolean)
  const documentosOpcionales = catalogoDocumentos.filter(
    (d) => !esObligatorioFijo(d.codigo),
  )

  // Regla H: publicada con postulaciones deja los documentos bloqueados (además
  // del bloqueo global por estado de solo lectura).
  const documentosBloqueados = soloLectura || bloquearDocumentos

  const validarEtapa = (numero) => {
    const campos = OBLIGATORIOS_ETAPA[numero] ?? []
    const faltantes = {}
    for (const campo of campos) {
      if (!String(form[campo] ?? '').trim()) faltantes[campo] = 'Obligatorio para publicar.'
    }
    // Con varias fichas en alcance hay que decir en cuál se crea.
    if (numero === 1 && esNueva && fichas.length > 1 && !form.ficha_id) {
      faltantes.ficha_id = 'Elige la ficha de la convocatoria.'
    }
    setErroresLocales((prev) => ({ ...prev, ...faltantes }))
  }

  const siguiente = () => {
    validarEtapa(etapa)
    setEtapa((e) => Math.min(ULTIMA_ETAPA, e + 1))
  }

  const anterior = () => setEtapa((e) => Math.max(1, e - 1))

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
    documentos: form.documentos,
    // La ficha solo se manda al crear y solo si el usuario tiene más de una:
    // con una sola, el backend la hereda de la sesión. Al editar no se envía:
    // la convocatoria ya tiene ficha y no se puede mover.
    ...(esNueva && fichas.length > 1 ? { ficha_id: form.ficha_id || null } : {}),
  })

  const guardar = () => onGuardar?.(construirPayload())
  const publicar = () => onPublicar?.(construirPayload())

  const campo = (campo) => ({
    value: form[campo],
    onChange: cambiar(campo),
    disabled: soloLectura,
    className: CLASE_INPUT,
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Boton variante="secundario" tamano="sm" onClick={onVolver}>
            ← Volver
          </Boton>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-sena-texto">{titulo}</h1>
        </div>
        {valoresIniciales?.estado && (
          <EtiquetaEstado
            codigo={valoresIniciales.estado.codigo}
            nombre={valoresIniciales.estado.nombre}
          />
        )}
      </div>

      {error && <MensajeError>{error}</MensajeError>}

      {soloLectura && (
        <MensajeAviso>
          Esta convocatoria está {valoresIniciales?.estado?.nombre ?? 'cerrada'} y solo se puede
          consultar.
        </MensajeAviso>
      )}

      {/* Pestañas: se pueden recorrer libremente; "Siguiente" marca obligatorios. */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 dark:border-sena-borde">
        {ETAPAS.map((e) => {
          const activa = etapa === e.numero
          return (
            <button
              key={e.numero}
              type="button"
              onClick={() => setEtapa(e.numero)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                activa
                  ? 'border-sena text-sena-azul dark:border-sena dark:text-sena-texto'
                  : 'border-transparent text-slate-500 hover:text-sena-azul dark:text-sena-texto-suave dark:hover:text-sena-texto'
              }`}
            >
              {e.numero}. {e.nombre}
            </button>
          )
        })}
      </div>

      <Tarjeta className="p-4">
        {etapa === 1 && (
          <div className="grid gap-4 md:grid-cols-2">
            <Campo etiqueta="Nombre de la convocatoria" requerido error={errorDe('nombre')}>
              <input type="text" maxLength={150} {...campo('nombre')} />
            </Campo>

            <Campo etiqueta="Código">
              <input
                type="text"
                value={form.codigo}
                disabled
                readOnly
                placeholder="Se genera automáticamente"
                className={CLASE_INPUT}
              />
            </Campo>

            <Campo etiqueta="Cargo" requerido error={errorDe('cargo')}>
              <input type="text" maxLength={120} {...campo('cargo')} />
            </Campo>

            <Campo etiqueta="Área" requerido error={errorDe('area')}>
              <input type="text" maxLength={120} {...campo('area')} />
            </Campo>

            <Campo etiqueta="Número de vacantes" error={errorDe('vacantes')}>
              <input type="number" min={1} {...campo('vacantes')} />
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

            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave md:col-span-2">
              Condiciones laborales
            </h2>

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
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Mín"
                  value={formatearMiles(form.salario_min)}
                  onChange={cambiarSalario('salario_min')}
                  disabled={soloLectura}
                  className={`${CLASE_INPUT} min-w-0`}
                />
                <span className="text-slate-400">—</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Máx"
                  value={formatearMiles(form.salario_max)}
                  onChange={cambiarSalario('salario_max')}
                  disabled={soloLectura}
                  className={`${CLASE_INPUT} min-w-0`}
                />
              </div>
            </Campo>
          </div>
        )}

        {etapa === 2 && (
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
        )}

        {etapa === 3 && (
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
        )}

        {/* Etapa 4: SKILLS. Es opcional. El gestor puede SELECCIONAR las
            skills del catálogo (tema skill_catalogo) y también AGREGAR las
            suyas en texto libre. Cada skill guardada lleva su parametro_id
            cuando viene del catálogo. */}
        {etapa === 4 && (
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
                    <Boton onClick={() => agregarSkill(nuevaSkill)}>+ Agregar</Boton>
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
                          <button
                            type="button"
                            onClick={() => quitarSkill(s.nombre)}
                            className={CLASE_QUITAR}
                          >
                            Quitar
                          </button>
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
        )}

        {etapa === 5 && (
          <div className="grid gap-4 md:grid-cols-3">
            <Campo etiqueta="Fecha de apertura" requerido error={errorDe('fecha_apertura')}>
              <input type="date" {...campo('fecha_apertura')} />
            </Campo>

            <Campo etiqueta="Fecha de cierre" requerido error={errorDe('fecha_cierre')}>
              <input type="date" {...campo('fecha_cierre')} />
            </Campo>

            <Campo etiqueta="Fecha de evaluación" error={errorDe('fecha_evaluacion')}>
              <input type="date" {...campo('fecha_evaluacion')} />
            </Campo>
          </div>
        )}

        {etapa === 6 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500 dark:text-sena-texto-suave">
              Los cuatro primeros son obligatorios y no se pueden quitar. Los
              demás los eliges tú.
            </p>
            <p className="text-xs text-slate-400 dark:text-sena-texto-suave">
              Solo se aceptan archivos PDF.
            </p>
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
                <div className="grid gap-2 sm:grid-cols-2">
                  {documentosObligatorios.map((d) => (
                    <label
                      key={d.id}
                      className="flex items-center gap-2 rounded border border-slate-200 p-3 text-sm text-slate-700 dark:border-sena-borde dark:text-sena-texto"
                    >
                      <input
                        type="checkbox"
                        checked
                        readOnly
                        disabled
                        className="h-4 w-4 accent-sena"
                      />
                      <span>{d.nombre}</span>
                      {etiquetasDocumento(d.codigo).map((etiqueta) => (
                        <Etiqueta key={etiqueta} tono="neutral">
                          {etiqueta}
                        </Etiqueta>
                      ))}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {documentosOpcionales.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
                  Opcionales
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {documentosOpcionales.map((d) => (
                    <label
                      key={d.id}
                      className="flex items-center gap-2 rounded border border-slate-200 p-3 text-sm text-slate-700 dark:border-sena-borde dark:text-sena-texto"
                    >
                      <input
                        type="checkbox"
                        checked={form.documentos.includes(d.codigo)}
                        onChange={() => alternarDocumento(d.codigo)}
                        disabled={documentosBloqueados}
                        className="h-4 w-4 accent-sena"
                      />
                      <span>{d.nombre}</span>
                      {etiquetasDocumento(d.codigo).map((etiqueta) => (
                        <Etiqueta key={etiqueta} tono="neutral">
                          {etiqueta}
                        </Etiqueta>
                      ))}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Tarjeta>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Boton variante="secundario" onClick={anterior} disabled={etapa === 1}>
          ← Anterior
        </Boton>

        {!soloLectura && (
          <div className="flex flex-wrap gap-2">
            {/* Al CREAR se guarda un borrador (la convocatoria nace en
                borrador); al EDITAR se guardan cambios sobre una convocatoria
                que ya existe. */}
            <Boton variante="secundario" onClick={guardar} disabled={guardando || publicando}>
              {guardando ? 'Guardando...' : esNueva ? 'Guardar borrador' : 'Guardar cambios'}
            </Boton>

            {etapa < ULTIMA_ETAPA && <Boton onClick={siguiente}>Siguiente →</Boton>}

            {etapa === ULTIMA_ETAPA && puedePublicar && (
              <Boton onClick={publicar} disabled={guardando || publicando}>
                {publicando ? 'Publicando...' : 'Publicar convocatoria'}
              </Boton>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
