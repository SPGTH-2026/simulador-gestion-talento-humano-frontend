import { useRef } from 'react'
import Boton from '../../components/ui/Boton'
import { EsqueletoTabla } from '../../components/ui/Esqueleto'
import EstadoVacio from '../../components/ui/EstadoVacio'
import Icono from '../../components/ui/Icono'
import { MensajeError, MensajeExito } from '../../components/ui/Mensaje'
import Tarjeta from '../../components/ui/Tarjeta'
import { CLASE_SUBTITULO_PAGINA, CLASE_TITULO_PAGINA } from '../../lib/estilos'
import DialogoFicha from './DialogoFicha'
import DialogoInstructores from './DialogoInstructores'
import TablaFichas from './TablaFichas'
import { useFichasListado } from './useFichasListado'

// Fichas del alcance de quien consulta, en una tabla (con desplazamiento propio si no cabe). Crear y editar van en un diálogo, y los instructores en otro. Es solo
// presentación: las operaciones, los permisos y los textos de las confirmaciones son los de siempre.
export default function FichasListado() {
  const ctx = useFichasListado()
  const { abrirAlta, abrirEdicion, abrirInstructores, alGuardar, aplicarFicha, cargando, cerrarDialogo, dialogo, eliminandoId, eliminar } = ctx
  const { errorAccion, errorCarga, esSuperAdmin, exito, fichaDelDialogo, fichas, pausaExito } = ctx
  const refTitulo = useRef(null)
  const propsAcciones = (ficha) => ({
    esSuperAdmin,
    eliminando: eliminandoId === ficha.id,
    ocupado: eliminandoId !== null,
    onEditar: () => abrirEdicion(ficha),
    onEliminar: () => alEliminar(ficha),
    onInstructores: () => abrirInstructores(ficha),
  })
  // Al eliminar, el botón desaparece con su tarjeta: el foco pasa al título de la página para no perderse.
  const alEliminar = async (ficha) => {
    if (await eliminar(ficha)) refTitulo.current?.focus()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 ref={refTitulo} tabIndex={-1} className={`${CLASE_TITULO_PAGINA} focus:outline-none`}>
            Fichas
          </h1>
          <p className={CLASE_SUBTITULO_PAGINA}>Consulta y gestiona las fichas de formación a las que tienes acceso</p>
        </div>
        <Boton onClick={abrirAlta}>
          <Icono nombre="mas" className="size-5 shrink-0" />
          Nueva ficha
        </Boton>
      </div>

      {exito && (
        <div {...pausaExito}>
          <MensajeExito>{exito.texto}</MensajeExito>
        </div>
      )}
      {errorAccion && <MensajeError>{errorAccion}</MensajeError>}

      {cargando && (
        <EsqueletoTabla
          texto="Cargando fichas…"
          filas={4}
          columnas={7}
          plantilla="grid-cols-[1.4fr_0.7fr_1fr_1fr_1fr_1.2fr_1.6fr]"
          encabezados={['Ficha', 'Estado', 'Creada por', 'Convocatorias', 'Aspirantes y aprendices', 'Instructores', 'Acciones'].map((texto) => ({ texto }))}
        />
      )}

      {!cargando && errorCarga && <MensajeError>{errorCarga}</MensajeError>}

      {!cargando && !errorCarga && fichas.length === 0 && (
        <Tarjeta>
          <EstadoVacio titulo="No hay fichas registradas." />
        </Tarjeta>
      )}

      {!cargando && fichas.length > 0 && <TablaFichas fichas={fichas} acciones={propsAcciones} />}

      {dialogo?.tipo === 'ficha' && <DialogoFicha ficha={dialogo.ficha} onCerrar={cerrarDialogo} onGuardada={alGuardar} />}
      {fichaDelDialogo && (
        <DialogoInstructores ficha={fichaDelDialogo} puedeGestionar={esSuperAdmin} onCerrar={cerrarDialogo} onActualizada={aplicarFicha} />
      )}
    </div>
  )
}
