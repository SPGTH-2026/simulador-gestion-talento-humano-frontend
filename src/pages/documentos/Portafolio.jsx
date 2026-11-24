import { isValidElement } from 'react'
import { usePortafolio } from './usePortafolio'
import { Link } from 'react-router-dom'
import { descargarDocumentoRevision, descargarCertificadoRevision } from '../../api/portafolios'
import Mensaje, { MensajeAviso } from '../../components/ui/Mensaje'
import Boton from '../../components/ui/Boton'
import Etiqueta from '../../components/ui/Etiqueta'
import Icono from '../../components/ui/Icono'
import Tarjeta from '../../components/ui/Tarjeta'
import IndicadorCompletitud from '../../components/postulacion/IndicadorCompletitud'
import EtiquetaPostulacion from '../../components/convocatorias/EtiquetaPostulacion'
import { EtiquetaConIcono } from '../../components/evaluacion/PresentacionEvaluacion'
import { CLASE_SUBTITULO_PAGINA, CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE, CLASE_TITULO_PAGINA } from '../../lib/estilos'
import { ESTADO_DOCUMENTO } from '../../lib/evaluacion'
import { formatearTamano } from '../../lib/postulacionDocumentos'
import { formatearFechaHora } from '../../lib/ventanaPostulacion'

// Línea de acciones de volver: botón fantasma con flecha, el mismo de Evaluación. Con 'to' es un enlace fijo (no
// depende del historial: un enlace directo o una pestaña nueva también vuelve al listado); con 'onClick', una acción.
export function Volver({ to, onClick, children }) {
  return (
    <Boton
      variante="fantasma"
      tamano="tactil"
      {...(to ? { as: Link, to } : { onClick })}
      className="-ml-4 self-start"
    >
      <Icono nombre="flechaIzquierda" className="size-4" />
      {children}
    </Boton>
  )
}

export const TITULO_BLOQUE = `text-base font-semibold ${CLASE_TEXTO_FUERTE}`

