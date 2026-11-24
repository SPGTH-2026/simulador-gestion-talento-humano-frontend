import { Link } from 'react-router-dom'
import Icono from '../../ui/Icono'
import { CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../../../lib/estilos'

function EnlaceAviso({ enlace }) {
  if (!enlace) return null
  return (
    <>
      {' '}
      <Link to={enlace.to} className="font-semibold underline underline-offset-2">
        {enlace.texto}
      </Link>
    </>
  )
}

// Avisos del Ranking, en dos niveles para que lo que pide intervención no se pierda entre lo rutinario:
//  - tono 'aviso' (hay que hacer algo: lista en revisión, convocatoria sin proceso, sin candidatos listos): caja ámbar.
//  - tono 'info' y 'exito' (rutina: cómo se elige, estado «al día»): líneas sin caja, con el mismo tamaño de texto legible.
export default function AvisosRanking({ avisos }) {
  const alertas = avisos.filter((a) => a.tono === 'aviso')
  const rutina = avisos.filter((a) => a.tono !== 'aviso')
  return (
    <section aria-label="Avisos del ranking" className="flex flex-col gap-2">
      {alertas.length > 0 && (
        <ul className="flex flex-col gap-1.5 rounded-xl border border-aviso/30 bg-aviso/10 px-3 py-2.5">
          {alertas.map((a) => (
            <li key={a.texto} className={`flex items-start gap-2 text-sm ${CLASE_TEXTO_FUERTE}`}>
              <Icono nombre="alerta" className="mt-0.5 size-4 shrink-0 text-aviso" />
              <span className="min-w-0">
                {a.texto}
                <EnlaceAviso enlace={a.enlace} />
              </span>
            </li>
          ))}
        </ul>
      )}
      {rutina.length > 0 && (
        <ul className="flex flex-col gap-1 px-1">
          {rutina.map((a) => (
            <li key={a.texto} className={`flex items-start gap-2 text-sm ${a.tono === 'exito' ? CLASE_TEXTO_FUERTE : CLASE_TEXTO_SUAVE}`}>
              {a.tono === 'exito' ? (
                <Icono nombre="check" className="mt-0.5 size-4 shrink-0 text-exito" />
              ) : (
                <span aria-hidden="true" className="mt-0.5 w-4 shrink-0 text-center">
                  •
                </span>
              )}
              <span className="min-w-0">
                {a.texto}
                <EnlaceAviso enlace={a.enlace} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
