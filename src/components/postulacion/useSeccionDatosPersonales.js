import { useEffect, useRef, useState } from 'react'
import { listaParametros } from '../../api/convocatorias'
import { guardarDatosPersonales } from '../../api/postulacionesDocumentos'
import { listaDepartamentos, listaMunicipios } from '../../api/ubicaciones'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import { categoriaDeEdad, cuerpoDesdeForm, EDAD_MINIMA, formCompleto, formDesdeDatos } from '../../lib/datosPersonales'

// Catálogos fijos (tipos de documento, niveles de formación y departamentos): no cambian durante la sesión, así que se piden
// una sola vez y no en cada visita a la postulación. Si la petición falla, la siguiente visita vuelve a pedirlos.
let catalogosFijos = null
function cargarCatalogosFijos() {
  if (!catalogosFijos) {
    catalogosFijos = Promise.all([listaParametros('tipo_documento_identidad'), listaParametros('nivel_formacion'), listaDepartamentos()])
      .catch((e) => {
        catalogosFijos = null
        throw e
      })
  }
  return catalogosFijos
}

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
    cargarCatalogosFijos()
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

  // Los municipios de cada departamento elegido (el del aspirante y el de la residencia de su representante) se piden al
  // elegirlo: 1.122 juntos serían demasiados para una lista. Los ya pedidos no se vuelven a pedir.
  const porPedir = [form.departamento, form.representante_departamento]
    .filter((codigo, i, lista) => codigo && lista.indexOf(codigo) === i && !(codigo in municipiosPorDepto))
    .join(',')
  useEffect(() => {
    if (!porPedir) return undefined
    let activo = true
    porPedir.split(',').forEach((codigo) => {
      listaMunicipios(codigo)
        .then((municipios) => {
          if (activo) setMunicipiosPorDepto((prev) => ({ ...prev, [codigo]: municipios }))
        })
        .catch((e) => {
          if (activo) onError?.(mensajeError(e))
        })
    })
    return () => {
      activo = false
    }
  }, [porPedir, onError])
  const municipios = municipiosPorDepto[form.departamento] ?? []
  const municipiosRepresentante = municipiosPorDepto[form.representante_departamento] ?? []

  const categoria = categoriaDeEdad(form.fecha_nacimiento)
  const bajoMinimo = categoria === 'bajo_minimo'
  const esMenor = categoria === 'menor'
  const yaGuardado = Boolean(datos)
  // Autorizado = el SERVIDOR ya registró la autorización (no solo la casilla marcada en pantalla).
  const autorizado = Boolean(datos?.acepta_tratamiento_datos)
  // «Listo» = lo que muestra el formulario está COMPLETO, AUTORIZADO y GUARDADO tal cual en el servidor. Mientras no lo esté
  // (campos sin llenar, cambios pendientes de guardar o datos guardados antes de que existieran campos nuevos) no se puede
  // pasar a documentos ni enviar: el servidor decide con lo guardado, no con lo que se ve en pantalla.
  const guardadoEnServidor = JSON.stringify(cuerpoDesdeForm(formDesdeDatos(datos)))
  const listo = yaGuardado && autorizado && formCompleto(form) && JSON.stringify(cuerpoDesdeForm(form)) === guardadoEnServidor
  const errorEdad = bajoMinimo
    ? `Eres menor de la edad permitida para postularte (${EDAD_MINIMA} años). No puedes continuar.`
    : undefined

  const cambiar = (campo, valor) => {
    // Cambiar de departamento invalida el municipio: pertenece al anterior.
    const hijo = { departamento: 'municipio', representante_departamento: 'representante_municipio' }[campo]
    setForm((prev) => ({ ...prev, [campo]: valor, ...(hijo ? { [hijo]: '' } : {}) }))
    setErrores((prev) => ({ ...prev, [campo]: undefined, ...(hijo ? { [hijo]: undefined } : {}) }))
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
    listo,
    municipios,
    municipiosRepresentante,
    yaGuardado,
  }
}
