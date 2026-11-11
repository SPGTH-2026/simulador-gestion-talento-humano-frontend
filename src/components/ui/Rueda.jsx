// Rueda de "trabajando": un anillo con un tramo abierto que gira. Con movimiento
// reducido queda quieta: el anillo abierto sigue indicando el estado junto al
// texto. Es decorativa (aria-hidden); quien la usa debe decir en texto o con
// aria-busy qué está pasando.
export default function Rueda({ className = 'size-4' }) {
  return (
    <span
      aria-hidden="true"
      className={`${className} shrink-0 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin`}
    />
  )
}
