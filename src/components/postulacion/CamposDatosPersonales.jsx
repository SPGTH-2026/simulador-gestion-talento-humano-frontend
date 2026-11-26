import { CLASE_CAJA_SUAVE, CLASE_CAMPO, CLASE_TARJETA, CLASE_TEXTO_SUAVE, CLASE_TITULO_SECCION } from '../../lib/estilos'
import { EDAD_MINIMA, ID_SECCION_DATOS } from '../../lib/datosPersonales'
import AutorizacionDatos from './AutorizacionDatos'
import Boton from '../ui/Boton'
import Campo from '../ui/Campo'
import GrupoSexo from './GrupoSexo'
import MarcaObligatorio from '../ui/MarcaObligatorio'
import Icono from '../ui/Icono'

// Sección «Datos personales» de ESTA postulación (cada convocatoria empieza en blanco). El estado y el guardado viven en
// useSeccionDatosPersonales (`d`); aquí solo se dibuja. No hay botón de guardar: los datos se guardan al autorizar su
// tratamiento (ver AutorizacionDatos) y, ya autorizados, al salir de cada campo.
//
// Con menos de 16 años avisa al instante y no deja continuar; con 16 o 17 años pide los datos del representante legal.
// El servidor repite las mismas reglas.
export default function CamposDatosPersonales({ d, editable, motivoBloqueo, onContinuar = null }) {
  const { bajoMinimo, campo, cambiar, catalogos, errorDe, esMenor, form, municipios, municipiosRepresentante } = d

  return (
    <section id={ID_SECCION_DATOS} className={`${CLASE_TARJETA} scroll-mt-24 p-4`}>
      <h2 className={CLASE_TITULO_SECCION}>Datos personales</h2>
      <p className={`mt-0.5 text-sm ${CLASE_TEXTO_SUAVE}`}>
        Llénalos para esta postulación. Los campos con * son obligatorios.
      </p>

      {/* Sin botón de guardar: en cuanto el formulario está completo se guarda solo (ver useSeccionDatosPersonales). */}
      <form onSubmit={(e) => e.preventDefault()} noValidate className="mt-3 flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Campo etiqueta="Nombres" requerido error={errorDe('nombres')}>
            <input type="text" autoComplete="given-name" maxLength={100} className={CLASE_CAMPO} {...campo('nombres')} />
          </Campo>
          <Campo etiqueta="Apellidos" requerido error={errorDe('apellidos')}>
            <input type="text" autoComplete="family-name" maxLength={100} className={CLASE_CAMPO} {...campo('apellidos')} />
          </Campo>

          <Campo etiqueta="Tipo de documento" requerido error={errorDe('tipo_documento_identidad')}>
            <select className={CLASE_CAMPO} {...campo('tipo_documento_identidad')}>
              <option value="">Selecciona una opción</option>
              {catalogos.tiposDocumento.map((tipo) => (
                <option key={tipo.id} value={tipo.codigo}>{tipo.nombre}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Número de documento" requerido error={errorDe('numero_documento')}>
            <input type="text" inputMode="numeric" maxLength={20} className={CLASE_CAMPO} {...campo('numero_documento')} />
          </Campo>

          <Campo etiqueta="Fecha de nacimiento" requerido error={errorDe('fecha_nacimiento')}>
            <input type="date" className={CLASE_CAMPO} aria-invalid={bajoMinimo || undefined} {...campo('fecha_nacimiento')} />
          </Campo>
          <Campo etiqueta="Nivel de formación" requerido error={errorDe('nivel_formacion')}>
            <select className={CLASE_CAMPO} {...campo('nivel_formacion')}>
              <option value="">Selecciona una opción</option>
              {catalogos.nivelesFormacion.map((nivel) => (
                <option key={nivel.id} value={nivel.codigo}>{nivel.nombre}</option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Teléfono" requerido error={errorDe('telefono')}>
            <input type="tel" autoComplete="tel" maxLength={20} className={CLASE_CAMPO} {...campo('telefono')} />
          </Campo>
          <Campo etiqueta="Departamento" requerido error={errorDe('departamento')}>
            <select autoComplete="address-level1" className={CLASE_CAMPO} {...campo('departamento')}>
              <option value="">Selecciona un departamento</option>
              {catalogos.departamentos.map((departamento) => (
                <option key={departamento.codigo} value={departamento.codigo}>{departamento.nombre}</option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Municipio" requerido error={errorDe('municipio')}>
            <select
              autoComplete="address-level2"
              className={CLASE_CAMPO}
              {...campo('municipio')}
              disabled={!form.departamento || !editable}
            >
              <option value="">{form.departamento ? 'Selecciona un municipio' : 'Primero elige el departamento'}</option>
              {municipios.map((municipio) => (
                <option key={municipio.codigo} value={municipio.codigo}>{municipio.nombre}</option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Dirección (opcional)" error={errorDe('direccion')}>
            <input type="text" autoComplete="street-address" maxLength={150} className={CLASE_CAMPO} {...campo('direccion')} />
          </Campo>
        </div>

        <GrupoSexo
          valor={form.sexo}
          onCambio={(codigo) => cambiar('sexo', codigo)}
          deshabilitado={!editable}
          error={errorDe('sexo')}
        />

        {esMenor && (
          <fieldset className={`${CLASE_CAJA_SUAVE} flex min-w-0 flex-col gap-3 p-3`} disabled={!editable}>
            <legend className="px-1 text-sm font-semibold text-sena-azul dark:text-sena-texto">Representante legal</legend>
            <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
              Como tienes entre {EDAD_MINIMA} y 17 años, necesitamos los datos de tu representante legal para poder localizarlo.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Campo etiqueta="Nombre completo" requerido error={errorDe('representante_nombre')}>
                <input type="text" maxLength={150} className={CLASE_CAMPO} {...campo('representante_nombre')} />
              </Campo>
              <Campo etiqueta="Parentesco" requerido error={errorDe('representante_parentesco')}>
                <input type="text" maxLength={40} placeholder="Madre, padre, tutor…" className={CLASE_CAMPO} {...campo('representante_parentesco')} />
              </Campo>
              <Campo etiqueta="Tipo de documento" requerido error={errorDe('representante_tipo_documento')}>
                <select className={CLASE_CAMPO} {...campo('representante_tipo_documento')}>
                  <option value="">Selecciona una opción</option>
                  {/* Es una persona adulta: no se ofrece la tarjeta de identidad. */}
                  {catalogos.tiposDocumento.filter((tipo) => tipo.codigo !== 'ti').map((tipo) => (
                    <option key={tipo.id} value={tipo.codigo}>{tipo.nombre}</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Número de documento" requerido error={errorDe('representante_documento')}>
                <input type="text" inputMode="numeric" maxLength={20} className={CLASE_CAMPO} {...campo('representante_documento')} />
              </Campo>
              <Campo etiqueta="Teléfono" requerido error={errorDe('representante_telefono')}>
                <input type="tel" maxLength={20} className={CLASE_CAMPO} {...campo('representante_telefono')} />
              </Campo>
              <Campo etiqueta="Correo electrónico" requerido error={errorDe('representante_correo')}>
                <input type="email" autoComplete="off" maxLength={150} className={CLASE_CAMPO} {...campo('representante_correo')} />
              </Campo>
              <Campo etiqueta="Teléfono alterno (opcional)" error={errorDe('representante_telefono_alterno')}>
                <input type="tel" maxLength={20} className={CLASE_CAMPO} {...campo('representante_telefono_alterno')} />
              </Campo>
              <Campo etiqueta="Departamento de residencia (opcional)" error={errorDe('representante_departamento')}>
                <select className={CLASE_CAMPO} {...campo('representante_departamento')}>
                  <option value="">Selecciona un departamento</option>
                  {catalogos.departamentos.map((departamento) => (
                    <option key={departamento.codigo} value={departamento.codigo}>{departamento.nombre}</option>
                  ))}
                </select>
              </Campo>
              <Campo etiqueta="Municipio de residencia (opcional)" error={errorDe('representante_municipio')}>
                <select
                  className={CLASE_CAMPO}
                  {...campo('representante_municipio')}
                  disabled={!form.representante_departamento || !editable}
                >
                  <option value="">{form.representante_departamento ? 'Selecciona un municipio' : 'Primero elige el departamento'}</option>
                  {municipiosRepresentante.map((municipio) => (
                    <option key={municipio.codigo} value={municipio.codigo}>{municipio.nombre}</option>
                  ))}
                </select>
              </Campo>
            </div>

            <div className="border-t border-sena-linea/70 pt-3 dark:border-sena-borde/50">
              <label className="flex items-start gap-3 text-sm leading-relaxed text-slate-700 dark:text-sena-texto">
                <input
                  type="checkbox"
                  checked={form.representante_conoce}
                  disabled={!editable}
                  onChange={(e) => cambiar('representante_conoce', e.target.checked)}
                  className="mt-1 size-4 shrink-0 accent-sena-oscuro dark:accent-sena-acento"
                />
                <span>
                  Declaro que mi representante legal conoce mi postulación.
                  <MarcaObligatorio />
                </span>
              </label>
              {errorDe('representante_conoce') && (
                <p role="alert" className="mt-1 pl-7 text-sm font-medium text-peligro">{errorDe('representante_conoce')}</p>
              )}
            </div>
          </fieldset>
        )}
      </form>

      <div className="mt-4 border-t border-sena-linea/70 pt-4 dark:border-sena-borde/50">
        <AutorizacionDatos d={d} editable={editable} />
      </div>

      {!editable && <p className={`mt-3 text-sm ${CLASE_TEXTO_SUAVE}`}>{motivoBloqueo}</p>}

      {/* Paso siguiente. Solo se ofrece cuando las secciones van en pestañas; bloqueado hasta autorizar los datos. */}
      {onContinuar && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-sena-linea/70 pt-4 dark:border-sena-borde/50">
          {!d.autorizado && (
            <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Completa tus datos y marca la autorización para continuar.</p>
          )}
          <Boton variante="primario" tamano="tactil" disabled={!d.autorizado || d.guardando} onClick={onContinuar}>
            Continuar a documentos
            <Icono nombre="flechaDerecha" className="size-4" />
          </Boton>
        </div>
      )}
    </section>
  )
}
