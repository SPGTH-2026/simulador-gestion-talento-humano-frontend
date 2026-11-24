import { useState, useEffect, useCallback } from 'react'
import { listaMisPostulaciones } from '../../api/postulaciones'
import EstadoVacio from '../../components/ui/EstadoVacio'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import { CLASE_CAJA_SUAVE, CLASE_TARJETA, CLASE_TITULO_PAGINA } from '../../lib/estilos'
import { Link } from 'react-router-dom'
import Boton from '../../components/ui/Boton'
import { EsqueletoTarjetas } from '../../components/ui/Esqueleto'

export default function MisDocumentos() {
  const [postulaciones, setPostulaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const data = await listaMisPostulaciones()
      setPostulaciones(data.data)
    } catch (e) {
      setError('No se pudieron cargar tus postulaciones.')
      console.error(e)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const hayDatos = !cargando && !error && postulaciones.length > 0

  return (
    <div className="flex flex-col gap-6">
      {/* Título y ayuda no dependen de la API: se ven siempre (cargando, con error y sin resultados). */}
      <header>
        <h1 className={CLASE_TITULO_PAGINA}>Mis documentos</h1>
        <p className="text-sm text-slate-500 dark:text-sena-texto-suave mt-1">
          Gestiona los documentos de cada postulación. Cada convocatoria tiene sus propios requisitos.
        </p>
      </header>

      {cargando && <EsqueletoTarjetas texto="Cargando tus postulaciones…" n={3} unaColumna />}

      {!cargando && error && (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <Boton variante="contorno" onClick={cargar}>Reintentar</Boton>
        </div>
      )}

      {!cargando && !error && postulaciones.length === 0 && (
        <EstadoVacio
          icono="📄"
          titulo="Sin postulaciones"
          descripcion="Aún no te has postulado a ninguna convocatoria. Cuando lo hagas, aquí verás tus postulaciones y podrás gestionar sus documentos."
          accion={{ label: 'Ver convocatorias', onClick: () => window.location.href = '/convocatorias' }}
        />
      )}

      {hayDatos && (
        <div className="space-y-3">
          {postulaciones.map(p => (
            <article
              key={p.id}
              className={`${CLASE_TARJETA} p-4`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <EtiquetaPostulacion codigo={p.estado?.codigo} nombre={p.estado?.nombre} />
                  </div>
                  <p className="font-medium text-slate-900 dark:text-sena-texto">{p.convocatoria?.nombre}</p>
                  <p className="text-sm text-slate-500 dark:text-sena-texto-suave">
                    Postulada el {p.fecha_postulacion ? new Date(p.fecha_postulacion).toLocaleDateString('es-CO') : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Boton as={Link} to={`/postulaciones/${p.id}/documentos`}>
                    Gestionar documentos
                  </Boton>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-sena-borde flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-sena-texto-suave">
                <span>Estado: <strong>{p.estado?.nombre}</strong></span>
                <span>•</span>
                <span>Postulada: {p.fecha_postulacion ? new Date(p.fecha_postulacion).toLocaleDateString('es-CO') : '—'}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Ayuda estática: aparece también mientras carga para que la pantalla no cambie de forma al llegar los datos. */}
      {(cargando || hayDatos) && (
        <div className={`${CLASE_CAJA_SUAVE} p-4 text-sm text-slate-600 dark:text-sena-texto-suave`}>
          <p className="font-medium mb-1">¿Cómo funciona?</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Cada postulación tiene su propio espacio de documentos.</li>
            <li>Los documentos requeridos dependen de la convocatoria.</li>
            <li>Puedes cargar y reemplazar documentos mientras la convocatoria esté abierta (o según las reglas de edición).</li>
            <li>Un documento obligatorio no se elimina: solo se reemplaza. Los opcionales y los adicionales sí se pueden eliminar.</li>
            <li>Los certificados de skills son opcionales y se cargan por separado.</li>
          </ul>
        </div>
      )}
    </div>
  )
}
