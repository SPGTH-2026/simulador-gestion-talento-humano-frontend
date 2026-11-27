import { useState } from 'react'
import Boton from '../ui/Boton'
import Etiqueta from '../ui/Etiqueta'
import { etiquetasDocumento, itemsDeTexto, itemsFijos } from '../../lib/documentosConvocatoria'
import { CLASE_INPUT } from '../../lib/estilos'

// Checklist de un documento: los ítems fijos (predeterminados) no se quitan; el gestor puede agregar más.
function ChecklistDocumento({ codigo, nombre, texto, bloqueado, onCambiar }) {
  const [nuevo, setNuevo] = useState('')
  const items = itemsDeTexto(texto)
  const fijos = new Set(itemsFijos(codigo))

  const agregar = () => {
    const limpio = nuevo.trim()
    if (!limpio) return
    onCambiar([...items, limpio].join('\n'))
    setNuevo('')
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-slate-500 dark:text-sena-texto-suave">Checklist de este documento</span>
      {items.length > 0 && (
        <ul className="flex flex-col gap-1">
          {items.map((item, indice) => (
            <li
              key={`${indice}-${item}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded bg-slate-50 px-2 py-1 text-sm text-slate-700 dark:bg-sena-noche dark:text-sena-texto"
            >
              <span className="min-w-0 break-words">{item}</span>
              {fijos.has(item) ? (
                <Etiqueta tono="neutral">Fijo</Etiqueta>
              ) : (
                !bloqueado && (
                  <Boton
                    variante="peligroSuave"
                    tamano="tactil"
                    onClick={() => onCambiar(items.filter((_, i) => i !== indice).join('\n'))}
                    aria-label={`Quitar «${item}» de ${nombre}`}
                  >
                    Quitar
                  </Boton>
                )
              )}
            </li>
          ))}
        </ul>
      )}
      {!bloqueado && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                agregar()
              }
            }}
            maxLength={200}
            placeholder="Nuevo ítem del checklist"
            aria-label={`Nuevo ítem del checklist de ${nombre}`}
            className={`${CLASE_INPUT} min-w-56 flex-1 text-sm`}
          />
          <Boton variante="contorno" tamano="tactil" onClick={agregar} disabled={!nuevo.trim()}>
            Agregar ítem
          </Boton>
        </div>
      )}
    </div>
  )
}

// Una fila del paso de documentos: casilla, nombre, etiquetas y su porcentaje.
// El % solo se habilita cuando el documento está incluido en la convocatoria.
// Recibe lo que usa como props (no el contexto entero) y el wizard la monta con sus manejadores.
export default function FilaDocumento({ documento, fijo = false, seleccionados, bloqueado, ponderacion, alternar, ponderar, itemsDe, cambiarItems }) {
  const identificador = documento.codigo ?? documento.id
  const incluido = fijo || seleccionados.includes(identificador)
  const deshabilitado = !incluido || bloqueado

  return (
    <div className="flex flex-col gap-2 rounded border border-slate-200 p-3 dark:border-sena-borde">
      <div className="flex flex-wrap items-center justify-between gap-2">
      <label className="flex flex-1 items-center gap-2 text-sm text-slate-700 dark:text-sena-texto">
        <input
          type="checkbox"
          checked={incluido}
          onChange={() => alternar(identificador)}
          readOnly={fijo}
          disabled={fijo || bloqueado}
          className="h-4 w-4 accent-sena"
        />
        <span>{documento.nombre}</span>
        {etiquetasDocumento(documento.codigo).map((etiqueta) => (
          <Etiqueta key={etiqueta} tono="neutral">
            {etiqueta}
          </Etiqueta>
        ))}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={ponderacion(identificador)}
          onChange={(e) => ponderar(identificador, e.target.value)}
          disabled={deshabilitado}
          aria-label={`Porcentaje de ${documento.nombre}`}
          placeholder="—"
          className={`${CLASE_INPUT} w-24 text-right`}
        />
        <span className="text-sm text-slate-500 dark:text-sena-texto-suave">%</span>
      </div>
      </div>
      {incluido && cambiarItems && (
        <ChecklistDocumento
          codigo={documento.codigo}
          nombre={documento.nombre}
          texto={itemsDe ? itemsDe(identificador) : ''}
          bloqueado={bloqueado}
          onCambiar={(texto) => cambiarItems(identificador, texto)}
        />
      )}
    </div>
  )
}
