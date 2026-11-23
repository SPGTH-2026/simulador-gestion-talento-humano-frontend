import { useId } from 'react'
import BarraProgreso from '../ui/BarraProgreso'
import Boton from '../ui/Boton'
import Interruptor from '../ui/Interruptor'
import { CLASE_ETIQUETA, CLASE_CERTIFICADA, origenTexto } from './estilosSkills'

// Una fila de skill: casilla, nivel, certificado y acciones. Recibe lo que necesita como props.
export default function FilaSkill({
  nombre,
  declarada,
  editable,
  enVuelo,
  progresoCert,
  certificadosSubidos,
  clave,
  tope,
  sinSiNo = false,
  error = '',
  errorClave = null,
  onActivar,
  onDesactivar,
  onAdjuntar,
  onDescargar,
  onQuitarCertificado,
  registrarRef,
  onArchivo,
}) {
  const idNombre = useId()
  const idAyuda = useId()
  const activa = Boolean(declarada)
  const certificado = declarada?.certificado || (declarada?.id ? certificadosSubidos?.[declarada.id] : null)
  const subiendoCert = activa && enVuelo === `cert-${declarada.id}`
  // Se guarda el interruptor de ESTA fila (declarar o quitar la skill): la rueda va en la perilla y junto al control.
  // Si el error de la sección pertenece a esta fila (declarar, quitar o algo de su certificado), se pinta junto a ella.
  const clavesDeLaFila = [clave, declarada && `skill-${declarada.id}`, declarada && `cert-${declarada.id}`, declarada && `quitarcert-${declarada.id}`]
  const errorDeLaFila = error && errorClave && clavesDeLaFila.includes(errorClave) ? error : ''
  const guardandoSiNo = enVuelo === clave || (activa && enVuelo === `skill-${declarada.id}`)
  const puedeEditarCert = editable && !sinSiNo
  // Hay algo en curso que NO es el guardado de esta fila: sus controles se bloquean (aria-disabled, sin perder el foco). El propio
  // interruptor de la fila no se deshabilita mientras guarda (perdería el foco del teclado): se marca como ocupado.
  const otraOperacion = Boolean(enVuelo) && !guardandoSiNo
  // Con el envío al 100 % el archivo ya llegó y el servidor sigue trabajando: se dice «Procesando…».
  const procesandoCert = subiendoCert && (progresoCert ?? 0) >= 100
  const textoCarga = procesandoCert ? 'Procesando…' : 'Cargando…'

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <p className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-sena-texto">
          <span id={idNombre}>{nombre}</span>
          {/* El origen solo se indica donde ayuda: las skills de la convocatoria ya lo dicen en su encabezado. */}
          {activa && declarada.origen !== 'convocatoria' && (
            <span className={CLASE_ETIQUETA}>{origenTexto(declarada.origen)}</span>
          )}
          {activa && (
            <span className={certificado ? CLASE_CERTIFICADA : CLASE_ETIQUETA}>
              {certificado ? 'Certificado cargado' : 'Declarada'}
            </span>
          )}
          {sinSiNo && (
            <span className={CLASE_ETIQUETA}>Declarada antes</span>
          )}
        </p>

        {!sinSiNo && (
          <div className="flex items-center gap-2">
            {/* El único indicador visible es la rueda dentro del interruptor. Mientras guarda se ANUNCIA el estado con un texto solo
                para lectores de pantalla (sr-only, fuera del flujo: no mueve la distribución). La región existe siempre para que
                el anuncio se lea al cambiar su contenido. */}
            <span role="status" className="sr-only">
              {guardandoSiNo ? (activa ? 'Quitando…' : 'Guardando…') : ''}
            </span>
            <Interruptor
              idNombre={idNombre}
              activo={activa}
              onChange={(declarar) => (declarar ? onActivar() : onDesactivar())}
              ocupado={guardandoSiNo}
              bloqueado={!editable || otraOperacion || Boolean(tope && !activa)}
              ayudaId={editable && tope && !activa ? idAyuda : undefined}
            />
          </div>
        )}
      </div>

      {editable && tope && !activa && !sinSiNo && (
        <p id={idAyuda} className="text-sm text-slate-600 dark:text-sena-texto-suave">
          Alcanzaste el máximo de skills: quita una para declarar otra.
        </p>
      )}

      {activa && (
        <div className="flex flex-col gap-2 rounded-lg bg-sena-fondo/50 px-3 py-2 dark:bg-sena-noche/40">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <p className="min-w-0 break-words text-sm text-slate-600 dark:text-sena-texto-suave">
            {certificado
              ? certificado.nombre_original ?? 'Certificado cargado'
              : puedeEditarCert
                ? 'Certificado opcional: aún no cargaste uno.'
                : 'Sin certificado.'}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            {certificado ? (
              <>
                <Boton variante="contorno" tamano="tactil" disabled={Boolean(enVuelo)} onClick={onDescargar}>
                  Ver
                </Boton>
                {puedeEditarCert && (
                  <Boton
                    variante="contorno"
                    tamano="tactil"
                    ocupado={subiendoCert}
                    disabled={Boolean(enVuelo)}
                    onClick={onAdjuntar}
                    aria-label={`Reemplazar certificado de ${nombre}`}
                  >
                    {subiendoCert ? textoCarga : 'Reemplazar'}
                  </Boton>
                )}
                {puedeEditarCert && (
                  <Boton
                    variante="peligroSuave"
                    tamano="tactil"
                    disabled={Boolean(enVuelo)}
                    onClick={onQuitarCertificado}
                    aria-label={`Quitar certificado de ${nombre}`}
                  >
                    Quitar
                  </Boton>
                )}
              </>
            ) : (
              puedeEditarCert && (
                <Boton
                  variante="contorno"
                  tamano="tactil"
                  ocupado={subiendoCert}
                  disabled={Boolean(enVuelo)}
                  onClick={onAdjuntar}
                  aria-label={`Cargar certificado de ${nombre}`}
                >
                  {subiendoCert ? textoCarga : 'Cargar certificado'}
                </Boton>
              )
            )}
          </div>
        </div>

        {/* Una sola barra, dentro de la franja del certificado: avance real del envío y, al llegar al 100 %,
            «Procesando…» hasta que el servidor confirma y la pantalla se actualiza. */}
        {subiendoCert && <BarraProgreso valor={progresoCert ?? 0} etiqueta="Enviando certificado" className="mt-0" />}
        </div>
      )}

      {errorDeLaFila && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {errorDeLaFila}
        </p>
      )}

      <input
        ref={registrarRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        aria-label={`Certificado de ${nombre}`}
        onChange={(e) => {
          const archivo = e.target.files?.[0]
          if (archivo) onArchivo?.(archivo)
          e.target.value = ''
        }}
      />
    </li>
  )
}

// Skills de la postulación (doc 33). SOLO las que pide la convocatoria
// (vista.skills_convocatoria): el aspirante activa el interruptor y puede adjuntar un
// certificado OPCIONAL. Todas son opcionales (ninguna bloquea el envío).
//
// Las filas declaradas ANTES del cambio (origen 'catalogo' o 'propia') NO se
// borran ni se modifican: se muestran por nombre en solo lectura, con la nota
// "declaradas antes". La primera acción de guardado dispara el borrador
// silencioso (asegurar), así que la sección funciona con y sin postulación.
