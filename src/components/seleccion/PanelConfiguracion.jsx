import { useEffect, useId, useRef, useState } from 'react'
import { obtenerConfiguracion, guardarConfiguracion } from '../../api/seleccion'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import Boton from '../ui/Boton'
import Campo from '../ui/Campo'
import Etiqueta from '../ui/Etiqueta'
import { MensajeAviso, MensajeError, MensajeExito } from '../ui/Mensaje'
import Rueda from '../ui/Rueda'
import {
  CLASE_CAMPO,
  CLASE_CAJA_SUAVE,
  CLASE_TEXTO_FUERTE,
  CLASE_TEXTO_SUAVE,
} from '../../lib/estilos'
import { OPCIONES_ACTIVIDADES, opcionPorId } from '../../lib/seleccion'

// Formulario a partir de la configuración que devolvió el servidor. Sin
// configurar (opcion null) no hay ninguna opción elegida.
const desdeConfiguracion = (c) => ({
  opcion: c.opcion,
  pesoEntrevista: String(c.entrevista?.activa && c.prueba_tecnica?.activa ? c.entrevista.peso : 50),
  pesoPrueba: String(c.entrevista?.activa && c.prueba_tecnica?.activa ? c.prueba_tecnica.peso : 50),
})

const soloDigitos = (valor) => valor.replace(/\D/g, '').slice(0, 3)

// Etiqueta del estado de la configuración. "Pendiente de configurar" (nunca se
// guardó) y "Sin actividades" (se guardó a propósito sin ellas) son cosas distintas.
function EstadoConfiguracion({ config }) {
  if (!config.configurada) return <Etiqueta tono="aviso">Pendiente de configurar</Etiqueta>
  if (config.opcion === 'sin_actividades') return <Etiqueta tono="neutral">Sin actividades</Etiqueta>
  return <Etiqueta tono="azul">{opcionPorId(config.opcion)?.etiqueta ?? config.opcion}</Etiqueta>
}

