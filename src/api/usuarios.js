import client from './client'

// GET /api/usuarios?search=&ficha_id=&page=  ->  { data: [...], meta: {...} }
// Solo visibles para quien tenga 'usuarios:gestionar' (super admin o instructor).
export const listaUsuarios = (params) =>
  client.get('/usuarios', { params }).then((res) => res.data)

// GET /api/fichas  ->  { data: [ { id, codigo, nombre_programa, estado } ] }
// Devuelve solo las fichas sobre las que el usuario tiene alcance.
export const listaFichas = () => client.get('/fichas').then((res) => res.data)

// PATCH /api/usuarios/{id}
// body { role, subrole, active, ficha_id }  ->  { data: {...} }
// La matriz de roles la aplica el backend y responde 422 si no corresponde.
export const asignarRol = (id, datos) =>
  client.patch(`/usuarios/${id}`, datos).then((res) => res.data)