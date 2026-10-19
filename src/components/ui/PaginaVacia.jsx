import Tarjeta from '../ui/Tarjeta'

// Marcador de vista todavía no construida. No se muestra el permiso que la
// habilita: es un detalle interno del enrutado y no le aporta nada al usuario.
export default function PaginaVacia({ titulo }) {
  return (
    <Tarjeta className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-sena-texto">{titulo}</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-sena-texto-suave">
        Página en construcción.
      </p>
    </Tarjeta>
  )
}
