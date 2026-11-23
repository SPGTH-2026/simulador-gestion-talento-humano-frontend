// Barra de progreso de una carga. 'valor' va de 0 a 100. Se muestra dentro de la
// tarjeta del documento mientras el archivo se envía, con el porcentaje real.
//
// Dos fases distintas: mientras el archivo viaja muestra «etiqueta… NN %». Al llegar
// al 100 % el archivo ya está en el servidor, que todavía valida, guarda y confirma:
// la barra pasa a «Procesando…» (llena y con pulso suave) para no aparentar que ya
// terminó. Desaparece cuando quien la usa deja de montarla, o sea cuando se conoce
// el resultado.
export default function BarraProgreso({
  valor = 0,
  etiqueta = 'Cargando documento',
  etiquetaProcesando = 'Procesando',
  className = 'mt-2',
}) {
  const porcentaje = Math.min(100, Math.max(0, Math.round(valor)))
  const procesando = porcentaje >= 100

  return (
    <div className={className} role="status" aria-live="polite">
      <div className="mb-1 flex items-center justify-between text-sm font-medium text-sena-azul dark:text-sena-texto">
        <span>{procesando ? etiquetaProcesando : etiqueta}…</span>
        {!procesando && <span className="tabular-nums">{porcentaje}%</span>}
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-sena-hundido dark:bg-sena-superficie-alta"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={procesando ? undefined : porcentaje}
        aria-valuetext={procesando ? 'Procesando' : `${porcentaje} %`}
      >
        <div
          className={`h-full rounded-full bg-sena transition-[width] duration-200 ease-out ${
            procesando ? 'motion-safe:animate-pulse' : ''
          }`}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  )
}
