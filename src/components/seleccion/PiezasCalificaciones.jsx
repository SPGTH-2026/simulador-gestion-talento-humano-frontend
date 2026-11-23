import { useEffect, useRef, useState } from 'react'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import Boton from '../ui/Boton'
import Campo from '../ui/Campo'
import Etiqueta from '../ui/Etiqueta'
import { MensajeError } from '../ui/Mensaje'
import { CLASE_CAJA_SUAVE, CLASE_CAMPO, CLASE_TARJETA_PLANA, CLASE_TEXTO_FUERTE, CLASE_TEXTO_PARTIDO, CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { formatoFecha, hoyBogota, notaParaServidor, permiteEscribirNota, validarNota, textoNota, traducirError, traducirErrores } from '../../lib/seleccion'

// Piezas del panel de calificaciones: formulario de nota, historial y tarjeta de actividad.
export const CAMPOS_FORMULARIO = ['nota', 'fecha_realizacion', 'observacion', 'motivo']

// Por qué no se puede escribir (null = se puede). Las notas existentes se ven igual.

// Formulario de una nota. Conserva lo escrito si el guardado falla y pinta cada error 422 en su campo.
export function FormularioNota({ actividad, existente, bloqueado = false, onGuardar, onCancelar }) {
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
    const texto = e.target.value
    // La nota se restringe al escribir y al pegar: lo que ya no puede ser una nota válida NO entra al campo (se conserva el
    // texto anterior) y se dice el motivo. Nunca se corrige solo: un pegado inválido se rechaza entero.
    if (campo === 'nota') {
      const regla = permiteEscribirNota(texto)
      if (!regla.permitido) {
        setErrores((previo) => ({ ...previo, nota: regla.mensaje }))
        return
      }
    }
    setValores((v) => ({ ...v, [campo]: texto }))
    // Lo permitido se valida igual mientras se escribe: un separador sin decimales («8,») aún no es error hasta salir del campo.
    const nota = campo === 'nota' && texto.trim() !== '' ? validarNota(texto, { enEdicion: true }) : null
    setErrores((previo) => ({ ...previo, [campo]: nota && !nota.ok && nota.mensaje ? nota.mensaje : undefined }))
    setErrorGeneral('')
  }

  // Al salir del campo también se señala una nota incompleta («8,»).
  const validarNotaAlSalir = () => {
    if (valores.nota.trim() === '') return
    const nota = validarNota(valores.nota)
    setErrores((previo) => ({ ...previo, nota: nota.ok ? undefined : nota.mensaje }))
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
    const nota = validarNota(valores.nota)
    if (!nota.ok) {
      setErrores({ nota: nota.mensaje })
      return
    }
    setGuardando(true)
    setErrores({})
    setErrorGeneral('')
    try {
      await onGuardar(actividad.id, {
        nota: nota.valor,
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
              onBlur={validarNotaAlSalir}
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

export function Historial({ correcciones }) {
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

export function TarjetaActividad({ actividad, info, puedeEscribir, editando, algunaEditando, onEditar, onCerrar, onGuardar }) {
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
// 'soloLectura': vista de consulta (p. ej. la evidencia al decidir en Decidir): muestra las notas, pesos y correcciones de
// hoy sin ofrecer registrar ni corregir, y sin el aviso de rol (que sería falso para quien sí puede calificar).
