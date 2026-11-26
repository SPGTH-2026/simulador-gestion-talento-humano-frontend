import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LayoutInformativo from '../../layouts/LayoutInformativo'
import AcercaDe from './AcercaDe'
import Terminos from './Terminos'
import Privacidad from './Privacidad'
import Cookies from './Cookies'
import InformacionLegal from './InformacionLegal'
import { EnlacesUsuario, PieLegal } from '../../components/informativo/EnlacesLegales'

let usuario = null
vi.mock('../../auth/useAuth', () => ({
  useAuth: () => ({ user: usuario, authResolved: true, errorRed: '', can: () => false }),
}))

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
  vi.resetModules()
})
beforeEach(() => {
  usuario = null
  window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }))
})

// El router decide en su carga si las páginas existen: cada caso lo importa de nuevo con la bandera que corresponde.
async function abrir(ruta, bandera) {
  if (bandera !== undefined) vi.stubEnv('VITE_PAGINAS_INFORMATIVAS', bandera)
  vi.resetModules()
  const { default: AppRouter } = await import('../../router')
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AppRouter />
    </MemoryRouter>,
  )
}

const RUTAS = ['/acerca-de', '/terminos', '/privacidad', '/cookies', '/informacion-legal']
const PAGINAS = { '/acerca-de': AcercaDe, '/terminos': Terminos, '/privacidad': Privacidad, '/cookies': Cookies, '/informacion-legal': InformacionLegal }

// Las páginas se prueban dentro de su marco real sin cargar el router completo (más rápido); el router solo se prueba en la
// puerta de activación.
function abrirPagina(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route element={<LayoutInformativo />}>
          {RUTAS.map((r) => {
            const Pagina = PAGINAS[r]
            return <Route key={r} path={r} element={<Pagina />} />
          })}
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('páginas informativas: desactivadas por defecto', () => {
  // Sin sesión, una ruta que no existe termina en el acceso: lo importante es que no aparezca nada de las páginas informativas.
  it.each(['', 'false', 'TRUE'])('con la bandera %j no existe la ruta, su contenido ni los accesos', async (valor) => {
    await abrir('/privacidad', valor ?? '')
    expect(await screen.findByRole('heading', { name: /Iniciar sesión|Bienvenid/i }, { timeout: 15000 })).toBeTruthy()
    expect(screen.queryByText(/Vista de revisión local/)).toBeNull()
    expect(screen.queryByRole('heading', { level: 1, name: /Privacidad y datos personales/ })).toBeNull()
    // El acceso (inicio de sesión) no muestra enlaces legales sin la bandera.
    expect(screen.queryByRole('navigation', { name: 'Información legal' })).toBeNull()
  }, 30000)
})

describe('páginas informativas: activadas para revisión', () => {
  it('con la bandera exactamente en «true» el router sirve la página y el acceso muestra el pie legal', async () => {
    await abrir('/login', 'true')
    const pie = await screen.findByRole('navigation', { name: 'Información legal' }, { timeout: 15000 })
    expect(within(pie).getAllByRole('link').map((a) => a.textContent)).toEqual(['Términos de uso', 'Privacidad y datos personales', 'Cookies', 'Acerca de SPGTH'])
    cleanup()
    await abrir('/cookies', 'true')
    expect(await screen.findByRole('heading', { level: 1, name: 'Cookies' }, { timeout: 15000 })).toBeTruthy()
  }, 40000)

  it.each([
    ['/acerca-de', 'Acerca de SPGTH'],
    ['/terminos', 'Términos de uso'],
    ['/privacidad', 'Privacidad y datos personales'],
    ['/cookies', 'Cookies'],
    ['/informacion-legal', 'Información legal'],
  ])('%s se muestra con su título, sin etiquetas de desarrollo y con el acceso para volver o iniciar sesión', async (ruta, titulo) => {
    abrirPagina(ruta)
    expect(await screen.findByRole('heading', { level: 1, name: titulo }, { timeout: 15000 })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Volver' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' }).getAttribute('href')).toBe('/login')
    const pie = screen.getByRole('navigation', { name: 'Información' })
    expect(within(pie).getAllByRole('link')).toHaveLength(4)
    // Nada de lo interno llega a la presentación.
    expect(document.body.textContent).not.toMatch(/Verificado en el código|Confirmado por el equipo|Borrador|Dato pendiente|Datos por completar|\[ /)
  })

  it('con sesión iniciada el acceso lleva al inicio', async () => {
    usuario = { id: 1, role: 'aspirante', email_verified: true }
    abrirPagina('/privacidad')
    await screen.findByRole('heading', { level: 1, name: 'Privacidad y datos personales' }, { timeout: 15000 })
    expect(screen.getByRole('link', { name: 'Ir al inicio' }).getAttribute('href')).toBe('/')
  })

  it.each(RUTAS.slice(0, 4))('%s: el índice enlaza con secciones que existen y no hay plazos ni garantías inventados', async (ruta) => {
    abrirPagina(ruta)
    await screen.findByRole('heading', { level: 1 }, { timeout: 15000 })
    const [indice] = screen.getAllByRole('navigation', { name: /En esta página|Índice de la página/ })
    for (const enlace of within(indice).getAllByRole('link')) {
      expect(document.getElementById(enlace.getAttribute('href').slice(1))).not.toBeNull()
    }
    expect(document.body.textContent).not.toMatch(/días hábiles|garantizamos|100 ?% seguro|totalmente seguro/i)
  })
})

