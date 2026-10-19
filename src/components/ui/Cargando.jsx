// Estado de carga reutilizable (dentro de tablas o de una vista).
export default function Cargando({ children = 'Cargando…' }) {
  return (
    <p className="p-8 text-center text-sm text-slate-500 dark:text-sena-texto-suave">{children}</p>
  )
}
