import { usePanelDocumentosPostulacion } from './usePanelDocumentosPostulacion'
import { postularse } from '../../api/postulaciones'
import { CLASE_CAJA_SUAVE } from '../../lib/estilos'
import IndicadorCompletitud from './IndicadorCompletitud'
import SeccionSexo from './SeccionSexo'
import SeccionDocumentosRequeridos from './SeccionDocumentosRequeridos'
import SeccionSkills from './SeccionSkills'
import SeccionAdicionales from './SeccionAdicionales'
import SeccionEnviarPostulacion from './SeccionEnviarPostulacion'
import Boton from '../ui/Boton'
import { EnvioCorreccion, ResumenCorreccion } from './CorreccionDocumentos'

// Panel reutilizable del paso único "llenar todo en la convocatoria" (doc 33).
//
// Funciona en dos escenarios:
//   1) SIN postulación (detalle de la convocatoria): dibuja las secciones desde
//      detalle.documentos / detalle.skills con todo en pendiente / No. La primera
//      acción de guardado dispara el BORRADOR SILENCIOSO (POST postularse), relee
//      el estado y continúa la acción. Solo mirar o elegir el sexo NO crea nada.
//   2) CON postulación (paso /postulaciones/:id/documentos): usa el GET de estado
//      como fuente de verdad.
//
// El estado del panel (GET /postulaciones/{id}/documentos) es la única fuente;
// se comparte con quien lo monta vía onEstadoChange (p. ej. para el encabezado).
export default function PanelDocumentosPostulacion({
  postulacionId = null,
  convocatoria = null,
  documentosConvocatoria = null,
  skillsConvocatoriaNombres = null,
  miPostulacion = null,
  onEstadoChange,
  onPostulacionCreada,
  onEnviado,
  onVerDocumentos,
  modoCorreccion = false,
  onCorreccionEnviada,
}) {
  const ctx = usePanelDocumentosPostulacion({ postulacionId, convocatoria, documentosConvocatoria, skillsConvocatoriaNombres, miPostulacion, onEstadoChange, onPostulacionCreada, onEnviado, onVerDocumentos, modoCorreccion, onCorreccionEnviada })
  const { alGuardarSexo, asegurar, aviso, correccion, correccionVigente, corregidos, editable, editableSexo, enviandoCorreccion, enviarCorreccionAhora, error, esBorrador, esRetirada, estado, infoCorreccion, marcados, motivo, motivoVolver, puedeVolver, reactivando, recargar, setError, sexo, vista, volverAPostularme } = ctx
  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="rounded bg-red-100 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
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

      {!modoCorreccion && (
        <SeccionSexo
          sexo={sexo}
          editable={editableSexo}
          onGuardado={alGuardarSexo}
          onError={setError}
        />
      )}

      {modoCorreccion && correccion && (
        <ResumenCorreccion correccion={correccion} total={marcados.size} corregidos={corregidos} />
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
          correccion={correccion}
          total={marcados.size}
          corregidos={corregidos}
          enviando={enviandoCorreccion}
          onEnviar={enviarCorreccionAhora}
        />
      )}

      {!modoCorreccion && (
        <>
          <SeccionSkills
            vista={vista}
            // Durante una corrección vigente solo se reemplazan los documentos marcados: las habilidades no se editan.
            editable={editable && !correccionVigente}
            asegurar={asegurar}
            onRecargar={recargar}
            onError={setError}
          />

          <SeccionAdicionales
            vista={vista}
            editable={editable}
            bloqueoCorreccion={correccionVigente}
            asegurar={asegurar}
            onRecargar={recargar}
            onError={setError}
          />
        </>
      )}

      {!modoCorreccion && esBorrador && editable && (
        <SeccionEnviarPostulacion
          estado={vista}
          onExito={() => onEnviado?.()}
          onError={setError}
          onRecargar={recargar}
        />
      )}

      {esRetirada && (
        <div className={`${CLASE_CAJA_SUAVE} flex flex-wrap items-center justify-between gap-3 p-3`}>
          <p className="text-sm text-slate-600 dark:text-sena-texto-suave">
            {puedeVolver
              ? 'Tus documentos obligatorios están completos.'
              : motivoVolver}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {onVerDocumentos && (
              <Boton variante="contorno" tamano="tactil"
                onClick={() => onVerDocumentos(vista.postulacion.id)}>
                Ver documentos
              </Boton>
            )}
            <Boton variante="primario" tamano="tactil"
              disabled={!puedeVolver || reactivando}
              title={puedeVolver ? undefined : motivoVolver}
              onClick={volverAPostularme}>
              {reactivando ? 'Postulando...' : 'Volver a postularme'}
            </Boton>
          </div>
        </div>
      )}
    </div>
  )
}
