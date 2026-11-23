import Campo from '../../ui/Campo'

// Etapa 2 del asistente de convocatorias. Recibe el estado y las acciones del asistente en la prop ctx.
export default function EtapaDescripcion({ ctx }) {
  const { campo, errorDe } = ctx
  return (
      <div className="flex flex-col gap-4">
        <Campo etiqueta="Descripción del cargo" requerido error={errorDe('descripcion')}>
          <textarea rows={4} {...campo('descripcion')} />
        </Campo>

        <Campo etiqueta="Funciones principales" error={errorDe('funciones')}>
          <textarea rows={4} {...campo('funciones')} />
        </Campo>

        <Campo etiqueta="Responsabilidades" error={errorDe('responsabilidades')}>
          <textarea rows={4} {...campo('responsabilidades')} />
        </Campo>

        <Campo etiqueta="Perfil requerido" error={errorDe('perfil_requerido')}>
          <textarea rows={4} {...campo('perfil_requerido')} />
        </Campo>
      </div>
  )
}
