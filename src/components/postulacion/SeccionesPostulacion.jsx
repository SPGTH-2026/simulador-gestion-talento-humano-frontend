import { CLASE_CAJA_SUAVE } from '../../lib/estilos'
import Boton from '../ui/Boton'
import CamposDatosPersonales from './CamposDatosPersonales'
import IndicadorCompletitud from './IndicadorCompletitud'
import Icono from '../ui/Icono'
import SeccionDocumentosRequeridos from './SeccionDocumentosRequeridos'
import SeccionEnviarPostulacion from './SeccionEnviarPostulacion'
import SeccionSkills from './SeccionSkills'
import { EnvioCorreccion, ResumenCorreccion } from './CorreccionDocumentos'
import { usePostulacion } from './contextoPostulacion'

// Las secciones de la postulación del aspirante. Todas leen el mismo estado (ProveedorPostulacion), así que pueden ir en
// pestañas distintas o apiladas en una pantalla. Van por fases:
//   1) Datos personales (incluye la autorización de datos)  2) Documentos (con habilidades y envío).
// En pestañas, Documentos se abre solo cuando los datos están autorizados y guardados (`props.irA` salta de una a otra).

const CLASE_ERROR = 'rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300'

// Último error de cualquier sección. Va arriba de cada pestaña (o una sola vez cuando están apiladas).
export function AvisosPostulacion() {
  const { panel } = usePostulacion()
  if (!panel?.error) return null
  return (
    <p role="alert" className={CLASE_ERROR}>
      {panel.error}
    </p>
  )
}

export function PestanaDatosPersonales({ conAvisos = true }) {
  const { pantalla, panel, datos, props } = usePostulacion()
  if (pantalla) return pantalla

  const { editableDatos, motivo, vista } = panel
  // Enviada la postulación, los datos quedan fijos: para cambiarlos hay que retirarla y volver a postularse.
  const motivoBloqueo =
    vista.postulacion?.estado?.codigo === 'postulada'
      ? 'Tu postulación ya fue enviada. Para cambiar tus datos, retírala y vuelve a postularte.'
      : motivo

  return (
    <div className="flex flex-col gap-4">
      {conAvisos && <AvisosPostulacion />}
      <CamposDatosPersonales
        d={datos}
        editable={editableDatos}
        motivoBloqueo={motivoBloqueo}
        onContinuar={props.irA ? () => props.irA('documentos') : null}
      />
    </div>
  )
}

// Fase 2 bloqueada: sin datos autorizados no se llenan documentos ni se envía. Solo aplica con la postulación sin enviar
// (una enviada o retirada antes de este paso conserva su vista de documentos).
function DocumentosBloqueados({ irA }) {
  return (
    <section className={`${CLASE_CAJA_SUAVE} flex flex-col items-start gap-3 p-4`}>
      <h2 className="text-base font-semibold text-slate-800 dark:text-sena-texto">Primero tus datos personales</h2>
      <p className="text-sm text-slate-600 dark:text-sena-texto-suave">
        Para subir tus documentos y enviar la postulación, primero llena tus datos personales y autoriza su tratamiento.
      </p>
      <Boton variante="contorno" tamano="tactil" onClick={() => irA('datos')}>
        <Icono nombre="flechaIzquierda" className="size-4" />
        Ir a datos personales
      </Boton>
    </section>
  )
}

