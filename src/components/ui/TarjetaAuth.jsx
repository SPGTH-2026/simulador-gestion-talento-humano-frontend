import LogoSena from './LogoSena'

// Marco centrado de las pantallas públicas (login, registro, recuperación,
// verificación). Estilo institucional según el Manual de Identidad Visual
// SENA 2024 (paleta en src/index.css, tipografía Work Sans).
export default function TarjetaAuth({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sena-cielo/30 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-lg">
        {/* Franja con el verde institucional del logosímbolo SENA */}
        <div className="h-2 bg-sena" />

        <div className="p-8">
          {/* El logosímbolo va sobre el texto y no al lado: ya contiene las
              letras SENA, así que en horizontal competirían ambas versiones. */}
          <div className="mb-5 flex justify-center">
            <LogoSena className="h-16 w-16 text-sena" />
          </div>

          <h1 className="mb-1 text-center text-2xl font-bold text-sena-azul">SPGTH</h1>
          <p className="mb-6 text-center text-sm text-sena-azul/70">
            Simulador de Procesos de Gestión de Talento Humano
          </p>
          {children}
        </div>
      </div>
    </div>
  )
}