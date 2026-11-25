import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { ID_SECCION_AUTORIZACION } from '../../lib/datosPersonales'
import Icono from '../ui/Icono'
import Rueda from '../ui/Rueda'

// Bloque «Autorización de datos», al final de la sección Datos personales: el consentimiento para tratar los datos
// personales. Es una casilla más del formulario: se registra con el guardado automático (no hay botón) y sin ella el
// servidor no deja enviar la postulación. Ya registrada no se desmarca aquí: para revocarla se retira la postulación.
export default function AutorizacionDatos({ d, editable }) {
  const { autorizado, bajoMinimo, cambiar, errorDe, esMenor, form, guardando } = d

  return (
    <div id={ID_SECCION_AUTORIZACION} className="scroll-mt-24">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-sena-texto">Autorización de datos</h3>

      <label className="mt-2 flex items-start gap-2.5 text-sm text-slate-700 dark:text-sena-texto">
        <input
          type="checkbox"
          checked={form.acepta_tratamiento_datos}
          disabled={!editable || autorizado || bajoMinimo}
          onChange={(e) => cambiar('acepta_tratamiento_datos', e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-sena-oscuro dark:accent-sena-acento"
        />
        <span>
          Autorizo el tratamiento de mis datos personales para este proceso de selección (Ley 1581 de 2012). *
          {esMenor && ' Como eres menor de edad, tu representante legal también debe conocer y autorizar este tratamiento.'}
        </span>
      </label>

      <div role="status" aria-live="polite" className="mt-2">
        {guardando && (
          <p className={`flex items-center gap-2 text-sm ${CLASE_TEXTO_SUAVE}`}>
            <Rueda /> Guardando…
          </p>
        )}
        {!guardando && autorizado && (
          <p className="flex items-center gap-1.5 text-sm text-exito">
            <Icono nombre="check" className="size-4 shrink-0" />
            Datos autorizados y guardados.
          </p>
        )}
        {!guardando && !autorizado && editable && (
          <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
            Tus datos se guardan solos al completarlos. Marca esta casilla para poder continuar: sin autorización no podrás enviar la postulación.
          </p>
        )}
      </div>
      {errorDe('acepta_tratamiento_datos') && (
        <p role="alert" className="mt-1 text-sm font-medium text-peligro">{errorDe('acepta_tratamiento_datos')}</p>
      )}
    </div>
  )
}
