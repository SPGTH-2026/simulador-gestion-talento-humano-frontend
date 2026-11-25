// Marcas de contenido sin cerrar en las páginas informativas. Un dato pendiente nunca se redacta como si estuviera decidido: se ve
// con borde punteado y su nombre, y los lectores de pantalla lo anuncian como «dato pendiente».
export function CampoPendiente({ dato }) {
  return (
    <span className="mx-0.5 inline rounded border border-dashed border-aviso/70 bg-aviso/10 px-1.5 py-0.5 text-[0.9em] font-medium text-aviso [overflow-wrap:anywhere]">
      <span className="sr-only">Dato pendiente: </span>
      <span aria-hidden="true">[ </span>
      {dato}
      <span aria-hidden="true"> ]</span>
    </span>
  )
}

// Etiqueta de origen de un bloque: «Verificado en el código» (descripción técnica de lo que hace hoy la aplicación), «Confirmado por
// el equipo» (dato que el equipo declaró) o «Borrador» (texto sin aprobar). Ninguna significa aprobación legal.
const TEXTOS = {
  verificado: 'Verificado en el código · pendiente de revisión',
  confirmado: 'Confirmado por el equipo · pendiente de revisión',
  borrador: 'Borrador · sin aprobar',
}

export function EtiquetaContenido({ tipo }) {
  const verificado = tipo === 'verificado' || tipo === 'confirmado'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        verificado
          ? 'border-sena-azul/30 bg-sena-cielo/20 text-sena-azul dark:border-sena-borde dark:bg-sena-superficie-alta dark:text-sena-texto'
          : 'border-aviso/40 bg-aviso/10 text-aviso'
      }`}
    >
      {TEXTOS[tipo] ?? TEXTOS.borrador}
    </span>
  )
}
