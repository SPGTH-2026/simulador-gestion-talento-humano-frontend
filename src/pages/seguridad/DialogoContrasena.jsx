import Boton from '../../components/ui/Boton'
import Dialogo from '../../components/ui/Dialogo'
import Icono from '../../components/ui/Icono'
import { MensajeExito } from '../../components/ui/Mensaje'
import { CLASE_TEXTO_SUAVE } from '../../lib/estilos'
import FormularioContrasena from './FormularioContrasena'
import { ACCIONES, EXPLICACIONES, useSeguridadCuenta } from './useSeguridadCuenta'

const ID_TITULO = 'dialogo-contrasena-titulo'
const ID_DESCRIPCION = 'dialogo-contrasena-descripcion'

// «Contraseña» de la propia cuenta, en un diálogo: explicación y acción, luego el envío del código y el formulario, todo en la
// misma caja y con el mismo ancho. El estado vive aquí dentro: al cerrar, el diálogo se desmonta y no queda nada escrito ni se
// guarda nada. Mientras hay una petición en curso no se cierra (ni con Escape ni con el fondo) para no perder el resultado.
// Lo usan el menú de usuario (barra superior y cajón móvil) y la ruta /seguridad.
export default function DialogoContrasena({ onCerrar }) {
  const ctx = useSeguridadCuenta()
  const { acceso, paso, refAviso, aviso, abrir, enviando, reenviando } = ctx
  const ocupado = enviando || reenviando
  const accion = ACCIONES[acceso.contrasena] ?? ACCIONES.desconocido
  const explicacion = EXPLICACIONES[acceso.contrasena] ?? EXPLICACIONES.desconocido

  return (
    <Dialogo
      idTitulo={ID_TITULO}
      idDescripcion={paso === 'reposo' ? ID_DESCRIPCION : undefined}
      onCerrar={ocupado ? () => {} : onCerrar}
      className="max-w-md"
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 id={ID_TITULO} className="text-lg font-semibold text-slate-800 dark:text-sena-texto">
            Contraseña
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            disabled={ocupado}
            aria-label="Cerrar"
            className="-mr-2 grid size-11 shrink-0 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-sena-hundido hover:text-sena-azul disabled:cursor-progress disabled:opacity-60 motion-reduce:transition-none dark:text-sena-texto-suave dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Icono nombre="cerrar" />
          </button>
        </div>

        {paso === 'reposo' && (
          <>
            <p id={ID_DESCRIPCION} className={`text-sm ${CLASE_TEXTO_SUAVE}`}>
              {explicacion}
              {acceso.google && ' Podrás seguir accediendo con Google.'}
            </p>
            <Boton onClick={abrir} className="w-full">
              {accion}
            </Boton>
          </>
        )}

        {(paso === 'pedir' || paso === 'codigo') && <FormularioContrasena ctx={ctx} titulo={accion} />}

        {paso === 'listo' && (
          <>
            <div ref={refAviso} tabIndex={-1} className="focus:outline-none">
              <MensajeExito>
                {aviso}
                {acceso.google && ' Puedes seguir entrando con Google.'}
              </MensajeExito>
            </div>
            <Boton variante="contorno" onClick={onCerrar} className="w-full">
              Cerrar
            </Boton>
          </>
        )}
      </div>
    </Dialogo>
  )
}
