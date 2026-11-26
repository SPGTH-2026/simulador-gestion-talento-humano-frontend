import { isValidElement } from 'react'
import { useEvaluacionEvaluar } from './useEvaluacionEvaluar'
import PanelRondasCorreccion from './PanelRondasCorreccion'






import AvatarIniciales from '../../components/evaluacion/AvatarIniciales'
import {
  EtiquetaConIcono,
  EtiquetaEvaluacion,
} from '../../components/evaluacion/PresentacionEvaluacion'
import RequisitoEvaluacion from '../../components/evaluacion/RequisitoEvaluacion'
import RespuestaSiNo from '../../components/evaluacion/RespuestaSiNo'
import ResumenCumplimiento from '../../components/evaluacion/ResumenCumplimiento'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'

import Mensaje, { MensajeAviso, MensajeError } from '../../components/ui/Mensaje'

import {
  CLASE_CAMPO,
  CLASE_TARJETA,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
} from '../../lib/estilos'


export default function EvaluacionEvaluar() {
  const ctx = useEvaluacionEvaluar()
  // Mientras carga, sin postulación o sin datos, el hook devuelve la propia pantalla (un elemento de React) y no el contexto.
  if (isValidElement(ctx)) return ctx
  const { abriendo, actualizados, aplicables, aspirante, botonBorrador, botonCorregir, botonFinalizar, bloqueoFinalizar, bloqueoPorNoCumple, convocatoria, correccion, cumplidos, cumplimiento, enCorreccion, error, errorDocumento, evaluacion, excluidos, faltantes, finalizar, guardando, guardar, noCumple, habilidades, skillMarcas, setSkillMarca, itemMarcas, setItemMarca, observaciones, pesos, postulacionId, puedePedirCorreccion, respuestas, setDato, setObservaciones, setRespuestas, sinCargar, sinResponder, total, verDocumento, volverAlListado } = ctx
  return (
    <div className="flex flex-col gap-4">
      {volverAlListado}

      <header className={`${CLASE_TARJETA} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5`}>
        <div className="flex min-w-0 items-center gap-4">
          <span className="shrink-0 rounded-full dark:ring-1 dark:ring-sena-texto-suave/60">
            <AvatarIniciales nombre={aspirante.name} size="lg" />
          </span>
          <div className="min-w-0">
            <p className={`text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Evaluación de aspirante</p>
            <h1
              className={`text-xl font-bold tracking-tight text-sena-azul dark:text-sena-texto sm:text-2xl ${CLASE_TEXTO_PARTIDO}`}
            >
              {aspirante.name}
            </h1>
            {aspirante.email && (
              <p className={`text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_SUAVE}`}>{aspirante.email}</p>
            )}
            <p className={`mt-0.5 text-sm font-medium ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>
              {convocatoria.titulo}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-row flex-wrap items-center gap-2 sm:flex-col sm:items-end">
          <EtiquetaEvaluacion evaluacion={evaluacion} />
          {evaluacion?.fecha && (
            <span className={`text-xs ${CLASE_TEXTO_SUAVE}`}>Iniciada el {evaluacion.fecha}</span>
          )}
        </div>
      </header>


      {evaluacion?.reabierta && (
        <MensajeAviso>
          <strong>Evaluación reabierta.</strong> {evaluacion.reabierta.motivo} Antes de finalizarla, confirma que el
          resultado sigue siendo válido: si lo finalizas de nuevo, la selección usará el documento actualizado.
        </MensajeAviso>
      )}

      {enCorreccion &&
        (actualizados.length > 0 ? (
          <Mensaje tipo="info">
            <strong>
              El aspirante ya reemplazó {actualizados.length}{' '}
              {actualizados.length === 1 ? 'documento' : 'documentos'}.
            </strong>{' '}
            Revisa los archivos marcados como «Corregido por el aspirante» y actualiza tu calificación.
          </Mensaje>
        ) : (
          <MensajeAviso>
            <strong>En espera de corrección del aspirante:</strong> se le pidió subsanar los documentos
            marcados con «No cumple».
          </MensajeAviso>
        ))}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
        <div className="xl:col-start-2 xl:row-start-1">
          <ResumenCumplimiento
            evaluacion={evaluacion}
            porcentaje={cumplimiento}
            cumplidos={cumplidos}
            total={total}
            sinResponder={sinResponder}
            sinCargar={sinCargar}
          />
        </div>

        <section
          aria-labelledby="requisitos-titulo"
          className={`${CLASE_TARJETA} flex flex-col gap-5 p-4 sm:p-5 xl:col-start-1 xl:row-start-1`}
        >
          <div>
            <h2 id="requisitos-titulo" className={`text-lg font-semibold ${CLASE_TEXTO_FUERTE}`}>
              Requisitos del perfil
            </h2>
            <p className={`mt-1 text-sm ${CLASE_TEXTO_SUAVE}`}>
              Abre cada documento y marca «Cumple» o «No cumple». Solo cuentan los documentos
              obligatorios y aplicables de la convocatoria.
            </p>
          </div>

          {errorDocumento && <MensajeError>{errorDocumento}</MensajeError>}

          {total === 0 ? (
            <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Sin documentos obligatorios aplicables.</p>
          ) : (
            <ul className="@container divide-y divide-sena-linea/70 dark:divide-sena-borde/50">
              {aplicables.map((documento) => (
                <RequisitoEvaluacion
                  key={documento.id}
                  documento={documento}
                  peso={pesos[documento.id]}
                  respuesta={respuestas[documento.id]}
                  actualizado={actualizados.includes(documento.id)}
                  onChange={(valor) => setRespuestas((prev) => ({ ...prev, [documento.id]: valor }))}
                  onVerDocumento={() => verDocumento(documento)}
                  abriendo={abriendo === documento.id}
                  items={documento.items ?? []}
                  marcasItems={itemMarcas}
                  onMarcaItem={setItemMarca}
                />
              ))}
            </ul>
          )}

          {habilidades.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-sena-linea/70 pt-4 dark:border-sena-borde/50">
              <div>
                <h3 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>Habilidades de la convocatoria</h3>
                <p className={`mt-1 text-xs ${CLASE_TEXTO_SUAVE}`}>
                  Marca si el aspirante cumple cada habilidad. Las que tienen porcentaje cuentan en el cumplimiento junto con
                  los documentos (el total es 100 %).
                </p>
              </div>
              <ul className="@container divide-y divide-sena-linea/70 dark:divide-sena-borde/50">
                {habilidades.map((skill) => {
                  const declarada = skill.declarada
                  const estadoTexto = skill.certificada
                    ? 'Declarada y certificada'
                    : declarada
                      ? 'Declarada, sin certificado'
                      : 'No declarada por el aspirante'
                  return (
                    <li
                      key={skill.id}
                      className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 @min-[36rem]:flex-row @min-[36rem]:items-center @min-[36rem]:justify-between @min-[36rem]:gap-4"
                    >
                      <div className="min-w-0">
                        <p className={`font-medium ${CLASE_TEXTO_FUERTE}`}>{skill.nombre}</p>
                        <p className={`mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${CLASE_TEXTO_SUAVE}`}>
                          <span>{estadoTexto}</span>
                          <span aria-hidden="true">·</span>
                          <span>{skill.ponderacion != null ? `Peso ${skill.ponderacion} %` : 'Sin porcentaje'}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center">
                        <RespuestaSiNo
                          requisito={skill.nombre}
                          valor={skillMarcas[`skill-${skill.id}`]}
                          onChange={(valor) => setSkillMarca(skill.id, valor)}
                          textoSi="Cumple"
                          textoNo="No cumple"
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {excluidos.length > 0 && (
            <div className="border-t border-sena-linea/70 pt-4 dark:border-sena-borde/50">
              <h3 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>No cuentan en el cumplimiento</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {excluidos.map((documento) => (
                  <li
                    key={documento.id}
                    className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm ${CLASE_TEXTO_SUAVE}`}
                  >
                    <span className={`min-w-0 ${CLASE_TEXTO_PARTIDO}`}>{documento.nombre}</span>
                    <EtiquetaConIcono tono="neutral">
                      {documento.estado === 'no_aplica' ? 'No aplica' : 'Opcional'}
                    </EtiquetaConIcono>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Campo etiqueta="Observaciones">
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={4}
              maxLength={2000}
              className={`${CLASE_CAMPO} py-2`}
              placeholder="Escribe tus observaciones"
            />
          </Campo>

          {error && <MensajeError>{error}</MensajeError>}

          {faltantes.length > 0 && (
            <MensajeAviso>
              <strong>No se puede finalizar:</strong> falta cargar{' '}
              {faltantes.map((d) => d.nombre).join(', ')}. Marca «No cumple» en {faltantes.length === 1 ? 'ese documento' : 'esos documentos'},
              explica en las observaciones qué debe corregir el aspirante y usa «Enviar a corrección». También puedes guardar un borrador.
            </MensajeAviso>
          )}

          <PanelRondasCorreccion correccion={correccion} postulacionId={postulacionId} onActualizada={setDato} />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Boton
              ref={botonBorrador}
              variante="contorno"
              tamano="tactil"
              onClick={() => guardar('en_proceso')}
              disabled={guardando}
            >
              {guardando ? 'Guardando…' : 'Guardar borrador'}
            </Boton>
            <Boton
              ref={botonCorregir}
              variante="contorno"
              tamano="tactil"
              onClick={() => guardar('correccion_solicitada')}
              disabled={guardando || !puedePedirCorreccion}
              aria-describedby={correccion ? 'motivo-sin-correccion' : undefined}
            >
              {guardando
                ? 'Enviando…'
                : correccion?.tipo_siguiente === 'excepcional'
                  ? 'Enviar a corrección (excepcional)'
                  : 'Enviar a corrección'}
            </Boton>
            <Boton
              ref={botonFinalizar}
              tamano="tactil"
              onClick={finalizar}
              disabled={guardando || bloqueoFinalizar}
              title={
                faltantes.length > 0
                  ? 'Falta cargar un documento obligatorio'
                  : bloqueoPorNoCumple
                    ? 'Hay documentos marcados «No cumple». Espera a que el aspirante los corrija o a que se agoten las correcciones.'
                    : undefined
              }
              className="whitespace-normal!"
            >
              {guardando ? 'Guardando…' : 'Finalizar y enviar resultado'}
            </Boton>
          </div>
          {bloqueoPorNoCumple && (
            <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
              Para finalizar, todos los documentos deben cumplir o las correcciones deben haberse agotado. Marcados como «No
              cumple»: {noCumple.map((d) => d.nombre).join(', ')}.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
