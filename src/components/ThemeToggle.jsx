import { CLASE_BOTON_ICONO } from '../lib/estilos'
import { useTema } from '../lib/useTema'
import Boton from './ui/Boton'
import Icono from './ui/Icono'

// Interruptor de tema. Neutro: se ve igual en la barra superior (superficie
// clara u oscura) y en el marco de las pantallas de acceso. Con 'conTexto' es
// una fila completa con su nombre visible, para el cajón de navegación.
export default function ThemeToggle({ conTexto = false }) {
  const { oscuro, alternar } = useTema()
  const etiqueta = oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
  const icono = <Icono nombre={oscuro ? 'sol' : 'luna'} />

  if (conTexto) {
    return (
      <Boton
        variante="fantasma"
        tamano="tactil"
        onClick={alternar}
        aria-pressed={oscuro}
        className="w-full justify-start"
      >
        {icono}
        {etiqueta}
      </Boton>
    )
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={oscuro}
      aria-label={etiqueta}
      title={etiqueta}
      className={CLASE_BOTON_ICONO}
    >
      {icono}
    </button>
  )
}
