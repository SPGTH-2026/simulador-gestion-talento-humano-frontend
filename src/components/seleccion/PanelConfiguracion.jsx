import { isValidElement } from 'react'
import { usePanelConfiguracion } from './usePanelConfiguracion'
import Boton from '../ui/Boton'
import Campo from '../ui/Campo'
import Etiqueta from '../ui/Etiqueta'
import { MensajeAviso, MensajeError, MensajeExito } from '../ui/Mensaje'
import { CLASE_CAMPO, CLASE_CAJA_SUAVE, CLASE_TARJETA_PLANA, CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { OPCIONES_ACTIVIDADES, opcionPorId } from '../../lib/seleccion'

// Formulario a partir de la configuración que devolvió el servidor. Sin
// configurar (opcion null) no hay ninguna opción elegida.
const desdeConfiguracion = (c) => ({
  opcion: c.opcion,
  pesoEntrevista: String(c.entrevista?.activa && c.prueba_tecnica?.activa ? c.entrevista.peso : 50),
  pesoPrueba: String(c.entrevista?.activa && c.prueba_tecnica?.activa ? c.prueba_tecnica.peso : 50),
})

// Etiqueta del estado de la configuración. "Pendiente de configurar" (nunca se
// guardó) y "Sin actividades" (se guardó a propósito sin ellas) son cosas distintas.
function EstadoConfiguracion({ config }) {
  if (!config.configurada) return <Etiqueta tono="aviso">Pendiente de configurar</Etiqueta>
  if (config.opcion === 'sin_actividades') return <Etiqueta tono="neutral">Sin actividades</Etiqueta>
  return <Etiqueta tono="azul">{opcionPorId(config.opcion)?.etiqueta ?? config.opcion}</Etiqueta>
}

// Configuración de la entrevista y la prueba técnica de UNA convocatoria. Se pide
// al abrir la pestaña ('activo'), una sola vez; el padre lo monta con 'key' = id
// de la convocatoria, así que cambiar de convocatoria lo reinicia.
export default function PanelConfiguracion({ convocatoriaId, activo, puedeDecidir }) {
  const ctx = usePanelConfiguracion({ convocatoriaId, activo, puedeDecidir })
  // Mientras carga, falla o no está abierto, el hook devuelve la propia pantalla (un elemento de React) y no el contexto.
  if (ctx === null || isValidElement(ctx)) return ctx
  const { ambas, borrador, cambiarPeso, config, editable, editar, errorGeneral, errores, guardada, guardando, guardar, huboCambio, idGrupo, opcion, puedeGuardar, suma, unaSola } = ctx
  return (
    <form
      onSubmit={guardar}
      noValidate
      className={`${CLASE_TARJETA_PLANA} flex flex-col gap-5 p-4 @min-[600px]:p-5`}
      aria-busy={guardando}
    >
      <div className="flex flex-wrap items-center gap-3">
        <EstadoConfiguracion config={config} />
        {config.actualizada_por && (
          <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
            Actualizada por {config.actualizada_por}
          </p>
        )}
      </div>

      {config.bloqueada ? (
        <MensajeAviso>
          La configuración ya no se puede cambiar: esta convocatoria tiene calificaciones registradas.
        </MensajeAviso>
      ) : !config.editable ? (
        <MensajeAviso>
          Solo se puede configurar con la convocatoria publicada o en proceso (ahora está{' '}
          {config.estado_convocatoria === 'cerrada' ? 'cerrada' : config.estado_convocatoria === 'borrador' ? 'en borrador' : config.estado_convocatoria}
          ).
        </MensajeAviso>
      ) : !puedeDecidir ? (
        <MensajeAviso>Puedes consultar la configuración, pero tu rol no permite modificarla.</MensajeAviso>
      ) : null}

      <fieldset disabled={!editable || guardando} className="flex min-w-0 flex-col gap-3">
        <legend className={`mb-1 text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
          Actividades presenciales
        </legend>
        <div className="grid gap-3 @min-[520px]:grid-cols-2">
          {OPCIONES_ACTIVIDADES.map((o) => {
            const elegida = borrador.opcion === o.id
            return (
              <label
                key={o.id}
                className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 has-disabled:cursor-not-allowed has-disabled:opacity-70 has-focus-visible:ring-2 has-focus-visible:ring-sena/40 ${
                  elegida
                    ? 'border-sena bg-sena-fondo ring-1 ring-sena dark:bg-sena-superficie-alta'
                    : 'border-sena-linea/80 dark:border-sena-borde/60'
                }`}
              >
                <input
                  type="radio"
                  name={idGrupo}
                  value={o.id}
                  checked={elegida}
                  onChange={() => editar({ opcion: o.id })}
                  className="mt-1 size-4 shrink-0 accent-sena-oscuro"
                />
                <span className="flex min-w-0 flex-col">
                  <span className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>{o.etiqueta}</span>
                  <span className={`text-sm ${CLASE_TEXTO_SUAVE}`}>{o.ayuda}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {unaSola && (
        <div className={`${CLASE_CAJA_SUAVE} p-4`}>
          <p className={`text-sm ${CLASE_TEXTO_FUERTE}`}>
            {opcion.entrevista ? 'Entrevista' : 'Prueba técnica'}:{' '}
            <span className="font-semibold tabular-nums">peso 100 %</span>
          </p>
        </div>
      )}

      {ambas && (
        <div className={`${CLASE_CAJA_SUAVE} flex flex-col gap-4 p-4`}>
          <div className="grid gap-4 @min-[520px]:grid-cols-2">
            <Campo
              etiqueta="Peso de la entrevista (%)"
              error={errores.peso_entrevista}
              ayuda="Entero entre 1 y 99."
            >
              {({ id, describedby, invalid }) => (
                <input
                  id={id}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={borrador.pesoEntrevista}
                  onChange={(e) => cambiarPeso('entrevista', e.target.value)}
                  disabled={!editable || guardando}
                  aria-describedby={describedby}
                  aria-invalid={invalid || undefined}
                  className={CLASE_CAMPO}
                />
              )}
            </Campo>
            <Campo
              etiqueta="Peso de la prueba técnica (%)"
              error={errores.peso_prueba_tecnica}
              ayuda="Entero entre 1 y 99."
            >
              {({ id, describedby, invalid }) => (
                <input
                  id={id}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={borrador.pesoPrueba}
                  onChange={(e) => cambiarPeso('prueba', e.target.value)}
                  disabled={!editable || guardando}
                  aria-describedby={describedby}
                  aria-invalid={invalid || undefined}
                  className={CLASE_CAMPO}
                />
              )}
            </Campo>
          </div>
          <p
            aria-live="polite"
            className={`text-sm font-medium tabular-nums ${suma === 100 ? CLASE_TEXTO_SUAVE : 'text-aviso'}`}
          >
            Suma: {suma} % {suma === 100 ? '' : '(deben sumar 100 %)'}
          </p>
        </div>
      )}

      {errorGeneral && <MensajeError>{errorGeneral}</MensajeError>}
      {guardada && <MensajeExito>Configuración guardada.</MensajeExito>}

      {editable && (
        <div className="flex flex-wrap items-center gap-3">
          <Boton type="submit" tamano="tactil" ocupado={guardando} disabled={!puedeGuardar}>
            {guardando ? 'Guardando…' : 'Guardar configuración'}
          </Boton>
          {!huboCambio && borrador.opcion != null && !guardada && (
            <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Sin cambios por guardar.</p>
          )}
        </div>
      )}
    </form>
  )
}
