import { useEffect, useRef, useState } from 'react'
import { listaParametros } from '../../api/convocatorias'
import { guardarDatosPersonales } from '../../api/postulacionesDocumentos'
import { listaDepartamentos, listaMunicipios } from '../../api/ubicaciones'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import { categoriaDeEdad, cuerpoDesdeForm, EDAD_MINIMA, formCompleto, formDesdeDatos } from '../../lib/datosPersonales'

// Pausa antes de guardar, para no mandar una petición por cada tecla: lo bastante corta para sentirse inmediata.
const ESPERA_GUARDADO_MS = 500

// Estado de los datos personales: valores, catálogos, validación inmediata por edad y GUARDADO AUTOMÁTICO.
//
// No hay botón de guardar ni la autorización guarda nada: en cuanto el formulario está completo (todos los campos
// obligatorios, y el representante si es menor) se guarda solo, tras una pausa breve, y lo mismo con cada cambio posterior.
// Guardar crea el borrador si aún no existe. La autorización del tratamiento de datos es una casilla más del formulario: se
// registra con el siguiente guardado y es lo que habilita pasar a documentos y enviar. La postulación releída del servidor es
// la fuente de verdad (`datos`).
export function useSeccionDatosPersonales({ datos, editable, asegurar, onRecargar, onError }) {
  const [form, setForm] = useState(() => formDesdeDatos(datos))
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [catalogos, setCatalogos] = useState({ tiposDocumento: [], nivelesFormacion: [], departamentos: [] })
  // Municipios ya pedidos, por código de departamento: no se vuelven a pedir al volver a elegirlo.
  const [municipiosPorDepto, setMunicipiosPorDepto] = useState({})
  // Lo último que se mandó guardar (o que ya estaba guardado): evita repetir el mismo guardado y reintentar sin parar un
  // rechazo del servidor hasta que la persona cambie algo.
  const ultimoEnviado = useRef(JSON.stringify(cuerpoDesdeForm(formDesdeDatos(datos))))
  // Evita dos guardados a la vez.
  const enVuelo = useRef(false)

  // Los datos llegan del servidor DESPUÉS de montar (la postulación se lee o se crea al guardar): cuando pasan de «sin
  // datos» a «con datos guardados» el formulario parte de lo guardado. No se reinicia con cada relectura, para no pisar
  // lo que la persona esté escribiendo.
  const [habiaDatos, setHabiaDatos] = useState(Boolean(datos))
  if (habiaDatos !== Boolean(datos)) {
    setHabiaDatos(Boolean(datos))
    setForm(formDesdeDatos(datos))
  }

  useEffect(() => {
    let activo = true
    Promise.all([listaParametros('tipo_documento_identidad'), listaParametros('nivel_formacion'), listaDepartamentos()])
      .then(([tipos, niveles, departamentos]) => {
        if (activo) setCatalogos({ tiposDocumento: tipos.data ?? [], nivelesFormacion: niveles.data ?? [], departamentos })
      })
      .catch((e) => {
        if (activo) onError?.(mensajeError(e))
      })
    return () => {
      activo = false
    }
  }, [onError])

  // Los municipios del departamento elegido se piden al elegirlo (1.122 juntos serían demasiados para una lista).
  const departamentoElegido = form.departamento
  const yaPedido = departamentoElegido in municipiosPorDepto
  useEffect(() => {
    if (!departamentoElegido || yaPedido) return undefined
    let activo = true
    listaMunicipios(departamentoElegido)
      .then((municipios) => {
        if (activo) setMunicipiosPorDepto((prev) => ({ ...prev, [departamentoElegido]: municipios }))
      })
      .catch((e) => {
        if (activo) onError?.(mensajeError(e))
      })
    return () => {
      activo = false
    }
  }, [departamentoElegido, yaPedido, onError])
  const municipios = municipiosPorDepto[departamentoElegido] ?? []

  const categoria = categoriaDeEdad(form.fecha_nacimiento)
  const bajoMinimo = categoria === 'bajo_minimo'
  const esMenor = categoria === 'menor'
  const yaGuardado = Boolean(datos)
  // Autorizado = el SERVIDOR ya registró la autorización (no solo la casilla marcada en pantalla).
  const autorizado = Boolean(datos?.acepta_tratamiento_datos)
  const errorEdad = bajoMinimo
    ? `Eres menor de la edad permitida para postularte (${EDAD_MINIMA} años). No puedes continuar.`
    : undefined

  const cambiar = (campo, valor) => {
    // Cambiar de departamento invalida el municipio: pertenece al anterior.
    setForm((prev) => ({ ...prev, [campo]: valor, ...(campo === 'departamento' ? { municipio: '' } : {}) }))
    setErrores((prev) => ({ ...prev, [campo]: undefined, ...(campo === 'departamento' ? { municipio: undefined } : {}) }))
  }

  // Props para un <input>/<select> controlado. No se deshabilitan mientras guarda: el guardado es automático y bloquear el
  // campo mientras se escribe le quitaría el foco a la persona.
  const campo = (nombre) => ({
    value: form[nombre],
    disabled: !editable,
    onChange: (e) => cambiar(nombre, e.target.value),
  })

  const errorDe = (nombre) => (nombre === 'fecha_nacimiento' ? errorEdad ?? errores[nombre] : errores[nombre])

  // Guardado automático: con el formulario completo y distinto de lo último enviado, se guarda tras una pausa breve. Cada
  // cambio reinicia la pausa (el cleanup cancela el temporizador anterior).
  const cuerpo = JSON.stringify(cuerpoDesdeForm(form))
  useEffect(() => {
    if (!editable || bajoMinimo || !formCompleto(form) || cuerpo === ultimoEnviado.current) return undefined

    const temporizador = setTimeout(async () => {
      if (enVuelo.current) return
      enVuelo.current = true
      ultimoEnviado.current = cuerpo
      setGuardando(true)
      setErrores({})
      onError?.('')
      try {
        const { postulacionId } = await asegurar()
        await guardarDatosPersonales(postulacionId, JSON.parse(cuerpo))
        await onRecargar?.()
      } catch (e) {
        // Se queda como «último enviado»: no se reintenta solo hasta que la persona cambie algo.
        setErrores(erroresDeCampo(e))
        onError?.(mensajeError(e))
      } finally {
        enVuelo.current = false
        setGuardando(false)
      }
    }, ESPERA_GUARDADO_MS)

    return () => clearTimeout(temporizador)
  }, [cuerpo, editable, bajoMinimo, form, guardando, asegurar, onRecargar, onError])

  return {
    autorizado,
    bajoMinimo,
    campo,
    cambiar,
    catalogos,
    errorDe,
    esMenor,
    form,
    guardando,
    municipios,
    yaGuardado,
  }
}
