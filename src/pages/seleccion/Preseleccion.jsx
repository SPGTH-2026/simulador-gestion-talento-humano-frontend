import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import EtiquetaEstado from '../../components/convocatorias/EtiquetaEstado'
import ListaConvocatorias from '../../components/seleccion/ListaConvocatorias'
import PanelCandidatos from '../../components/seleccion/PanelCandidatos'
import PanelConfiguracion from '../../components/seleccion/PanelConfiguracion'
import Boton from '../../components/ui/Boton'
import Icono from '../../components/ui/Icono'
import Pestanas from '../../components/ui/Pestanas'
import useFiltrosUrl from '../../hooks/useFiltrosUrl'
import {
  CLASE_CHIP,
  CLASE_TARJETA_PLANA,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
  CLASE_TITULO_PAGINA,
} from '../../lib/estilos'
import { tituloConvocatoria } from '../../lib/seleccion'

// La convocatoria y la pestaña viven en la URL: sobreviven a recargar y se pueden compartir.
const CLAVES = ['convocatoria', 'pestana']

export default function Preseleccion() {
  const { can } = useAuth()
  const { valores, setValores } = useFiltrosUrl(CLAVES)
  // Datos de la convocatoria elegida (nombre, estado...). El id manda: viene de la URL.
  const [datos, setDatos] = useState(null)

  const convocatoriaId = valores.convocatoria
  const pestana = valores.pestana === 'configuracion' ? 'configuracion' : 'candidatos'

  // Solo se desplaza la vista cuando la persona elige una convocatoria (no al cargar ni al pasar por la URL).
  const desplazar = useRef(false)

  const elegir = useCallback(
    (convocatoria, { silencioso = false } = {}) => {
      setDatos(convocatoria)
      // El llenado silencioso solo completa los datos de la convocatoria que ya está en la URL.
      if (!silencioso) {
        desplazar.current = true
        setValores({ convocatoria: convocatoria.id, pestana: '' }, { reemplazar: false })
      }
    },
    [setValores],
  )

  // En pantallas estrechas el detalle queda debajo de toda la lista: al elegir se lleva a la vista.
  useEffect(() => {
    if (!desplazar.current || !convocatoriaId) return
    desplazar.current = false
    const detalle = document.getElementById('detalle-convocatoria')
    const lista = document.getElementById('lista-convocatorias')
    if (!detalle || !lista || detalle.getBoundingClientRect().top < lista.getBoundingClientRect().bottom) return
    // Inmediato: no hay animación que atender con movimiento reducido y el encabezado queda a la vista al instante.
    detalle.scrollIntoView({ behavior: 'auto', block: 'start' })
  }, [convocatoriaId])

  // Solo en pantallas apiladas: vuelve a la lista, sobre la convocatoria activa, para elegir otra sin perder el sitio.
  const volverALaLista = () => {
    const activa = document.querySelector('#lista-convocatorias [aria-current="true"]')
    if (!activa) return
    activa.scrollIntoView({ behavior: 'auto', block: 'center' })
    activa.focus()
  }

  const cambiarPestana = (id) => setValores({ pestana: id === 'candidatos' ? '' : id })

  // 'datos' puede ser de una convocatoria anterior mientras la URL ya apunta a otra.
  const actual = datos && String(datos.id) === String(convocatoriaId) ? datos : null

  return (
    <div className="flex flex-col gap-4">
      <h1 className={`${CLASE_TITULO_PAGINA} text-balance`}>Preselección</h1>

      <div className="@container">
        {/* Lista de navegación de 280 a 320 px y el detalle con todo el ancho restante. */}
        <div className="grid items-start gap-x-6 gap-y-4 @min-[900px]:grid-cols-[minmax(17.5rem,20rem)_minmax(0,1fr)]">
          <ListaConvocatorias
            seleccionadaId={convocatoriaId}
            onElegir={elegir}
            className="@min-[900px]:sticky @min-[900px]:top-2 @min-[900px]:max-h-[calc(100dvh-10rem)]"
          />

          {!convocatoriaId ? (
            <section
              aria-label="Detalle de la convocatoria"
              className={`${CLASE_TARJETA_PLANA} flex flex-col items-center gap-2 px-6 py-14 text-center`}
            >
              <h2 className={`text-lg font-semibold ${CLASE_TEXTO_FUERTE}`}>Elige una convocatoria</h2>
              <p className={`max-w-md text-sm ${CLASE_TEXTO_SUAVE}`}>
                Al elegirla verás sus candidatos y podrás abrir la configuración de actividades.
              </p>
            </section>
          ) : (
            <section
              id="detalle-convocatoria"
              aria-labelledby="titulo-detalle"
              className="flex min-w-0 scroll-mt-20 flex-col gap-3 @max-[899px]:min-h-[75dvh]"
            >
              <Boton
                variante="enlace"
                tamano="flexible"
                onClick={volverALaLista}
                className="-mb-1 self-start px-0 @min-[900px]:hidden"
              >
                <Icono nombre="flechaIzquierda" className="size-4" />
                Elegir otra convocatoria
              </Boton>

              {/* Encabezado compacto: nombre, y debajo estado, código y vacantes en una sola línea. */}
              <header className="flex flex-col gap-1.5">
                <h2
                  id="titulo-detalle"
                  className={`text-xl font-semibold leading-snug text-balance ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}
                >
                  {actual ? tituloConvocatoria(actual) : `Convocatoria ${convocatoriaId}`}
                </h2>
                {actual && (
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <EtiquetaEstado codigo={actual.estado?.codigo} nombre={actual.estado?.nombre} />
                    {actual.codigo && <span className={CLASE_CHIP}>{actual.codigo}</span>}
                    <span className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
                      {actual.vacantes} {actual.vacantes === 1 ? 'vacante' : 'vacantes'}
                    </span>
                  </p>
                )}
              </header>

              {/* key = convocatoria: al cambiar, cada panel nace de cero (página 1, sin datos
                  de la anterior) y sus respuestas tardías se descartan. */}
              <Pestanas
                key={convocatoriaId}
                className="flex flex-col gap-3"
                etiquetaAccesible="Preselección de la convocatoria"
                activaId={pestana}
                onCambiar={cambiarPestana}
                pestanas={[
                  {
                    id: 'candidatos',
                    etiqueta: 'Candidatos',
                    contenido: <PanelCandidatos key={convocatoriaId} convocatoriaId={convocatoriaId} />,
                  },
                  {
                    id: 'configuracion',
                    etiqueta: 'Configuración',
                    contenido: (
                      <PanelConfiguracion
                        key={convocatoriaId}
                        convocatoriaId={convocatoriaId}
                        activo={pestana === 'configuracion'}
                        puedeDecidir={can('seleccion:decidir')}
                      />
                    ),
                  },
                ]}
              />
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
