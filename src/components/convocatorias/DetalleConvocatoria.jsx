import EtiquetaEstado from './EtiquetaEstado'
import { etiquetasDocumento } from '../../lib/documentosConvocatoria'

// ── Micro-iconos inline (uso exclusivo de esta vista) ─────────────────────
// Iconos SVG en línea, al estilo de Iconos.jsx/Topbar.jsx.

function IconoEmpleo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
    </svg>
  )
}

function IconoContrato() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  )
}

function IconoModalidad() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  )
}

function IconoSalario() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  )
}

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

// Texto libre -> líneas limpias. 'funciones' se pinta como un <li> por línea,
// todo como texto; nunca dangerouslySetInnerHTML (React escapa el texto).
function aLineas(texto) {
  return String(texto ?? '')
    .split(/\r?\n/)
    .map((linea) => linea.trim())
    .filter(Boolean)
}

// ── Vista de solo lectura ─────────────────────────────────────────────────

// Tarjeta ÚNICA del detalle (sistema de diseño): borde fino del tema,
// rounded-lg, padding p-4 y fondo = superficie del tema. Sin variantes.
const ESTILO_TARJETA =
  'rounded-lg border border-slate-200 bg-white p-4 dark:border-sena-borde dark:bg-sena-superficie'

// Título de sección ÚNICO: text-sm font-semibold con la barra verde a la
// izquierda (border-l-4 + pl-3), igual en todas las secciones del detalle.
const ESTILO_TITULO_SECCION =
  'border-l-4 border-sena pl-3 text-sm font-semibold text-slate-800 dark:text-sena-texto'