export function PestanaDocumentos({ conAvisos = true }) {
  const { pantalla, panel, datos, props } = usePostulacion()
  if (pantalla) return pantalla

  const { irA, onEnviado, onVerDocumentos, modoCorreccion = false } = props
  // Datos personales sin completar, sin autorizar o con cambios sin guardar: no se envía ni se vuelve a postular.
  const datosPendientes = !datos.listo
  const { asegurar, aviso, correccion, correccionVigente, corregidos, editable, enviandoCorreccion, enviarCorreccionAhora, esBorrador, esRetirada, infoCorreccion, marcados, motivo, motivoVolver, puedeVolver, reactivando, recargar, setError, sexo, vista, volverAPostularme } = panel

  const sinDatos = vista.datos_personales?.completo !== true
  // «Volver a postularme» exige además que los datos estén completos y guardados.
  const puedeVolverAhora = puedeVolver && !datosPendientes
  const motivoVolverAhora = datosPendientes ? 'Completa y autoriza tus datos personales para volver a postularte.' : motivoVolver
  if (irA && (sinDatos || datosPendientes) && (!vista.postulacion?.id || esBorrador)) return <DocumentosBloqueados irA={irA} />

  return (
    <div className="flex flex-col gap-4">
      {conAvisos && <AvisosPostulacion />}

      {irA && (
        <Boton variante="fantasma" tamano="tactil" onClick={() => irA('datos')} className="-ml-4 self-start">
          <Icono nombre="flechaIzquierda" className="size-4" />
          Datos personales
        </Boton>
      )}

      {esRetirada && (
        <p className="rounded bg-sena-cielo/20 p-3 text-sm text-slate-700 dark:bg-sena-superficie-alta dark:text-sena-texto-suave">
          {editable
            ? 'Tu postulación está retirada. Puedes seguir editando tus documentos y, cuando quieras, vuelve a postularte al final de esta página.'
            : motivo}
        </p>
      )}

      {!esRetirada && motivo && (
        <p className="rounded bg-sena-cielo/20 p-3 text-sm text-slate-700 dark:bg-sena-superficie-alta dark:text-sena-texto-suave">
          {motivo}
        </p>
      )}

      {aviso && (
        <p role="status" className="rounded bg-sena-cielo/30 p-3 text-sm text-sena-azul dark:bg-sena-superficie-alta dark:text-sena-texto">
          {aviso}
        </p>
      )}

      {!modoCorreccion && <IndicadorCompletitud estado={vista} />}

      {modoCorreccion && correccion && (
        <ResumenCorreccion resumen={correccion.correccion} total={marcados.size} corregidos={corregidos} />
      )}

      <SeccionDocumentosRequeridos
        vista={vista}
        editable={editable}
        sexo={sexo}
        asegurar={asegurar}
        onRecargar={recargar}
        onError={setError}
        correccion={infoCorreccion}
        soloCorreccion={modoCorreccion}
        bloqueoCorreccion={correccionVigente}
      />

      {modoCorreccion && correccion && (
        <EnvioCorreccion
          resumen={correccion.correccion}
          total={marcados.size}
          corregidos={corregidos}
          enviando={enviandoCorreccion}
          onEnviar={enviarCorreccionAhora}
        />
      )}

      {!modoCorreccion && (
        <SeccionSkills
          vista={vista}
          // Durante una corrección vigente solo se reemplazan los documentos marcados: las habilidades no se editan.
          editable={editable && !correccionVigente}
          asegurar={asegurar}
          onRecargar={recargar}
          onError={setError}
        />
      )}

      {!modoCorreccion && esBorrador && editable && (
        <SeccionEnviarPostulacion
          estado={vista}
          datosPendientes={datosPendientes}
          onExito={() => onEnviado?.()}
          onError={setError}
          onRecargar={recargar}
        />
      )}

      {esRetirada && (
        <div className={`${CLASE_CAJA_SUAVE} flex flex-wrap items-center justify-between gap-3 p-3`}>
          <p className="text-sm text-slate-600 dark:text-sena-texto-suave">
            {puedeVolverAhora
              ? 'Tus documentos obligatorios están completos.'
              : motivoVolverAhora}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {onVerDocumentos && (
              <Boton variante="contorno" tamano="tactil"
                onClick={() => onVerDocumentos(vista.postulacion.id)}>
                Ver documentos
              </Boton>
            )}
            <Boton variante="primario" tamano="tactil"
              disabled={!puedeVolverAhora || reactivando}
              title={puedeVolverAhora ? undefined : motivoVolverAhora}
              onClick={volverAPostularme}>
              {reactivando ? 'Postulando...' : 'Volver a postularme'}
            </Boton>
          </div>
        </div>
      )}
    </div>
  )
}
