// Marca de campo obligatorio: asterisco rojo (mismo color 'peligro' que usa Campo) con el texto «obligatorio» solo
// para lectores de pantalla, de modo que la obligatoriedad no dependa del color ni del símbolo. Va dentro de la
// etiqueta del campo o junto al nombre del documento; la leyenda que explica el asterisco se escribe una sola vez
// por pantalla.
export default function MarcaObligatorio() {
  return (
    <>
      <span aria-hidden="true" className="text-peligro">
        {' '}
        *
      </span>
      <span className="sr-only"> (obligatorio)</span>
    </>
  )
}
