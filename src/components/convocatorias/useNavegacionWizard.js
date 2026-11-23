import { useEffect, useRef, useState } from 'react'
import { ETAPA_DE_CAMPO, ULTIMA_ETAPA } from './convocatoriaWizardUtils'

// Navegación del asistente: el paso actual, los saltos a un campo, a un error o a otro paso, y el foco que se
// lleva tras cada salto. 'enfocar' guarda el campo (o '__titulo') que debe recibir el foco; 'pulsoFoco' cambia
// cada vez que se pide un salto, para que el efecto de foco se ejecute aunque el paso no cambie.
export default function useNavegacionWizard({ etapaInicial, errores }) {
  const [etapa, setEtapa] = useState(etapaInicial)
  const [pulsoFoco, setPulsoFoco] = useState(0)
  const enfocar = useRef(null)

  // Si el servidor devuelve errores por campo, salta a la etapa del primero.
  // Los errores de skills llegan con la clave 'skills' (conjunto) o 'skills.N'
  // (un ítem): se busca la etapa por la clave base.
  useEffect(() => {
    const campos = Object.keys(errores ?? {})
    if (campos.length === 0) return
    const base = campos[0].split('.')[0]
    const destino = ETAPA_DE_CAMPO[campos[0]] ?? ETAPA_DE_CAMPO[base]
    if (destino) {
      setEtapa(destino)
      enfocar.current = campos[0]
      setPulsoFoco((n) => n + 1)
    }
    // Solo cuando cambian los errores entrantes.
  }, [errores])

  // Lleva al primer paso con un error y deja el foco en su campo.
  const irAlPrimerError = (lista) => {
    const campo = Object.keys(lista).sort((x, y) => (ETAPA_DE_CAMPO[x] ?? 9) - (ETAPA_DE_CAMPO[y] ?? 9))[0]
    if (!campo) return
    enfocar.current = campo
    setEtapa(ETAPA_DE_CAMPO[campo] ?? etapa)
    setPulsoFoco((n) => n + 1)
  }

  const irACampo = (campo) => {
    enfocar.current = campo
    setEtapa(ETAPA_DE_CAMPO[campo] ?? etapa)
    setPulsoFoco((n) => n + 1)
  }

  const irAEtapa = (nueva) => {
    enfocar.current = '__titulo'
    setEtapa(nueva)
    setPulsoFoco((n) => n + 1)
  }

  const siguiente = () => irAEtapa(Math.min(ULTIMA_ETAPA, etapa + 1))
  const anterior = () => irAEtapa(Math.max(1, etapa - 1))

  // Foco tras cambiar de paso o saltar a un error: el campo con error o, si no se encuentra, el título del paso. Solo
  // toca el DOM (no estado), así que no provoca un segundo render.
  useEffect(() => {
    if (!enfocar.current) return
    const objetivo = enfocar.current
    enfocar.current = null
    const el =
      (objetivo !== '__titulo' && document.querySelector(`[data-campo="${objetivo}"]`)) ||
      document.getElementById(`paso-titulo-${etapa}`)
    if (!el) return
    el.focus({ preventScroll: true })
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [pulsoFoco, etapa])

  return { etapa, irAlPrimerError, irACampo, irAEtapa, siguiente, anterior }
}
