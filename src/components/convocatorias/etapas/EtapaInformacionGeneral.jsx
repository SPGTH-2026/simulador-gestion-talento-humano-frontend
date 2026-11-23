import { CLASE_INPUT, CLASE_TEXTO_FUERTE } from '../../../lib/estilos'
import Campo from '../../ui/Campo'
import { formatearMiles } from '../convocatoriaWizardUtils'

// Etapa 1 del asistente de convocatorias. Recibe el estado y las acciones del asistente en la prop ctx.
export default function EtapaInformacionGeneral({ ctx }) {
  const { cambiar, cambiarSalario, campo, catalogos, errorDe, esNueva, fichas, form, soloLectura, valoresIniciales } = ctx
  return (
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
  )
}
