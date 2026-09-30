import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-lg">Esta página no existe.</p>
      <Link to="/" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
        Volver al inicio
      </Link>
    </div>
  )
}
