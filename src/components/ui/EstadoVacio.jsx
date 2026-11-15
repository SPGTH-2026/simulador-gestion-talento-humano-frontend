import Boton from './Boton'

// Estado vacío reutilizable: cuando una lista no tiene resultados.
export default function EstadoVacio({ icono, titulo, descripcion, accion, children }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icono && <p className="text-4xl mb-3">{icono}</p>}
      {titulo && <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{titulo}</h3>}
      {descripcion && <p className="text-sm text-slate-500 dark:text-sena-texto-suave mb-4 max-w-md">{descripcion}</p>}
      {accion && (
        <Boton onClick={accion.onClick}>{accion.label}</Boton>
      )}
      {children}
    </div>
  )
}