describe('páginas informativas: contenido confirmado', () => {
  it('Acerca de y Términos: proyecto académico de simulación hasta la decisión, documentos reales y ficticios, menores y entrega a las dos personas', async () => {
    abrirPagina('/acerca-de')
    await screen.findByRole('heading', { level: 1, name: 'Acerca de SPGTH' }, { timeout: 15000 })
    const texto = document.body.textContent
    expect(texto).toMatch(/proyecto académico de simulación/)
    expect(texto).toMatch(/decisión de selección/)
    expect(texto).toMatch(/documentos reales y ficticios/)
    expect(texto).toMatch(/menores de edad/)
    expect(texto).toMatch(/Edna Margarita Correa y Jarvison Aguilar Uribe recibirán el sistema y las cuentas/)
    expect(texto).toMatch(/Algunos procesos se conservarán para consulta/)
    expect(screen.getAllByRole('link', { name: 'spgth2026@gmail.com' })[0].getAttribute('href')).toBe('mailto:spgth2026@gmail.com')
    // La declaración del proyecto y el contacto están también en el pie común, junto a la marca.
    expect(screen.getByRole('contentinfo').textContent).toMatch(/proyecto académico de simulación/)
    expect(screen.getByRole('link', { name: 'SPGTH: ir al inicio' })).toBeTruthy()
    cleanup()
    abrirPagina('/terminos')
    await screen.findByRole('heading', { level: 1, name: 'Términos de uso' }, { timeout: 15000 })
    expect(document.body.textContent).toMatch(/no elimina cuentas ni documentos de forma automática/)
    expect(document.body.textContent).not.toMatch(/Jarvinson/)
  })

  it('Privacidad: datos, accesos por permiso, menores, derechos con la SIC, conservación y sin responsabilidad jurídica atribuida', async () => {
    abrirPagina('/privacidad')
    await screen.findByRole('heading', { level: 1, name: 'Privacidad y datos personales' }, { timeout: 15000 })
    const texto = document.body.textContent
    expect(texto).toMatch(/documentos reales y ficticios/)
    expect(texto).toMatch(/Si eres menor de edad/)
    expect(texto).not.toMatch(/1[67] años|desde los 16/)
    expect(texto).toMatch(/aprendices autorizados \(subrol general o evaluador\)/)
    expect(texto).toMatch(/Superintendencia de Industria y Comercio/)
    expect(texto).toMatch(/no elimina cuentas ni documentos de forma automática/)
    expect(texto).not.toMatch(/responsable del tratamiento|responsabilidad jurídica|Edna|Jarvison/i)
    expect(screen.getAllByRole('link', { name: 'spgth2026@gmail.com' }).length).toBeGreaterThan(0)
  })
})

