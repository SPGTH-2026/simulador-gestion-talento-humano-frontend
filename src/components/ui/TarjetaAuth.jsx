import LogoSena from './LogoSena'
import ThemeToggle from '../ThemeToggle'

// Marco centrado de las pantallas públicas (login, registro, recuperación,
// verificación). Estilo institucional según el Manual de Identidad Visual
// SENA 2024 (paleta en src/index.css, tipografía Work Sans).
export default function TarjetaAuth({ children }) {
  return (
    <div className="auth-fondo flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* El interruptor de tema va en su propia fila sobre el recuadro, no
            flotando en la esquina de la ventana: en móvil el recuadro llega
            hasta arriba y el botón (44 px) tapaba su borde. */}
        <div className="mb-3 flex justify-end">
          <div className="rounded-full bg-white/70 shadow-sm backdrop-blur-sm dark:bg-sena-superficie/70">
            <ThemeToggle />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-sena-azul/10 ring-1 ring-sena-azul/10 dark:bg-sena-superficie dark:shadow-black/40 dark:ring-white/10">
          {/* Franja con el verde institucional del logosímbolo SENA */}
          <div className="h-2 bg-sena" />

          <div className="p-6 sm:p-8">
            {/* El logosímbolo va sobre el texto y no al lado: ya contiene las
                letras SENA, así que en horizontal competirían ambas versiones. */}
            <div className="mb-4 flex justify-center">
              <LogoSena className="size-16 text-sena" />
            </div>

            <h1 className="mb-1 text-center text-2xl font-bold text-sena-azul dark:text-sena-texto">
              SPGTH
            </h1>
            <p className="mb-6 text-center text-sm text-sena-azul/70 dark:text-sena-texto-suave">
              Simulador de Procesos de Gestión de Talento Humano
            </p>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
