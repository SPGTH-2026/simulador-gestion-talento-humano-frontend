import { useEffect, useState } from 'react'
import { listaParametros } from '../../api/convocatorias'
import { listaFichas } from '../../api/fichas'
import { mensajeError } from '../../api/mensajeError'
import { indexarCatalogos } from './convocatoriaWizardUtils'

// Carga el catálogo completo (agrupado por tema) y las fichas del alcance del usuario para el formulario de convocatorias.
// Los setters se devuelven porque el formulario agrega documentos nuevos al catálogo y reintenta la carga.
export default function useCatalogosConvocatoria({ esNueva, intentoCatalogo }) {
  const [catalogos, setCatalogos] = useState(null)
  // Si el catálogo no carga, el motivo se muestra con la opción de reintentar:
  // sin él los selectores quedarían vacíos sin explicación.
  const [errorCatalogo, setErrorCatalogo] = useState('')
  const [fichas, setFichas] = useState([])

  useEffect(() => {
    let activo = true
    listaParametros()
      .then((res) => {
        if (!activo) return
        setCatalogos(indexarCatalogos(res.data))
        setErrorCatalogo('')
      })
      .catch((e) => {
        // El formulario igual se muestra (el backend valida), pero se avisa del
        // fallo con su motivo real y se permite reintentar.
        if (!activo) return
        setCatalogos((previo) => previo ?? {})
        setErrorCatalogo(mensajeError(e))
      })
    return () => {
      activo = false
    }
  }, [intentoCatalogo])

  // Fichas del alcance del usuario. Solo se piden al crear: si tiene una sola,
  // el backend la hereda de la sesión; si tiene varias, hay que elegir en cuál
  // se crea la convocatoria.
  useEffect(() => {
    if (!esNueva) return

    let activo = true
    listaFichas()
      .then((res) => {
        if (activo) setFichas(res.data ?? [])
      })
      .catch(() => {
        // Sin fichas el formulario igual se muestra; el backend avisa.
        if (activo) setFichas([])
      })
    return () => {
      activo = false
    }
  }, [esNueva])

  return { catalogos, setCatalogos, errorCatalogo, setErrorCatalogo, fichas }
}
