// Marcador de vista todavia no construida. No se muestra el permiso que la
// habilita: es un detalle interno del enrutado y no le aporta nada al usuario.
export default function PaginaVacia({ titulo }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-sena-borde dark:bg-sena-superficie">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-sena-texto">{titulo}</h1>
      <p className="mt-2 text-slate-500 dark:text-sena-texto-suave">
        Página en construcción.
      </p>
    </div>
  )
}
