import Etiqueta from '../../components/ui/Etiqueta'
import Icono from '../../components/ui/Icono'
import Tarjeta from '../../components/ui/Tarjeta'
import useDesbordeHorizontal from '../../hooks/useDesbordeHorizontal'
import { CLASE_FILA, CLASE_TABLA, CLASE_TBODY, CLASE_THEAD, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import AccionesFicha from './AccionesFicha'
import ResumenInstructores from './ResumenInstructores'
import TextoExpandible from './TextoExpandible'
import { INSTRUCTORES_EN_TABLA, TEXTO_SIN_REGISTRO } from './constantesFichas'

// Fondo opaco de la primera columna fija (debe tapar lo que pasa por debajo al desplazar); el de la fila al pasar el puntero sigue
// siendo el de las demás tablas.
const FONDO_FIJA = 'bg-white group-hover:bg-sena-hundido dark:bg-sena-superficie dark:group-hover:bg-sena-superficie-alta'
// El encabezado de la tabla es translúcido; la celda fija del encabezado necesita un fondo opaco parecido.
const FONDO_ENCABEZADO_FIJO =
  'bg-[color-mix(in_srgb,var(--color-sena-fondo)_60%,white)] dark:bg-[color-mix(in_srgb,var(--color-sena-noche)_30%,var(--color-sena-superficie))]'
// Celdas con 8 px de margen lateral (en vez de 12) para que quepan las siete columnas a 1280 px sin tocar letra ni botones.
const CLASE_TH = 'px-2 py-3'
const CLASE_TD = 'px-2 py-3'

// Tabla de fichas: es la presentación principal en TODOS los anchos. Cada columna tiene su medida útil y no se encoge (los estados y los
// botones no parten sus palabras); si el contenedor no alcanza, se desplaza SOLO la tabla (nunca la página), con un aviso visible
// únicamente cuando hay desbordamiento y con la región enfocable para desplazarla con el teclado. La primera columna queda fija y, en
// móvil, es angosta (6,5 rem como máximo) para que al llegar al final «Acciones» quepa completa a su lado y no quede tapada.
export default function TablaFichas({ fichas, acciones }) {
  const { ref, desborda, alFinal, alDesplazar } = useDesbordeHorizontal()
  return (
    <Tarjeta className="relative overflow-hidden">
      {desborda && (
        <p className={`flex items-center justify-between gap-2 border-b border-sena-linea/70 px-3 py-2 text-xs dark:border-sena-borde/50 ${CLASE_TEXTO_SUAVE}`}>
          <span>Desliza para ver más columnas</span>
          <Icono nombre="chevron" className="size-4 -rotate-90" />
        </p>
      )}
      <div
        ref={ref}
        onScroll={alDesplazar}
        role="region"
        aria-label="Fichas de formación (tabla desplazable)"
        tabIndex={desborda ? 0 : undefined}
        className="overflow-x-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sena"
      >
        <table className={`${CLASE_TABLA} table-fixed`}>
          <caption className="sr-only">Fichas de formación</caption>
          <colgroup>
            <col className="w-[min(6.5rem,28vw)] sm:w-36" />
            <col className="w-[5.25rem]" />
            <col className="w-28" />
            <col className="w-32" />
            <col className="w-28" />
            <col className="w-36" />
            <col className="w-[13.1rem]" />
          </colgroup>
          <thead className={CLASE_THEAD}>
            <tr>
              <th scope="col" className={`${CLASE_TH} sticky left-0 z-10 ${FONDO_ENCABEZADO_FIJO}`}>Ficha</th>
              <th scope="col" className={CLASE_TH}>Estado</th>
              <th scope="col" className={CLASE_TH}>Creada por</th>
              <th scope="col" className={`${CLASE_TH} text-center`}>Convocatorias</th>
              <th scope="col" className={`${CLASE_TH} text-center`}>Aspirantes y aprendices</th>
              <th scope="col" className={CLASE_TH}>Instructores</th>
              <th scope="col" className={`${CLASE_TH} text-center`}>Acciones</th>
            </tr>
          </thead>
          <tbody className={CLASE_TBODY}>
            {fichas.map((ficha) => (
              <tr key={ficha.id} className={`group ${CLASE_FILA}`}>
                <th scope="row" className={`${CLASE_TD} sticky left-0 z-10 text-left font-normal ${FONDO_FIJA}`}>
                  <span className="block font-semibold text-slate-800 [overflow-wrap:anywhere] dark:text-sena-texto">{ficha.codigo}</span>
                  {/* Resumen de tres líneas; el programa completo se abre con «Ver más» (teclado y táctil). */}
                  <TextoExpandible texto={ficha.nombre_programa} claseLineas="line-clamp-3" nombre={`el programa de la ficha ${ficha.codigo}`} className={`text-xs ${CLASE_TEXTO_SUAVE}`} />
                </th>
                <td className={CLASE_TD}>
                  <Etiqueta tono={ficha.estado === 'activa' ? 'exito' : 'neutral'} className="whitespace-nowrap">
                    {ficha.estado === 'activa' ? 'Activa' : 'Cerrada'}
                  </Etiqueta>
                </td>
                <td className={`${CLASE_TD} text-slate-700 dark:text-sena-texto`}>
                  {ficha.creado_por ? (
                    <TextoExpandible texto={ficha.creado_por.name} claseLineas="line-clamp-2" nombre={`quién creó la ficha ${ficha.codigo}`} />
                  ) : (
                    <span className={CLASE_TEXTO_SUAVE}>{TEXTO_SIN_REGISTRO}</span>
                  )}
                </td>
                <td className={`${CLASE_TD} text-center text-slate-700 dark:text-sena-texto`}>{ficha.convocatorias_count}</td>
                <td className={`${CLASE_TD} text-center text-slate-700 dark:text-sena-texto`}>{ficha.usuarios_count}</td>
                <td className={CLASE_TD}>
                  <ResumenInstructores instructores={ficha.instructores} maximo={INSTRUCTORES_EN_TABLA} />
                </td>
                <td className={CLASE_TD}>
                  <AccionesFicha ficha={ficha} {...acciones(ficha)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {desborda && !alFinal && (
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 top-9 w-8 bg-gradient-to-l from-white to-transparent dark:from-sena-superficie" />
      )}
    </Tarjeta>
  )
}
