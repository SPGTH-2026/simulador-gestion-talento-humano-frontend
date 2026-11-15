import { useId, useState } from 'react'
import Boton from '../ui/Boton'
import Etiqueta from '../ui/Etiqueta'
import Icono from '../ui/Icono'
import { CLASE_TARJETA, CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../lib/estilos'

// Pasos de un asistente de varios pasos (Nueva y Editar convocatoria). Se recorren libremente: cada paso es un botón que
// lleva a su contenido y el paso actual se marca con aria-current="step".
//  - 'pasos': [{ numero, nombre, rojos, faltan, completo, opcional }]. 'rojos' son datos a corregir (el último intento
//    falló o el servidor los rechazó); 'faltan', datos que aún se necesitan para publicar; 'completo', que el paso ya
//    tiene todo lo que se exige; 'opcional', que no exige nada.
//  - Escritorio: lista vertical siempre a la vista. Móvil: una línea con «Paso N de M», una barra de avance y un botón
//    que despliega la lista (para no ocupar media pantalla antes del formulario).
export default function PasosAsistente({ pasos, actual, onElegir }) {
  const [abierto, setAbierto] = useState(false)
  const idLista = useId()
  const paso = pasos.find((p) => p.numero === actual) ?? pasos[0]
  const avance = Math.round((paso.numero / pasos.length) * 100)

  return (
    <nav aria-label="Pasos de la convocatoria" className={`${CLASE_TARJETA} p-2`}>
      <div className="flex items-center justify-between gap-3 px-2 py-1 lg:hidden">
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
            Paso {paso.numero} de {pasos.length} · {paso.nombre}
          </p>
          <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-sena-hundido dark:bg-sena-superficie-alta">
            <div className="h-full rounded-full bg-sena-oscuro dark:bg-sena-acento" style={{ width: `${avance}%` }} />
          </div>
        </div>
        <Boton
          variante="fantasma"
          className="shrink-0"
          aria-expanded={abierto}
          aria-controls={idLista}
          onClick={() => setAbierto((a) => !a)}
        >
          {abierto ? 'Ocultar' : 'Ver pasos'}
        </Boton>
      </div>

      <ol id={idLista} className={`${abierto ? 'flex' : 'hidden'} flex-col gap-0.5 max-lg:mt-1 lg:flex`}>
        {pasos.map((p) => {
          const esActual = p.numero === actual
          return (
            <li key={p.numero}>
              <button
                type="button"
                aria-current={esActual ? 'step' : undefined}
                onClick={() => {
                  onElegir(p.numero)
                  setAbierto(false)
                }}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sena motion-reduce:transition-none ${
                  esActual
                    ? 'bg-sena-cielo/30 font-semibold text-sena-azul dark:bg-sena-superficie-alta dark:text-sena-texto'
                    : `font-medium ${CLASE_TEXTO_SUAVE} hover:bg-sena-hundido hover:text-sena-azul dark:hover:bg-white/5 dark:hover:text-sena-texto`
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                    esActual
                      ? 'bg-sena-oscuro text-white dark:bg-sena-acento dark:text-sena-noche'
                      : p.completo
                        ? 'bg-exito/15 text-exito'
                        : 'bg-sena-hundido text-sena-azul dark:bg-sena-superficie-alta dark:text-sena-texto'
                  }`}
                >
                  {p.completo && !esActual ? <Icono nombre="check" className="size-4" /> : p.numero}
                </span>
                <span className="min-w-0 flex-1">{p.nombre}</span>
                {p.rojos > 0 ? (
                  <Etiqueta tono="peligro">Corregir {p.rojos}</Etiqueta>
                ) : p.faltan > 0 ? (
                  <Etiqueta tono="aviso">Falta {p.faltan}</Etiqueta>
                ) : p.opcional ? (
                  <span className={`text-xs font-normal ${CLASE_TEXTO_SUAVE}`}>Opcional</span>
                ) : null}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
