import { Link } from 'react-router-dom'
import Boton from '../../components/ui/Boton'

export default function Forbidden() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-5xl font-bold text-slate-800 dark:text-sena-texto">403</h1>
      <p className="text-lg text-slate-600 dark:text-sena-texto-suave">
        No tienes permiso para ver esta página.
      </p>
      <Boton as={Link} to="/">
        Volver al inicio
      </Boton>
    </div>
  )
}
