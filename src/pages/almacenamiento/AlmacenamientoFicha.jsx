import { Link, useParams } from 'react-router-dom'
import Boton from '../../components/ui/Boton'
import Cargando from '../../components/ui/Cargando'
import EstadoVacio from '../../components/ui/EstadoVacio'
import Icono from '../../components/ui/Icono'
import Paginacion from '../../components/ui/Paginacion'
import Tarjeta from '../../components/ui/Tarjeta'
import { MensajeError, MensajeExito } from '../../components/ui/Mensaje'
import { formatearTamano } from '../../lib/postulacionDocumentos'
import { formatearFechaHora } from '../../lib/ventanaPostulacion'
import { useAuth } from '../../auth/useAuth'
import {
  CLASE_FILA,
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
import { useAlmacenamientoFicha } from './useAlmacenamientoFicha'

export default function AlmacenamientoFicha() {
  const { fichaId } = useParams()
  const a = useAlmacenamientoFicha(fichaId)
  const { can } = useAuth()
  // El aprendiz general solo ve (almacenamiento:ver); borrar exige almacenamiento:gestionar.
  const puedeBorrar = can('almacenamiento:gestionar')
  const marcados = a.seleccion.size

  return (
    <div className="flex flex-col gap-5">
      <Boton variante="fantasma" tamano="tactil" as={Link} to="/almacenamiento" className="-ml-4 self-start">
        <Icono nombre="flechaIzquierda" className="size-4" />
        Almacenamiento
      </Boton>

      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
        <div>
          <h1 className={CLASE_TITULO_PAGINA}>
            {a.ficha ? `Documentos de la ficha ${a.ficha.codigo}` : 'Documentos de la ficha'}
          </h1>
          <p className={`text-sm ${CLASE_SUBTITULO_PAGINA}`}>
            {puedeBorrar
              ? 'Puedes borrar los adicionales y los opcionales. Los obligatorios no se borran: el aspirante los reemplaza.'
              : 'Solo lectura: aquí ves los documentos de tu ficha y su tamaño.'}
          </p>
        </div>
        {puedeBorrar && (
          <Boton onClick={a.borrarSeleccion} ocupado={a.ocupado} disabled={marcados === 0 || a.ocupado}>
            <Icono nombre="alerta" className="size-4" />
            {marcados > 0 ? `Borrar ${marcados} seleccionado(s)` : 'Borrar seleccionados'}
          </Boton>
        )}
      </header>

      {a.error && <MensajeError>{a.error}</MensajeError>}

      {a.aviso && (
        <div className="flex flex-col gap-2">
          <MensajeExito>{a.aviso.borrados === 1 ? 'Se borró 1 documento.' : `Se borraron ${a.aviso.borrados} documentos.`}</MensajeExito>
          {a.aviso.omitidos.length > 0 && (
            <MensajeError>
              No se borraron {a.aviso.omitidos.length}:
              <ul className="mt-1 list-disc pl-5">
                {a.aviso.omitidos.map((o) => (
                  <li key={o.id}>{o.motivo}</li>
                ))}
              </ul>
            </MensajeError>
          )}
        </div>
      )}

      {a.cargando && a.documentos.length === 0 ? (
        <Cargando>Cargando documentos…</Cargando>
      ) : a.documentos.length === 0 ? (
        // Con error, el mensaje ya está arriba: no se dice «no tiene documentos» de una ficha que no pudimos leer.
        a.error ? null : (
          <EstadoVacio
            icono="📂"
            titulo="Esta ficha no tiene documentos"
            descripcion="Cuando los aspirantes suban archivos, aparecerán aquí."
          />
        )
      ) : (
        <>
          <Tarjeta className="overflow-x-auto">
            <table className={`${CLASE_TABLA} min-w-200`}>
              <thead className={CLASE_THEAD}>
                <tr>
                  {puedeBorrar && (
                    <th className={CLASE_TH}>
                      <input
                        type="checkbox"
                        aria-label="Seleccionar todos los que se pueden borrar de esta página"
                        checked={a.todosMarcados}
                        onChange={a.alternarTodos}
                        className="size-4"
                      />
                    </th>
                  )}
                  <th className={CLASE_TH}>Documento</th>
                  <th className={CLASE_TH}>Aspirante</th>
                  <th className={CLASE_TH}>Convocatoria</th>
                  <th className={CLASE_TH}>Fecha</th>
                  <th className={`${CLASE_TH} text-right`}>Tamaño</th>
                </tr>
              </thead>
              <tbody className={CLASE_TBODY}>
                {a.documentos.map((d) => (
                  <tr key={d.id} className={CLASE_FILA}>
                    {puedeBorrar && (
                      <td className={CLASE_TD}>
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar ${d.titulo ?? 'documento'}`}
                          checked={a.seleccion.has(d.id)}
                          disabled={!d.borrable || a.ocupado}
                          onChange={() => a.alternar(d.id)}
                          className="size-4"
                        />
                      </td>
                    )}
                    <td className={CLASE_TD}>
                      <div className={`font-semibold ${CLASE_TEXTO_FUERTE}`}>{d.titulo ?? '—'}</div>
                      <div className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
                        {d.tipo === 'adicional' ? 'Adicional' : 'Requerido'}
                        {d.obligatorio ? ' · obligatorio (no se borra)' : ''}
                      </div>
                    </td>
                    <td className={`${CLASE_TD} ${CLASE_TEXTO_FUERTE}`}>{d.aspirante ?? '—'}</td>
                    <td className={`${CLASE_TD} ${CLASE_TEXTO_SUAVE}`}>{d.convocatoria ?? '—'}</td>
                    <td className={`${CLASE_TD} ${CLASE_TEXTO_SUAVE}`}>{formatearFechaHora(d.creado_at)}</td>
                    <td className={`${CLASE_TD} ${CLASE_TEXTO_FUERTE} text-right`}>{formatearTamano(d.tamano_bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Tarjeta>

          <Paginacion
            meta={a.meta}
            singular="documento"
            plural="documentos"
            etiqueta="Paginación de documentos de la ficha"
            onPagina={a.irAPagina}
            ocupado={a.cargando}
            className="px-1"
          />
        </>
      )}
    </div>
  )
}
