import { describe, it, expect } from 'vitest'
import { MOTIVO_SIN_ELIMINAR, MOTIVO_SOLO_MARCADOS, reglasCorreccionDocumento } from './reglasCorreccionDocumentos'

describe('reglasCorreccionDocumento', () => {
  it('fuera de una corrección no bloquea nada', () => {
    expect(reglasCorreccionDocumento({ bloqueoCorreccion: false, marcado: false })).toEqual({
      bloqueadoReemplazo: false,
      motivoReemplazo: '',
      eliminarBloqueado: false,
      motivoEliminar: '',
    })
  })

  it('con corrección vigente, un documento no marcado no se reemplaza ni se elimina, y se explica por qué', () => {
    const r = reglasCorreccionDocumento({ bloqueoCorreccion: true, marcado: false })
    expect(r.bloqueadoReemplazo).toBe(true)
    expect(r.motivoReemplazo).toBe(MOTIVO_SOLO_MARCADOS)
    expect(r.eliminarBloqueado).toBe(true)
    expect(r.motivoEliminar).toBe(MOTIVO_SOLO_MARCADOS)
  })

  it('con corrección vigente, un documento marcado se reemplaza pero no se elimina', () => {
    const r = reglasCorreccionDocumento({ bloqueoCorreccion: true, marcado: true })
    expect(r.bloqueadoReemplazo).toBe(false)
    expect(r.motivoReemplazo).toBe('')
    expect(r.eliminarBloqueado).toBe(true)
    expect(r.motivoEliminar).toBe(MOTIVO_SIN_ELIMINAR)
  })
})
