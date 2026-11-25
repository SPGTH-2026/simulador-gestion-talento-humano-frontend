import { describe, it, expect, vi } from 'vitest'

vi.mock('./client', () => ({ default: { get: vi.fn() } }))

import client from './client'
import { listaDocumentos } from './documentos'

describe('listaDocumentos', () => {
  it('marca la autorización de un menor como requisito por edad y sin porcentaje', async () => {
    client.get.mockResolvedValue({
      data: {
        data: {
          documentos: [
            { parametro: { id: 1, nombre: 'Hoja de vida' }, obligatorio: true, ponderacion: 60, estado: 'subido', archivo: { id: 9 } },
            {
              parametro: { id: 7, nombre: 'Autorización del representante legal' },
              obligatorio: true,
              requisito_edad: true,
              ponderacion: null,
              estado: 'pendiente',
              archivo: null,
            },
          ],
          skills: [],
        },
      },
    })

    const { data } = await listaDocumentos(5)

    expect(data.find((d) => d.id === 'doc-1').requisitoEdad).toBe(false)
    const autorizacion = data.find((d) => d.id === 'doc-7')
    expect(autorizacion.requisitoEdad).toBe(true)
    expect(autorizacion.ponderacion).toBeNull()
  })
})
