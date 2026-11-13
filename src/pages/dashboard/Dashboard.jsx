import { useAuth } from '../../auth/useAuth'
import { listaConvocatorias } from '../../api/convocatorias'
import { misEvaluaciones } from '../../api/evaluaciones'
import { listaConvocatoriasSeleccion } from '../../api/seleccion'
import { listaMisPostulaciones } from '../../api/postulaciones'
import Carrusel from '../../components/inicio/Carrusel'
import {
  BloqueConvocatoriasAspirante,
  BloquePostulaciones,
  BloqueRecorrido,
  BloqueResultados,
} from '../../components/inicio/BloquesAspirante'
import {
  BloqueAccesos,
  BloqueConvocatoriasGestion,
  BloqueConvocatoriasSeleccion,
  BloqueRequiereAtencionSeleccion,
  BloqueEvaluacionesEnProceso,
  BloqueRecorridoSeleccion,
} from '../../components/inicio/BloquesGestion'
import { useCarga } from '../../hooks/useCarga'
import { CLASE_SUBTITULO_PAGINA, CLASE_TITULO_PAGINA } from '../../lib/estilos'
import { MAX_ELEMENTOS, destinosDelMenu, perfilInicio } from '../../lib/inicio'

// Línea de apoyo bajo el título, según lo que el perfil encuentra en la página.
function subtituloDe(perfil) {
  if (perfil.postulaciones) return 'Tus postulaciones y las convocatorias disponibles.'
  if (perfil.gestion || perfil.evaluando || perfil.convocatoriasSeleccion) return 'Convocatorias y accesos a tus módulos.'
  return 'Accesos a los módulos que puedes usar.'
}

function Inicio() {
  const { user, can } = useAuth()
  const perfil = perfilInicio(user, can)

  // Cada petición sale solo si su bloque existe para este perfil. Una sola
  // respuesta de cada endpoint se comparte entre los bloques que la usan.
  const postulaciones = useCarga(() => listaMisPostulaciones({}), perfil.postulaciones)
  const aspiranteVeConvocatorias = perfil.convocatoriasAspirante
  // Aspirante y gestión nunca coinciden: una sola petición de convocatorias.
  const convocatorias = useCarga(
    () => listaConvocatorias({ per_page: MAX_ELEMENTOS }),
    aspiranteVeConvocatorias || perfil.gestion,
  )
  // Convocatorias de Selección: solo para quien no tiene otro bloque de convocatorias.
  const convocatoriasSeleccion = useCarga(
    () => listaConvocatoriasSeleccion({ page: 1 }),
    perfil.convocatoriasSeleccion,
  )
  // Pendientes del seleccionador: el backend aplica el criterio antes de limitar (no depende de la primera página).
  const atencionSeleccion = useCarga(
    () => listaConvocatoriasSeleccion({ atencion: 1 }),
    perfil.convocatoriasSeleccion,
  )
  // Resultados (aspirante) y evaluaciones en proceso (aprendiz) comparten
  // endpoint, pero nunca el mismo usuario.
  const evaluaciones = useCarga(() => misEvaluaciones(), perfil.resultados || perfil.evaluando)

  const destinos = perfil.accesos ? destinosDelMenu(can) : []

  const principales = []
  const laterales = []

  if (perfil.postulaciones) principales.push(<BloquePostulaciones key="post" recurso={postulaciones} />)
  if (aspiranteVeConvocatorias) {
    principales.push(<BloqueConvocatoriasAspirante key="conv-asp" recurso={convocatorias} />)
  }
  if (perfil.gestion) {
    principales.push(<BloqueConvocatoriasGestion key="conv-ges" recurso={convocatorias} />)
  }
  if (perfil.convocatoriasSeleccion) {
    principales.push(<BloqueRequiereAtencionSeleccion key="atencion-sel" recurso={atencionSeleccion} />)
    principales.push(<BloqueConvocatoriasSeleccion key="conv-sel" recurso={convocatoriasSeleccion} />)
  }
  if (perfil.evaluando) {
    principales.push(<BloqueEvaluacionesEnProceso key="eval" recurso={evaluaciones} />)
  }

  if (perfil.resultados) laterales.push(<BloqueResultados key="res" recurso={evaluaciones} />)
  if (perfil.postulaciones) laterales.push(<BloqueRecorrido key="rec" />)

  // Los accesos van siempre a un lado: todos los roles comparten la misma composición (columna principal ancha y
  // columna lateral), también quien no tiene bloques de datos (p. ej. el seleccionador).
  if (destinos.length > 0) laterales.push(<BloqueAccesos key="acc" destinos={destinos} />)
  // Orientación del recorrido, como «Cómo avanza el proceso» del aspirante (va tras los accesos).
  if (perfil.convocatoriasSeleccion) laterales.push(<BloqueRecorridoSeleccion key="rec-sel" />)

  const conLateral = laterales.length > 0
  const estirar = conLateral && perfil.convocatoriasSeleccion

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className={CLASE_TITULO_PAGINA}>Inicio</h1>
        <p className={CLASE_SUBTITULO_PAGINA}>{subtituloDe(perfil)}</p>
      </header>

      <div
        className={
          conLateral
            ? `grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] ${estirar ? 'lg:items-stretch' : 'lg:items-start'}`
            : 'flex flex-col gap-5'
        }
      >
        {/* Selección (seleccionador): sus dos columnas tienen casi la misma altura, así que el último bloque de cada una
            crece y terminan parejas, sin hueco en la esquina. Los demás perfiles conservan su composición. */}
        <div className={`flex min-w-0 flex-col gap-5 ${estirar ? 'lg:[&>:last-child]:flex-1' : ''}`}>
          <Carrusel />
          {principales}
        </div>
        {conLateral && (
          <div className={`flex min-w-0 flex-col gap-5 ${estirar ? 'lg:[&>:last-child]:flex-1' : ''}`}>{laterales}</div>
        )}
      </div>
    </div>
  )
}

// 'key' por usuario: si cambia la sesión, el estado y las peticiones en vuelo de
// la cuenta anterior se descartan y todo empieza de cero.
export default function Dashboard() {
  const { user } = useAuth()
  return <Inicio key={user?.id} />
}
