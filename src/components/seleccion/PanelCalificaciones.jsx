import { useEffect, useRef, useState } from 'react'
import { guardarCalificacion, obtenerCalificaciones } from '../../api/seleccion'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import Boton from '../ui/Boton'
import Campo from '../ui/Campo'
import Etiqueta from '../ui/Etiqueta'
import { MensajeAviso, MensajeError } from '../ui/Mensaje'
import Rueda from '../ui/Rueda'
import {
  CLASE_CAJA_SUAVE,
  CLASE_CAMPO,
  CLASE_TARJETA_PLANA,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_PARTIDO,
  CLASE_TEXTO_SUAVE,
} from '../../lib/estilos'
import {
  ACTIVIDADES,
  ESTADO_RESULTADO,
  formatoFecha,
  hoyBogota,
  notaParaServidor,
  textoNota,
  traducirError,
  traducirErrores,
} from '../../lib/seleccion'

const CAMPOS_FORMULARIO = ['nota', 'fecha_realizacion', 'observacion', 'motivo']

// Por qué no se puede escribir (null = se puede). Las notas existentes se ven igual.
function razonSinEscritura(datos, puedeDecidir) {
  if (!puedeDecidir) return 'Tu rol puede consultar las calificaciones, pero no registrarlas.'
  if (!datos.configuracion.configurada) return null // se explica aparte: pendiente de configurar
  if (datos.resultado_adicional.estado === 'sin_actividades') return null // se explica aparte
  if (datos.estado_convocatoria !== 'en_proceso') {
    return 'Solo se pueden registrar calificaciones con la convocatoria en proceso.'
  }
  if (datos.estado_documental !== 'habilitado') {
    return 'El candidato ya no está habilitado documentalmente: sus notas se conservan, pero no se pueden registrar ni corregir hasta que lo esté.'
  }
  return null
}

