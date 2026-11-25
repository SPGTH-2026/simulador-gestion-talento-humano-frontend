import client from './client'

// Departamentos y municipios de Colombia (DIVIPOLA, DANE). Solo lectura; los pide el formulario de datos personales.

// GET /api/ubicaciones/departamentos  ->  { data: [ { codigo: '05', nombre: 'Antioquia' } ] }  (33, por nombre)
export const listaDepartamentos = () =>
  client.get('/ubicaciones/departamentos').then((res) => res.data.data)

// GET /api/ubicaciones/departamentos/{codigo}/municipios  ->  { data: [ { codigo: '05001', nombre: 'Medellín', tipo } ] }
// Un departamento que no existe responde 404.
export const listaMunicipios = (departamento) =>
  client.get(`/ubicaciones/departamentos/${departamento}/municipios`).then((res) => res.data.data)
