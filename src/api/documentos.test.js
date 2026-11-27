import { describe, it, expect, vi } from 'vitest'

vi.mock('./client', () => ({ default: { get: vi.fn() } }))

import client from './client'
import { listaDocumentos } from './documentos'

describe('listaDocumentos', () => {
  it('convierte cada documento de la postulación con su peso, obligatoriedad y archivo', async () => {
    client.get.mockResolvedValue({
      data: {
        data: {
          documentos: [
            { parametro: { id: 1, nombre: 'Hoja de vida' }, obligatorio: true, ponderacion: 60, estado: 'subido', archivo: { id: 9 } },
            { parametro: { id: 2, nombre: 'Tarjeta profesional' }, obligatorio: false, ponderacion: null, estado: 'pendiente', archivo: null },
          ],
          skills: [],
        },
      },
    })

    const { data } = await listaDocumentos(5)

    expect(data).toEqual([
      { id: 'doc-1', nombre: 'Hoja de vida', tipo: 'documento', ponderacion: 60, obligatorio: true, estado: 'subido', archivo: { id: 9 }, items: [] },
      { id: 'doc-2', nombre: 'Tarjeta profesional', tipo: 'documento', ponderacion: null, obligatorio: false, estado: 'pendiente', archivo: null, items: [] },
    ])
  })
})
