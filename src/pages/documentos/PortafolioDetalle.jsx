import { useParams } from 'react-router-dom'
import Portafolio from './Portafolio'

export default function PortafolioDetalle() {
  const { userId } = useParams()
  return <Portafolio key={userId} userId={userId} />
}
