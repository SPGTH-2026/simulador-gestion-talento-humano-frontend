import { useEffect, useRef, useState } from 'react'
import { listaParametros } from '../../api/convocatorias'
import { guardarDatosPersonales } from '../../api/postulacionesDocumentos'
import { listaDepartamentos, listaMunicipios } from '../../api/ubicaciones'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import { categoriaDeEdad, cuerpoDesdeForm, EDAD_MINIMA, formCompleto, formDesdeDatos } from '../../lib/datosPersonales'

// Estado de los datos personales (campos + autorización): valores, catálogos, validación inmediata por edad y guardado.
//
// No hay botón de guardar. Los datos se guardan al AUTORIZAR su tratamiento (eso crea el borrador si aún no existe) y, ya
// autorizados, cada cambio se guarda solo al salir del campo. La postulación releída del servidor es la fuente de verdad:
// sin autorización guardada no hay datos, y sin datos el servidor no deja enviar.
export function useSeccionDatosPersonales({ datos, editable, asegurar, onRecargar, onError }) {
  const [form, setForm] = useState(() => formDesdeDatos(datos))
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [catalogos, setCatalogos] = useState({ tiposDocumento: [], nivelesFormacion: [], departamentos: [] })
  // Municipios ya pedidos, por código de departamento: no se vuelven a pedir al volver a elegirlo.
  const [municipiosPorDepto, setMunicipiosPorDepto] = useState({})
  // Evita dos guardados a la vez (p. ej. el blur de un campo justo al marcar la autorización).
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
  const errorEdad = bajoMinimo
    ? `Eres menor de la edad permitida para postularte (${EDAD_MINIMA} años). No puedes continuar.`
    : undefined

  const cambiar = (campo, valor) => {
    // Cambiar de departamento invalida el municipio: pertenece al anterior.
    setForm((prev) => ({ ...prev, [campo]: valor, ...(campo === 'departamento' ? { municipio: '' } : {}) }))
    setErrores((prev) => ({ ...prev, [campo]: undefined, ...(campo === 'departamento' ? { municipio: undefined } : {}) }))
  }

  // Props para un <input>/<select> controlado.
  const campo = (nombre) => ({
    value: form[nombre],
    disabled: !editable || guardando,
    onChange: (e) => cambiar(nombre, e.target.value),
  })

  const errorDe = (nombre) => (nombre === 'fecha_nacimiento' ? errorEdad ?? errores[nombre] : errores[nombre])

  // Crea el borrador si hace falta y guarda `contenido`. Devuelve true si quedó guardado.
  const guardar = async (contenido) => {
    if (!editable || enVuelo.current || bajoMinimo) return false
    enVuelo.current = true
    setGuardando(true)
    setErrores({})
    onError?.('')
    try {
      const { postulacionId } = await asegurar()
      await guardarDatosPersonales(postulacionId, cuerpoDesdeForm(contenido))
      await onRecargar?.()
      return true
    } catch (e) {
      setErrores(erroresDeCampo(e))
      onError?.(mensajeError(e))
      return false
    } finally {
      enVuelo.current = false
      setGuardando(false)
    }
  }

  // Marcar la autorización guarda los datos. Si el servidor los rechaza (faltan campos), la casilla vuelve a quedar
  // sin marcar y cada campo muestra su error.
  const autorizar = async (marcada) => {
    if (!marcada || yaGuardado) return
    const contenido = { ...form, acepta_tratamiento_datos: true }
    setForm(contenido)
    if (!(await guardar(contenido))) cambiar('acepta_tratamiento_datos', false)
  }

  // Con los datos ya autorizados, un cambio se guarda al salir del campo (no antes: a medias no es válido).
  // Si el formulario quedó a medias (p. ej. cambió el departamento y falta elegir el municipio) no se guarda todavía.
  const alSalirDeCampo = () => {
    if (yaGuardado && formCompleto(form)) guardar(form)
  }

  // Un selector (sexo) no «sale» del campo al elegir: se guarda en el momento, con el valor nuevo.
  const cambiarYGuardar = (nombre, valor) => {
    cambiar(nombre, valor)
    const nuevo = { ...form, [nombre]: valor }
    if (yaGuardado && formCompleto(nuevo)) guardar(nuevo)
  }

  return {
    alSalirDeCampo,
    autorizar,
    bajoMinimo,
    campo,
    cambiar,
    cambiarYGuardar,
    catalogos,
    errorDe,
    esMenor,
    form,
    guardando,
    municipios,
    yaGuardado,
  }
}
