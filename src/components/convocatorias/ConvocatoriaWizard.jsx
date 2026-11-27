import { useEffect, useId, useMemo, useRef, useState } from 'react'
import useCatalogosConvocatoria from './useCatalogosConvocatoria'
import useSkillsYDocumentos from './useSkillsYDocumentos'
import useNavegacionWizard from './useNavegacionWizard'
import useValidacionConvocatoria from './useValidacionConvocatoria'
import EtapaInformacionGeneral from './etapas/EtapaInformacionGeneral'
import EtapaDescripcion from './etapas/EtapaDescripcion'
import EtapaRequisitos from './etapas/EtapaRequisitos'
import EtapaSkills from './etapas/EtapaSkills'
import EtapaFechas from './etapas/EtapaFechas'
import EtapaDocumentos from './etapas/EtapaDocumentos'
import CabeceraWizard from './CabeceraWizard'
import MensajesWizard from './MensajesWizard'
import FilaDocumento from './FilaDocumento'
import PendientesPublicar from './PendientesPublicar'
import BarraWizard from './BarraWizard'
import PasosAsistente from './PasosAsistente'
import { construirPayload } from './convocatoriaWizardPayload'
import { errorDeSkillsDe, estadoDePasos } from './convocatoriaWizardPasos'
import Tarjeta from '../ui/Tarjeta'
import { CLASE_INPUT, CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { ETAPAS, TEMAS_CLASIFICACION, ULTIMA_ETAPA, formInicial, soloDigitos } from './convocatoriaWizardUtils'

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

  // Qué se intentó (guardar o publicar) y falló por faltantes: solo entonces se marcan en rojo los campos.
  const [intento, setIntento] = useState(null)
  const bloqueMensajes = useRef(null)
  // En móvil la lista de lo que falta empieza plegada: ocupaba media pantalla antes del formulario.
  const [resumenAbierto, setResumenAbierto] = useState(false)
  const idResumen = useId()
  const [form, setForm] = useState(() => formInicial(valoresIniciales))
  // Si el catálogo no carga, el motivo se muestra con la opción de reintentar:
  // sin él los selectores quedarían vacíos sin explicación.
  const [intentoCatalogo, setIntentoCatalogo] = useState(0)

  // Evita marcar "cambios sin guardar" por la carga inicial del catálogo.
  const formPrevio = useRef(form)
  // Ref con el último onCambio: el efecto de abajo lo lee sin depender de él (no re-dispara al cambiar la función).
  const onCambioRef = useRef(onCambio)
  useEffect(() => {
    onCambioRef.current = onCambio
  })
  const saltarSucio = useRef(false)

  // Catálogos y fichas del formulario: ver useCatalogosConvocatoria.
  const { catalogos, setCatalogos, errorCatalogo, setErrorCatalogo, fichas } = useCatalogosConvocatoria({
    esNueva,
    intentoCatalogo,
  })
  // Skills, documentos y sus porcentajes: ver useSkillsYDocumentos.
  const docs = useSkillsYDocumentos({ form, setForm, catalogos, setCatalogos })
  // Paso actual, saltos y foco: ver useNavegacionWizard.
  const { etapa, irAlPrimerError, irACampo, irAEtapa, siguiente, anterior } = useNavegacionWizard({
    etapaInicial,
    errores,
  })

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
    onCambioRef.current?.()
  }, [form])

  const errorDeSkills = useMemo(() => errorDeSkillsDe(errores), [errores])

  const cambiar = (campo) => (e) => {
    const valor = e.target.value
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  const cambiarSalario = (campo) => (e) => {
    const digitos = soloDigitos(e.target.value).slice(0, 12)
    setForm((prev) => ({ ...prev, [campo]: digitos }))
  }

  // Validación en vivo (faltantes, fechas y errores por campo): ver useValidacionConvocatoria.
  const { editable, avisosFechas, minimoFecha, erroresBor, erroresPub, pendientes, erroresDelIntento, errorDe } =
    useValidacionConvocatoria({ form, esNueva, fichas, soloLectura, puedePublicar, errores, intento })

  // La confirmación o el aviso del guardado puede quedar fuera de pantalla (el guardado se pulsa al final del paso).
  useEffect(() => {
    if (exito || aviso) bloqueMensajes.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [exito, aviso])

  // Guardar un borrador exige poco (ver REQUERIDOS_PUBLICAR); publicar, todo lo demás. Si falta algo se queda aquí, se
  // marca y se lleva al primer error. Solo lo que pasa la validación sale hacia el servidor.
  const guardar = () => {
    if (Object.keys(erroresBor).length > 0) {
      setIntento('guardar')
      irAlPrimerError(erroresBor)
      return
    }
    setIntento(null)
    onGuardar?.(construirPayload(form, { esNueva, fichas }), etapa)
  }
  const publicar = () => {
    if (Object.keys(erroresPub).length > 0) {
      setIntento('publicar')
      irAlPrimerError(erroresPub)
      return
    }
    setIntento(null)
    onPublicar?.(construirPayload(form, { esNueva, fichas }), etapa)
  }

  const campo = (campo) => ({
    value: form[campo],
    onChange: cambiar(campo),
    disabled: soloLectura,
    className: CLASE_INPUT,
    'data-campo': campo,
    'aria-invalid': errorDe(campo) ? true : undefined,
  })

  // Regla H: publicada con postulaciones deja los documentos bloqueados (además
  // del bloqueo global por estado de solo lectura).
  const documentosBloqueados = soloLectura || bloquearDocumentos

  // Una fila del paso de documentos (componente FilaDocumento). La usa el paso 6.
  const filaDocumento = (documento, fijo = false) => (
    <FilaDocumento
      key={documento.id}
      documento={documento}
      fijo={fijo}
      seleccionados={form.documentos}
      bloqueado={documentosBloqueados}
      ponderacion={docs.ponderacionDe}
      alternar={docs.alternarDocumento}
      ponderar={docs.cambiarPonderacion}
      itemsDe={docs.itemsDe}
      cambiarItems={docs.cambiarItems}
    />
  )

  // Contenido de cada paso. El formulario entero vive en un solo estado: al avanzar o retroceder no se pierde nada.
  // Cada etapa es un componente aparte (carpeta etapas/); recibe lo que usa en ctx.
  const ctx = {
    ...docs,
    avisosFechas,
    bloquearDocumentos,
    cambiar,
    cambiarSalario,
    campo,
    catalogos,
    documentosBloqueados,
    errorDe,
    errorDeSkills,
    esNueva,
    fichas,
    filaDocumento,
    form,
    minimoFecha,
    soloLectura,
    valoresIniciales,
  }
  const contenidoEtapas = {
    1: <EtapaInformacionGeneral ctx={ctx} />,
    2: <EtapaDescripcion ctx={ctx} />,
    3: <EtapaRequisitos ctx={ctx} />,
    4: <EtapaSkills ctx={ctx} />,
    5: <EtapaFechas ctx={ctx} />,
    6: <EtapaDocumentos ctx={ctx} />,
  }

  const pasos = estadoDePasos({ errores, erroresDelIntento, pendientes, puedePublicar, editable })
  const etapaActual = ETAPAS.find((e) => e.numero === etapa) ?? ETAPAS[0]
  const subtitulo = esNueva
    ? 'Completa los seis pasos. Puedes guardar un borrador en cualquier momento y publicar cuando esté lista.'
    : soloLectura
      ? 'Consulta los datos de la convocatoria.'
      : 'Edita los datos de la convocatoria y guarda los cambios cuando termines.'

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <CabeceraWizard
        titulo={titulo}
        estado={valoresIniciales?.estado}
        subtitulo={subtitulo}
        onVolver={onVolver}
      />

      <MensajesWizard
        refMensajes={bloqueMensajes}
        exito={exito}
        aviso={aviso}
        error={error}
        onVolver={onVolver}
        intento={intento}
        erroresDelIntento={erroresDelIntento}
        errorCatalogo={errorCatalogo}
        onReintentarCatalogo={() => {
          setErrorCatalogo('')
          setIntentoCatalogo((n) => n + 1)
        }}
        soloLectura={soloLectura}
        estadoNombre={valoresIniciales?.estado?.nombre}
      />

      {/* Escritorio: los pasos a la izquierda (fijos al desplazar) y el formulario a la derecha. Móvil: los pasos
          pasan arriba, plegados. */}
      <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start">
        <aside className="flex flex-col gap-3 lg:sticky lg:top-0">
          <PasosAsistente pasos={pasos} actual={etapa} onElegir={irAEtapa} />

          {puedePublicar && editable && (
            <PendientesPublicar
              pendientes={pendientes}
              resumenAbierto={resumenAbierto}
              setResumenAbierto={setResumenAbierto}
              idResumen={idResumen}
              irACampo={irACampo}
            />
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

          <BarraWizard
            etapa={etapa}
            esNueva={esNueva}
            soloLectura={soloLectura}
            puedePublicar={puedePublicar}
            guardando={guardando}
            publicando={publicando}
            anterior={anterior}
            siguiente={siguiente}
            guardar={guardar}
            publicar={publicar}
          />
        </div>
      </div>
    </div>
  )
}
