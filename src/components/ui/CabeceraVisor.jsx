import { Fragment, useEffect, useRef, useState } from 'react'
import Boton from './Boton'
import Icono from './Icono'
import { IconoX } from '../convocatorias/Iconos'

// Cabecera del visor de documentos.
//  - Identificación: título descriptivo (máximo 2 líneas con puntos suspensivos) y, debajo, el nombre del archivo en UNA línea con
//    elipsis. Los textos completos siguen en el DOM (los lectores de pantalla los leen enteros). Si algo se recorta aparece
//    «Ver más» (botón, con teclado y táctil; no depende del tooltip) que despliega ambos textos sin recortar.
//  - La X de cerrar queda siempre arriba a la derecha (mismo cierre que los demás diálogos). Las acciones secundarias van a su lado
//    cuando cabe y pasan a una segunda fila cuando no.
const ACCION = 'gap-2'

// Ofrece al navegador puntos de corte naturales tras «_», «-» y «.» (nombres de archivo e identificadores). El texto no cambia
// (copiar y lectores de pantalla lo leen igual); así un identificador largo se parte por sus separadores y no en medio de una palabra.
const conCortes = (texto) =>
  texto.split(/(?<=[_.-])/).map((trozo, i) => (
    <Fragment key={i}>
      {i > 0 && <wbr />}
      {trozo}
    </Fragment>
  ))

export default function CabeceraVisor({ idTitulo, titulo, nombre, onAbrir, onDescargar, puedeAbrir, puedeDescargar, onCerrar, botonCerrar }) {
  const refTitulo = useRef(null)
  const refNombre = useRef(null)
  const [recortado, setRecortado] = useState(false)
  const [completo, setCompleto] = useState(false)
  const textoTitulo = titulo || nombre || 'Documento'
  const mostrarNombre = Boolean(titulo && nombre && titulo !== nombre)

  // Mide si algo se está recortando (se re-mide al cambiar el ancho). El callback del observador corre también al empezar a observar.
  useEffect(() => {
    const medir = () => {
      const t = refTitulo.current
      const n = refNombre.current
      setRecortado(Boolean((t && t.scrollHeight > t.clientHeight + 1) || (n && n.scrollWidth > n.clientWidth + 1)))
    }
    if (typeof ResizeObserver === 'undefined') {
      medir()
      return undefined
    }
    const observador = new ResizeObserver(medir)
    if (refTitulo.current) observador.observe(refTitulo.current)
    if (refNombre.current) observador.observe(refNombre.current)
    return () => observador.disconnect()
  }, [textoTitulo, nombre, completo])

  return (
    <header className="@container grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 max-h-[60dvh] overflow-y-auto border-b border-sena-linea px-4 py-2.5 dark:border-sena-borde @min-[640px]:grid-cols-[minmax(0,1fr)_auto_auto]">
      <div className="min-w-0 self-center">
        <h2
          ref={refTitulo}
          id={idTitulo}
          className={`text-base font-semibold text-sena-azul dark:text-sena-texto ${completo ? 'break-words' : 'line-clamp-2 break-words'}`}
        >
          {conCortes(textoTitulo)}
        </h2>
        {mostrarNombre && (
          <p
            ref={refNombre}
            className={`mt-0.5 text-sm text-slate-600 dark:text-sena-texto-suave ${completo ? 'break-words' : 'truncate'}`}
          >
            {completo ? conCortes(nombre) : nombre}
          </p>
        )}
        {(recortado || completo) && (
          <Boton variante="enlace" tamano="tactil" className="-ml-4 justify-start" aria-expanded={completo} onClick={() => setCompleto((v) => !v)}>
            {completo ? 'Ver menos' : 'Ver más'}
          </Boton>
        )}
      </div>

      <Boton
        ref={botonCerrar}
        variante="fantasma"
        tamano="tactil"
        onClick={onCerrar}
        aria-label="Cerrar visor"
        autoFocus
        className="col-start-2 row-start-1 self-start @min-[640px]:col-start-3"
      >
        <IconoX className="size-5" />
      </Boton>

      <div className={`col-span-2 row-start-2 flex flex-wrap items-center ${ACCION} @min-[640px]:col-span-1 @min-[640px]:col-start-2 @min-[640px]:row-start-1 @min-[640px]:self-center`}>
        {/* En pantallas estrechas el texto se acorta para que las dos acciones quepan en una fila y quede más alto para el PDF;
            el nombre accesible sigue siendo el completo. */}
        <Boton variante="contorno" onClick={onAbrir} disabled={!puedeAbrir} aria-label="Abrir en otra pestaña">
          <Icono nombre="externo" className="size-4" />
          <span className="@min-[480px]:hidden" aria-hidden="true">Abrir</span>
          <span className="hidden @min-[480px]:inline" aria-hidden="true">Abrir en otra pestaña</span>
        </Boton>
        <Boton variante="contorno" onClick={onDescargar} disabled={!puedeDescargar}>
          <Icono nombre="descargar" className="size-4" />
          Descargar
        </Boton>
      </div>
    </header>
  )
}
