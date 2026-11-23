import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'

// El encabezado del paso dice «Paso N de 6 · descripción»; la barra de pasos repite el número, así que se mira la frase completa.
const enPaso = (n) => waitFor(() => expect(document.body.textContent).toContain(`Paso ${n} de 6 ·`))

// Red de seguridad para partir el asistente: monta el formulario completo y recorre sus seis etapas. Si una etapa usa un
// nombre que ya no existe, el render falla aquí (el lint no lo detecta).
vi.mock('../../api/convocatorias', () => ({
  listaParametros: vi.fn(async () => ({ data: [] })),
  crearDocumentoCatalogo: vi.fn(),
}))
vi.mock('../../api/fichas', () => ({
  listaFichas: vi.fn(async () => ({ data: [] })),
}))

import ConvocatoriaWizard from './ConvocatoriaWizard'

afterEach(cleanup)

// jsdom no implementa scrollIntoView; el asistente lo usa al cambiar de etapa. Es un hueco del entorno, no del componente.
Element.prototype.scrollIntoView = function () {}

describe('ConvocatoriaWizard', () => {
  it('recorre las seis etapas sin errores', async () => {
    render(<ConvocatoriaWizard onGuardar={() => {}} onPublicar={() => {}} onVolver={() => {}} />)

    await enPaso(1)

    for (const paso of [2, 3, 4, 5, 6]) {
      fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
      await enPaso(paso)
    }
  })

  it('vuelve hacia atrás por las etapas', async () => {
    render(<ConvocatoriaWizard onGuardar={() => {}} onPublicar={() => {}} onVolver={() => {}} />)
    await enPaso(1)

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))
    await enPaso(3)

    fireEvent.click(screen.getByRole('button', { name: /anterior/i }))
    await enPaso(2)
  })
})
