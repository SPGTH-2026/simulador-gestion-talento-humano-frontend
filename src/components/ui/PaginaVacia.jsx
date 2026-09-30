export default function PaginaVacia({ titulo, permiso }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-bold text-slate-800">{titulo}</h1>
      <p className="mt-2 text-slate-500">Página en construcción.</p>
      <p className="mt-4 text-sm text-slate-400">
        Permiso requerido: <code>{permiso}</code>
      </p>
    </div>
  )
}