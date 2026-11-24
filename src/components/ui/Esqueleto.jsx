import { CLASE_TARJETA_PLANA, CLASE_TEXTO_SUAVE, CLASE_THEAD } from '../../lib/estilos'
import Rueda from './Rueda'

// Esqueletos de la CARGA INICIAL de contenido: reservan la forma de lo que va a llegar (lista, tabla, tarjetas o detalle) para
// que la pantalla no salte. Solo se usan cuando todavía no hay nada que mostrar; al refrescar datos que ya se ven se conserva
// el contenido (ver cada pantalla). No sustituyen a los indicadores de una operación (guardar, enviar, eliminar, subir
// archivos), que siguen siendo la rueda del botón o la barra de progreso.
//
// Accesibilidad: cada esqueleto es UNA región role="status" con aria-busy y un texto solo para lectores de pantalla («Cargando
// candidatos…»); los huecos son decorativos (aria-hidden). Con movimiento reducido no se animan (motion-safe).
// Sin dependencias ni esperas artificiales: se ven mientras dura la petición.

// Bloque gris base. Se compone en cualquier forma con 'className' (alto, ancho, radio).
export function Hueco({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded bg-sena-hundido motion-safe:animate-pulse dark:bg-sena-borde ${className}`.trim()}
    />
  )
}

// Región anunciada. Para composiciones propias (p. ej. métricas + tabla): <CargaInicial texto="Cargando ranking…">…</CargaInicial>.
// Sin 'texto' es solo un contenedor: así un esqueleto puede ir DENTRO de otra región anunciada sin duplicar el aviso.
export function CargaInicial({ texto, className = '', rellenar = false, children }) {
  if (!texto) return <div className={className}>{children}</div>
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{texto}</span>
      {/* rellenar: el contenido ocupa (y puede recortarse a) el alto que deja el contenedor flex, sin crecer. */}
      <div aria-hidden="true" className={rellenar ? 'flex min-h-0 flex-1 flex-col' : undefined}>
        {children}
      </div>
    </div>
  )
}

// Fila de persona/elemento: círculo y dos líneas.
function Persona({ avatar = 'size-9', className = '' }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      {avatar && <Hueco className={`${avatar} shrink-0 rounded-full`} />}
      <div className="flex-1 space-y-2">
        <Hueco className="h-3 w-3/4" />
        <Hueco className="h-2.5 w-1/2" />
      </div>
    </div>
  )
}

// Línea del total (aún desconocido). Con 'textoPie' dice en palabras lo que se espera («Cargando convocatorias…») en el lugar donde
// irá el total, con su rueda, en vez de un hueco; es solo visual (aria-hidden): el aviso para lectores de pantalla es el de la región, una sola vez.
function LineaTotal({ textoPie }) {
  // Mismo formato que la línea de carga de Convocatorias: rueda + texto breve, en el lugar del total.
  if (textoPie) {
    return (
      <p className={`flex items-center gap-2.5 text-sm ${CLASE_TEXTO_SUAVE}`}>
        <Rueda /> {textoPie}
      </p>
    )
  }
  return <Hueco className="h-4 w-44" />
}

// Pie de paginación: «Página N de M» y los dos botones, con la misma altura que el pie real. Se reserva en la carga inicial para que
// la lista no salte al llegar los datos.
function PiePaginacion({ textoPie, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 px-3 ${className}`.trim()}>
      <LineaTotal textoPie={textoPie} />
      <div className="grid grid-cols-2 gap-2">
        <Hueco className="h-11 rounded-lg" />
        <Hueco className="h-11 rounded-lg" />
      </div>
    </div>
  )
}

