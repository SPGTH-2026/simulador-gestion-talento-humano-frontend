import { Component } from 'react'
import Boton from './ui/Boton'
import Icono from './ui/Icono'
import { CLASE_TARJETA, CLASE_TEXTO_FUERTE, CLASE_TEXTO_SUAVE } from '../lib/estilos'

// Barrera de errores de pantalla. Sin ella, una excepción al dibujar cualquier componente desmonta TODA la
// aplicación y el usuario se queda con una página en blanco sin salida.
//
//  - nivel="pantalla" (dentro del marco): solo el contenido muestra el aviso; el menú y la barra siguen en su
//    sitio y 'resetKey' (la ruta) la rearma al navegar a otra pantalla.
//  - nivel="app" (raíz): último recurso, a página completa. No depende del router ni del contexto de sesión.
//
// Los errores de eventos y de promesas no pasan por aquí (React no los entrega a las barreras); esos ya los
// atiende cada pantalla con su propio estado de error.

// Tras publicar una versión nueva, un navegador con la pestaña abierta pide archivos que ya no existen: es el
// único caso en que recargar la página (y no solo reintentar) es la solución.
const esErrorDeVersion = (error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    String(error?.message ?? error),
  )

export default class ErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey }

  static getDerivedStateFromError(error) {
    return { error }
  }

  // Al cambiar 'resetKey' (otra ruta) la barrera se rearma sola.
  static getDerivedStateFromProps(props, state) {
    if (props.resetKey === state.resetKey) return null
    return { error: null, resetKey: props.resetKey }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const deVersion = esErrorDeVersion(error)
    const pantallaCompleta = this.props.nivel === 'app'

    const contenido = (
      <section
        role="alert"
        className={`${CLASE_TARJETA} mx-auto flex w-full max-w-lg flex-col items-center gap-3 px-6 py-10 text-center`}
      >
        <span className="grid size-12 place-items-center rounded-full bg-aviso/10 text-aviso">
          <Icono nombre="alerta" className="size-6" />
        </span>
        <h1 className={`text-lg font-semibold ${CLASE_TEXTO_FUERTE}`}>
          {deVersion ? 'Hay una versión nueva del sistema' : 'Esta pantalla tuvo un problema'}
        </h1>
        <p className={`max-w-sm text-sm ${CLASE_TEXTO_SUAVE}`}>
          {deVersion
            ? 'Recarga la página para continuar. No pierdes ningún dato guardado.'
            : 'No es culpa tuya y tus datos guardados están a salvo. Puedes volver a intentarlo o ir al inicio.'}
        </p>
        <div className="mt-2 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {deVersion ? (
            <Boton tamano="tactil" onClick={() => window.location.reload()}>
              Recargar la página
            </Boton>
          ) : (
            <Boton tamano="tactil" onClick={() => this.setState({ error: null })}>
              Reintentar
            </Boton>
          )}
          {/* Un <a> y no <Link>: la barrera de la raíz vive fuera del router y, al recargar, también se
              descarta cualquier estado dañado. */}
          <Boton as="a" href="/" variante="contorno" tamano="tactil">
            Ir al inicio
          </Boton>
        </div>
      </section>
    )

    return pantallaCompleta ? (
      <main className="alto-minimo-pantalla grid place-items-center bg-sena-lienzo px-4 py-8 dark:bg-sena-noche">
        {contenido}
      </main>
    ) : (
      <div className="py-6">{contenido}</div>
    )
  }
}