// Formulario de una nota. Conserva lo escrito si el guardado falla y pinta cada error 422 en su campo.
function FormularioNota({ actividad, existente, bloqueado = false, onGuardar, onCancelar }) {
  const corrigiendo = existente != null
  const [valores, setValores] = useState({
    nota: existente ? textoNota(existente.nota) : '',
    fecha_realizacion: existente?.fecha_realizacion ?? hoyBogota(),
    observacion: existente?.observacion ?? '',
    motivo: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const inactivo = guardando || bloqueado

  const cambiar = (campo) => (e) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }))
    setErrores((previo) => ({ ...previo, [campo]: undefined }))
    setErrorGeneral('')
  }

  // Al corregir, sin ningún cambio no hay nada que enviar (el servidor lo trataría como reenvío idéntico).
  const sinCambios =
    corrigiendo &&
    notaParaServidor(valores.nota) === notaParaServidor(textoNota(existente.nota)) &&
    valores.fecha_realizacion === existente.fecha_realizacion &&
    (valores.observacion.trim() || '') === (existente.observacion ?? '')

  const enviar = async (e) => {
    e.preventDefault()
    if (guardando) return
    if (valores.nota.trim() === '') {
      setErrores({ nota: 'Escribe la nota (de 0 a 10, con hasta dos decimales).' })
      return
    }
    setGuardando(true)
    setErrores({})
    setErrorGeneral('')
    try {
      await onGuardar(actividad.id, {
        nota: notaParaServidor(valores.nota),
        fecha_realizacion: valores.fecha_realizacion,
        observacion: valores.observacion.trim() === '' ? null : valores.observacion.trim(),
        ...(corrigiendo && valores.motivo.trim() !== '' && { motivo: valores.motivo.trim() }),
      })
    } catch (err) {
      const porCampo = erroresDeCampo(err)
      setErrores(traducirErrores(Object.fromEntries(Object.entries(porCampo).filter(([k]) => CAMPOS_FORMULARIO.includes(k)))))
      const sueltos = Object.entries(porCampo).filter(([k]) => !CAMPOS_FORMULARIO.includes(k))
      setErrorGeneral(sueltos.length > 0 ? traducirError(sueltos[0][1]) : Object.keys(porCampo).length === 0 ? mensajeError(err) : '')
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={enviar} noValidate aria-busy={guardando} className={`${CLASE_CAJA_SUAVE} flex flex-col gap-4 p-4`}>
      <div className="grid gap-4 @min-[520px]:grid-cols-2">
        <Campo etiqueta="Nota (0 a 10)" requerido error={errores.nota} ayuda="Hasta dos decimales, por ejemplo 8,5.">
          {({ id, describedby, invalid }) => (
            <input
              id={id}
              type="text"
              inputMode="decimal"
              autoComplete="off"
              autoFocus
              value={valores.nota}
              onChange={cambiar('nota')}
              disabled={inactivo}
              aria-describedby={describedby}
              aria-invalid={invalid || undefined}
              className={CLASE_CAMPO}
            />
          )}
        </Campo>
        <Campo etiqueta="Fecha de realización" requerido error={errores.fecha_realizacion}>
          {({ id, describedby, invalid }) => (
            <input
              id={id}
              type="date"
              max={hoyBogota()}
              value={valores.fecha_realizacion}
              onChange={cambiar('fecha_realizacion')}
              disabled={inactivo}
              aria-describedby={describedby}
              aria-invalid={invalid || undefined}
              className={CLASE_CAMPO}
            />
          )}
        </Campo>
      </div>

      <Campo etiqueta="Observación (opcional)" error={errores.observacion}>
        {({ id, describedby, invalid }) => (
          <textarea
            id={id}
            rows={2}
            maxLength={500}
            value={valores.observacion}
            onChange={cambiar('observacion')}
            disabled={inactivo}
            aria-describedby={describedby}
            aria-invalid={invalid || undefined}
            className={`${CLASE_CAMPO} py-2`}
          />
        )}
      </Campo>

      {corrigiendo && (
        <Campo
          etiqueta="Motivo de la corrección"
          requerido
          error={errores.motivo}
          ayuda="Queda en el historial junto al valor anterior (mínimo 10 caracteres)."
        >
          {({ id, describedby, invalid }) => (
            <textarea
              id={id}
              rows={2}
              maxLength={500}
              value={valores.motivo}
              onChange={cambiar('motivo')}
              disabled={inactivo}
              aria-describedby={describedby}
              aria-invalid={invalid || undefined}
              className={`${CLASE_CAMPO} py-2`}
            />
          )}
        </Campo>
      )}

      {errorGeneral && <MensajeError>{errorGeneral}</MensajeError>}

      <div className="flex flex-wrap items-center gap-3">
        <Boton type="submit" tamano="tactil" ocupado={guardando} disabled={sinCambios || bloqueado}>
          {guardando ? 'Guardando…' : corrigiendo ? 'Guardar corrección' : 'Guardar nota'}
        </Boton>
        <Boton variante="contorno" tamano="tactil" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </Boton>
        {bloqueado ? (
          <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Bloqueado mientras se actualizan los datos.</p>
        ) : (
          sinCambios && <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Sin cambios por guardar.</p>
        )}
      </div>
    </form>
  )
}

