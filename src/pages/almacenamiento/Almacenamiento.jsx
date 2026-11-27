import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import CampoBusqueda from '../../components/ui/CampoBusqueda'
import Cargando from '../../components/ui/Cargando'
import EstadoVacio from '../../components/ui/EstadoVacio'
import Icono from '../../components/ui/Icono'
import { TarjetaSeccion } from '../../components/ui/Tarjeta'
import { MensajeError } from '../../components/ui/Mensaje'
import { formatearTamano } from '../../lib/postulacionDocumentos'
import {
  CLASE_FILA,
  CLASE_LISTA,
  CLASE_SUBTITULO_PAGINA,
  CLASE_TABLA,
  CLASE_TBODY,
  CLASE_TD,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_SUAVE,
  CLASE_TH,
  CLASE_THEAD,
  CLASE_TITULO_PAGINA,
} from '../../lib/estilos'
import { useAlmacenamiento } from './useAlmacenamiento'

// Motor de la base de datos, como se muestra al administrador.
const MOTORES = { pgsql: 'PostgreSQL (Supabase)', mysql: 'MySQL' }

// Capacidad: a partir de 1 GB se lee en GB (10,0 GB), no en MB (10240,0 MB).
function formatearCapacidad(bytes) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1).replace('.', ',')} GB`

  return formatearTamano(bytes)
}

// Porcentaje con coma decimal, como en el resto de la aplicación (1,2 %).
function formatearPorcentaje(porcentaje) {
  return `${porcentaje.toLocaleString('es-CO', { maximumFractionDigits: 1 })} %`
}

// Color de la barra según qué tan llena está: normal, ámbar desde el 70 % y rojo desde el 90 %.
function colorDeUso(porcentaje) {
  if (porcentaje >= 90) return 'bg-red-600'
  if (porcentaje >= 70) return 'bg-amber-500'

  return 'bg-sena'
}

// Barra de uso accesible: el nombre y el valor los lee un lector de pantalla.
function BarraUso({ porcentaje, nombre }) {
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-sena-hundido dark:bg-sena-superficie-alta"
      role="progressbar"
      aria-label={nombre}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.min(porcentaje, 100)}
      aria-valuetext={formatearPorcentaje(porcentaje)}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-200 ${colorDeUso(porcentaje)}`}
        style={{ width: `${Math.min(porcentaje, 100)}%` }}
      />
    </div>
  )
}

// Una fila del detalle: nombre, lo usado frente a la capacidad, y la barra. Sin barra si no se pudo medir.
function FilaUso({ titulo, subtitulo, uso, nombre }) {
  const medido = uso?.porcentaje != null

  return (
    <li className="flex flex-col gap-2 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <p className={`font-semibold ${CLASE_TEXTO_FUERTE}`}>{titulo}</p>
          {subtitulo && <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>{subtitulo}</p>}
        </div>
        {medido ? (
          <p className={`text-sm tabular-nums ${CLASE_TEXTO_SUAVE}`}>
            {formatearTamano(uso.usado_bytes)} de {formatearCapacidad(uso.limite_bytes)}
          </p>
        ) : (
          <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>No disponible en este momento.</p>
        )}
      </div>
      {medido && <BarraUso porcentaje={uso.porcentaje} nombre={nombre} />}
    </li>
  )
}

