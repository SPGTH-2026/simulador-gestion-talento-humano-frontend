import { CargaInicial, Hueco } from '../ui/Esqueleto'
import { CLASE_CAJA_SUAVE, CLASE_TARJETA_PLANA, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { ACTIVIDADES } from '../../lib/seleccion'

// Carga inicial del panel de calificaciones: dibuja los bloques reales (Progreso, Resultado adicional y la rejilla de
// actividades) con las MISMAS clases que el panel, para que al llegar los datos nada salte. Los encabezados «Progreso» y
// «Resultado adicional» ya se conocen y se muestran; los valores son huecos.
//
// Las actividades presenciales dependen de la configuración de la convocatoria. Si quien lo monta ya la conoce, pasa sus ids en
// 'actividades' y se dibuja una tarjeta con su nombre por cada una; si no se conoce, la estructura es neutral: tarjetas sin
// nombre (no se inventa cuál está activa ni su peso). Un solo anuncio para lectores de pantalla: el de la región.
export default function EsqueletoCalificaciones({ actividades = null, texto = 'Cargando calificaciones…' }) {
  const tarjetas = actividades ? ACTIVIDADES.filter((a) => actividades.includes(a.id)) : ACTIVIDADES.map(() => null)
  return (
    <CargaInicial texto={texto}>
      <div className="@container flex flex-col gap-4">
        <dl className="grid gap-3 @min-[520px]:grid-cols-3">
          <div className={`${CLASE_CAJA_SUAVE} p-3`}>
            <dt className={`text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Progreso</dt>
            <dd className="mt-1 flex h-5 items-center">
              <Hueco className="h-3.5 w-2/3" />
            </dd>
          </div>
          <div className={`${CLASE_CAJA_SUAVE} p-3 @min-[520px]:col-span-2`}>
            <dt className={`text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Resultado adicional</dt>
            <dd className="mt-1 flex h-8 items-center">
              <Hueco className="h-5 w-1/4" />
            </dd>
          </div>
        </dl>
        {tarjetas.length > 0 && (
          <ul className="grid gap-3 @min-[620px]:grid-cols-2">
            {tarjetas.map((a, i) => (
              <li key={a?.id ?? i} className={`${CLASE_TARJETA_PLANA} flex min-w-0 flex-col gap-3 p-4`}>
                <div className="flex items-center justify-between gap-2">
                  {a ? <span className="text-sm font-semibold">{a.etiqueta}</span> : <Hueco className="h-4 w-28" />}
                  <Hueco className="h-5 w-16 rounded-full" />
                </div>
                <Hueco className="h-3 w-3/4" />
                <Hueco className="h-9 w-full rounded-lg" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </CargaInicial>
  )
}
