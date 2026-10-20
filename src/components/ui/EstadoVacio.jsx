// Estado vacío reutilizable: cuando una lista no tiene resultados.
export default function EstadoVacio({ icono, titulo, descripcion, accion, children }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icono && <p className="text-4xl mb-3">{icono}</p>}
      {titulo && <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{titulo}</h3>}
      {descripcion && <p className="text-sm text-slate-500 dark:text-sena-texto-suave mb-4 max-w-md">{descripcion}</p>}
      {accion && (
        <button
          onClick={accion.onClick}
          className="px-4 py-2 text-sm font-semibold text-white bg-sena-azul rounded hover:bg-sena-azul/90 transition-colors"
        >
          {accion.label}
        </button>
      )}
      {children}
    </div>
  )
}