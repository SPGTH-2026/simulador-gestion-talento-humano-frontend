import { useEffect, useRef, useState } from 'react'

// Texto recortado a unas líneas que se puede abrir completo con un botón (teclado y táctil), sin depender del atributo title. El botón
// «Ver más» solo existe si el texto de verdad está recortado, y su área es de 44 px añadiendo poca altura a la fila. 'claseLineas' es la
// clase de recorte (line-clamp-N) y 'nombre' aclara a un lector de pantalla qué se despliega.
export default function TextoExpandible({ texto, claseLineas, nombre, className = '' }) {
  const ref = useRef(null)
  const [recortado, setRecortado] = useState(false)
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    const elemento = ref.current
    if (!elemento || abierto || typeof ResizeObserver === 'undefined') return undefined
    const observador = new ResizeObserver(() => setRecortado(elemento.scrollHeight > elemento.clientHeight + 1))
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [abierto, texto])

  return (
    <>
      <span ref={ref} className={`[overflow-wrap:anywhere] ${abierto ? 'block' : claseLineas} ${className}`.trim()}>
        {texto}
      </span>
      {(recortado || abierto) && (
        <button
          type="button"
          aria-expanded={abierto}
          onClick={() => setAbierto(!abierto)}
          className="-mb-3 inline-flex min-h-11 items-center text-xs font-semibold text-sena-azul underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sena dark:text-sena-texto"
        >
          {abierto ? 'Ver menos' : 'Ver más'}
          {' '}
          <span className="sr-only">{nombre}</span>
        </button>
      )}
    </>
  )
}
