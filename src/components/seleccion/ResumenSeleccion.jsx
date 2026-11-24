import { CLASE_META_DD, CLASE_META_DT, CLASE_TARJETA_PLANA } from '../../lib/estilos'

// Resumen de cifras de una convocatoria (Ranking y Decidir): una tarjeta con métricas alineadas. Dos columnas mientras el panel
// mide menos de 600 px (cada cifra con su etiqueta completa, sin apretarse) y, desde ahí, tantas como quepan (mínimo 9 rem).
// Se compone con <Metrica>: cada una es un término y su valor, en el mismo orden visual y de lectura.
export function ResumenSeleccion({ etiqueta, children }) {
  return (
    <section aria-label={etiqueta}>
      <dl
        className={`${CLASE_TARJETA_PLANA} grid grid-cols-2 items-start gap-x-5 gap-y-3 p-4 @min-[600px]:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]`}
      >
        {children}
      </dl>
    </section>
  )
}

export function Metrica({ titulo, children }) {
  return (
    <div>
      <dt className={CLASE_META_DT}>{titulo}</dt>
      <dd className={`${CLASE_META_DD} tabular-nums`}>{children}</dd>
    </div>
  )
}