// Lista de filas (convocatorias, aspirantes, documentos…).
//  - tarjeta: las filas van dentro de la tarjeta plana de las listas reales (p-1, filas de dos líneas).
//  - pie: reserva el pie de paginación (ver PiePaginacion).
// La cantidad de filas es una estimación de lo visible, no el total real. Cuando la lista vive en un área de alto limitado
// (flex con min-h-0), la tarjeta se recorta (overflow-hidden) en vez de crecer: no genera scroll ni empuja el pie.
export function EsqueletoLista({ texto, filas = 5, avatar = true, tarjeta = false, pie = false, textoPie, className = '', listaClassName = '' }) {
  return (
    <CargaInicial texto={texto} rellenar={tarjeta} className={tarjeta ? `flex min-h-0 flex-1 flex-col ${className}`.trim() : className}>
      <div className={tarjeta ? 'flex min-h-0 flex-1 flex-col gap-2' : ''}>
        <ul
          className={
            tarjeta
              ? `${CLASE_TARJETA_PLANA} flex min-h-0 flex-col gap-0.5 overflow-hidden p-1 ${listaClassName}`.trim()
              : 'flex flex-col gap-2'
          }
        >
          {Array.from({ length: filas }, (_, i) => (
            <li key={i} className={tarjeta ? 'flex min-h-14 shrink-0 flex-col justify-center gap-1.5 px-3 py-1.5' : 'px-3 py-2'}>
              {tarjeta ? (
                <>
                  <Hueco className="h-3.5 w-4/5" />
                  <Hueco className="h-2.5 w-3/5" />
                </>
              ) : (
                <Persona avatar={avatar ? 'size-8' : null} />
              )}
            </li>
          ))}
        </ul>
        {pie && <PiePaginacion textoPie={textoPie} className="shrink-0" />}
      </div>
    </CargaInicial>
  )
}

