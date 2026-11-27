import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'

vi.mock('../../api/archivos', () => ({ obtenerArchivo: vi.fn() }))
vi.mock('../../api/postulacionesDocumentos', () => ({
  dispararDescarga: vi.fn(),
  mensajeErrorBlob: vi.fn(async (e) => e?.mensajeBlob ?? ''),
}))

import { obtenerArchivo } from '../../api/archivos'
import { dispararDescarga } from '../../api/postulacionesDocumentos'
import VisorDocumento from './VisorDocumento'
import Dialogo from './Dialogo'

const pdf = () => new Blob(['%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF'], { type: 'application/octet-stream' })
const html = () => new Blob(['<html><script>alert(1)</script></html>'], { type: 'application/pdf' })

let creadas
let revocadas
beforeEach(() => {
  vi.clearAllMocks()
  creadas = []
  revocadas = []
  let n = 0
  URL.createObjectURL = vi.fn(() => {
    const url = `blob:prueba/${++n}`
    creadas.push(url)
    return url
  })
  URL.revokeObjectURL = vi.fn((url) => revocadas.push(url))
  window.open = vi.fn()
  Object.defineProperty(navigator, 'pdfViewerEnabled', { value: true, configurable: true })
})
afterEach(cleanup)

const abrirVisor = (props = {}) =>
  render(<VisorDocumento ruta="/doc/1" titulo="Cédula" nombre="cedula.pdf" onCerrar={vi.fn()} {...props} />)

describe('VisorDocumento', () => {
  it('muestra la carga y luego el PDF en un iframe, sin abrir pestañas', async () => {
    obtenerArchivo.mockResolvedValue(pdf())
    abrirVisor()
    expect(screen.getByText('Cargando documento…')).toBeTruthy()
    const marco = await screen.findByTitle('Cédula')
    expect(marco.tagName).toBe('IFRAME')
    await waitFor(() => expect(marco.getAttribute('src')).toMatch(/^blob:/))
    expect(screen.getByRole('dialog', { name: 'Cédula' })).toBeTruthy()
    expect(window.open).not.toHaveBeenCalled()
  })

  it('muestra el error del servidor y reintenta', async () => {
    obtenerArchivo.mockRejectedValueOnce({ mensajeBlob: 'El archivo no está disponible.' }).mockResolvedValue(pdf())
    abrirVisor()
    expect(await screen.findByText('El archivo no está disponible.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Abrir en otra pestaña' }).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByTitle('Cédula')).toBeTruthy()
    expect(obtenerArchivo).toHaveBeenCalledTimes(2)
  })

  it('no muestra como PDF algo que no lo es (aunque el servidor diga application/pdf): solo permite descargar', async () => {
    obtenerArchivo.mockResolvedValue(html())
    abrirVisor()
    expect(await screen.findByText(/no es un PDF/)).toBeTruthy()
    expect(screen.queryByTitle('Cédula')).toBeNull()
    expect(screen.getByRole('button', { name: 'Abrir en otra pestaña' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: 'Descargar' }).disabled).toBe(false)
  })

  it('abre en otra pestaña y descarga reutilizando el blob (sin volver a pedirlo)', async () => {
    obtenerArchivo.mockResolvedValue(pdf())
    abrirVisor()
    await screen.findByTitle('Cédula')
    fireEvent.click(screen.getByRole('button', { name: 'Abrir en otra pestaña' }))
    fireEvent.click(screen.getByRole('button', { name: 'Abrir en otra pestaña' }))
    expect(window.open).toHaveBeenCalledTimes(2)
    // La URL de la pestaña se crea una vez y se reutiliza.
    expect(window.open.mock.calls[0][0]).toBe(window.open.mock.calls[1][0])
    fireEvent.click(screen.getByRole('button', { name: 'Descargar' }))
    expect(dispararDescarga).toHaveBeenCalledWith(expect.any(Blob), 'cedula.pdf')
    expect(obtenerArchivo).toHaveBeenCalledTimes(1)
  })

  it('al cerrar libera la URL del iframe pero no la de la pestaña ya abierta', async () => {
    obtenerArchivo.mockResolvedValue(pdf())
    const { unmount } = abrirVisor()
    const marco = await screen.findByTitle('Cédula')
    await waitFor(() => expect(marco.getAttribute('src')).toMatch(/^blob:/))
    const urlIframe = marco.getAttribute('src')
    fireEvent.click(screen.getByRole('button', { name: 'Abrir en otra pestaña' }))
    const urlPestana = window.open.mock.calls[0][0]
    expect(urlPestana).not.toBe(urlIframe)
    unmount()
    expect(revocadas).toContain(urlIframe)
    expect(revocadas).not.toContain(urlPestana)
  })

  it('cancela la petición al cerrar y descarta una respuesta de un documento anterior', async () => {
    let resolverPrimero
    obtenerArchivo.mockImplementationOnce(() => new Promise((r) => { resolverPrimero = r }))
    obtenerArchivo.mockResolvedValueOnce(pdf())
    const { rerender } = abrirVisor({ ruta: '/doc/1', titulo: 'Primero' })
    const señal = obtenerArchivo.mock.calls[0][1].signal
    rerender(<VisorDocumento ruta="/doc/2" titulo="Segundo" nombre="b.pdf" onCerrar={vi.fn()} />)
    expect(señal.aborted).toBe(true)
    expect(await screen.findByTitle('Segundo')).toBeTruthy()
    resolverPrimero(pdf())
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.queryByTitle('Primero')).toBeNull()
    expect(screen.getByTitle('Segundo')).toBeTruthy()
  })

  it('sin visor de PDF integrado avisa y ofrece alternativas; solo lo muestra si el usuario lo pide', async () => {
    Object.defineProperty(navigator, 'pdfViewerEnabled', { value: false, configurable: true })
    obtenerArchivo.mockResolvedValue(pdf())
    abrirVisor()
    expect(await screen.findByText(/no muestra PDF dentro de la página/)).toBeTruthy()
    expect(screen.queryByTitle('Cédula')).toBeNull()
    expect(screen.getByRole('button', { name: 'Abrir en otra pestaña' }).disabled).toBe(false)
    expect(window.open).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Intentar mostrarlo aquí' }))
    expect(await screen.findByTitle('Cédula')).toBeTruthy()
  })
})

