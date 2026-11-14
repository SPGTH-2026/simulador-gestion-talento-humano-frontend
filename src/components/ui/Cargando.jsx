import Rueda from './Rueda'

// Estado de carga reutilizable (dentro de tablas o de una vista): la rueda y el texto de lo que se espera, anunciados
// a los lectores de pantalla. El texto va como contenido: <Cargando>Cargando fichas…</Cargando>.
export default function Cargando({ children = 'Cargando…' }) {
  return (
    <p
      role="status"
      className="flex items-center justify-center gap-2 p-8 text-center text-sm text-slate-500 dark:text-sena-texto-suave"
    >
      <Rueda /> {children}
    </p>
  )
}
