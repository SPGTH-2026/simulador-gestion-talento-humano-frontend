// Barra de progreso de una subida. 'valor' va de 0 a 100. Se muestra dentro de la
// tarjeta del documento mientras el archivo se envía, con el porcentaje real.
export default function BarraProgreso({ valor = 0, etiqueta = 'Subiendo documento' }) {
  const porcentaje = Math.min(100, Math.max(0, Math.round(valor)))

  return (
    <div className="mt-2" role="status" aria-live="polite">
      <div className="mb-1 flex items-center justify-between text-xs font-medium text-sena-azul dark:text-sena-texto">
        <span>{etiqueta}…</span>
        <span className="tabular-nums">{porcentaje}%</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-sena-hundido dark:bg-sena-superficie-alta"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje}
      >
        <div
          className="h-full rounded-full bg-sena transition-[width] duration-200 ease-out"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  )
}
