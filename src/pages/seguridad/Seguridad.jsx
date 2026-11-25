import { useLocation, useNavigate } from 'react-router-dom'
import DialogoContrasena from './DialogoContrasena'

// Enlace directo a la contraseña de la cuenta (/seguridad): abre el MISMO diálogo que el menú de usuario, sin otra
// implementación. Al cerrarlo vuelve a donde estaba la persona, o al inicio si entró directamente por el enlace.
export default function Seguridad() {
  const navigate = useNavigate()
  const { key } = useLocation()
  const cerrar = () => (key === 'default' ? navigate('/', { replace: true }) : navigate(-1))

  return <DialogoContrasena onCerrar={cerrar} />
}