// Tabla: encabezado y filas con 'columnas' celdas (la primera ancha, con persona), dentro de la misma tarjeta plana que las tablas reales.
//  - 'encabezados' (opcional): los títulos que YA se conocen y se pueden mostrar al perfil (p. ej. Aspirante, Estado, Acciones) con su
//    estilo real; solo las filas son esqueleto. Cada uno es { texto, clase, tipo }, con tipo 'persona' (por defecto la primera), 'casilla' o 'hueco': 'clase' son sus ajustes de ancho o visibilidad (hidden
//    @min-[720px]:block, text-right…) y se aplican también a la celda de las filas. 'plantilla' es la clase de rejilla de columnas.
//    Las columnas que dependen de la modalidad o de permisos que aún no se conocen simplemente no se pasan: no se inventan.
//  - 'pie' reserva la línea del total bajo la tarjeta (gap-4 como en las pantallas); 'textoPie' la rellena con el texto de carga. No
//    dibuja botones de página: aún no se sabe si habrá más de una ni cuántos resultados hay.
export function EsqueletoTabla({ texto, filas = 5, columnas = 3, encabezados, plantilla = '', pie = false, textoPie, className = '' }) {
  const celda = 'px-3 first:pl-4 last:pr-4'
  return (
    <CargaInicial texto={texto} className={className}>
      <div className={CLASE_TARJETA_PLANA + ' overflow-hidden'}>
        {encabezados ? (
          <>
            <div className={`grid items-center py-3 ${CLASE_THEAD} ${plantilla}`}>
              {encabezados.map((h) => (
                <span key={h.texto} className={`${celda} whitespace-nowrap ${h.clase ?? ''}`.trim()}>
                  {h.texto}
                </span>
              ))}
            </div>
            <div className="divide-y divide-sena-hundido dark:divide-sena-borde">
              {Array.from({ length: filas }, (_, i) => (
                <div key={i} className={`grid items-center gap-y-2 py-3.5 ${plantilla}`}>
                  {encabezados.map((h, j) => (
                    <span key={h.texto} className={`${celda} ${h.clase ?? ''}`.trim()}>
                      {(h.tipo ?? (j === 0 ? 'persona' : 'hueco')) === 'persona' ? (
                        <Persona />
                      ) : h.tipo === 'casilla' ? (
                        <Hueco className="size-5 rounded-md" />
                      ) : (
                        <Hueco className="h-3 w-3/4" />
                      )}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="border-b border-sena-linea bg-sena-fondo/60 px-4 py-3.5 dark:border-sena-borde dark:bg-sena-noche/30">
              <Hueco className="h-3 w-1/4" />
            </div>
            <div className="divide-y divide-sena-hundido dark:divide-sena-borde">
              {Array.from({ length: filas }, (_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5">
                  <Persona className="w-2/5 flex-1" />
                  {Array.from({ length: Math.max(0, columnas - 1) }, (_, j) => (
                    <Hueco key={j} className={`h-3 ${j === 0 ? 'hidden w-20 @min-[480px]:block' : 'w-14'}`} />
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      {pie && (
        <div className="mt-4 px-1">
          <LineaTotal textoPie={textoPie} />
        </div>
      )}
    </CargaInicial>
  )
}

// Tarjetas en rejilla (listados de tarjetas): título, dos líneas y una fila de datos. La rejilla es de 1 columna, 2 desde
// 600 px de contenedor y 3 desde 940 px; con 'n' impar se añade una tarjeta que solo se ve en la banda de 2 columnas, para no
// dejar media fila vacía. 'unaColumna' fuerza una sola columna (listados de tarjetas a todo el ancho).
// 'rejilla' y 'clasesItem' permiten a una pantalla con rejilla propia (por ancho de ventana) decir cuántas tarjetas se ven en cada ancho.
// 'claseTarjeta' (p. ej. un alto mínimo) acerca el esqueleto al alto real de las tarjetas de esa pantalla.
export function EsqueletoTarjetas({ texto, n = 3, unaColumna = false, rejilla, clasesItem, claseTarjeta = '', pie = false, textoPie, className = '' }) {
  const extra = !unaColumna && !rejilla && n % 2 === 1
  return (
    <CargaInicial texto={texto} className={className}>
      <ul className={rejilla ?? (unaColumna ? 'flex flex-col gap-3' : 'grid gap-4 @min-[600px]:grid-cols-2 @min-[940px]:grid-cols-3')}>
        {Array.from({ length: n + (extra ? 1 : 0) }, (_, i) => (
          <li
            key={i}
            className={`${CLASE_TARJETA_PLANA} flex flex-col gap-3 p-4 ${claseTarjeta} ${clasesItem ? clasesItem(i) : i === n ? 'hidden @min-[600px]:flex @min-[940px]:hidden' : ''}`.trim()}
          >
            <div className="flex items-center justify-between gap-3">
              <Hueco className="h-4 w-1/3" />
              <Hueco className="h-5 w-16 rounded-full" />
            </div>
            <Hueco className="h-4 w-4/5" />
            <Hueco className="h-3 w-3/5" />
            <div className="mt-1 flex gap-2">
              <Hueco className="h-6 w-20 rounded-full" />
              <Hueco className="h-6 w-24 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
      {pie && (
        <div className="mt-4 px-1">
          <LineaTotal textoPie={textoPie} />
        </div>
      )}
    </CargaInicial>
  )
}

// Detalle: opcionalmente una fila de 'metricas' (cifras) y 'bloques' (tarjetas con título y líneas). Las métricas usan la misma
// rejilla y el mismo alto que ResumenSeleccion (2 columnas, y desde 600 px tantas como quepan) para que el resumen no salte.
export function EsqueletoDetalle({ texto, metricas = 0, bloques = 2, className = '' }) {
  return (
    <CargaInicial texto={texto} className={className}>
      <div className="flex flex-col gap-4">
        {metricas > 0 && (
          <div
            className={`${CLASE_TARJETA_PLANA} grid grid-cols-2 items-start gap-x-5 gap-y-3 p-4 @min-[600px]:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]`}
          >
            {Array.from({ length: metricas }, (_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <Hueco className="h-3 w-2/3" />
                <Hueco className="h-5 w-1/3" />
              </div>
            ))}
          </div>
        )}
        {Array.from({ length: bloques }, (_, i) => (
          <div key={i} className={`${CLASE_TARJETA_PLANA} flex flex-col gap-3 p-4`}>
            <Hueco className="h-4 w-1/3" />
            <Hueco className="h-3 w-full" />
            <Hueco className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </CargaInicial>
  )
}
