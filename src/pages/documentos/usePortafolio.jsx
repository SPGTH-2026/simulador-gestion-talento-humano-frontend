import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { obtenerPortafolio, estadoRevision } from '../../api/portafolios'
import { mensajeErrorBlob } from '../../api/postulacionesDocumentos'
import useVisorDocumento from '../../hooks/useVisorDocumento'
import Mensaje from '../../components/ui/Mensaje'
import Boton from '../../components/ui/Boton'
import { EsqueletoDetalle } from '../../components/ui/Esqueleto'

// Lógica de Portafolio: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function usePortafolio({ userId }) {
  const [portafolio, setPortafolio] = useState(null)
  const [postulacionSel, setPostulacionSel] = useState(null)
  const [revision, setRevision] = useState(null)
  // La carga inicial empieza en curso: sin esto el primer render dibujaba una pantalla en blanco.
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Postulación cuya revisión se está abriendo, y el fallo (con su postulación) para mostrarlo junto a su botón.
  const [abriendoId, setAbriendoId] = useState(null)
  const [errorRevision, setErrorRevision] = useState(null)
  // Archivos con una acción en curso (claves 'ver:…' / 'descargar:…') y el error de cada tarjeta de archivo.
  const { abrir: abrirVisor, visor } = useVisorDocumento()
  const [enCurso, setEnCurso] = useState(() => new Set())
  const [erroresArchivo, setErroresArchivo] = useState({})
  const encabezadoRevision = useRef(null)
  // Guarda síncrona: dos clics seguidos llegan antes de que React pinte el botón ocupado, así que el estado solo no basta.
  const guardaAcciones = useRef(new Set())

  const cargarPortafolio = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const data = await obtenerPortafolio(userId)
      setPortafolio(data)
    } catch (e) {
      setError('No se pudo cargar el portafolio.')
      console.error(e)
    } finally {
      setCargando(false)
    }
  }, [userId])

  useEffect(() => {
    cargarPortafolio()
  }, [cargarPortafolio])

  // Al terminar de cargar una revisión, el foco pasa a su encabezado (y se desplaza a la vista): la revisión aparece
  // debajo de la lista y, sin esto, quien usa teclado o lector de pantalla no sabría que ya está.
  useEffect(() => {
    if (!revision) return
    encabezadoRevision.current?.focus()
    encabezadoRevision.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [revision])

  const handleVerDocumentos = async (postulacion) => {
    if (!postulacion.puede_ver_documentos || guardaAcciones.current.has('revision')) return
    guardaAcciones.current.add('revision')
    setAbriendoId(postulacion.id)
    setErrorRevision(null)
    try {
      const data = await estadoRevision(postulacion.id)
      setPostulacionSel(postulacion)
      setErroresArchivo({})
      setRevision(data)
    } catch (e) {
      const msg = await mensajeErrorBlob(e)
      setErrorRevision({ id: postulacion.id, mensaje: msg || 'No se pudo cargar la revisión de documentos.' })
      console.error(e)
    } finally {
      guardaAcciones.current.delete('revision')
      setAbriendoId(null)
    }
  }

  // Ejecuta una acción sobre un archivo: mientras dura, su botón queda ocupado (un doble clic no la repite) y, si
  // falla, el error aparece en la tarjeta de ese archivo.
  const accionArchivo = async (clave, accion, textoError) => {
    if (guardaAcciones.current.has(clave)) return
    guardaAcciones.current.add(clave)
    setEnCurso((previo) => new Set(previo).add(clave))
    setErroresArchivo((previo) => ({ ...previo, [clave.split(':')[1]]: '' }))
    try {
      await accion()
    } catch (e) {
      const msg = await mensajeErrorBlob(e)
      setErroresArchivo((previo) => ({ ...previo, [clave.split(':')[1]]: msg || textoError }))
    } finally {
      guardaAcciones.current.delete(clave)
      setEnCurso((previo) => {
        const siguiente = new Set(previo)
        siguiente.delete(clave)
        return siguiente
      })
    }
  }

  // Abre el archivo en el visor interno (el propio visor muestra la carga y los errores).
  const verArchivo = (ruta, nombre, titulo) => abrirVisor(ruta, { titulo: titulo || nombre, nombre })

  const rutaArchivo = (suffix) => `/revision/postulaciones/${postulacionSel.id}/${suffix}`

  if (cargando && !portafolio) {
    return <EsqueletoDetalle texto="Cargando portafolio…" bloques={3} />
  }

  if (error && !portafolio) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Mensaje tipo="error">{error}</Mensaje>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Boton variante="contorno" tamano="tactil" onClick={cargarPortafolio}>
            Reintentar
          </Boton>
          <Boton variante="fantasma" tamano="tactil" as={Link} to="/documentos">
            Volver al listado
          </Boton>
        </div>
      </div>
    )
  }

  if (!portafolio) return null

  const { usuario, postulaciones } = portafolio

  // Ver y Descargar son acciones neutras de lectura: las dos con contorno, sin iconos decorativos.
  // 'id' identifica el archivo (también para mostrar su error junto a los botones).
  const botonesLectura = (id, nombre, ver, descargarFn) => (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Boton
          variante="contorno"
          tamano="tactil"
          ocupado={enCurso.has(`ver:${id}`)}
          aria-label={`Ver ${nombre}`}
          onClick={() => accionArchivo(`ver:${id}`, ver, 'No se pudo abrir el archivo.')}
        >
          Ver
        </Boton>
        <Boton
          variante="contorno"
          tamano="tactil"
          ocupado={enCurso.has(`descargar:${id}`)}
          aria-label={`Descargar ${nombre}`}
          onClick={() => accionArchivo(`descargar:${id}`, descargarFn, 'No se pudo descargar el archivo.')}
        >
          Descargar
        </Boton>
      </div>
      {erroresArchivo[id] && <Mensaje tipo="error">{erroresArchivo[id]}</Mensaje>}
    </div>
  )

    return {
      abriendoId,
      accionArchivo,
      botonesLectura,
      cargando,
      cargarPortafolio,
      enCurso,
      encabezadoRevision,
      error,
      errorRevision,
      erroresArchivo,
      guardaAcciones,
      handleVerDocumentos,
      portafolio,
      postulacionSel,
      postulaciones,
      revision,
      rutaArchivo,
      setAbriendoId,
      setCargando,
      setEnCurso,
      setError,
      setErrorRevision,
      setErroresArchivo,
      setPortafolio,
      setPostulacionSel,
      setRevision,
      userId,
      usuario,
      verArchivo,
      visor,
    }
}