// Configuración de la entrevista y la prueba técnica de UNA convocatoria. Se pide
// al abrir la pestaña ('activo'), una sola vez; el padre lo monta con 'key' = id
// de la convocatoria, así que cambiar de convocatoria lo reinicia.
export default function PanelConfiguracion({ convocatoriaId, activo, puedeDecidir }) {
  const idGrupo = useId()
  const [config, setConfig] = useState(null)
  const [errorCarga, setErrorCarga] = useState('')
  const [intento, setIntento] = useState(0)
  // La pestaña se abrió al menos una vez: desde ahí la configuración se pide (una sola vez).
  const [abierta, setAbierta] = useState(false)
  if (activo && !abierta) setAbierta(true)
  const pedido = useRef(-1)
  const montado = useRef(false)

  const [borrador, setBorrador] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [guardada, setGuardada] = useState(false)

  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  useEffect(() => {
    if (!abierta || pedido.current === intento) return
    pedido.current = intento
    const miIntento = intento
    obtenerConfiguracion(convocatoriaId)
      .then((res) => {
        if (!montado.current || pedido.current !== miIntento) return
        setConfig(res.data)
        setBorrador(desdeConfiguracion(res.data))
      })
      .catch((e) => {
        if (!montado.current || pedido.current !== miIntento) return
        setErrorCarga(mensajeError(e))
      })
  }, [abierta, intento, convocatoriaId])

  const reintentar = () => {
    setErrorCarga('')
    setIntento((n) => n + 1)
  }

  if (!abierta) {
    return <p className={`py-8 text-sm ${CLASE_TEXTO_SUAVE}`}>La configuración se carga al abrir esta pestaña.</p>
  }
  if (errorCarga) {
    return (
      <div className="flex flex-col items-start gap-3">
        <MensajeError>{errorCarga}</MensajeError>
        <Boton variante="contorno" tamano="tactil" onClick={reintentar}>
          Reintentar
        </Boton>
      </div>
    )
  }
  if (config == null) {
    return (
      <p role="status" className={`flex items-center gap-2 py-8 text-sm ${CLASE_TEXTO_SUAVE}`}>
        <Rueda /> Cargando configuración…
      </p>
    )
  }

  const opcion = opcionPorId(borrador.opcion)
  const ambas = borrador.opcion === 'ambas'
  const unaSola = opcion && opcion.entrevista !== opcion.prueba
  const editable = puedeDecidir && config.editable
  const pesoE = Number(borrador.pesoEntrevista)
  const pesoP = Number(borrador.pesoPrueba)
  const suma = (Number.isFinite(pesoE) ? pesoE : 0) + (Number.isFinite(pesoP) ? pesoP : 0)

  const huboCambio =
    borrador.opcion !== config.opcion ||
    (ambas &&
      (borrador.pesoEntrevista !== String(config.entrevista.peso) ||
        borrador.pesoPrueba !== String(config.prueba_tecnica.peso)))
  const puedeGuardar = editable && borrador.opcion != null && huboCambio

  const editar = (cambios) => {
    setBorrador((previo) => ({ ...previo, ...cambios }))
    setErrores({})
    setErrorGeneral('')
    setGuardada(false)
  }

  // Al escribir un peso, el otro se completa a 100 (sigue siendo editable).
  const cambiarPeso = (cual, texto) => {
    const valor = soloDigitos(texto)
    const n = Number(valor)
    const otro = valor !== '' && n >= 1 && n <= 99 ? String(100 - n) : null
    if (cual === 'entrevista') editar({ pesoEntrevista: valor, ...(otro && { pesoPrueba: otro }) })
    else editar({ pesoPrueba: valor, ...(otro && { pesoEntrevista: otro }) })
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!puedeGuardar || guardando) return
    const cuerpo = { entrevista_activa: opcion.entrevista, prueba_tecnica_activa: opcion.prueba }
    // Con una sola actividad el servidor fija el peso en 100; con ambas se envían los dos.
    if (ambas) {
      cuerpo.peso_entrevista = borrador.pesoEntrevista === '' ? null : Number(borrador.pesoEntrevista)
      cuerpo.peso_prueba_tecnica = borrador.pesoPrueba === '' ? null : Number(borrador.pesoPrueba)
    }

    setGuardando(true)
    setErrores({})
    setErrorGeneral('')
    setGuardada(false)
    try {
      const res = await guardarConfiguracion(convocatoriaId, cuerpo)
      if (!montado.current) return
      setConfig(res.data)
      setBorrador(desdeConfiguracion(res.data))
      setGuardada(true)
    } catch (err) {
      if (!montado.current) return
      const porCampo = erroresDeCampo(err)
      const conocidos = ['peso_entrevista', 'peso_prueba_tecnica']
      setErrores(Object.fromEntries(Object.entries(porCampo).filter(([k]) => conocidos.includes(k))))
      // Lo que no cae en un campo (convocatoria cerrada, bloqueo, permisos, red) va arriba.
      const sueltos = Object.entries(porCampo).filter(([k]) => !conocidos.includes(k))
      setErrorGeneral(sueltos.length > 0 ? sueltos[0][1] : Object.keys(porCampo).length === 0 ? mensajeError(err) : '')
    } finally {
      if (montado.current) setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-5" aria-busy={guardando}>
      <div className="flex flex-wrap items-center gap-3">
        <EstadoConfiguracion config={config} />
        {config.actualizada_por && (
          <p className={`text-xs ${CLASE_TEXTO_SUAVE}`}>
            Actualizada por {config.actualizada_por}
          </p>
        )}
      </div>

      {config.bloqueada ? (
        <MensajeAviso>
          La configuración ya no se puede cambiar: esta convocatoria tiene calificaciones registradas.
        </MensajeAviso>
      ) : !config.editable ? (
        <MensajeAviso>
          Solo se puede configurar con la convocatoria publicada o en proceso (ahora está{' '}
          {config.estado_convocatoria === 'cerrada' ? 'cerrada' : config.estado_convocatoria === 'borrador' ? 'en borrador' : config.estado_convocatoria}
          ).
        </MensajeAviso>
      ) : !puedeDecidir ? (
        <MensajeAviso>Puedes consultar la configuración, pero tu rol no permite modificarla.</MensajeAviso>
      ) : null}

      <fieldset disabled={!editable || guardando} className="flex min-w-0 flex-col gap-3">
        <legend className={`mb-1 text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>
          Actividades presenciales
        </legend>
        <div className="grid gap-3 @min-[520px]:grid-cols-2">
          {OPCIONES_ACTIVIDADES.map((o) => {
            const elegida = borrador.opcion === o.id
            return (
              <label
                key={o.id}
                className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border p-3 has-disabled:cursor-not-allowed has-disabled:opacity-70 has-focus-visible:ring-2 has-focus-visible:ring-sena/40 ${
                  elegida
                    ? 'border-sena bg-sena-fondo ring-1 ring-sena dark:bg-sena-superficie-alta'
                    : 'border-sena-linea/80 dark:border-sena-borde/60'
                }`}
              >
                <input
                  type="radio"
                  name={idGrupo}
                  value={o.id}
                  checked={elegida}
                  onChange={() => editar({ opcion: o.id })}
                  className="mt-1 size-4 shrink-0 accent-sena-oscuro"
                />
                <span className="flex min-w-0 flex-col">
                  <span className={`text-sm font-semibold ${CLASE_TEXTO_FUERTE}`}>{o.etiqueta}</span>
                  <span className={`text-sm ${CLASE_TEXTO_SUAVE}`}>{o.ayuda}</span>
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {unaSola && (
        <div className={`${CLASE_CAJA_SUAVE} p-4`}>
          <p className={`text-sm ${CLASE_TEXTO_FUERTE}`}>
            {opcion.entrevista ? 'Entrevista' : 'Prueba técnica'}:{' '}
            <span className="font-semibold tabular-nums">peso 100 %</span>
          </p>
        </div>
      )}

      {ambas && (
        <div className={`${CLASE_CAJA_SUAVE} flex flex-col gap-4 p-4`}>
          <div className="grid gap-4 @min-[520px]:grid-cols-2">
            <Campo
              etiqueta="Peso de la entrevista (%)"
              error={errores.peso_entrevista}
              ayuda="Entero entre 1 y 99."
            >
              {({ id, describedby, invalid }) => (
                <input
                  id={id}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={borrador.pesoEntrevista}
                  onChange={(e) => cambiarPeso('entrevista', e.target.value)}
                  disabled={!editable || guardando}
                  aria-describedby={describedby}
                  aria-invalid={invalid || undefined}
                  className={CLASE_CAMPO}
                />
              )}
            </Campo>
            <Campo
              etiqueta="Peso de la prueba técnica (%)"
              error={errores.peso_prueba_tecnica}
              ayuda="Entero entre 1 y 99."
            >
              {({ id, describedby, invalid }) => (
                <input
                  id={id}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={borrador.pesoPrueba}
                  onChange={(e) => cambiarPeso('prueba', e.target.value)}
                  disabled={!editable || guardando}
                  aria-describedby={describedby}
                  aria-invalid={invalid || undefined}
                  className={CLASE_CAMPO}
                />
              )}
            </Campo>
          </div>
          <p
            aria-live="polite"
            className={`text-sm font-medium tabular-nums ${suma === 100 ? CLASE_TEXTO_SUAVE : 'text-aviso'}`}
          >
            Suma: {suma} % {suma === 100 ? '' : '(deben sumar 100 %)'}
          </p>
        </div>
      )}

      {errorGeneral && <MensajeError>{errorGeneral}</MensajeError>}
      {guardada && <MensajeExito>Configuración guardada.</MensajeExito>}

      {editable && (
        <div className="flex flex-wrap items-center gap-3">
          <Boton type="submit" tamano="tactil" ocupado={guardando} disabled={!puedeGuardar}>
            {guardando ? 'Guardando…' : 'Guardar configuración'}
          </Boton>
          {!huboCambio && borrador.opcion != null && !guardada && (
            <p className={`text-sm ${CLASE_TEXTO_SUAVE}`}>Sin cambios por guardar.</p>
          )}
        </div>
      )}
    </form>
  )
}
