import Boton from '../ui/Boton'
import Icono from '../ui/Icono'
import { ULTIMA_ETAPA } from './convocatoriaWizardUtils'

// Barra de navegación del asistente: Anterior, Guardar y Siguiente o Publicar.
// En móvil queda fija al borde inferior; desde 'sm' vuelve a ser una fila normal.
export default function BarraWizard({
  etapa,
  esNueva,
  soloLectura,
  puedePublicar,
  guardando,
  publicando,
  anterior,
  siguiente,
  guardar,
  publicar,
}) {
  return (
    <div className="grid grid-cols-2 gap-2 max-lg:sticky max-lg:-bottom-5 max-lg:z-10 max-lg:rounded-2xl max-lg:border max-lg:border-sena-linea max-lg:bg-white max-lg:p-2.5 max-lg:shadow-[0_-6px_16px_-8px_rgba(0,0,0,0.25)] dark:max-lg:border-sena-borde/70 dark:max-lg:bg-sena-superficie sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <Boton variante="contorno" onClick={anterior} disabled={etapa === 1} className={`${etapa === ULTIMA_ETAPA ? 'order-2' : 'order-1'} sm:order-none`}>
        <Icono nombre="flechaIzquierda" className="size-4" />
        Anterior
      </Boton>

      <div className="contents sm:flex sm:flex-wrap sm:gap-2">
        {/* Al CREAR se guarda un borrador (la convocatoria nace en borrador); al EDITAR se guardan cambios sobre una
            convocatoria que ya existe. En los dos casos el paso actual se conserva. */}
        {!soloLectura && (
          <Boton
            variante="contorno"
            onClick={guardar}
            ocupado={guardando}
            disabled={publicando}
            className={`order-3 sm:order-none sm:col-span-1 ${etapa === ULTIMA_ETAPA ? '' : 'col-span-2'}`}
          >
            {guardando ? 'Guardando…' : esNueva ? 'Guardar borrador' : 'Guardar cambios'}
          </Boton>
        )}

        {etapa < ULTIMA_ETAPA && (
          <Boton onClick={siguiente} className="order-2 sm:order-none">
            Siguiente
            <Icono nombre="flechaDerecha" className="size-4" />
          </Boton>
        )}

        {etapa === ULTIMA_ETAPA && puedePublicar && !soloLectura && (
          <Boton onClick={publicar} ocupado={publicando} disabled={guardando} className="order-1 col-span-2 sm:order-none sm:col-span-1">
            {publicando ? 'Publicando…' : 'Publicar convocatoria'}
          </Boton>
        )}
      </div>
    </div>
  )
}
