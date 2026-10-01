// Marco centrado de las pantallas públicas (login, registro, recuperación).
// `marca="sena"` viste la pantalla con la paleta del Manual de Identidad Visual
// SENA 2024 (tokens en src/index.css). Sin marca mantiene el estilo neutro.
export default function TarjetaAuth({ children, marca }) {
  const esSena = marca === 'sena'

  return (
    <div
      className={`flex min-h-screen items-center justify-center p-4 ${
        esSena ? 'bg-sena-cielo/30' : 'bg-slate-100'
      }`}
    >
      <div
        className={`w-full max-w-md rounded-lg bg-white ${
          esSena ? 'overflow-hidden shadow-lg' : 'p-8 shadow'
        }`}
      >
        {/* Franja con el verde institucional del logosímbolo SENA */}
        {esSena && <div className="h-2 bg-sena" />}

        <div className={esSena ? 'p-8' : ''}>
          <h1
            className={`mb-1 text-center text-2xl font-bold ${
              esSena ? 'text-sena-azul' : ''
            }`}
          >
            SPGTH
          </h1>
          <p
            className={`mb-6 text-center text-sm ${
              esSena ? 'text-sena-azul/70' : 'text-slate-500'
            }`}
          >
            Simulador de Procesos de Gestión de Talento Humano
          </p>
          {children}
        </div>
      </div>
    </div>
  )
}