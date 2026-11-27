import Boton from '../../components/ui/Boton'
import Icono from '../../components/ui/Icono'

// Botón de icono de 44 px (el botón «contorno» del sistema con un icono del sistema) y su ayuda visible. Quien lo usa decide cuál
// ayuda se ve (`visible`) para que NUNCA haya dos a la vez: aparece al pasar el puntero o al enfocar con el teclado, desaparece al
// salir, al perder el foco o con Escape. El nombre accesible es 'etiqueta'.
export default function BotonIconoFicha({ etiqueta, ayuda, icono, onClick, disabled, visible, onMostrar, onOcultar }) {
  return (
    <span
      className="relative inline-flex"
      onPointerEnter={onMostrar}
      onPointerLeave={onOcultar}
      onFocus={onMostrar}
      onBlur={onOcultar}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onOcultar()
      }}
    >
      <Boton variante="contorno" onClick={onClick} disabled={disabled} aria-label={etiqueta} className="w-11 px-0!">
        <Icono nombre={icono} />
      </Boton>
      <span
        role="tooltip"
        aria-hidden={!visible}
        className={`pointer-events-none absolute -top-1 left-1/2 z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-sena-azul px-2 py-1 text-xs font-medium text-white shadow-md transition-opacity motion-reduce:transition-none dark:bg-sena-superficie-alta dark:text-sena-texto ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {ayuda}
      </span>
    </span>
  )
}
