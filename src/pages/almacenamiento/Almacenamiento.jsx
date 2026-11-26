import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import CampoBusqueda from '../../components/ui/CampoBusqueda'
import Cargando from '../../components/ui/Cargando'
import EstadoVacio from '../../components/ui/EstadoVacio'
import Icono from '../../components/ui/Icono'
import Tarjeta from '../../components/ui/Tarjeta'
import { MensajeError } from '../../components/ui/Mensaje'
import { formatearTamano } from '../../lib/postulacionDocumentos'
import {
  CLASE_FILA,
  CLASE_META_DD,
  CLASE_META_DT,
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

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div>
          <h1 className={CLASE_TITULO_PAGINA}>Almacenamiento</h1>
          <p className={`text-sm ${CLASE_SUBTITULO_PAGINA}`}>Espacio que usan la base de datos y los documentos de cada ficha.</p>
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
          <section className="grid gap-3 sm:grid-cols-2" aria-label="Totales">
            {datos.base !== undefined && (
              <Tarjeta className="p-4">
                <p className={CLASE_META_DT}>Base de datos</p>
                <p className={`${CLASE_META_DD} text-lg`}>{formatearTamano(datos.base.bytes)}</p>
                <p className={`mt-1 text-xs ${CLASE_TEXTO_SUAVE}`}>{MOTORES[datos.base.motor] ?? datos.base.motor}</p>
              </Tarjeta>
            )}
            <Tarjeta className="p-4">
              {/* El super admin ve todas las fichas; el instructor y el aprendiz general, solo las suyas. */}
              <p className={CLASE_META_DT}>
                {datos.base !== undefined ? 'Documentos de todas las fichas' : 'Documentos de tus fichas'}
              </p>
              <p className={`${CLASE_META_DD} text-lg`}>{formatearTamano(datos.totales.bytes)}</p>
              <p className={`mt-1 text-xs ${CLASE_TEXTO_SUAVE}`}>{datos.totales.documentos} documento(s) registrados</p>
            </Tarjeta>
          </section>

          {datos.fichas.length === 0 ? (
            <EstadoVacio
              icono="🗂️"
              titulo="No tienes fichas a cargo"
              descripcion="Aquí aparecerán las fichas que administras y el espacio que usan sus documentos."
            />
          ) : (
            <>
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
                <Tarjeta className="overflow-x-auto">
                  <table className={`${CLASE_TABLA} min-w-175`}>
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
                </Tarjeta>
              )}
            </>
          )}

          <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
            Se mide la carpeta de cada ficha en el disco de documentos. Los archivos guardados antes de la organización por ficha
            no aparecen en ninguna ficha.
          </p>
        </>
      ) : null}
    </div>
  )
}