// Portafolio en solo lectura: quien llega aquí ve y descarga, no escribe.
export default function Portafolio({ userId }) {
  const ctx = usePortafolio({ userId })
  // Mientras carga o si falla, el hook devuelve la propia pantalla (un elemento de React) o null, no el contexto.
  if (ctx === null || isValidElement(ctx)) return ctx
  const { abriendoId, botonesLectura, encabezadoRevision, errorRevision, handleVerDocumentos, portafolio, postulacionSel, postulaciones, revision, rutaArchivo, setPostulacionSel, setRevision, usuario, verArchivo } = ctx
  return (
    <>
      <div className="flex flex-col gap-5">
        <header className="flex flex-col">
          <Volver to="/documentos">Volver al listado</Volver>
          <h1 className={`${CLASE_TITULO_PAGINA} text-balance ${CLASE_TEXTO_PARTIDO}`}>Portafolio de {usuario.name}</h1>
          <p className={CLASE_SUBTITULO_PAGINA}>
            {usuario.email} · Ficha: {usuario.ficha?.codigo ?? 'Sin ficha'}
          </p>
        </header>

        {portafolio.postulaciones.length === 0 ? (
          <div className="py-12 text-center">
            <p className={CLASE_TEXTO_SUAVE}>Este aspirante no tiene postulaciones visibles en sus fichas.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {postulaciones.map((p) => (
              <Tarjeta
                key={p.id}
                as="article"
                aria-current={revision && postulacionSel?.id === p.id ? 'true' : undefined}
                className={`flex flex-col gap-3 p-4 ${
                  revision && postulacionSel?.id === p.id ? 'ring-2 ring-sena/60 dark:ring-sena-acento/60' : ''
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <EtiquetaPostulacion codigo={p.estado?.codigo} nombre={p.estado?.nombre} />
                      {revision && postulacionSel?.id === p.id && <Etiqueta tono="azul">En revisión</Etiqueta>}
                      {p.puede_ver_documentos ? (
                        <Etiqueta tono="exito">Documentos disponibles</Etiqueta>
                      ) : (
                        <Etiqueta tono="neutral">Sin documentos (borrador)</Etiqueta>
                      )}
                    </div>
                    <p className={`font-medium ${CLASE_TEXTO_FUERTE} ${CLASE_TEXTO_PARTIDO}`}>{p.convocatoria?.nombre}</p>
                    <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>{p.convocatoria?.codigo}</p>
                  </div>
                  {p.puede_ver_documentos && (
                    // Abre la revisión de la postulación: navegación, con contorno como «Ver detalle».
                    <Boton
                      variante="contorno"
                      tamano="tactil"
                      ocupado={abriendoId === p.id}
                      disabled={abriendoId !== null && abriendoId !== p.id}
                      onClick={() => handleVerDocumentos(p)}
                      className="shrink-0"
                    >
                      {abriendoId === p.id ? 'Abriendo…' : 'Ver documentos'}
                    </Boton>
                  )}
                </div>

                {errorRevision?.id === p.id && <Mensaje tipo="error">{errorRevision.mensaje}</Mensaje>}

                <IndicadorCompletitud estado={{ completo: p.completo }} titulo="Estado de los documentos" />

                <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
                  Postulada el {formatearFechaHora(p.fecha_postulacion)}
                  {' · '}Documentos: {p.documentos?.subidos ?? 0}/{p.documentos?.requeridos ?? 0} requeridos,{' '}
                  {p.documentos?.adicionales ?? 0} adicionales
                  {' · '}Skills: {p.skills?.total ?? 0} ({p.skills?.con_certificado ?? 0} con certificado)
                </p>
              </Tarjeta>
            ))}
          </div>
        )}
      </div>

      {postulacionSel && revision && (
        <Tarjeta as="section" className="mt-6 flex flex-col gap-5 p-4 sm:p-6">
          <header className="flex flex-col gap-1">
            <Volver
              onClick={() => {
                setPostulacionSel(null)
                setRevision(null)
              }}
            >
              Volver al listado de postulaciones
            </Volver>
            <h2
              ref={encabezadoRevision}
              tabIndex={-1}
              className={`scroll-mt-4 text-xl font-bold focus:outline-none ${CLASE_TEXTO_FUERTE} ${CLASE_TEXTO_PARTIDO}`}
            >
              Documentos de: {postulacionSel.convocatoria?.nombre}
            </h2>
          </header>

          <IndicadorCompletitud estado={revision} titulo="Estado de los documentos" />

          {revision.requiere_sexo && (
            <MensajeAviso>Esta convocatoria exige libreta militar y no hay sexo registrado en el perfil.</MensajeAviso>
          )}

          {revision.documentos && revision.documentos.length > 0 && (
            <section>
              <h3 className={`${TITULO_BLOQUE} mb-3`}>Documentos requeridos</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {revision.documentos.map((d) => {
                  const estado = ESTADO_DOCUMENTO[d.estado] ?? ESTADO_DOCUMENTO.pendiente
                  return (
                    <Tarjeta key={d.parametro?.id ?? d.id} as="article" className="flex flex-col gap-3 p-4">
                      <div className="min-w-0">
                        <p className={`font-medium ${CLASE_TEXTO_FUERTE} ${CLASE_TEXTO_PARTIDO}`}>
                          {d.parametro?.nombre ?? d.parametro?.codigo}
                        </p>
                        <p className={`mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${CLASE_TEXTO_SUAVE}`}>
                          <EtiquetaConIcono
                            tono={estado.tono}
                            icono={d.estado === 'subido' ? <Icono nombre="check" className="size-3.5" /> : null}
                          >
                            {estado.texto}
                          </EtiquetaConIcono>
                          <span className="whitespace-nowrap">{d.obligatorio ? 'Obligatorio' : 'Opcional'}</span>
                        </p>
                      </div>

                      <p className={`text-sm ${CLASE_TEXTO_SUAVE} ${CLASE_TEXTO_PARTIDO}`}>
                        {d.archivo
                          ? `${d.archivo.nombre_original} · ${formatearTamano(d.archivo.tamano_bytes)}`
                          : 'Sin archivo'}
                      </p>

                      {d.archivo && (
                        <div className="mt-auto border-t border-sena-linea/70 pt-3 dark:border-sena-borde/50">
                          {botonesLectura(
                            `doc-${d.archivo.id}`,
                            d.archivo.nombre_original,
                            () => verArchivo(rutaArchivo(`documentos/${d.archivo.id}/archivo?inline=1`), d.archivo.nombre_original),
                            () => descargarDocumentoRevision(postulacionSel.id, d.archivo.id, d.archivo.nombre_original),
                          )}
                        </div>
                      )}
                    </Tarjeta>
                  )
                })}
              </div>
            </section>
          )}

          {revision.adicionales && revision.adicionales.length > 0 && (
            <section>
              <h3 className={`${TITULO_BLOQUE} mb-3`}>Documentos adicionales</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {revision.adicionales.map((d) => (
                  <Tarjeta key={d.id} as="article" className="flex flex-col gap-3 p-4">
                    <div className="min-w-0">
                      <p className={`font-medium ${CLASE_TEXTO_FUERTE} ${CLASE_TEXTO_PARTIDO}`}>{d.titulo}</p>
                      {d.nota && <p className={`text-xs ${CLASE_TEXTO_SUAVE} ${CLASE_TEXTO_PARTIDO}`}>{d.nota}</p>}
                      <p className={`mt-1 text-xs ${CLASE_TEXTO_SUAVE} ${CLASE_TEXTO_PARTIDO}`}>
                        {d.archivo?.nombre_original} · {formatearTamano(d.archivo?.tamano_bytes)}
                      </p>
                    </div>
                    {d.archivo && (
                      <div className="mt-auto border-t border-sena-linea/70 pt-3 dark:border-sena-borde/50">
                        {botonesLectura(
                          `adic-${d.archivo.id}`,
                          d.archivo.nombre_original,
                          () => verArchivo(rutaArchivo(`documentos/${d.archivo.id}/archivo?inline=1`), d.archivo.nombre_original),
                          () => descargarDocumentoRevision(postulacionSel.id, d.archivo.id, d.archivo.nombre_original),
                        )}
                      </div>
                    )}
                  </Tarjeta>
                ))}
              </div>
            </section>
          )}

          {revision.skills && revision.skills.length > 0 && (
            <section>
              <h3 className={`${TITULO_BLOQUE} mb-3`}>Skills declaradas</h3>
              <div className="flex flex-col gap-3">
                {revision.skills.map((s) => (
                  <Tarjeta key={s.id} as="article" className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className={`font-medium ${CLASE_TEXTO_FUERTE} ${CLASE_TEXTO_PARTIDO}`}>{s.nombre}</span>
                          <Etiqueta tono="neutral">{s.origen}</Etiqueta>
                        </div>
                        {s.certificado && (
                          <p className={`text-xs ${CLASE_TEXTO_SUAVE} ${CLASE_TEXTO_PARTIDO}`}>
                            Certificado: {s.certificado.nombre_original} · {formatearTamano(s.certificado.tamano_bytes)}
                          </p>
                        )}
                      </div>
                      {s.certificado &&
                        botonesLectura(
                          `skill-${s.id}`,
                          s.certificado.nombre_original,
                          () => verArchivo(rutaArchivo(`skills/${s.id}/certificado/archivo?inline=1`), s.certificado.nombre_original),
                          () => descargarCertificadoRevision(postulacionSel.id, s.id, s.certificado.nombre_original),
                        )}
                    </div>
                  </Tarjeta>
                ))}
              </div>
            </section>
          )}

          {revision.documentos?.length === 0 && revision.adicionales?.length === 0 && revision.skills?.length === 0 && (
            <p className={`py-8 text-center ${CLASE_TEXTO_SUAVE}`}>No hay documentos ni skills en esta postulación.</p>
          )}
        </Tarjeta>
      )}
    </>
  )
}

// 'key' por aspirante: al cambiar de portafolio el estado del anterior (revisión abierta, errores) se descarta.
