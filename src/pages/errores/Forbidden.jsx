import { Link } from 'react-router-dom'

export default function Forbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-5xl font-bold text-slate-800 dark:text-sena-texto">403</h1>
      <p className="text-lg text-slate-600 dark:text-sena-texto-suave">
        No tienes permiso para ver esta página.
      </p>
      <Link
        to="/"
        className="rounded bg-sena-oscuro px-4 py-2 text-white transition-colors hover:bg-sena-azul"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
