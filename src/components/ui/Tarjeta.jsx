import { CLASE_TARJETA, CLASE_TITULO_SECCION } from '../../lib/estilos'

// Superficie base para agrupar contenido.
export function Tarjeta({ as: Componente = 'div', className = '', children, ...props }) {
  return (
    <Componente className={`${CLASE_TARJETA} ${className}`.trim()} {...props}>
      {children}
    </Componente>
  )
}

// Tarjeta con el título de sección estándar. La cabecera va sobre una banda
// tenue con la barra verde institucional y un borde inferior que separa el
// título del contenido, para que la sección se lea como una unidad.
export function TarjetaSeccion({ titulo, className = '', children }) {
  return (
    <section className={`${CLASE_TARJETA} overflow-hidden ${className}`.trim()}>
      {titulo && (
        <header className="border-b border-sena-linea/80 bg-sena-fondo/50 px-4 py-3 dark:border-sena-borde/60 dark:bg-sena-noche/30">
          <h2 className={CLASE_TITULO_SECCION}>{titulo}</h2>
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export default Tarjeta
