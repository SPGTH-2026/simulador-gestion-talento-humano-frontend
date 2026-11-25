import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import Boton from '../../components/ui/Boton'
import { CargaInicial, Hueco } from '../../components/ui/Esqueleto'
import { MensajeAviso, MensajeError } from '../../components/ui/Mensaje'
import Tarjeta from '../../components/ui/Tarjeta'
import TarjetaCita from '../../components/seleccion/citaciones/TarjetaCita'
import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { useMisCitaciones } from './useMisCitaciones'

// «Tus citaciones» en Mis postulaciones: entrevistas y pruebas técnicas programadas o canceladas (con su motivo), de cualquier
// convocatoria. No aparece si no hay ninguna. Aquí llevan los avisos de la campana: «?cita=ID» resalta y enfoca esa cita. El ID solo
// se busca entre las citas del propio aspirante (la API no entrega otras), así que uno ajeno o inexistente simplemente no resalta nada.
export default function BloqueCitaciones() {
  const { citas, error, reintentar } = useMisCitaciones()
  const [params] = useSearchParams()
  const citaPedida = Number(params.get('cita')) || null
  const refCita = useRef(null)
  const existe = citaPedida != null && (citas ?? []).some((c) => c.id === citaPedida)
  useEffect(() => {
    if (!existe || !refCita.current) return
    refCita.current.scrollIntoView?.({ block: 'center' })
    refCita.current.focus({ preventScroll: true })
  }, [existe, citaPedida])
  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <MensajeError>No pudimos cargar tus citaciones. {error}</MensajeError>
        <Boton variante="contorno" onClick={reintentar}>Reintentar</Boton>
      </div>
    )
  }
  // Llegó desde un aviso (?cita=ID): mientras se busca se ve una carga, y si esa cita no está entre las propias se dice (no queda cargando).
  if (!citas && citaPedida != null) {
    return (
      <CargaInicial texto="Buscando tu citación…" className="rounded-2xl border border-sena-linea p-4 dark:border-sena-borde/60">
        <Hueco className="h-4 w-1/3" />
        <Hueco className="mt-3 h-20 w-full" />
      </CargaInicial>
    )
  }
  if (!citas) return null
  if (citas.length === 0) {
    return citaPedida != null ? <MensajeAviso>No encontramos esa citación entre las tuyas.</MensajeAviso> : null
  }

  return (
    <Tarjeta as="section" aria-labelledby="titulo-citaciones" className="flex flex-col gap-3 p-4">
      <div>
        <h2 id="titulo-citaciones" className="text-base font-semibold text-slate-800 dark:text-sena-texto">Tus citaciones</h2>
        <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>La fecha y la hora son de Colombia.</p>
      </div>
      {citaPedida != null && !existe && <MensajeAviso>No encontramos esa citación entre las tuyas. Estas son las que tienes.</MensajeAviso>}
      <ul className="grid gap-3 @min-[40rem]:grid-cols-2">
        {citas.map((cita) => (
          <li
            key={cita.id}
            id={`cita-${cita.id}`}
            ref={cita.id === citaPedida ? refCita : null}
            tabIndex={cita.id === citaPedida ? -1 : undefined}
            aria-label={cita.id === citaPedida ? 'Cita de tu aviso' : undefined}
            className={`min-w-0 rounded-xl ${cita.id === citaPedida ? 'ring-2 ring-sena focus-visible:outline-none' : ''}`.trim()}
          >
            <TarjetaCita cita={cita} titulo={cita.convocatoria} zona={false} />
          </li>
        ))}
      </ul>
    </Tarjeta>
  )
}
