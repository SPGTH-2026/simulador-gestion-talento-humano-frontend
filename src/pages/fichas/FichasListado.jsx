import { useFichasListado } from './useFichasListado'
import { NUEVA } from './useFichasListado'
import FilaFicha from './FilaFicha'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import Cargando from '../../components/ui/Cargando'
import EstadoVacio from '../../components/ui/EstadoVacio'
import Icono from '../../components/ui/Icono'
import { MensajeError, MensajeExito } from '../../components/ui/Mensaje'
import Tarjeta from '../../components/ui/Tarjeta'
import { CLASE_INPUT, CLASE_TABLA, CLASE_TBODY, CLASE_TD, CLASE_TH, CLASE_THEAD, CLASE_TITULO_PAGINA } from '../../lib/estilos'

const ESTADOS = [
  { valor: 'activa', etiqueta: 'Activa' },
  { valor: 'cerrada', etiqueta: 'Cerrada' },
]

// 'nueva' marca la fila del formulario de alta; un id, la edición de esa ficha.

export default function FichasListado() {
  const ctx = useFichasListado()
  const { cancelar, cargando, editandoId, empezarAlta, error, errores, exito, fichas, form, guardando, guardar, setForm } = ctx
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={CLASE_TITULO_PAGINA}>Fichas</h1>
          <p className="text-sm text-slate-500 dark:text-sena-texto-suave">
            La ficha que registras queda a tu nombre: tú la gestionas.
          </p>
        </div>

        {editandoId !== NUEVA && (
          <Boton onClick={empezarAlta}>
            <Icono nombre="mas" className="size-5 shrink-0" />
            Nueva ficha
          </Boton>
        )}
      </div>

      {error && <MensajeError>{error}</MensajeError>}
      {exito && <MensajeExito>{exito}</MensajeExito>}

      <Tarjeta className="@container overflow-x-auto">
        <table className={`${CLASE_TABLA} min-w-200`}>
          <thead className={CLASE_THEAD}>
            <tr>
              <th className={CLASE_TH}>Ficha</th>
              <th className={CLASE_TH}>Estado</th>
              <th className={CLASE_TH}>Dueño</th>
              <th className={CLASE_TH}>Instructores</th>
              <th className={CLASE_TH}>Convocatorias</th>
              <th className={CLASE_TH}>Personas</th>
              <th className={`${CLASE_TH} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody className={CLASE_TBODY}>
            {cargando && (
              <tr>
                <td colSpan="7">
                  <div className="sticky left-0 w-[100cqw]">
                    <Cargando>Cargando fichas…</Cargando>
                  </div>
                </td>
              </tr>
            )}

            {!cargando && editandoId === NUEVA && (
              <tr className="bg-sena-cielo/30 dark:bg-sena-superficie-alta/30">
                <td colSpan="7" className={CLASE_TD}>
                  <form onSubmit={guardar} className="flex flex-wrap items-end gap-3">
                    <Campo etiqueta="Código" requerido error={errores.codigo}>
                      <input
                        type="text"
                        value={form.codigo}
                        onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                        className={CLASE_INPUT}
                        placeholder="3173334"
                      />
                    </Campo>

                    <Campo etiqueta="Programa" requerido error={errores.nombre_programa}>
                      <input
                        type="text"
                        value={form.nombre_programa}
                        onChange={(e) => setForm({ ...form, nombre_programa: e.target.value })}
                        className={CLASE_INPUT}
                        placeholder="Análisis y Desarrollo de Software"
                      />
                    </Campo>

                    <Campo etiqueta="Estado" error={errores.estado}>
                      <select
                        value={form.estado}
                        onChange={(e) => setForm({ ...form, estado: e.target.value })}
                        className={CLASE_INPUT}
                      >
                        {ESTADOS.map((estado) => (
                          <option key={estado.valor} value={estado.valor}>
                            {estado.etiqueta}
                          </option>
                        ))}
                      </select>
                    </Campo>

                    <div className="ml-auto flex gap-2">
                      <Boton variante="contorno" onClick={cancelar}>
                        Cancelar
                      </Boton>
                      <Boton type="submit" disabled={guardando}>
                        {guardando ? 'Guardando...' : 'Crear ficha'}
                      </Boton>
                    </div>
                  </form>
                </td>
              </tr>
            )}

            {!cargando && fichas.length === 0 && editandoId !== NUEVA && (
              <tr>
                <td colSpan="7">
                  <EstadoVacio>No hay fichas registradas.</EstadoVacio>
                </td>
              </tr>
            )}

            {!cargando &&
              fichas.map((ficha) =>
                editandoId === ficha.id ? (
                  <tr key={ficha.id} className="bg-sena-cielo/30 dark:bg-sena-superficie-alta/30">
                    <td colSpan="7" className={CLASE_TD}>
                      <form onSubmit={guardar} className="flex flex-wrap items-end gap-3">
                        <Campo etiqueta="Código" requerido error={errores.codigo}>
                          <input
                            type="text"
                            value={form.codigo}
                            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                            className={CLASE_INPUT}
                          />
                        </Campo>

                        <Campo etiqueta="Programa" requerido error={errores.nombre_programa}>
                          <input
                            type="text"
                            value={form.nombre_programa}
                            onChange={(e) => setForm({ ...form, nombre_programa: e.target.value })}
                            className={CLASE_INPUT}
                          />
                        </Campo>

                        <Campo etiqueta="Estado" error={errores.estado}>
                          <select
                            value={form.estado}
                            onChange={(e) => setForm({ ...form, estado: e.target.value })}
                            className={CLASE_INPUT}
                          >
                            {ESTADOS.map((estado) => (
                              <option key={estado.valor} value={estado.valor}>
                                {estado.etiqueta}
                              </option>
                            ))}
                          </select>
                        </Campo>

                        <div className="ml-auto flex gap-2">
                          <Boton variante="contorno" onClick={cancelar}>
                            Cancelar
                          </Boton>
                          <Boton type="submit" disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Guardar'}
                          </Boton>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <FilaFicha key={ficha.id} ficha={ficha} ctx={ctx} />
                ),
              )}
          </tbody>
        </table>
      </Tarjeta>
    </div>
  )
}