describe('VisorDocumento: cabecera y foco', () => {
  it('muestra la etiqueta del documento como título y el nombre del archivo debajo, sin repetir ni inventar', async () => {
    obtenerArchivo.mockResolvedValue(pdf())
    const { unmount } = abrirVisor({ titulo: 'Documento de identidad', nombre: 'cedula.pdf' })
    expect(screen.getByRole('dialog', { name: 'Documento de identidad' })).toBeTruthy()
    expect(screen.getByText('cedula.pdf')).toBeTruthy()
    unmount()
    abrirVisor({ titulo: 'cedula.pdf', nombre: 'cedula.pdf' })
    expect(screen.getAllByText('cedula.pdf')).toHaveLength(1)
    cleanup()
    abrirVisor({ titulo: undefined, nombre: 'solo.pdf' })
    expect(screen.getByRole('dialog', { name: 'solo.pdf' })).toBeTruthy()
  })

  it('«Cerrar» es el botón principal y recibe el foco inicial', () => {
    obtenerArchivo.mockReturnValue(new Promise(() => {}))
    abrirVisor()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cerrar visor' }))
  })

  it('si el visor nativo toma el foco justo al cargar, lo devuelve a «Cerrar» una sola vez; después no compite con el usuario', async () => {
    obtenerArchivo.mockResolvedValue(pdf())
    abrirVisor()
    const marco = await screen.findByTitle('Cédula')
    await waitFor(() => expect(marco.getAttribute('src')).toMatch(/^blob:/)) // los efectos del visor ya corrieron
    marco.setAttribute('tabindex', '0')
    marco.focus()
    window.dispatchEvent(new Event('blur'))
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cerrar visor' }))
    // Una segunda entrada al PDF (intencional) ya no se toca.
    marco.focus()
    window.dispatchEvent(new Event('blur'))
    expect(document.activeElement).toBe(marco)
  })

  it('pasados 3 s, un foco dentro del PDF es del usuario y no se recupera', async () => {
    obtenerArchivo.mockResolvedValue(pdf())
    abrirVisor()
    const marco = await screen.findByTitle('Cédula')
    await waitFor(() => expect(marco.getAttribute('src')).toMatch(/^blob:/)) // los efectos del visor ya corrieron
    marco.setAttribute('tabindex', '0')
    const ahora = Date.now()
    const espia = vi.spyOn(Date, 'now').mockReturnValue(ahora + 5000)
    marco.focus()
    window.dispatchEvent(new Event('blur'))
    expect(document.activeElement).toBe(marco)
    espia.mockRestore()
  })
})