export default function Almacenamiento() {
  const { datos, cargando, error, recargar } = useAlmacenamiento()
  const [busqueda, setBusqueda] = useState('')

  // Filtro en la propia pantalla: el resumen ya trae todas las fichas del alcance (pocas), así que no hace falta pedir de nuevo.
  const fichas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    const lista = datos?.fichas ?? []
    if (!termino) return lista

    return lista.filter(
      (f) => f.codigo.toLowerCase().includes(termino) || (f.nombre_programa ?? '').toLowerCase().includes(termino),
    )
  }, [datos, busqueda])

  const esSuperAdmin = datos?.base !== undefined
  const uso = datos?.uso
  const totalMedido = uso?.porcentaje != null

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div>
          <h1 className={CLASE_TITULO_PAGINA}>Almacenamiento</h1>
          <p className={`text-sm ${CLASE_SUBTITULO_PAGINA}`}>Cuánto espacio usa el sistema y qué ocupa cada ficha.</p>
        </div>
        <Boton variante="contorno" onClick={recargar} ocupado={cargando && Boolean(datos)}>
          <Icono nombre="reintentar" className="size-4" />
          Actualizar
        </Boton>
      </header>

      {error && <MensajeError>{error}</MensajeError>}

      {cargando && !datos ? (
        <Cargando>Midiendo el almacenamiento…</Cargando>
      ) : datos ? (
        <>
          <TarjetaSeccion titulo="Uso del almacenamiento">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                <div>
                  <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Uso total</p>
                  <p className={`text-3xl font-semibold tabular-nums ${CLASE_TEXTO_FUERTE}`}>
                    {totalMedido ? formatearPorcentaje(uso.porcentaje) : '—'}
                  </p>
                </div>
                {totalMedido ? (
                  <p className={`text-sm tabular-nums ${CLASE_TEXTO_SUAVE}`}>
                    {formatearTamano(uso.usado_bytes)} de {formatearCapacidad(uso.limite_bytes)}
                  </p>
                ) : (
                  <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>No disponible en este momento.</p>
                )}
              </div>
              {totalMedido && <BarraUso porcentaje={uso.porcentaje} nombre="Uso de almacenamiento" />}
            </div>

            <ul className={`${CLASE_LISTA} mt-5 border-t border-sena-linea/70 pt-1 dark:border-sena-borde/50`}>
              {esSuperAdmin && (
                <FilaUso
                  titulo="Base de datos"
                  subtitulo={MOTORES[datos.base.motor] ?? datos.base.motor}
                  uso={uso?.base}
                  nombre="Uso de la base de datos"
                />
              )}
              {esSuperAdmin ? (
                <FilaUso
                  titulo="Documentos de todas las fichas"
                  subtitulo={`${datos.totales.documentos} documento(s) registrados`}
                  uso={uso?.documentos}
                  nombre="Uso de documentos"
                />
              ) : (
                <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4">
                  <div>
                    <p className={`font-semibold ${CLASE_TEXTO_FUERTE}`}>Documentos de tus fichas</p>
                    <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>{datos.totales.documentos} documento(s) registrados</p>
                  </div>
                  <p className={`text-sm tabular-nums ${CLASE_TEXTO_SUAVE}`}>{formatearTamano(datos.totales.bytes)}</p>
                </li>
              )}
            </ul>
          </TarjetaSeccion>

          <TarjetaSeccion titulo="Fichas">
            {datos.fichas.length === 0 ? (
              <EstadoVacio
                icono="🗂️"
                titulo="No tienes fichas a cargo"
                descripcion="Aquí aparecerán las fichas que administras y el espacio que usan sus documentos."
              />
            ) : (
              <div className="flex flex-col gap-4">
                <div role="search" aria-label="Filtrar fichas" className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <Campo etiqueta="Buscar por código o programa" className="sm:flex-1">
                    <CampoBusqueda
                      placeholder="Escribe para buscar…"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </Campo>
                </div>

                {fichas.length === 0 ? (
                  <EstadoVacio icono="🔎" titulo="Ninguna ficha coincide" descripcion="Prueba con otro código o nombre de programa." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className={CLASE_TABLA}>
                      <thead className={CLASE_THEAD}>
                        <tr>
                          <th className={CLASE_TH}>Ficha</th>
                          <th className={CLASE_TH}>Documentos</th>
                          <th className={CLASE_TH}>Espacio</th>
                          <th className={`${CLASE_TH} text-right`}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody className={CLASE_TBODY}>
                        {fichas.map((f) => (
                          <tr key={f.ficha_id} className={CLASE_FILA}>
                            <td className={CLASE_TD}>
                              <div className={`font-semibold ${CLASE_TEXTO_FUERTE}`}>{f.codigo}</div>
                              <div className={`text-xs ${CLASE_TEXTO_SUAVE}`}>{f.nombre_programa}</div>
                            </td>
                            <td className={`${CLASE_TD} ${CLASE_TEXTO_FUERTE}`}>{f.documentos}</td>
                            <td className={CLASE_TD}>
                              <div className={CLASE_TEXTO_FUERTE}>
                                {f.almacenamiento.bytes == null ? 'No disponible' : formatearTamano(f.almacenamiento.bytes)}
                              </div>
                              {f.almacenamiento.objetos != null && (
                                <div className={`text-xs ${CLASE_TEXTO_SUAVE}`}>{f.almacenamiento.objetos} archivo(s)</div>
                              )}
                            </td>
                            <td className={`${CLASE_TD} text-right`}>
                              <Boton variante="fantasma" tamano="tactil" as={Link} to={`/almacenamiento/fichas/${f.ficha_id}`}>
                                Ver documentos
                                <Icono nombre="flechaDerecha" className="size-4" />
                              </Boton>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </TarjetaSeccion>

          <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
            El uso total compara la base de datos y los documentos con la capacidad de los planes. Cada documento cuenta con el
            tamaño que tenía al subirse, también los anteriores a la organización por ficha.
          </p>
        </>
      ) : null}
    </div>
  )
}
