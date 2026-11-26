import Etiqueta from '../ui/Etiqueta'
import { etiquetasDocumento } from '../../lib/documentosConvocatoria'
import { CLASE_INPUT } from '../../lib/estilos'

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
        <label className="flex flex-col gap-1 text-xs text-slate-500 dark:text-sena-texto-suave">
          Checklist de este documento (un ítem por línea, opcional)
          <textarea
            rows={3}
            value={itemsDe ? itemsDe(identificador) : ""}
            onChange={(e) => cambiarItems(identificador, e.target.value)}
            disabled={bloqueado}
            placeholder="Ej.: Datos personales completos
Firmada"
            className={`${CLASE_INPUT} text-sm`}
          />
        </label>
      )}
    </div>
  )
}
