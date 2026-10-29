import { useState } from 'react'
import EtiquetaEstado from './EtiquetaEstado'
import EtiquetaPostulacion from './EtiquetaPostulacion'
import EtiquetaDocumento from '../ui/EtiquetaDocumento'
import Boton from '../ui/Boton'
import Pestanas from '../ui/Pestanas'
import { useAuth } from '../../auth/useAuth'
import {
  IconoCalendario,
  IconoDocumento,
  IconoMaletin,
} from './Iconos'
import { ETIQUETAS_DOCUMENTO } from '../../lib/documentosConvocatoria'
import { veIdentificador } from '../../lib/convocatorias'
import {
  CLASE_CAJA_SUAVE,
  CLASE_CHIP,
  CLASE_META_DD,
  CLASE_META_DT,
  CLASE_TARJETA,
  CLASE_TARJETA_PLANA,
  CLASE_TITULO_SECCION,
} from '../../lib/estilos'

// ── Ayudas de formato ─────────────────────────────────────────────────────

// dd/mm/aaaa cortando la cadena ISO. Nunca new Date() sobre AAAA-MM-DD: esas
// funciones vuelven a UTC y en Colombia desplazarían un día.
function formatearFecha(iso) {
  if (!iso) return '—'
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : iso
}

// COP sin decimales. Devuelve null si no hay valor (para el rango salarial).
function moneda(valor) {
  if (valor == null) return null
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor)
}

// Texto libre -> líneas limpias. Los párrafos se pintan como <li> por línea,
// todo como texto; nunca dangerouslySetInnerHTML (React escapa el texto).
function aLineas(texto) {
  return String(texto ?? '')
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean)
}

// ¿El campo trae algo visible? Se usa para ocultar las secciones vacías en vez
// de dejar etiquetas "—" sueltas.
function hay(valor) {
  return String(valor ?? '').trim().length > 0
}

// ── Bloques de contenido reutilizables ────────────────────────────────────

// Título de sección: barra verde a la izquierda, igual en todas las pestañas.
function TituloSeccion({ children, className = '' }) {
  return <h3 className={`${CLASE_TITULO_SECCION} ${className}`.trim()}>{children}</h3>
}

// Párrafo de texto libre con los saltos de línea respetados. Se queda en 14 px
// (el mínimo del contenido): compactar significa recortar espacios, no bajar la
// tipografía por debajo de los mínimos.
function Parrafo({ children }) {
  return (
    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-sena-texto">
      {children}
    </p>
  )
}

// Lista con viñeta verde: una línea por elemento.
function ListaLineas({ lineas }) {
  return (
    <ul className="mt-2 flex flex-col gap-1.5">
      {lineas.map((linea, i) => (
        <li
          key={i}
          className="flex items-start gap-2 text-sm leading-relaxed text-slate-700 dark:text-sena-texto"
        >
          <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sena" />
          {linea}
        </li>
      ))}
    </ul>
  )
}

// Celda de la banda de fechas: UNA fila baja, contenido centrado. El icono va a
// la izquierda del par etiqueta/valor para ahorrar alto sin perder el anclaje
// visual; relleno vertical mínimo. Las celdas son idénticas (sin color de
// acento). El radio del contenedor lo respeta el overflow-hidden de la banda.
function CeldaFecha({ etiqueta, valor }) {
  return (
    <div className="flex items-center justify-center gap-2 px-3 py-1.5">
      <span className="text-sena" aria-hidden="true">
        <IconoCalendario className="h-4 w-4" />
      </span>
      <div className="min-w-0 text-left">
        <dt className={`${CLASE_META_DT} leading-tight`}>{etiqueta}</dt>
        <dd className={`${CLASE_META_DD} mt-0 leading-tight`}>{valor}</dd>
      </div>
    </div>
  )
}