// Vista de presentación del detalle de una convocatoria. NO maneja mutación:
// solo pinta los datos que recibe y deja un hueco (children) al pie para que
// la página inyecte el botón de postulación y la sección de documentos
// simulada. Reemplaza al wizard en modo lectura (el wizard queda para
// Nueva/Editar).
export default function DetalleConvocatoria({ convocatoria, onVolver, children }) {
  const c = convocatoria
  const lineasFunciones = aLineas(c?.funciones)

  // Rango salarial según el diseño: "X – Y" con ambos, "Desde X"/"Hasta Y" con
  // uno solo y "A convenir" si no hay salarios. Nunca se inventan cifras.
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

  const miniTarjetas = [
    { etiqueta: 'Cargo', valor: c?.cargo ?? '—' },
    { etiqueta: 'Vacantes', valor: c?.vacantes ?? '—' },
    { etiqueta: 'Tipo de convocatoria', valor: c?.tipo_convocatoria?.nombre ?? '—' },
    { etiqueta: 'Publicación', valor: formatearFecha(c?.fecha_apertura) },
    { etiqueta: 'Cierre', valor: formatearFecha(c?.fecha_cierre) },
    { etiqueta: 'Evaluación', valor: formatearFecha(c?.fecha_evaluacion) },
  ]

  const datosIcono = [
    { etiqueta: 'Tipo de empleo', valor: c?.tipo_empleo?.nombre ?? '—', icono: <IconoEmpleo /> },
    { etiqueta: 'Tipo de contrato', valor: c?.tipo_contrato?.nombre ?? '—', icono: <IconoContrato /> },
    { etiqueta: 'Modalidad', valor: c?.modalidad?.nombre ?? '—', icono: <IconoModalidad /> },
    { etiqueta: 'Rango salarial', valor: rangoSalarial, icono: <IconoSalario /> },
  ]

  const cajasPerfil = [
    { etiqueta: 'Formación académica', valor: c?.formacion },
    { etiqueta: 'Experiencia requerida', valor: c?.experiencia },
    { etiqueta: 'Competencias', valor: c?.competencias },
    { etiqueta: 'Conocimientos', valor: c?.conocimientos_especificos },
  ]

  return (
    // Contenedor del detalle: ancho máximo centrado; todos los bloques al
    // mismo ancho y con el mismo espaciado vertical (gap-4; gap-3 en grids).
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      {/* Cabecera: "← Volver" a la izquierda, pastilla de estado a la derecha;
          debajo el título y el subtítulo atenuado. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onVolver}
          className="rounded border border-sena-azul/25 px-4 py-2 text-sm font-medium text-sena-azul hover:bg-sena-cielo/30 dark:border-sena-borde dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
        >
          ← Volver
        </button>
        <EtiquetaEstado codigo={c?.estado?.codigo} nombre={c?.estado?.nombre} />
      </div>
      <h1 className="text-xl font-semibold text-slate-800 dark:text-sena-texto">
        Convocatoria {c?.nombre}
      </h1>
      <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
        {c?.codigo} · Área: {c?.area}
      </p>

      {/* Fila de datos: 6 tarjetas con la MISMA altura (stretch del grid);
          3 columnas en escritorio, 2 en tablet, 1 en móvil. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {miniTarjetas.map((item) => (
          <div key={item.etiqueta} className={ESTILO_TARJETA}>
            <p className="text-xs text-slate-500 dark:text-sena-texto-suave">{item.etiqueta}</p>
            <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-sena-texto">
              {item.valor}
            </p>
          </div>
        ))}
      </div>

      {/* Fila de 4 datos con icono de 16 px: 4 columnas en escritorio, 2 en
          tablet, 1 en móvil. Misma tarjeta y tamaños que la fila anterior. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {datosIcono.map((item) => (
          <div key={item.etiqueta} className={ESTILO_TARJETA + ' flex items-center gap-3'}>
            <span className="shrink-0 text-sena">{item.icono}</span>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-sena-texto-suave">{item.etiqueta}</p>
              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-sena-texto">
                {item.valor}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Descripción y Perfil: items-stretch para que ambas tarjetas tengan la
          MISMA altura; el contenido queda arriba (sin huecos raros si la
          descripción es corta, el texto sigue al tope). */}
      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-2">
        <section className={ESTILO_TARJETA}>
          <h2 className={ESTILO_TITULO_SECCION}>Descripción del cargo</h2>
          <p className="mt-3 whitespace-pre-line text-sm text-slate-700 dark:text-sena-texto">
            {c?.descripcion ? c.descripcion.trim() : '—'}
          </p>

          {lineasFunciones.length > 0 && (
            <>
              <h3 className={`${ESTILO_TITULO_SECCION} mt-4`}>Funciones principales</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {lineasFunciones.map((linea, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-700 dark:text-sena-texto"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sena"
                    />
                    {linea}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className={ESTILO_TARJETA}>
          <h2 className={ESTILO_TITULO_SECCION}>Perfil requerido</h2>
          <p className="mt-3 whitespace-pre-line text-sm text-slate-700 dark:text-sena-texto">
            {c?.perfil_requerido ? c.perfil_requerido.trim() : '—'}
          </p>

          {/* Cajas 2x2: gap-2, sin borde pesado, fondo del tema ligeramente
              distinto al de la tarjeta; auto-rows-fr iguala las 4 alturas. */}
          <div className="mt-3 grid auto-rows-fr grid-cols-1 gap-2 sm:grid-cols-2">
            {cajasPerfil.map((caja) => (
              <div
                key={caja.etiqueta}
                className="rounded-md bg-slate-50 p-2.5 dark:bg-sena-superficie-alta"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
                  {caja.etiqueta}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-sena-texto">
                  {caja.valor ? String(caja.valor).trim() : '—'}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Documentos: pastillas verdes, sin etiqueta de obligatorio (el backend
          reporta obligatorio = false). Con lista vacía no queda tarjeta vacía. */}
      <section className={ESTILO_TARJETA}>
        <h2 className={ESTILO_TITULO_SECCION}>Documentos de convocatoria</h2>
        {(c?.documentos?.length ?? 0) > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {c.documentos.map((documento) => (
              <span
                key={documento.id}
                className="inline-flex flex-wrap items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              >
                {documento.nombre}
                {etiquetasDocumento(documento.codigo, documento.obligatorio).map((etiqueta) => (
                  <span
                    key={etiqueta}
                    className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100"
                  >
                    {etiqueta}
                  </span>
                ))}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500 dark:text-sena-texto-suave">
            Esta convocatoria no pide documentos.
          </p>
        )}
      </section>

      {/* Pie inyectado por la página: documentos + botón de postulación (cada
          uno decide internamente si se muestra y queda al ancho del
          contenedor, alineado con el borde de las tarjetas). */}
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}