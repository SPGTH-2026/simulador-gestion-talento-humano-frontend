import { useEffect, useId, useRef, useState } from 'react'
import { obtenerConfiguracion, guardarConfiguracion } from '../../api/seleccion'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import Boton from '../ui/Boton'
import Etiqueta from '../ui/Etiqueta'
import { MensajeError } from '../ui/Mensaje'
import Rueda from '../ui/Rueda'
import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import { opcionPorId } from '../../lib/seleccion'

export const desdeConfiguracion = (c) => ({
  opcion: c.opcion,
  pesoEntrevista: String(c.entrevista?.activa && c.prueba_tecnica?.activa ? c.entrevista.peso : 50),
  pesoPrueba: String(c.entrevista?.activa && c.prueba_tecnica?.activa ? c.prueba_tecnica.peso : 50),
})

// Etiqueta del estado de la configuración. "Pendiente de configurar" (nunca se
// guardó) y "Sin actividades" (se guardó a propósito sin ellas) son cosas distintas.
function EstadoConfiguracion({ config }) {
  if (!config.configurada) return <Etiqueta tono="aviso">Pendiente de configurar</Etiqueta>
  if (config.opcion === 'sin_actividades') return <Etiqueta tono="neutral">Sin actividades</Etiqueta>
  return <Etiqueta tono="azul">{opcionPorId(config.opcion)?.etiqueta ?? config.opcion}</Etiqueta>
}

export const soloDigitos = (valor) => valor.replace(/\D/g, '').slice(0, 3)

// Lógica de PanelConfiguracion: estado, efectos y manejadores. Devuelve todo en un objeto (ctx) para la vista.
export function usePanelConfiguracion({ convocatoriaId, activo, puedeDecidir }) {
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

    return {
      abierta,
      activo,
      ambas,
      borrador,
      cambiarPeso,
      config,
      convocatoriaId,
      editable,
      editar,
      errorCarga,
      errorGeneral,
      errores,
      guardada,
      guardando,
      guardar,
      huboCambio,
      idGrupo,
      intento,
      montado,
      opcion,
      pedido,
      pesoE,
      pesoP,
      puedeDecidir,
      puedeGuardar,
      reintentar,
      setAbierta,
      setBorrador,
      setConfig,
      setErrorCarga,
      setErrorGeneral,
      setErrores,
      setGuardada,
      setGuardando,
      setIntento,
      suma,
      unaSola,
    }
}
