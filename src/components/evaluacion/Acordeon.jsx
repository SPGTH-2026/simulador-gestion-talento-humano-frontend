import { useState } from 'react'

export default function Acordeon({ titulo, children, abiertoPorDefecto = false }) {
  const [abierto, setAbierto] = useState(abiertoPorDefecto)
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-sena-borde">
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className="flex w-full items-center justify-between bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:bg-sena-noche dark:text-sena-texto dark:hover:bg-sena-superficie-alta"
      >
        {titulo}
        <span className="text-xs">{abierto ? '▲' : '▼'}</span>
      </button>
      {abierto && (
        <div className="border-t border-slate-200 p-3 dark:border-sena-borde">{children}</div>
      )}
    </div>
  )
}