function Historial({ correcciones }) {
  return (
    <ol className="flex flex-col gap-3 border-t border-sena-linea/70 pt-3 dark:border-sena-borde/50">
      {correcciones.map((c, i) => (
        <li key={i} className="flex flex-col gap-0.5 text-sm">
          <p className={`font-medium tabular-nums ${CLASE_TEXTO_FUERTE}`}>
            {textoNota(c.nota_anterior)} → {textoNota(c.nota_nueva)}
          </p>
          <p className={`${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>Motivo: {c.motivo}</p>
          <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
            {c.corregida_por ?? 'Usuario eliminado'} · {formatoFecha(c.corregida_en)}
          </p>
        </li>
      ))}
    </ol>
  )
}

function TarjetaActividad({ actividad, info, puedeEscribir, editando, algunaEditando, onEditar, onCerrar, onGuardar }) {
  const [verHistorial, setVerHistorial] = useState(false)
  const botonRef = useRef(null)
  const nota = info.calificacion
  const correcciones = nota?.correcciones ?? []

  // Al cerrar el formulario (cancelar o guardar) el foco vuelve al botón que lo abrió, no se pierde en la página.
  const estabaEditando = useRef(false)
  useEffect(() => {
    if (estabaEditando.current && !editando) botonRef.current?.focus()
    estabaEditando.current = editando
  }, [editando])

  return (
    <li className={`${CLASE_TARJETA_PLANA} flex min-w-0 flex-col gap-3 p-4 ${algunaEditando ? '@min-[620px]:col-span-2' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
          {actividad.etiqueta}
          <span className={`ml-2 font-normal tabular-nums ${CLASE_TEXTO_SUAVE}`}>
            {info.peso != null ? `peso ${info.peso} %` : ''}
          </span>
        </h4>
        {info.estado === 'registrada' && <Etiqueta tono="exito">Registrada</Etiqueta>}
        {info.estado === 'pendiente' && <Etiqueta tono="aviso">Pendiente</Etiqueta>}
        {info.estado === 'desactivada' && <Etiqueta tono="neutral">Desactivada</Etiqueta>}
      </div>

      {info.estado === 'desactivada' && (
        <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Esta actividad no forma parte de la convocatoria.</p>
      )}

      {info.estado === 'pendiente' && (
        <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Aún no tiene nota registrada.</p>
      )}

      {nota && (
        <div className="flex flex-col gap-1">
          {/* Una nota real de 0 se muestra como "0,00": no es lo mismo que una actividad pendiente. */}
          <p className={`text-3xl font-bold tabular-nums ${CLASE_TEXTO_FUERTE}`}>{textoNota(nota.nota)}</p>
          <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
            Realizada el {formatoFecha(nota.fecha_realizacion)} · registrada por{' '}
            {nota.registrada_por ?? 'usuario eliminado'}
          </p>
          {nota.observacion && (
            <p className={`text-sm ${CLASE_TEXTO_PARTIDO} ${CLASE_TEXTO_FUERTE}`}>{nota.observacion}</p>
          )}
        </div>
      )}

      {editando ? (
        <FormularioNota actividad={actividad} existente={nota} bloqueado={!puedeEscribir} onGuardar={onGuardar} onCancelar={onCerrar} />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {puedeEscribir && info.activa && (
            <Boton ref={botonRef} variante={nota ? 'contorno' : 'primario'} tamano="tactil" onClick={onEditar}>
              {nota ? 'Corregir nota' : 'Registrar nota'}
            </Boton>
          )}
          {correcciones.length > 0 && (
            <Boton
              variante="enlace"
              tamano="tactil"
              aria-expanded={verHistorial}
              onClick={() => setVerHistorial((v) => !v)}
            >
              {verHistorial ? 'Ocultar historial' : `Ver historial (${correcciones.length})`}
            </Boton>
          )}
        </div>
      )}

      {verHistorial && correcciones.length > 0 && <Historial correcciones={correcciones} />}
    </li>
  )
}

// Calificaciones presenciales de UN candidato. Se piden al montarse (el detalle solo se monta al abrirlo);
// 'recarga' las vuelve a pedir cuando algo externo cambió (p. ej. se designó la referencia documental).
//
// Vigencia: cada petición tiene su clave (convocatoria, candidato, recarga, intento). Los datos en pantalla son
// "vigentes" solo si se obtuvieron con la clave de ahora. Mientras se actualizan, o si la recarga falla, las notas
// anteriores siguen visibles pero NO se puede escribir: serían decisiones sobre datos que ya pueden haber cambiado
// (por ejemplo, el candidato dejó de estar habilitado). Una respuesta vencida nunca pisa a la actual.
export default function PanelCalificaciones({ convocatoriaId, postulacionId, puedeDecidir, recarga, onCambio }) {
  const clave = `${convocatoriaId}|${postulacionId}|${recarga}`
  const [intento, setIntento] = useState(0)
  const clavePedida = `${clave}|${intento}`
  const [estado, setEstado] = useState({ datos: null, claveDatos: null, claveError: null, error: '' })
  const [editando, setEditando] = useState(null) // id de la actividad en edición

  useEffect(() => {
    let vigente = true
    obtenerCalificaciones(convocatoriaId, postulacionId)
      .then((res) => {
        if (vigente) setEstado({ datos: res.data, claveDatos: clavePedida, claveError: null, error: '' })
      })
      .catch((e) => {
        if (vigente) setEstado((previo) => ({ ...previo, claveError: clavePedida, error: mensajeError(e) }))
      })
    return () => {
      vigente = false
    }
  }, [convocatoriaId, postulacionId, clavePedida])

  const reintentar = () => setIntento((n) => n + 1)

  // Lanza si falla (el formulario conserva lo escrito y pinta los errores); si sale bien, usa lo que devolvió el servidor.
  const guardar = async (actividadId, cuerpo) => {
    const res = await guardarCalificacion(convocatoriaId, postulacionId, actividadId, cuerpo)
    setEstado({ datos: res.data, claveDatos: clavePedida, claveError: null, error: '' })
    setEditando(null)
    onCambio?.({ id: postulacionId, estado_documental: res.data.estado_documental })
  }

  const { datos, error } = estado
  const datosVigentes = estado.claveDatos === clavePedida
  const fallo = !datosVigentes && estado.claveError === clavePedida
  const actualizando = datos != null && !datosVigentes && !fallo

  const avisoReintento = (
    <div className="flex flex-col items-start gap-3">
      <MensajeError>{error}</MensajeError>
      <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
        Reintentar
      </Boton>
    </div>
  )

  if (datos == null && fallo) return avisoReintento
  if (datos == null) {
    return (
      <p role="status" className={`flex items-center gap-2 py-8 text-sm ${CLASE_TEXTO_SUAVE}`}>
        <Rueda /> Cargando calificaciones…
      </p>
    )
  }

  const resultado = datos.resultado_adicional
  const sinConfigurar = !datos.configuracion.configurada
  const sinActividades = resultado.estado === 'sin_actividades'
  const razon = razonSinEscritura(datos, puedeDecidir)
  const puedeEscribir = puedeDecidir && datosVigentes && datos.calificable && !sinConfigurar && !sinActividades

  return (
    <div className="@container flex flex-col gap-4" aria-busy={actualizando}>
      {actualizando && (
        <p role="status" className={`flex items-center gap-2 text-sm ${CLASE_TEXTO_SUAVE}`}>
          <Rueda /> Actualizando calificaciones… Las acciones de escritura están bloqueadas hasta tener datos vigentes.
        </p>
      )}
      {fallo && (
        <div className="flex flex-col items-start gap-3">
          <MensajeError>{error}</MensajeError>
          <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
            Estas son las últimas notas que se pudieron consultar. No se puede registrar ni corregir hasta recargar.
          </p>
          <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
            Reintentar
          </Boton>
        </div>
      )}

      <dl className="grid gap-3 @min-[520px]:grid-cols-3">
        <div className={`${CLASE_CAJA_SUAVE} p-3`}>
          <dt className={`text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Progreso</dt>
          <dd className={`mt-1 text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
            {sinConfigurar || sinActividades ? (
              '—'
            ) : (
              <>
                <span className="tabular-nums">
                  {datos.progreso.registradas} de {datos.progreso.requeridas}
                </span>{' '}
                notas registradas
              </>
            )}
          </dd>
        </div>
        <div className={`${CLASE_CAJA_SUAVE} p-3 @min-[520px]:col-span-2`}>
          <dt className={`text-xs font-medium ${CLASE_TEXTO_SUAVE}`}>Resultado adicional</dt>
          <dd className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {resultado.valor != null ? (
              <span className={`text-2xl font-bold tabular-nums ${CLASE_TEXTO_FUERTE}`}>
                {textoNota(resultado.valor)}
              </span>
            ) : (
              <span className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
                {ESTADO_RESULTADO[resultado.estado] ?? resultado.estado}
              </span>
            )}
            {resultado.estado === 'incompleto' && datos.progreso.pendientes.length > 0 && (
              <span className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
                Falta:{' '}
                {datos.progreso.pendientes
                  .map((p) => ACTIVIDADES.find((a) => a.id === p)?.etiqueta ?? p)
                  .join(' y ')}
              </span>
            )}
          </dd>
        </div>
      </dl>

      {sinConfigurar && (
        <MensajeAviso>
          Pendiente de configurar: esta convocatoria aún no tiene definidas sus actividades presenciales. Se configuran
          en la pestaña Configuración de la convocatoria.
        </MensajeAviso>
      )}
      {sinActividades && (
        <p className={`${CLASE_CAJA_SUAVE} p-3 text-sm ${CLASE_TEXTO_FUERTE}`}>
          Esta convocatoria no tiene actividades presenciales: solo cuenta la habilitación documental.
        </p>
      )}
      {razon && <MensajeAviso>{razon}</MensajeAviso>}

      {!sinConfigurar && !sinActividades && (
        <ul className="grid gap-3 @min-[620px]:grid-cols-2">
          {ACTIVIDADES.map((actividad) => (
            <TarjetaActividad
              key={`${postulacionId}-${actividad.id}`}
              actividad={actividad}
              info={datos.actividades[actividad.id]}
              puedeEscribir={puedeEscribir}
              editando={editando === actividad.id}
              algunaEditando={editando != null}
              onEditar={() => setEditando(actividad.id)}
              onCerrar={() => setEditando(null)}
              onGuardar={guardar}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
