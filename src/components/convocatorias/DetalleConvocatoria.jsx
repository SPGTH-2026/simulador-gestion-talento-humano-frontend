import { useState } from 'react'
import EtiquetaEstado from './EtiquetaEstado'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import Pestanas from '../ui/Pestanas'
import { MensajeError } from '../ui/Mensaje'
import { useAuth } from '../../auth/useAuth'
import { veIdentificador } from '../../lib/convocatorias'
import { CLASE_TARJETA, CLASE_TITULO_PAGINA } from '../../lib/estilos'
import SeccionesDescripcion from './detalle/SeccionesDescripcion'
import BarraInferior from './detalle/BarraInferior'
import { hay } from './detalle/formatosDetalle'

export default function DetalleConvocatoria({
  convocatoria,
  onVolver,
  panelDocumentos = null,
  accionInferior = null,
  // Acciones de quien gestiona (Editar, Cerrar) y el error de la última: van dentro de la cabecera.
  accionesGestion = null,
  errorAccion = '',
}) {
  const c = convocatoria
  const { user, can } = useAuth()

  // Quien puede gestionar ve el conteo de postulantes (dato de gestión).
  const esGestion = can('convocatorias:gestionar')
  // El identificador (CONV-AAAA-NNN) tiene su propia lista blanca: el
  // aprendiz con subrol 'general' también tiene el permiso de gestión, pero
  // no debe ver el identificador.
  const muestraCodigo = veIdentificador(user, can)

  // Pestaña activa: estado propio del detalle. Es controlado porque la acción
  // principal de la barra ("Continuar a documentos") y el enlace "Volver a
  // descripción" saltan de pestaña.
  const [pestanaActiva, setPestanaActiva] = useState('descripcion')

  // "A convenir" solo cuando la convocatoria realmente no define salarios; si
  // hay uno o los dos, se muestra el rango real.
  const contenidoDescripcion = <SeccionesDescripcion c={c} esGestion={esGestion} />

  // ── Pestaña Documentos ────────────────────────────────────────────────
  // Solo existe cuando la página inyecta el panel de postulación (el aspirante
  // que puede postularse): ahí se suben los archivos y se envía. Para quien no
  // postula no hay pestañas: la lista de documentos ya está en la descripción,
  // y una segunda pestaña solo la repetiría.
  const contenidoDocumentos = (
    <div className="flex flex-col gap-5">
      {/* Sin «Volver a descripción»: las pestañas de arriba ya llevan de una sección a la otra y el botón lo repetía. */}
      {panelDocumentos}
    </div>
  )

  // Orden fijado: Descripción y Documentos. Sin iconos: las dos pestañas
  // compartían el mismo icono decorativo, que no ayudaba a distinguirlas.
  const pestanas = [
    {
      id: 'descripcion',
      etiqueta: 'Descripción',
      contenido: contenidoDescripcion,
    },
    {
      id: 'documentos',
      etiqueta: 'Documentos',
      contenido: contenidoDocumentos,
    },
  ]

  // Mismo criterio que la tarjeta del listado: el nombre de la convocatoria
  // encabeza y el subtítulo es "cargo · área". Sin repetir: si el nombre es el
  // cargo, el subtítulo solo lleva lo que añade.
  const titulo = c?.nombre || c?.cargo || 'Convocatoria'
  const subtitulo = [c?.cargo, c?.area]
    .filter((parte) => hay(parte) && String(parte).trim() !== titulo.trim())
    .join(' · ')

  // Cargo, área y número de aspirantes (este último solo para gestión) en un solo texto: si la línea se parte, lo hace
  // sin dejar un separador suelto al inicio.
  const datosLinea = [
    subtitulo,
    c?.postulantes != null && esGestion ? `${c.postulantes} ${c.postulantes === 1 ? 'aspirante' : 'aspirantes'}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      {/* Volver arriba a la izquierda, fuera de la cabecera. */}
      <Boton variante="fantasma" tamano="tactil" onClick={onVolver} className="-ml-4 self-start">
        <Icono nombre="flechaIzquierda" className="size-4" />
        Volver
      </Boton>

      {/* Cabecera: icono en cuadro azul claro, cargo como título, código y
          subtítulo, y el estado real a la derecha. */}
      <header className={`${CLASE_TARJETA} flex flex-col gap-4 p-5`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className={`${CLASE_TITULO_PAGINA} text-balance [overflow-wrap:anywhere]`}>{titulo}</h1>
            {/* Estado, identificador (dato de gestión: solo lo ve la lista blanca de instructor, super admin y el subrol
                gestor_convocatorias), cargo y área, y el número de aspirantes (también de gestión: el aspirante no debe
                ver cuántas personas se han postulado), todo en una misma línea. */}
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600 dark:text-sena-texto-suave">
              <EtiquetaEstado codigo={c?.estado?.codigo} nombre={c?.estado?.nombre} />
              <span>
                {muestraCodigo && <span className="font-mono text-xs">{c?.codigo}</span>}
                {muestraCodigo && datosLinea && ' · '}
                {datosLinea}
              </span>
            </p>
          </div>

          {/* Acciones de gestión junto al título: en escritorio a la derecha, sin una franja aparte; en móvil debajo,
              repartidas a todo el ancho. */}
          {accionesGestion && <div className="sm:shrink-0">{accionesGestion}</div>}
        </div>

        {errorAccion && <MensajeError>{errorAccion}</MensajeError>}
      </header>

      {/* Con panel de postulación hay dos pestañas, con todos los paneles
          montados (Pestanas los oculta con 'hidden') para no perder archivos
          ni estado en vuelo al cambiar de sección. Sin panel, solo la
          descripción: sin barra de pestañas. */}
      {panelDocumentos ? (
        <Pestanas
          pestanas={pestanas}
          etiquetaAccesible="Secciones de la convocatoria"
          activaId={pestanaActiva}
          onCambiar={setPestanaActiva}
        />
      ) : (
        contenidoDescripcion
      )}

      {/* Barra inferior: una sola línea y UNA sola acción principal. Se muestra
          SOLO en la pestaña Descripción: en Documentos ya estás donde la acción
          te llevaría, así que ahí no aporta. La arma la página, que decide si
          hay algo que hacer para el rol (aspirante publicado). */}
      {pestanaActiva === 'descripcion' && (
        <BarraInferior accion={accionInferior} />
      )}
    </div>
  )
}