describe('VisorDocumento: nombres largos', () => {
  it('ofrece «Ver más» solo cuando algo se recorta y lo despliega por clic/teclado', async () => {
    obtenerArchivo.mockReturnValue(new Promise(() => {}))
    abrirVisor({ titulo: 'Título corto', nombre: 'a.pdf' })
    expect(screen.queryByRole('button', { name: 'Ver más' })).toBeNull()
    cleanup()

    const ancho = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth')
    Object.defineProperty(HTMLElement.prototype, 'scrollWidth', { configurable: true, get: () => 900 })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 100 })
    try {
      const largo = 'certificado_sin_espacios_'.repeat(8) + '.pdf'
      abrirVisor({ titulo: 'Título descriptivo', nombre: largo })
      const boton = await screen.findByRole('button', { name: 'Ver más' })
      // Los textos completos están en el DOM aunque se vean recortados (lectores de pantalla).
      expect(screen.getByText(largo)).toBeTruthy()
      expect(boton.getAttribute('aria-expanded')).toBe('false')
      fireEvent.click(boton)
      const menos = screen.getByRole('button', { name: 'Ver menos' })
      expect(menos.getAttribute('aria-expanded')).toBe('true')
      expect(screen.getByText(largo).className).not.toMatch(/truncate/)
    } finally {
      if (ancho) Object.defineProperty(HTMLElement.prototype, 'scrollWidth', ancho)
      else delete HTMLElement.prototype.scrollWidth
      delete HTMLElement.prototype.clientWidth
    }
  })
})

describe('VisorDocumento dentro de otro diálogo', () => {
  function Anfitrion({ alCerrarPadre }) {
    const [visor, setVisor] = useState(false)
    return (
      <Dialogo idTitulo="t" onCerrar={alCerrarPadre}>
        <h2 id="t">Padre</h2>
        <input aria-label="Observación" defaultValue="" />
        <button onClick={() => setVisor(true)}>Ver</button>
        {visor && <VisorDocumento ruta="/doc/1" titulo="Hijo" onCerrar={() => setVisor(false)} />}
      </Dialogo>
    )
  }

  it('Escape cierra solo el visor, el foco vuelve a «Ver» y lo escrito se conserva; el siguiente Escape cierra el padre', async () => {
    obtenerArchivo.mockResolvedValue(pdf())
    const alCerrarPadre = vi.fn()
    render(<Anfitrion alCerrarPadre={alCerrarPadre} />)
    fireEvent.change(screen.getByLabelText('Observación'), { target: { value: 'texto a medias' } })
    const ver = screen.getByRole('button', { name: 'Ver' })
    ver.focus()
    fireEvent.click(ver)
    await screen.findByTitle('Hijo')

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => expect(screen.queryByTitle('Hijo')).toBeNull())
    expect(alCerrarPadre).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(ver)
    expect(screen.getByLabelText('Observación').value).toBe('texto a medias')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(alCerrarPadre).toHaveBeenCalledTimes(1)
  })
})
