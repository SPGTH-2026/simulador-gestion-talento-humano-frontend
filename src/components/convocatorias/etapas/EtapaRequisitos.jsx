import Campo from '../../ui/Campo'

// Etapa 3 del asistente de convocatorias. Recibe el estado y las acciones del asistente en la prop ctx.
export default function EtapaRequisitos({ ctx }) {
  const { campo, errorDe } = ctx
  return (
      <div className="flex flex-col gap-4">
        <Campo etiqueta="Formación académica requerida" error={errorDe('formacion')}>
          <textarea rows={3} {...campo('formacion')} />
        </Campo>

        <Campo etiqueta="Experiencia requerida" error={errorDe('experiencia')}>
          <textarea rows={3} {...campo('experiencia')} />
        </Campo>

        <Campo etiqueta="Competencias" error={errorDe('competencias')}>
          <textarea rows={3} {...campo('competencias')} />
        </Campo>

        <Campo etiqueta="Conocimientos específicos" error={errorDe('conocimientos_especificos')}>
          <textarea rows={3} {...campo('conocimientos_especificos')} />
        </Campo>
      </div>
  )
}
