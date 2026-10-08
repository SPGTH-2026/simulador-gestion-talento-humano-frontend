import LogoSena from './LogoSena'
import ThemeToggle from '../ThemeToggle'

// Marco centrado de las pantallas públicas (login, registro, recuperación,
// verificación). Estilo institucional según el Manual de Identidad Visual
// SENA 2024 (paleta en src/index.css, tipografía Work Sans).
export default function TarjetaAuth({ children }) {
  return (
    <div className="auth-fondo relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute right-4 top-4 z-10 rounded-full bg-white/70 shadow-sm backdrop-blur-sm dark:bg-sena-superficie/70">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-sena-azul/10 dark:bg-sena-superficie dark:ring-white/5">
        {/* Franja con el verde institucional del logosímbolo SENA */}
        <div className="h-2 bg-sena" />

        <div className="p-8">
          {/* El logosímbolo va sobre el texto y no al lado: ya contiene las
              letras SENA, así que en horizontal competirían ambas versiones. */}
          <div className="mb-5 flex justify-center">
            <LogoSena className="h-16 w-16 text-sena" />
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
  )
}