describe('accesos visibles a las páginas informativas', () => {
  const dentro = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

  it('el pie de acceso separa «Acerca de SPGTH» de los textos legales y solo existe con la bandera', () => {
    vi.stubEnv('VITE_PAGINAS_INFORMATIVAS', 'true')
    dentro(<PieLegal />)
    const pie = screen.getByRole('navigation', { name: 'Información legal' })
    expect(within(pie).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/terminos', '/privacidad', '/cookies', '/acerca-de'])
    cleanup()
    vi.stubEnv('VITE_PAGINAS_INFORMATIVAS', '')
    const { container } = dentro(<PieLegal />)
    expect(container.textContent).toBe('')
  })

  it('en el área de usuario hay «Información legal» y «Acerca de SPGTH», no como módulos del menú, y se cierra el cajón al navegar', () => {
    vi.stubEnv('VITE_PAGINAS_INFORMATIVAS', 'true')
    const alNavegar = vi.fn()
    dentro(<EnlacesUsuario onNavegar={alNavegar} />)
    expect(screen.getByRole('link', { name: 'Información legal' }).getAttribute('href')).toBe('/informacion-legal')
    const acerca = screen.getByRole('link', { name: 'Acerca de SPGTH' })
    expect(acerca.getAttribute('href')).toBe('/acerca-de')
    acerca.click()
    expect(alNavegar).toHaveBeenCalled()
    cleanup()
    vi.stubEnv('VITE_PAGINAS_INFORMATIVAS', 'false')
    const { container } = dentro(<EnlacesUsuario />)
    expect(container.textContent).toBe('')
  })
})

describe('botón flotante «Volver arriba»', () => {
  const desplazar = (y) => {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })
  }
  afterEachRestaurar()

  function afterEachRestaurar() {
    afterEach(() => {
      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    })
  }

  it('aparece solo tras desplazarse una pantalla, con nombre accesible y área de 44 px', async () => {
    abrirPagina('/terminos')
    await screen.findByRole('heading', { level: 1, name: 'Términos de uso' }, { timeout: 15000 })
    expect(screen.queryByRole('button', { name: 'Volver arriba' })).toBeNull()
    desplazar(200)
    expect(screen.queryByRole('button', { name: 'Volver arriba' })).toBeNull()
    desplazar(window.innerHeight * 2)
    const boton = screen.getByRole('button', { name: 'Volver arriba' })
    expect(boton.className).toMatch(/size-11/)
    desplazar(0)
    expect(screen.queryByRole('button', { name: 'Volver arriba' })).toBeNull()
  })

  it('al volver a la parte alta sale con su animación (inaccesible mientras tanto) y luego se retira; con movimiento reducido se retira al instante', async () => {
    abrirPagina('/terminos')
    await screen.findByRole('heading', { level: 1, name: 'Términos de uso' }, { timeout: 15000 })
    desplazar(window.innerHeight * 2)
    expect(screen.getByRole('button', { name: 'Volver arriba' }).className).toMatch(/boton-subir/)
    desplazar(0)
    const saliendo = document.querySelector('button[aria-label="Volver arriba"]')
    expect(saliendo).not.toBeNull()
    expect(saliendo.className).toMatch(/boton-baja/)
    expect(saliendo.getAttribute('aria-hidden')).toBe('true')
    expect(saliendo.getAttribute('tabindex')).toBe('-1')
    await waitFor(() => expect(document.querySelector('button[aria-label="Volver arriba"]')).toBeNull(), { timeout: 2000 })
    // Si vuelve a aparecer mientras se retiraba, no se queda a medias.
    desplazar(window.innerHeight * 2)
    expect(screen.getByRole('button', { name: 'Volver arriba' }).className).toMatch(/boton-subir/)
    cleanup()
    desplazar(0)
    const original = window.matchMedia
    window.matchMedia = (q) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })
    abrirPagina('/cookies')
    await screen.findByRole('heading', { level: 1, name: 'Cookies' }, { timeout: 15000 })
    desplazar(window.innerHeight * 2)
    desplazar(0)
    expect(document.querySelector('button[aria-label="Volver arriba"]')).toBeNull()
    window.matchMedia = original
  })

  it('al activarlo sube con desplazamiento suave y lleva el foco al título sin otro salto', async () => {
    window.scrollTo = vi.fn()
    abrirPagina('/privacidad')
    const titulo = await screen.findByRole('heading', { level: 1, name: 'Privacidad y datos personales' }, { timeout: 15000 })
    desplazar(window.innerHeight * 2)
    fireEvent.click(screen.getByRole('button', { name: 'Volver arriba' }))
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    expect(document.activeElement).toBe(titulo)
  })

  it('con movimiento reducido el desplazamiento es instantáneo', async () => {
    window.scrollTo = vi.fn()
    const original = window.matchMedia
    window.matchMedia = (q) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} })
    abrirPagina('/cookies')
    await screen.findByRole('heading', { level: 1, name: 'Cookies' }, { timeout: 15000 })
    desplazar(window.innerHeight * 2)
    fireEvent.click(screen.getByRole('button', { name: 'Volver arriba' }))
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
    window.matchMedia = original
  })

  it('retira sus listeners al desmontar', async () => {
    const quitar = vi.spyOn(window, 'removeEventListener')
    const { unmount } = abrirPagina('/terminos')
    await screen.findByRole('heading', { level: 1, name: 'Términos de uso' }, { timeout: 15000 })
    unmount()
    const tipos = quitar.mock.calls.map((c) => c[0])
    expect(tipos).toContain('scroll')
    expect(tipos).toContain('resize')
    quitar.mockRestore()
  })
})
