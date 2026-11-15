// Casilla de una fila de las tablas de Selección («Elegir» como finalista y «Comparar»). Mismo control para las dos:
// el cuadro es de 20 px pero toda su zona táctil mide 44 px (el rótulo con margen negativo no agranda la fila), con
// foco visible y cursor de «no permitido» cuando está desactivada. 'etiqueta' dice a quién marca y para qué.
export default function CasillaSeleccion({ marcada, desactivada = false, onCambiar, etiqueta, title }) {
  return (
    <label
      title={title}
      className={`-m-2 flex size-11 items-center justify-center ${desactivada ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <input
        type="checkbox"
        className="size-5 shrink-0 cursor-pointer accent-sena-oscuro focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena disabled:cursor-not-allowed"
        checked={marcada}
        disabled={desactivada}
        onChange={onCambiar}
        aria-label={etiqueta}
      />
    </label>
  )
}
