// Estado vacío reutilizable: cuando una lista no tiene resultados.
export default function EstadoVacio({ children }) {
  return (
    <p className="p-8 text-center text-sm text-slate-500 dark:text-sena-texto-suave">{children}</p>
  )
}