// Fila de la lista de condiciones: fila baja (py-1), la etiqueta ocupa un ancho
// FIJO (40 %) y el valor va justo a continuación, en negrita. Cada fila lleva su
// línea inferior con el token sena-separador (más marcado que el borde de la
// tarjeta). En una rejilla responsive no se puede omitir solo la última fila
// visible sin romper en algún breakpoint, así que la línea es uniforme en todas.
function FilaCondicion({ etiqueta, valor }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-sena-separador py-1">
      <dt className={`${CLASE_META_DT} w-2/5 shrink-0`}>{etiqueta}</dt>
      <dd className={`${CLASE_META_DD} mt-0 min-w-0 flex-1 break-words`}>{valor}</dd>
    </div>
  )
}

// ── Vista de solo lectura ─────────────────────────────────────────────────

// Vista de presentación del detalle de una convocatoria. NO maneja mutación ni
// llamadas propias: solo pinta los datos que recibe. La pestaña Documentos
// recibe el bloque de postulación por 'panelDocumentos' (children del panel se
// monta siempre; ver Pestanas) y la barra inferior la arma la página, que es
// quien conoce el rol y el estado real de la postulación.
//
// El detalle se adapta al rol con el permiso y el subrol del usuario: el
// conteo de postulantes y el identificador (CONV-AAAA-NNN) son datos de
// gestión y no se muestran a quien no corresponde. NO hay encabezado propio
// de gestión: la vista de gestión es el mismo detalle.
export default function DetalleConvocatoria({
  convocatoria,
  onVolver,
  panelDocumentos = null,
  accionInferior = null,
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
  const minimo = moneda(c?.salario_min)
  const maximo = moneda(c?.salario_max)
  const rangoSalarial =
    minimo && maximo
      ? `${minimo} – ${maximo}`
      : minimo
        ? `Desde ${minimo}`
        : maximo
          ? `Hasta ${maximo}`
          : 'A convenir'
  const haySalario = Boolean(minimo || maximo)

  const documentos = c?.documentos ?? []
  const skills = (c?.skills ?? []).filter(hay)
  const lineasFunciones = aLineas(c?.funciones)

  // Una sola tarjeta "Condiciones de la convocatoria", SIN repetir datos y sin
  // Ficha. Arriba la banda de FECHAS en orden cronológico (Apertura, Cierre,
  // Evaluación — esta solo si existe), después la lista de datos en un solo
  // orden temático. El backend NO tiene fecha de publicación: "Apertura" muestra
  // fecha_apertura (no se inventa un campo). Los datos vacíos se ocultan y la
  // rejilla se reacomoda sin huecos.
  const fechasCondiciones = [
    { etiqueta: 'Apertura', valor: formatearFecha(c?.fecha_apertura) },
    { etiqueta: 'Cierre', valor: formatearFecha(c?.fecha_cierre) },
    {
      etiqueta: 'Evaluación',
      valor: c?.fecha_evaluacion ? formatearFecha(c.fecha_evaluacion) : null,
    },
  ].filter((fila) => fila.valor != null && hay(fila.valor))

  // Orden temático: primero "del cargo" (Área, tipos) y después "condiciones
  // laborales" (Modalidad, Vacantes, salario). Sin subtítulos: el orden agrupa.
  const datosCondiciones = [
    { etiqueta: 'Área', valor: c?.area },
    { etiqueta: 'Tipo de convocatoria', valor: c?.tipo_convocatoria?.nombre },
    { etiqueta: 'Tipo de empleo', valor: c?.tipo_empleo?.nombre },
    { etiqueta: 'Tipo de contrato', valor: c?.tipo_contrato?.nombre },
    { etiqueta: 'Modalidad', valor: c?.modalidad?.nombre },
    { etiqueta: 'Vacantes', valor: c?.vacantes != null ? String(c.vacantes) : null },
    { etiqueta: 'Rango salarial', valor: haySalario ? rangoSalarial : null },
  ].filter((fila) => fila.valor != null && hay(fila.valor))

  // "Perfil requerido": bloques etiqueta/valor. Solo se incluyen los que tienen
  // contenido; los vacíos se ocultan.
  const bloquesPerfil = [
    { etiqueta: 'Perfil', valor: c?.perfil_requerido },
    { etiqueta: 'Formación académica', valor: c?.formacion },
    { etiqueta: 'Experiencia', valor: c?.experiencia },
    { etiqueta: 'Competencias', valor: c?.competencias },
    { etiqueta: 'Conocimientos específicos', valor: c?.conocimientos_especificos },
  ].filter((bloque) => hay(bloque.valor))

  const lineasResponsabilidades = aLineas(c?.responsabilidades)
  const hayFuncionesYResp =
    lineasFunciones.length > 0 || lineasResponsabilidades.length > 0
  const hayPerfil = bloquesPerfil.length > 0 || skills.length > 0

  // Documentos que pide la convocatoria, en modo lectura. Se comparte entre las
  // dos pestañas: en Descripción va como referencia y en Documentos acompaña al
  // panel del aspirante.
  const listaDocumentos =
    documentos.length === 0 ? (
      <p className="text-sm text-slate-600 dark:text-sena-texto-suave">
        Esta convocatoria no pide documentos.
      </p>
    ) : (
      <ul className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-2">
        {documentos.map((documento) => (
          <li
            key={documento.id}
            className={`${CLASE_CAJA_SUAVE} flex items-center gap-2 px-3 py-2`}
          >
            <span className="shrink-0 text-sena" aria-hidden="true">
              <IconoDocumento className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-sena-texto">
              {documento.nombre}
            </span>
            <EtiquetaDocumento obligatorio={Boolean(documento.obligatorio)} />
            {/* Regla propia del documento (libreta militar, tarjeta
                profesional). Misma constante que usa el panel de postulación:
                una sola fuente para el texto. */}
            {ETIQUETAS_DOCUMENTO[documento.codigo] && (
              <span className="shrink-0 rounded-full bg-sena-hundido px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-sena-superficie-alta dark:text-sena-texto-suave">
                {ETIQUETAS_DOCUMENTO[documento.codigo]}
              </span>
            )}
          </li>
        ))}
      </ul>
    )

  // Escala de espacios única para toda la pestaña: gap-3 entre tarjetas, p-4
  // dentro, mt-2 tras el subtítulo. Compacto se logra con espacios y alturas,
  // nunca bajando la tipografía (contenido 14 px, etiquetas 12 px).
  const contenidoDescripcion = (
    <div className="flex flex-col gap-3">
      {/* a) Condiciones de la convocatoria: UNA sola tarjeta, primera de la
          pestaña. Arriba la banda de fechas (una fila baja); debajo la lista de
          datos en rejilla de 3 columnas. La tarjeta usa p-3 (más baja que el
          resto) para ocupar menos alto. */}
      <section className={`${CLASE_TARJETA_PLANA} p-3`}>
        <TituloSeccion>Condiciones de la convocatoria</TituloSeccion>

        {/* Banda de fechas: un solo contenedor dividido en celdas del MISMO
            ancho por divisores marcados (sena-separador). En móvil se apilan con
            divisor horizontal. */}
        {fechasCondiciones.length > 0 && (
          <dl className="mt-2 grid grid-cols-1 divide-y divide-sena-separador overflow-hidden rounded-lg border border-sena-separador sm:grid-flow-col sm:auto-cols-fr sm:divide-x sm:divide-y-0">
            {fechasCondiciones.map((fila) => (
              <CeldaFecha key={fila.etiqueta} etiqueta={fila.etiqueta} valor={fila.valor} />
            ))}
          </dl>
        )}

        {/* Lista de datos: 3 columnas en pantalla ancha (7 datos -> 3 filas), 2
            en tableta y 1 en móvil. Sin subtítulos: el orden temático agrupa. */}
        {datosCondiciones.length > 0 && (
          <dl className="mt-2 grid grid-cols-1 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
            {datosCondiciones.map((fila) => (
              <FilaCondicion
                key={fila.etiqueta}
                etiqueta={fila.etiqueta}
                valor={fila.valor}
              />
            ))}
          </dl>
        )}
      </section>

      {/* c) Descripción del cargo. */}
      {hay(c?.descripcion) && (
        <section className={`${CLASE_TARJETA_PLANA} p-4`}>
          <TituloSeccion>Descripción del cargo</TituloSeccion>
          <Parrafo>{c.descripcion.trim()}</Parrafo>
        </section>
      )}

      {/* d) Funciones y responsabilidades: una tarjeta, dos columnas. */}
      {hayFuncionesYResp && (
        <section className={`${CLASE_TARJETA_PLANA} p-4`}>
          <TituloSeccion>Funciones y responsabilidades</TituloSeccion>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {lineasFunciones.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
                  Funciones
                </p>
                <ListaLineas lineas={lineasFunciones} />
              </div>
            )}
            {lineasResponsabilidades.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
                  Responsabilidades
                </p>
                <ListaLineas lineas={lineasResponsabilidades} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* e) Perfil requerido: bloques en cuadrícula de 2 columnas + skills. */}
      {hayPerfil && (
        <section className={`${CLASE_TARJETA_PLANA} p-4`}>
          <TituloSeccion>Perfil requerido</TituloSeccion>

          {bloquesPerfil.length > 0 && (
            <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {bloquesPerfil.map((bloque, i) => {
                // Un número impar de bloques deja el último a ancho completo.
                const impar =
                  bloquesPerfil.length % 2 === 1 && i === bloquesPerfil.length - 1
                return (
                  <div
                    key={bloque.etiqueta}
                    className={`${CLASE_CAJA_SUAVE} px-3 py-2 ${impar ? 'sm:col-span-2' : ''}`}
                  >
                    <dt className={CLASE_META_DT}>{bloque.etiqueta}</dt>
                    <dd className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-sena-texto">
                      {String(bloque.valor).trim()}
                    </dd>
                  </div>
                )
              })}
            </dl>
          )}

          {skills.length > 0 && (
            <div className={bloquesPerfil.length > 0 ? 'mt-4' : 'mt-2'}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
                Habilidades técnicas
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {skills.map((nombre, i) => (
                  <span key={`${nombre}-${i}`} className={CLASE_CHIP}>
                    {nombre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* g) Documentos que pide la convocatoria. Sin botón: la acción principal
          vive SOLO en la barra inferior. */}
      <section className={`${CLASE_TARJETA_PLANA} p-4`}>
        <TituloSeccion>Documentos que pide la convocatoria</TituloSeccion>
        <p className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">
          {esGestion
            ? 'Documentos que debe entregar el postulante.'
            : 'Debes adjuntar cada documento obligatorio en PDF para enviar tu postulación.'}
        </p>
        {listaDocumentos}
      </section>
    </div>
  )

  // ── Pestaña Documentos ────────────────────────────────────────────────
  // El panel real (si la página lo inyecta) es la vista operativa. La lista de
  // solo lectura ya vive en la pestaña Descripción ("Documentos que pide la
  // convocatoria"), así que aquí NO se repite. Si no hay panel (roles que no
  // postulan), se deja la lista como referencia.
  const contenidoDocumentos = (
    <div className="flex flex-col gap-5">
      {panelDocumentos ? (
        <>
          <div>
            <button
              type="button"
              onClick={() => setPestanaActiva('descripcion')}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/40 dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
            >
              <span aria-hidden="true">←</span> Volver a descripción
            </button>
          </div>
          {panelDocumentos}
        </>
      ) : (
        <section className={`${CLASE_TARJETA_PLANA} p-4`}>
          <TituloSeccion>
            {esGestion ? 'Documentos requeridos' : 'Documentos requeridos para postularte'}
          </TituloSeccion>
          <p className="mt-2 text-sm text-slate-600 dark:text-sena-texto-suave">
            {esGestion
              ? 'Documentos que debe entregar el postulante.'
              : 'Debes adjuntar cada documento obligatorio en PDF para enviar tu postulación.'}
          </p>
          {listaDocumentos}
        </section>
      )}
    </div>
  )

  // Solo se ofrecen las pestañas con contenido real: sin secciones vacías. Orden
  // fijado: Descripción y Documentos. Sin iconos: las dos pestañas compartían el
  // mismo icono decorativo, que no ayudaba a distinguirlas.
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

  const titulo = c?.cargo || c?.nombre || 'Convocatoria'
  // Subtítulo "cargo · área": el cargo ya encabeza, así que este refuerza el
  // contexto de área sin repetirlo en el título.
  const subtitulo = [c?.cargo, c?.area].filter(hay).join(' · ')

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      {/* Volver arriba a la izquierda, fuera de la cabecera. */}
      <button
        type="button"
        onClick={onVolver}
        className="inline-flex items-center gap-1.5 self-start rounded-md px-2 py-1 text-sm font-medium text-sena-azul transition-colors hover:bg-sena-cielo/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sena/40 dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
      >
        <span aria-hidden="true">←</span> Volver
      </button>

      {/* Cabecera: icono en cuadro azul claro, cargo como título, código y
          subtítulo, y el estado real a la derecha. */}
      <header className={`${CLASE_TARJETA} flex flex-wrap items-center gap-3 p-4`}>
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sena-cielo/40 text-sena-azul dark:bg-sena-superficie-alta dark:text-sena-texto"
        >
          <IconoMaletin className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold leading-snug text-sena-azul dark:text-sena-texto sm:text-xl">
            {titulo}
          </h1>
          {/* El identificador (CONV-AAAA-NNN) es un dato de gestión: solo lo
              ve la lista blanca (instructor, super admin y el subrol
              gestor_convocatorias). */}
          {muestraCodigo && (
            <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-sena-texto-suave">
              {c?.codigo}
            </p>
          )}
          {subtitulo && (
            <p className="mt-0.5 text-sm text-slate-600 dark:text-sena-texto-suave">{subtitulo}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Dato de gestión: solo llega a quien puede gestionar. El aspirante no
              debe ver cuántas personas se han postulado. */}
          {c?.postulantes != null && esGestion && (
            <span className="text-xs text-slate-500 dark:text-sena-texto-suave">
              {c.postulantes} {c.postulantes === 1 ? 'aspirante' : 'aspirantes'}
            </span>
          )}
          <EtiquetaEstado codigo={c?.estado?.codigo} nombre={c?.estado?.nombre} />
        </div>
      </header>

      {/* Pestañas: todos los paneles quedan montados (Pestanas los oculta con
          'hidden'), para no perder archivos ni estado en vuelo al cambiar de
          sección. */}
      <Pestanas
        pestanas={pestanas}
        etiquetaAccesible="Secciones de la convocatoria"
        activaId={pestanaActiva}
        onCambiar={setPestanaActiva}
      />

      {/* Barra inferior: una sola línea y UNA sola acción principal. Se muestra
          SOLO en la pestaña Descripción: en Documentos ya estás donde la acción
          te llevaría, así que ahí no aporta. La arma la página, que decide si
          hay algo que hacer para el rol (aspirante publicado). */}
      {pestanaActiva === 'descripcion' && (
        <BarraInferior pestanas={pestanas} accion={accionInferior} />
      )}
    </div>
  )
}

// Barra inferior del detalle: una línea, compacta y con UNA sola acción
// principal (la que arma la página según el estado real del aspirante). El
// detalle decide CUÁNDO mostrarla (solo en Descripción); esconderla en
// Documentos evita repetir la acción que ya se cumplió. No hay "Siguiente":
// haría lo mismo que la acción principal (ir a Documentos).
function BarraInferior({ pestanas, accion }) {
  if (pestanas.length < 2 && !accion) return null

  return (
    <div className={`${CLASE_TARJETA} flex flex-wrap items-center justify-between gap-3 px-4 py-2.5`}>
      <p className="min-w-0 text-sm text-slate-600 dark:text-sena-texto-suave">
        {accion?.deshabilitado ? accion.motivo : accion?.ayuda}
      </p>

      {accion && (
        <div className="flex flex-wrap items-center gap-2">
          {accion.insignia && accion.codigoEstado && (
            <EtiquetaPostulacion codigo={accion.codigoEstado} nombre={accion.nombreEstado} />
          )}
          <Boton
            variante="primario"
            tamano="sm"
            disabled={accion.deshabilitado}
            title={accion.motivo || undefined}
            onClick={accion.onClick}
          >
            {accion.etiqueta}
          </Boton>
        </div>
      )}
    </div>
  )
}
