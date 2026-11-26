import { Link } from 'react-router-dom'
import { listaFichas } from '../../api/fichas'
import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import { CLASE_TARJETA, CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { useCarga } from '../../hooks/useCarga'

// Mientras el instructor no administre ninguna ficha, el inicio le pide crear la suya. Desaparece en cuanto tiene una.
// Si la consulta falla no bloquea nada: simplemente no se muestra.
export default function AvisoCrearFicha() {
  const fichas = useCarga(() => listaFichas(), true)

  if (fichas.fase !== 'listo') return null

  const lista = Array.isArray(fichas.datos?.data) ? fichas.datos.data : []
  if (lista.length > 0) return null

  return (
    <section className={`${CLASE_TARJETA} flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between`} aria-labelledby="aviso-crear-ficha">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-sena-hundido text-sena-azul dark:bg-sena-superficie-alta dark:text-sena-texto">
          <Icono nombre="fichas" className="size-5" />
        </span>
        <div className="min-w-0">
          <p id="aviso-crear-ficha" className={`font-semibold ${CLASE_TEXTO_FUERTE}`}>
            Crea tu ficha para empezar
          </p>
          <p className={`mt-0.5 text-sm ${CLASE_TEXTO_SUAVE}`}>
            Todavía no administras ninguna ficha. La que registres queda a tu nombre, y desde ahí gestionas sus aspirantes y documentos.
          </p>
        </div>
      </div>
      <Boton as={Link} to="/fichas" className="shrink-0">
        Crear mi ficha
      </Boton>
    </section>
  )
}
