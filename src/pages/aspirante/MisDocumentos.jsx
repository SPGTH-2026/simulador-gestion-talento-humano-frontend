import { useState, useEffect, useCallback } from 'react'
import { listaMisPostulaciones } from '../../api/postulaciones'
import EstadoVacio from '../../components/ui/EstadoVacio'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import { CLASE_CAJA_SUAVE, CLASE_TARJETA } from '../../lib/estilos'
import { Link } from 'react-router-dom'

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

  if (cargando) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-2 border-sena-azul border-t-transparent" /></div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-600 dark:text-red-300">{error}</p>
        <button onClick={cargar} className="text-sena-azul hover:underline dark:text-sena-texto">Reintentar</button>
      </div>
    )
  }

  if (postulaciones.length === 0) {
    return (
      <EstadoVacio
        icono="📄"
        titulo="Sin postulaciones"
        descripcion="Aún no te has postulado a ninguna convocatoria. Cuando lo hagas, aquí verás tus postulaciones y podrás gestionar sus documentos."
        accion={{ label: 'Ver convocatorias', onClick: () => window.location.href = '/convocatorias' }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-sena-texto">Mis documentos</h1>
        <p className="text-sm text-slate-500 dark:text-sena-texto-suave mt-1">
          Gestiona los documentos de cada postulación. Cada convocatoria tiene sus propios requisitos.
        </p>
      </header>

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
                <Link
                  to={`/postulaciones/${p.id}/documentos`}
                  className="px-4 py-2 text-sm font-semibold text-white bg-sena-azul rounded hover:bg-sena-azul/90 transition-colors whitespace-nowrap"
                >
                  Gestionar documentos
                </Link>
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

      <div className={`${CLASE_CAJA_SUAVE} mt-6 p-4 text-sm text-slate-600 dark:text-sena-texto-suave`}>
        <p className="font-medium mb-1">¿Cómo funciona?</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Cada postulación tiene su propio espacio de documentos.</li>
          <li>Los documentos requeridos dependen de la convocatoria.</li>
          <li>Puedes subir, reemplazar y eliminar mientras la convocatoria esté abierta (o según las reglas de edición).</li>
          <li>Los certificados de skills son opcionales y se suben por separado.</li>
        </ul>
      </div>
    </div>
  )
}