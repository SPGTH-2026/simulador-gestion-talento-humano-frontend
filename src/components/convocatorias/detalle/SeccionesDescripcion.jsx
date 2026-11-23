import { IconoDocumento } from '../Iconos'
import EtiquetaDocumento from '../../ui/EtiquetaDocumento'
import { CLASE_CAJA_SUAVE, CLASE_CHIP, CLASE_TARJETA_PLANA, CLASE_META_DT } from '../../../lib/estilos'
import { ETIQUETAS_DOCUMENTO } from '../../../lib/documentosConvocatoria'
import { FilaCondicion, ListaLineas, Parrafo, TituloSeccion } from './PiezasDetalle'
import { aLineas, formatearFecha, hay, moneda } from './formatosDetalle'

// Pestaña Descripción del detalle. Condiciones (fechas y datos), cargo, funciones, perfil y documentos. Solo pinta.
export default function SeccionesDescripcion({ c, esGestion }) {
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
    ...fechasCondiciones,
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

  // Documentos que pide la convocatoria, en modo lectura (tarjeta de la
  // descripción). El nombre se parte en varias líneas en lugar de cortarse con
  // puntos suspensivos: un documento largo se lee completo.
  const listaDocumentos =
    documentos.length === 0 ? (
      <p className="text-sm text-slate-600 dark:text-sena-texto-suave">
        Esta convocatoria no pide documentos.
      </p>
    ) : (
      <ul className="mt-2 grid grid-cols-1 gap-2 @xl:grid-cols-2">
        {documentos.map((documento) => (
          <li
            key={documento.id}
            className={`${CLASE_CAJA_SUAVE} flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2`}
          >
            <span className="shrink-0 text-sena" aria-hidden="true">
              <IconoDocumento className="h-4 w-4" />
            </span>
            <span className="min-w-32 flex-1 text-sm font-medium text-slate-700 [overflow-wrap:anywhere] dark:text-sena-texto">
              {documento.nombre}
            </span>
            {/* Peso del documento en la evaluación de esta convocatoria. Solo
                se muestra si el gestor lo configuró. */}
            {documento.ponderacion != null && (
              <span className="shrink-0 rounded-full bg-sena-cielo px-2 py-0.5 text-xs font-semibold text-sena-azul dark:bg-sena-superficie-alta dark:text-sena-texto">
                {Math.round(Number(documento.ponderacion) * 100) / 100}%
              </span>
            )}
            <EtiquetaDocumento obligatorio={Boolean(documento.obligatorio)} />
            {/* Regla propia del documento (libreta militar). Misma constante
                que usa el panel de postulación: una sola fuente para el texto. */}
            {ETIQUETAS_DOCUMENTO[documento.codigo] && (
              <span className="shrink-0 rounded-full bg-sena-hundido px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-sena-superficie-alta dark:text-sena-texto-suave">
                {ETIQUETAS_DOCUMENTO[documento.codigo]}
              </span>
            )}
          </li>
        ))}
      </ul>
    )
  // Una sola columna de lectura: condiciones primero (lo que se consulta), después el cargo (lo que se lee) y al final
  // los documentos. Antes eran dos columnas y, con una descripción corta, la izquierda quedaba con un hueco enorme.
  // Dentro de cada tarjeta, las rejillas se adaptan al ancho de su contenedor ('@container') y no al de la pantalla.
  return (
    <div className="flex flex-col gap-4">
      {/* a) Condiciones de la convocatoria: UNA sola tarjeta, primera de la
          pestaña. Arriba la banda de fechas (una fila baja); debajo la lista de
          datos en rejilla de 3 columnas. */}
      <section className={`${CLASE_TARJETA_PLANA} p-4`}>
        <TituloSeccion>Condiciones de la convocatoria</TituloSeccion>

      <div className="@container">

        {/* Lista de datos: 3 columnas en pantalla ancha (7 datos -> 3 filas), 2
            en tableta y 1 en móvil. Sin subtítulos: el orden temático agrupa. */}
        {datosCondiciones.length > 0 && (
          <dl className="mt-3 grid grid-cols-2 gap-x-6 @3xl:grid-cols-3 @5xl:grid-cols-4">
            {datosCondiciones.map((fila) => (
              <FilaCondicion
                key={fila.etiqueta}
                etiqueta={fila.etiqueta}
                valor={fila.valor}
              />
            ))}
          </dl>
        )}
      </div>
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
        <div className="@container">{listaDocumentos}</div>
      </section>
    </div>
  )
}
