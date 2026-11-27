import { CLASE_CAJA_SUAVE, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { ID_SECCION_AUTORIZACION } from '../../lib/datosPersonales'
import { paginasInformativasActivas, RUTA_PRIVACIDAD } from '../../config/paginasInformativas'
import Icono from '../ui/Icono'
import MarcaObligatorio from '../ui/MarcaObligatorio'
import Rueda from '../ui/Rueda'

// Recuadro «Autorización de datos», al final de la sección Datos personales: el consentimiento para tratar los datos
// personales. Es una casilla más del formulario: se registra con el guardado automático (no hay botón) y sin ella el
// servidor no deja enviar la postulación. Ya registrada no se desmarca aquí: para revocarla se retira la postulación.
export default function AutorizacionDatos({ d, editable }) {
  const { autorizado, bajoMinimo, cambiar, errorDe, esMenor, form, guardando } = d
  // La página de Privacidad solo existe con las páginas informativas activas: sin ellas no hay a dónde enlazar.
  const conEnlace = paginasInformativasActivas()

  return (
    <section id={ID_SECCION_AUTORIZACION} aria-labelledby="autorizacion-titulo" className={`${CLASE_CAJA_SUAVE} scroll-mt-24 p-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="autorizacion-titulo" className="text-sm font-semibold text-slate-800 dark:text-sena-texto">
          Autorización de datos
        </h3>
        <div role="status" aria-live="polite">
          {guardando && (
            <span className={`flex items-center gap-1.5 text-xs ${CLASE_TEXTO_SUAVE}`}>
              <Rueda /> Guardando…
            </span>
          )}
          {!guardando && autorizado && (
            <span className="inline-flex items-center gap-1 rounded-full bg-exito/15 px-2.5 py-0.5 text-xs font-medium text-exito">
              <Icono nombre="check" className="size-3.5 shrink-0" />
              Autorizado
            </span>
          )}
        </div>
      </div>

      <label className="mt-3 flex items-start gap-3 text-sm leading-relaxed text-slate-700 dark:text-sena-texto">
        <input
          type="checkbox"
          checked={form.acepta_tratamiento_datos}
          disabled={!editable || autorizado || bajoMinimo}
          onChange={(e) => cambiar('acepta_tratamiento_datos', e.target.checked)}
          className="mt-1 size-4 shrink-0 accent-sena-oscuro dark:accent-sena-acento"
        />
        <span>
          {conEnlace ? (
            <>
              He leído la{' '}
              <a
                href={RUTA_PRIVACIDAD}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sena-oscuro underline underline-offset-2 dark:text-sena-acento"
              >
                política de privacidad y datos personales
              </a>{' '}
              y autorizo el tratamiento de mis datos para este proceso de selección (Ley 1581 de 2012).
            </>
          ) : (
            'Autorizo el tratamiento de mis datos personales para este proceso de selección (Ley 1581 de 2012).'
          )}
          <MarcaObligatorio />
        </span>
      </label>

      {esMenor && (
        <p className={`mt-2 pl-7 text-sm ${CLASE_TEXTO_SUAVE}`}>
          Como eres menor de edad, tu representante legal también debe estar enterado de este tratamiento.
        </p>
      )}
      {!autorizado && editable && (
        <p className={`mt-2 pl-7 text-xs ${CLASE_TEXTO_SUAVE}`}>
          Tus datos se guardan solos al completarlos. Sin esta autorización no podrás continuar ni enviar la postulación.
        </p>
      )}
      {errorDe('acepta_tratamiento_datos') && (
        <p role="alert" className="mt-2 pl-7 text-sm font-medium text-peligro">{errorDe('acepta_tratamiento_datos')}</p>
      )}
    </section>
  )
}
