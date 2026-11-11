import { IconoX } from '../convocatorias/Iconos'
import Etiqueta from '../ui/Etiqueta'
import Icono from '../ui/Icono'
import {
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
} from '../../lib/estilos'
import AvatarIniciales from './AvatarIniciales'

// Piezas con las que se presenta una evaluación en el listado, en la pantalla
// de calificar y en "Mis evaluaciones". 'evaluacion' es el objeto de la API
// ({ estado, puntaje_total, pasa_seleccion, ... }) o null si aún no hay.

// El texto acompaña siempre al icono y al color: ninguno es el único canal.
export function EtiquetaConIcono({ tono, icono, children }) {
  return (
    <Etiqueta tono={tono} className="whitespace-nowrap">
      <span className="inline-flex items-center gap-1">
        {icono}
        {children}
      </span>
    </Etiqueta>
  )
}

// Cómo va la evaluación: sin empezar, con un borrador guardado o completada.
export function EtiquetaEvaluacion({ evaluacion }) {
  if (evaluacion?.estado === 'finalizada') {
    return (
      <EtiquetaConIcono tono="exito" icono={<Icono nombre="check" className="size-3.5" />}>
        Completada
      </EtiquetaConIcono>
    )
  }
  // El evaluador pidió corregir documentos: espera al aspirante o, si ya
  // reemplazó alguno, hay algo nuevo por revisar.
  if (evaluacion?.estado === 'correccion_solicitada') {
    const porRevisar = (evaluacion.documentos_actualizados?.length ?? 0) > 0
    return (
      <EtiquetaConIcono
        tono={porRevisar ? 'azul' : 'aviso'}
        icono={<Icono nombre={porRevisar ? 'reintentar' : 'reloj'} className="size-3.5" />}
      >
        {porRevisar ? 'Corregido por revisar' : 'En corrección'}
      </EtiquetaConIcono>
    )
  }
  return (
    <EtiquetaConIcono
      tono={evaluacion ? 'azul' : 'neutral'}
      icono={<Icono nombre="reloj" className="size-3.5" />}
    >
      {evaluacion ? 'En proceso' : 'Pendiente'}
    </EtiquetaConIcono>
  )
}

// Resultado: solo existe cuando la evaluación está completada. Antes es
// provisional y no se presenta como aprobado ni como rechazado.
export function Resultado({ evaluacion }) {
  if (evaluacion?.estado !== 'finalizada') {
    return <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Sin resultado</span>
  }
  // Completada sin veredicto del backend: en revisión, no "No pasa".
  if (evaluacion.pasa_seleccion == null) {
    return <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>En revisión</span>
  }
  return evaluacion.pasa_seleccion ? (
    <EtiquetaConIcono tono="exito" icono={<Icono nombre="check" className="size-3.5" />}>
      Pasa a selección
    </EtiquetaConIcono>
  ) : (
    <EtiquetaConIcono tono="peligro" icono={<IconoX className="size-3.5" />}>
      No pasa
    </EtiquetaConIcono>
  )
}

// Porcentaje de cumplimiento guardado por el evaluador. Sin evaluación o sin
// cumplimiento se muestra un guion, con su texto para lectores de pantalla.
export function Cumplimiento({ evaluacion }) {
  const valor = evaluacion?.cumplimiento
  if (valor == null) {
    return (
      <>
        <span aria-hidden="true" className={`text-base ${CLASE_TEXTO_SUAVE}`}>
          —
        </span>
        <span className="sr-only">Sin cumplimiento</span>
      </>
    )
  }
  return (
    <span className={`whitespace-nowrap text-lg font-semibold tabular-nums ${CLASE_TEXTO_FUERTE}`}>
      {valor}&nbsp;%
    </span>
  )
}

export function Puntaje({ evaluacion }) {
  const valor = evaluacion?.puntaje_total
  if (valor == null) {
    return (
      <>
        <span aria-hidden="true" className={`text-base ${CLASE_TEXTO_SUAVE}`}>
          —
        </span>
        <span className="sr-only">Sin puntaje</span>
      </>
    )
  }
  return (
    <span className={`whitespace-nowrap text-lg font-semibold tabular-nums ${CLASE_TEXTO_FUERTE}`}>
      {valor}
    </span>
  )
}

// Avatar, nombre y correo. El nombre y el correo se parten en lugar de cortarse.
export function DatosAspirante({ aspirante, tamano }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {/* El círculo del avatar es azul institucional y en oscuro casi se funde
          con la superficie: un aro lo delimita sin tocar el componente. */}
      <span className="shrink-0 rounded-full dark:ring-1 dark:ring-sena-texto-suave/60">
        <AvatarIniciales nombre={aspirante.name} size={tamano} />
      </span>
      <div className="min-w-0">
        <p className={`font-semibold ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{aspirante.name}</p>
        {aspirante.email && (
          <p className={`text-xs ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_SUAVE}`}>{aspirante.email}</p>
        )}
      </div>
    </div>
  )
}
