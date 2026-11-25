import { useEffect, useRef, useState } from 'react'
import * as authApi from '../../api/auth'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import { segundosReintento } from '../../api/reintento'
import { useAuth } from '../../auth/useAuth'
import { useCuentaAtras } from '../../lib/useCuentaAtras'
import { enfocarPrimerError, soloConError, validarCodigo } from '../../lib/validacionAcceso'
import { REGLA_PASSWORD } from '../login/useRecuperarContrasena'

// Texto de la única acción según el estado de la contraseña. El estado histórico se llama «desconocido» y NO se presenta como
// «sin contraseña»: la acción es neutral.
export const ACCIONES = {
  sin_definir: 'Establecer contraseña',
  definida: 'Cambiar contraseña',
  desconocido: 'Configurar contraseña',
}

// Explicación breve bajo el estado. El estado histórico no afirma que la cuenta carezca de contraseña.
export const EXPLICACIONES = {
  sin_definir: 'Puedes establecer una contraseña como opción adicional de acceso.',
  definida: 'Te enviaremos un código al correo para confirmar el cambio.',
  desconocido: 'Puedes establecer una contraseña nueva para acceder con tu correo.',
}

// Pasos: 'reposo' (solo el resumen) → 'pedir' (enviar el código al correo de la sesión) → 'codigo' (código y contraseña) → 'listo'.
export function useSeguridadCuenta() {
  const { user, refrescar } = useAuth()
  const acceso = { google: Boolean(user?.acceso?.google), contrasena: user?.acceso?.contrasena ?? 'desconocido' }

  const [paso, setPaso] = useState('reposo')
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const { segundos, iniciar, bloqueado } = useCuentaAtras()
  // El estado `enviando` llega en el siguiente render: el ref corta un doble clic o doble Enter en el mismo lote. Un segundo envío
  // de código dejaría sin validez el correo recién recibido.
  const enVuelo = useRef(false)

  const limpiar = () => {
    setErrores({})
    setErrorGlobal('')
  }

  const abrir = () => {
    limpiar()
    setAviso('')
    setPaso('pedir')
  }

  const cancelar = () => {
    limpiar()
    setCodigo('')
    setPassword('')
    setConfirmacion('')
    setPaso('reposo')
  }

  const pedirCodigo = async ({ reenvio = false } = {}) => {
    if (enVuelo.current) return
    enVuelo.current = true
    limpiar()
    if (reenvio) setReenviando(true)
    else setEnviando(true)
    try {
      await authApi.solicitarCodigoContrasena()
      iniciar(0)
      setPaso('codigo')
    } catch (err) {
      setErrorGlobal(mensajeError(err))
      const espera = segundosReintento(err)
      if (espera) iniciar(espera)
    } finally {
      setEnviando(false)
      setReenviando(false)
      enVuelo.current = false
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (enVuelo.current) return
    limpiar()
    const codigoLimpio = codigo.replace(/\D/g, '').slice(0, 6)
    const encontrados = soloConError({
      code: validarCodigo(codigoLimpio),
      password: REGLA_PASSWORD.test(password) ? '' : 'Mínimo 8 caracteres, con letras y números.',
      confirmacion: !confirmacion ? 'Repite la contraseña.' : password !== confirmacion ? 'Las contraseñas no coinciden.' : '',
    })
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados)
      enfocarPrimerError(e.currentTarget, encontrados, ['code', 'password', 'confirmacion'])
      return
    }

    enVuelo.current = true
    setEnviando(true)
    try {
      const resultado = await authApi.establecerContrasena({
        code: codigoLimpio,
        password,
        password_confirmation: confirmacion,
      })
      setAviso(resultado.message)
      setCodigo('')
      setPassword('')
      setConfirmacion('')
      setPaso('listo')
      // Actualiza los métodos de acceso de la sesión (la marca pasa a «definida»); un fallo aquí no deshace el cambio.
      refrescar().catch(() => {})
    } catch (err) {
      const deCampo = erroresDeCampo(err)
      setErrores(deCampo)
      setErrorGlobal(mensajeError(err))
      const espera = segundosReintento(err)
      if (espera) iniciar(espera)
    } finally {
      setEnviando(false)
      enVuelo.current = false
    }
  }

  // El foco sigue al paso: al campo del código cuando llega el paso 2 y al aviso cuando termina.
  const refCodigo = useRef(null)
  const refAviso = useRef(null)
  useEffect(() => {
    if (paso === 'codigo') refCodigo.current?.focus()
    if (paso === 'listo') refAviso.current?.focus()
  }, [paso])

  return {
    acceso, user, paso, codigo, password, confirmacion, errores, errorGlobal, aviso, enviando, reenviando, segundos, bloqueado,
    refCodigo, refAviso, setCodigo, setPassword, setConfirmacion, abrir, cancelar, pedirCodigo, guardar,
  }
}
