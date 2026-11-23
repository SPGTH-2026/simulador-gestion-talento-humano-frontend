import { CLASE_META_DD, CLASE_META_DT, CLASE_TITULO_SECCION } from '../../../lib/estilos'

// Bloques de contenido del detalle: título de sección, párrafos, listas y datos de condiciones.
export function TituloSeccion({ children, className = '' }) {
  return <h3 className={`${CLASE_TITULO_SECCION} ${className}`.trim()}>{children}</h3>
}

// Párrafo de texto libre con los saltos de línea respetados. Se queda en 14 px
// (el mínimo del contenido): compactar significa recortar espacios, no bajar la
// tipografía por debajo de los mínimos.
export function Parrafo({ children }) {
  return (
    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-sena-texto">
      {children}
    </p>
  )
}

// Lista con viñeta verde: una línea por elemento.
export function ListaLineas({ lineas }) {
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

// Dato de la lista de condiciones: etiqueta pequeña arriba y valor en negrita debajo, con su línea inferior (token
// sena-separador). Apilados caben en columnas angostas sin partir las etiquetas largas («Tipo de convocatoria»).
export function FilaCondicion({ etiqueta, valor }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-sena-separador py-2">
      <dt className={CLASE_META_DT}>{etiqueta}</dt>
      <dd className={`${CLASE_META_DD} mt-0 min-w-0 break-words`}>{valor}</dd>
    </div>
  )
}
