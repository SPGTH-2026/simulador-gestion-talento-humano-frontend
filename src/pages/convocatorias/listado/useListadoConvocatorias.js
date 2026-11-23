import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../auth/useAuth'
import { veIdentificador } from '../../../lib/convocatorias'
import { useFiltrosListado } from './useFiltrosListado'
import { useDatosListado } from './useDatosListado'
import { useAccionesConvocatoria } from './useAccionesConvocatoria'

// Lógica del listado de convocatorias, en tres piezas: filtros (URL), datos (consulta) y acciones
// (cambiar estado). Devuelve un único objeto (ctx) que usan la página y sus subcomponentes.
export function useListadoConvocatorias() {
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const gestiona = can('convocatorias:gestionar')
  // El filtro por ficha solo lo ve quien puede listar fichas: super admin e
  // instructor ('usuarios:gestionar'). Un gestor de convocatorias sin ese
  // permiso no puede pedir GET /api/fichas y no debe ver el selector.
  const puedeFiltrarFicha = gestiona && can('usuarios:gestionar')
  // El aspirante ve una sola acción por tarjeta: "Ver información" (navega al
  // detalle siempre; el 404 de las no publicadas lo absorbe la vista).
  const esAspirante = user?.role === 'aspirante'
  // Gestión REAL: permiso + lista blanca (instructor, super admin y el subrol
  // gestor_convocatorias). El aprendiz con subrol 'general' tiene el permiso
  // 'convocatorias:gestionar' pero NO es gestión. Decide dos cosas:
  //  - el identificador (CONV-AAAA-NNN), dato de gestión;
  //  - qué estados ve la lista: las cerradas solo las ve la gestión.
  const gestionaEstricto = veIdentificador(user, can)
  const filtros = useFiltrosListado()
  const datos = useDatosListado(filtros, puedeFiltrarFicha)
  const acciones = useAccionesConvocatoria({ opcionesEstado: datos.opcionesEstado, setRecarga: datos.setRecarga })

  return { navigate, esAspirante, gestiona, gestionaEstricto, puedeFiltrarFicha, ...filtros, ...datos, ...acciones }
}
