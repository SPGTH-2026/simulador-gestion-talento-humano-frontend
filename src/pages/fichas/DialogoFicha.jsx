import { useEffect, useRef, useState } from 'react'
import { actualizarFicha, crearFicha } from '../../api/fichas'
import { erroresDeCampo, mensajeError } from '../../api/mensajeError'
import Boton from '../../components/ui/Boton'
import Campo from '../../components/ui/Campo'
import Dialogo from '../../components/ui/Dialogo'
import EncabezadoDialogo from '../../components/ui/EncabezadoDialogo'
import { MensajeError } from '../../components/ui/Mensaje'
import { CLASE_CAMPO } from '../../lib/estilos'
import { enfocarPrimerError, mostrarAvisoGlobal } from '../../lib/validacionAcceso'
import { ESTADOS } from './constantesFichas'

const ID_TITULO = 'dialogo-ficha-titulo'
const CAMPOS = ['codigo', 'nombre_programa', 'estado']

// Crear o editar una ficha en un diálogo. Si algo falla, el diálogo sigue abierto con lo escrito y el error junto al campo; al
// cerrarlo (X, Escape o fondo) no se guarda nada y el foco vuelve al botón que lo abrió. Mientras guarda no se puede cerrar.
export default function DialogoFicha({ ficha, onCerrar, onGuardada }) {
  const editando = Boolean(ficha)
  const [form, setForm] = useState(
    editando ? { codigo: ficha.codigo, nombre_programa: ficha.nombre_programa, estado: ficha.estado } : { codigo: '', nombre_programa: '', estado: 'activa' },
  )
  const [errores, setErrores] = useState({})
  const [errorGlobal, setErrorGlobal] = useState('')
  const [guardando, setGuardando] = useState(false)
  // El estado `guardando` llega en el siguiente render: el ref corta un doble clic o doble Enter en el mismo lote.
  const enVuelo = useRef(false)
  const refEnviar = useRef(null)
  // El botón está deshabilitado mientras guarda (y Chrome le quita el foco): si el fallo no es de un campo, el foco vuelve al botón
  // en cuanto se vuelve a habilitar.
  const devolverFocoAlBoton = useRef(false)
  useEffect(() => {
    if (!guardando && devolverFocoAlBoton.current) {
      devolverFocoAlBoton.current = false
      refEnviar.current?.focus()
    }
  }, [guardando])

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value })

  const guardar = async (e) => {
    e.preventDefault()
    if (enVuelo.current) return
    const formulario = e.currentTarget
    setErrorGlobal('')
    enVuelo.current = true
    setGuardando(true)
    setErrores({})
    const cuerpo = { codigo: form.codigo, nombre_programa: form.nombre_programa, estado: form.estado }
    try {
      const res = editando ? await actualizarFicha(ficha.id, cuerpo) : await crearFicha(cuerpo)
      onGuardada(res.data, editando)
    } catch (err) {
      const deCampo = erroresDeCampo(err)
      setErrores(deCampo)
      setErrorGlobal(mostrarAvisoGlobal(deCampo, CAMPOS) ? mensajeError(err) : '')
      if (CAMPOS.some((c) => deCampo[c])) enfocarPrimerError(formulario, deCampo, CAMPOS)
      else devolverFocoAlBoton.current = true
    } finally {
      setGuardando(false)
      enVuelo.current = false
    }
  }

  return (
    <Dialogo idTitulo={ID_TITULO} onCerrar={guardando ? () => {} : onCerrar} className="max-w-md">
      <form noValidate onSubmit={guardar} aria-labelledby={ID_TITULO} className="@container flex flex-col gap-4 p-5 sm:p-6">
        <EncabezadoDialogo
          idTitulo={ID_TITULO}
          titulo={editando ? 'Editar ficha' : 'Nueva ficha'}
          contexto={editando ? undefined : 'La ficha que registras queda a tu nombre: tú la gestionas.'}
          onCerrar={onCerrar}
          deshabilitado={guardando}
        />

        {errorGlobal && <MensajeError>{errorGlobal}</MensajeError>}

        <Campo etiqueta="Código" requerido error={errores.codigo}>
          {({ id, describedby, invalid }) => (
            <input
              id={id}
              name="codigo"
              type="text"
              autoFocus
              value={form.codigo}
              onChange={cambiar('codigo')}
              placeholder="3173334"
              autoComplete="off"
              aria-describedby={describedby}
              aria-invalid={invalid || undefined}
              className={CLASE_CAMPO}
            />
          )}
        </Campo>

        <Campo etiqueta="Programa" requerido error={errores.nombre_programa}>
          {({ id, describedby, invalid }) => (
            <input
              id={id}
              name="nombre_programa"
              type="text"
              value={form.nombre_programa}
              onChange={cambiar('nombre_programa')}
              placeholder="Análisis y Desarrollo de Software"
              autoComplete="off"
              aria-describedby={describedby}
              aria-invalid={invalid || undefined}
              className={CLASE_CAMPO}
            />
          )}
        </Campo>

        <Campo etiqueta="Estado" error={errores.estado}>
          {({ id, describedby, invalid }) => (
            <select
              id={id}
              name="estado"
              value={form.estado}
              onChange={cambiar('estado')}
              aria-describedby={describedby}
              aria-invalid={invalid || undefined}
              className={CLASE_CAMPO}
            >
              {ESTADOS.map((estado) => (
                <option key={estado.valor} value={estado.valor}>
                  {estado.etiqueta}
                </option>
              ))}
            </select>
          )}
        </Campo>

        <div className="flex flex-col @min-[22rem]:flex-row @min-[22rem]:justify-end">
          <Boton ref={refEnviar} type="submit" ocupado={guardando} className="w-full @min-[22rem]:w-auto">
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear ficha'}
          </Boton>
        </div>
      </form>
    </Dialogo>
  )
}
