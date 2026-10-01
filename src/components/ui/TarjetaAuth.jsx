// Marco centrado de las pantallas públicas (login, registro, recuperación).
export default function TarjetaAuth({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-1 text-center text-2xl font-bold">SPGTH</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Simulador de Procesos de Gestión de Talento Humano
        </p>
        {children}
      </div>
    </div>
  )
}