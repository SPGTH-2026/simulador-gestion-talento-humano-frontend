import { describe, it, expect, vi, afterEach } from 'vitest'
import { dispararDescarga } from './postulacionesDocumentos'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('dispararDescarga', () => {
  it('no libera la URL en el mismo tick del clic (algunos navegadores cancelan la descarga)', () => {
    vi.useFakeTimers()
    const revocar = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:prueba')
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    dispararDescarga(new Blob(['x']), 'hoja.pdf')

    expect(revocar).not.toHaveBeenCalled()
    vi.advanceTimersByTime(60000)
    expect(revocar).toHaveBeenCalledWith('blob:prueba')
  })
})
