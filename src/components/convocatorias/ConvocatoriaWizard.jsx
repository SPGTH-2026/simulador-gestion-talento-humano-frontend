import { useEffect, useMemo, useRef, useState } from 'react'
import { listaParametros } from '../../api/convocatorias'
import {
  DOCUMENTOS_OBLIGATORIOS,
  esObligatorioFijo,
  etiquetasDocumento,
} from '../../lib/documentosConvocatoria'
import Chip from './Chip'
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
  { numero: 4, nombre: 'Fechas' },
  { numero: 5, nombre: 'Documentos' },
]

// A qué etapa pertenece cada campo, para saltar al primer error del servidor.
const ETAPA_DE_CAMPO = {
  nombre: 1,
  cargo: 1,
  area: 1,
  vacantes: 1,
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
  skills: 3,
  fecha_apertura: 4,
  fecha_cierre: 4,
  fecha_evaluacion: 4,
  documentos: 5,
}

// Campos que se marcan en rojo al pulsar "Siguiente" (no bloquean el avance);
// el servidor los exige de verdad al publicar.
const OBLIGATORIOS_ETAPA = {
  1: ['nombre', 'cargo', 'area'],
  2: ['descripcion'],
  4: ['fecha_apertura', 'fecha_cierre'],
}

const TEMAS_CLASIFICACION = ['tipo_convocatoria', 'tipo_empleo', 'tipo_contrato', 'modalidad']

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
    skills: Array.isArray(valores?.skills) ? valores.skills : [],
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
  useEffect(() => {
    const campos = Object.keys(errores ?? {})
    if (campos.length === 0) return
    const destino = ETAPA_DE_CAMPO[campos[0]]
    if (destino) setEtapa(destino)
    // Solo cuando cambian los errores entrantes.
  }, [errores])

  const errorDe = (campo) => erroresLocales[campo] ?? errores[campo]

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

  const agregarSkill = (texto) => {
    const valor = String(texto ?? '').trim()
    if (!valor) return
    if (valor.length > 100) {
      setErrorSkill('Cada skill debe tener máximo 100 caracteres.')
      return
    }
    if (form.skills.length >= 20) {
      setErrorSkill('No puedes registrar más de 20 skills.')
      return
    }
    if (form.skills.some((s) => s.toLowerCase() === valor.toLowerCase())) {
      setErrorSkill('Esa skill ya está agregada.')
      return
    }
    setErrorSkill('')
    setForm((prev) => ({ ...prev, skills: [...prev.skills, valor] }))
    setNuevaSkill('')
  }

  const quitarSkill = (nombre) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== nombre) }))
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

  const sugerenciasSkills = useMemo(() => {
    const ya = new Set(form.skills.map((s) => s.toLowerCase()))
    return (catalogos?.skill_tecnica ?? []).filter(
      (s) => !ya.has(String(s.nombre).toLowerCase()),
    )
  }, [catalogos, form.skills])

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
    setErroresLocales((prev) => ({ ...prev, ...faltantes }))
  }

  const siguiente = () => {
    validarEtapa(etapa)
    setEtapa((e) => Math.min(5, e + 1))
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
    skills: form.skills,
    documentos: form.documentos,
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

            <div className="flex flex-col gap-2 text-sm font-medium text-sena-azul dark:text-sena-texto">
              <span>Skills / Habilidades técnicas</span>

              {!soloLectura && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevaSkill}
                    maxLength={100}
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

              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((s) => (
                    <Chip key={s} onQuitar={soloLectura ? undefined : () => quitarSkill(s)}>
                      {s}
                    </Chip>
                  ))}
                </div>
              )}

              {!soloLectura && sugerenciasSkills.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-normal text-slate-500 dark:text-sena-texto-suave">
                    Sugerencias:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {sugerenciasSkills.map((s) => (
                      <Chip
                        key={s.id}
                        tipo="sugerida"
                        onClick={() => agregarSkill(s.nombre)}
                      >
                        {s.nombre}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              {errorSkill && (
                <span className="text-xs text-red-600 dark:text-red-400">{errorSkill}</span>
              )}
              {errorDe('skills') && (
                <span className="text-xs text-red-600 dark:text-red-400">{errorDe('skills')}</span>
              )}
            </div>
          </div>
        )}

        {etapa === 4 && (
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

        {etapa === 5 && (
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
            <Boton variante="secundario" onClick={guardar} disabled={guardando || publicando}>
              {guardando ? 'Guardando...' : 'Guardar borrador'}
            </Boton>

            {etapa < 5 && <Boton onClick={siguiente}>Siguiente →</Boton>}

            {etapa === 5 && puedePublicar && (
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
