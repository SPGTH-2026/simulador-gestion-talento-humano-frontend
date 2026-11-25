import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LayoutInformativo from '../../layouts/LayoutInformativo'
import AcercaDe from './AcercaDe'
import Terminos from './Terminos'
import Privacidad from './Privacidad'
import Cookies from './Cookies'

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

const RUTAS = ['/acerca-de', '/terminos', '/privacidad', '/cookies']
const PAGINAS = { '/acerca-de': AcercaDe, '/terminos': Terminos, '/privacidad': Privacidad, '/cookies': Cookies }

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
  it.each(['', 'false', 'TRUE'])('con la bandera %j no existe la ruta ni su contenido', async (valor) => {
    await abrir('/privacidad', valor ?? '')
    expect(await screen.findByRole('heading', { name: /Iniciar sesión|Bienvenid/i }, { timeout: 15000 })).toBeTruthy()
    expect(screen.queryByText(/Vista de revisión local/)).toBeNull()
    expect(screen.queryByRole('heading', { level: 1, name: /Privacidad y tratamiento/ })).toBeNull()
    expect(document.body.textContent).not.toMatch(/Datos por completar|Dato pendiente/)
  }, 30000)
})

describe('páginas informativas: activadas para revisión', () => {
  it('con la bandera exactamente en «true» el router sirve la página', async () => {
    await abrir('/cookies', 'true')
    expect(await screen.findByRole('heading', { level: 1, name: 'Información sobre cookies' }, { timeout: 15000 })).toBeTruthy()
  }, 30000)

  it.each([
    ['/acerca-de', 'Acerca de SPGTH'],
    ['/terminos', 'Términos de uso'],
    ['/privacidad', 'Privacidad y tratamiento de datos'],
    ['/cookies', 'Información sobre cookies'],
  ])('%s se muestra con su título, el aviso de borrador y el acceso para volver o iniciar sesión', async (ruta, titulo) => {
    abrirPagina(ruta)
    expect(await screen.findByRole('heading', { level: 1, name: titulo }, { timeout: 15000 })).toBeTruthy()
    expect(screen.getByRole('note').textContent).toMatch(/Vista de revisión local/)
    expect(screen.getByRole('button', { name: 'Volver' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Iniciar sesión' }).getAttribute('href')).toBe('/login')
    // Navegación entre las cuatro páginas y salto al contenido.
    const pie = screen.getByRole('navigation', { name: 'Información' })
    expect(within(pie).getAllByRole('link')).toHaveLength(4)
    expect(screen.getByText('Saltar al contenido')).toBeTruthy()
  })

  it('con sesión iniciada el acceso lleva al inicio', async () => {
    usuario = { id: 1, role: 'aspirante', email_verified: true }
    abrirPagina('/privacidad')
    await screen.findByRole('heading', { level: 1, name: 'Privacidad y tratamiento de datos' }, { timeout: 15000 })
    expect(screen.getByRole('link', { name: 'Ir al inicio' }).getAttribute('href')).toBe('/')
  })

  it.each(RUTAS)('%s: cada dato pendiente del resumen aparece marcado dentro del contenido, sin texto legal inventado', async (ruta) => {
    abrirPagina(ruta)
    const resumen = await screen.findByRole('heading', { name: /Datos por completar/ }, { timeout: 15000 })
    const total = Number(resumen.textContent.match(/\((\d+)\)/)[1])
    expect(total).toBeGreaterThan(0)
    const lista = resumen.closest('section').querySelectorAll('li')
    expect(lista).toHaveLength(total)
    const cuerpo = document.querySelector('article')
    for (const li of lista) {
      const dato = li.textContent.replace(/Dato pendiente:|\[|\]/g, '').trim()
      // Cada dato figura también en alguna sección (no solo en el resumen).
      const enSecciones = [...cuerpo.querySelectorAll('section:not(#pendientes) span')].some((s) => s.textContent.includes(dato))
      expect(enSecciones, dato).toBe(true)
    }
    expect(document.body.textContent).not.toMatch(/\bdías hábiles\b|\b\d+ (años|meses|días)\b/i)
  })

  it('Acerca de usa solo hechos confirmados: ADSO, ficha 3173334, simulación; no se presenta como oficial ni nombra personas', async () => {
    abrirPagina('/acerca-de')
    await screen.findByRole('heading', { level: 1, name: 'Acerca de SPGTH' }, { timeout: 15000 })
    const texto = document.querySelector('article').textContent
    expect(texto).toMatch(/equipo ADSO de la ficha 3173334/)
    expect(texto).toMatch(/convocatoria/i)
    expect(texto).toMatch(/evaluación/i)
    expect(texto).toMatch(/selección/i)
    expect(texto).toMatch(/no se presenta como un sistema oficial del SENA/)
    // Ninguna persona nombrada ni responsabilidad atribuida (el resumen solo menciona la revisión pendiente).
    expect(texto).not.toMatch(/Margarita|desarrollado por|responsable es|coordinado por/i)
  })

  it('el índice de cada página enlaza con secciones que existen', async () => {
    abrirPagina('/terminos')
    await screen.findByRole('heading', { level: 1, name: 'Términos de uso' }, { timeout: 15000 })
    const indice = screen.getByRole('navigation', { name: 'En esta página' })
    for (const enlace of within(indice).getAllByRole('link')) {
      expect(document.getElementById(enlace.getAttribute('href').slice(1))).toBeTruthy()
    }
  })

  it.each(RUTAS)('%s: el contacto confirmado es un enlace de correo y no queda como dato pendiente', async (ruta) => {
    abrirPagina(ruta)
    await screen.findByRole('article', {}, { timeout: 15000 })
    const enlaces = screen.getAllByRole('link', { name: 'spgth2026@gmail.com' })
    expect(enlaces.every((a) => a.getAttribute('href') === 'mailto:spgth2026@gmail.com')).toBe(true)
    expect(document.body.textContent).not.toMatch(/Medio de contacto|Correo o canal de contacto/)
  })

  it('Privacidad describe lo confirmado y marca como pendiente solo lo no confirmado, sin aprobar nada', async () => {
    abrirPagina('/privacidad')
    await screen.findByRole('heading', { level: 1, name: 'Privacidad y tratamiento de datos' }, { timeout: 15000 })
    const texto = document.querySelector('article').textContent
    // Confirmado por el equipo.
    expect(texto).toMatch(/proyecto académico/)
    expect(texto).toMatch(/documentos reales y ficticios/)
    expect(texto).toMatch(/Puede haber usuarios menores de edad/)
    expect(texto).toMatch(/algunos procesos se conservarán para consulta/)
    expect(texto).toMatch(/Edna Margarita Correa y Jarvison Aguilar Uribe/)
    expect(texto).toMatch(/destinatarios previstos de la entrega/)
    expect(texto).toMatch(/no define quién es el responsable jurídico/)
    expect(texto).not.toMatch(/Jarvinson/)
    // Participar no es contratar.
    expect(texto).toMatch(/no equivale a celebrar un contrato de aprendizaje ni una contratación real/)
    // Hoy no hay aceptación registrada.
    expect(texto).toMatch(/no te pide aceptar estos textos ni guarda constancia/)
    // Lo no confirmado sigue marcado como pendiente.
    for (const dato of ['Identidad jurídica del responsable', 'Alcance de la autorización institucional', 'Procesos que se conservan, plazo y procedimiento']) {
      expect(texto).toContain(dato)
    }
    // Hash en vez de «cifrado» y sin afirmar configuración de producción.
    expect(texto).toMatch(/se guarda su hash|se guardan como hash/)
    expect(texto).toMatch(/no afirma nada sobre la configuración de producción/)
    expect(screen.getAllByText(/Borrador|pendiente de revisión/).length).toBeGreaterThan(0)
  })

  it('Privacidad describe los accesos por permiso con precisión', async () => {
    abrirPagina('/privacidad')
    await screen.findByRole('heading', { level: 1, name: 'Privacidad y tratamiento de datos' }, { timeout: 15000 })
    const acceso = document.getElementById('acceso').textContent
    expect(acceso).toMatch(/super administrador, los instructores y los aprendices con subrol general o evaluador/)
    expect(acceso).toMatch(/solo lectura/)
    expect(acceso).toMatch(/seleccionadores/)
    expect(acceso).toMatch(/el ranking no carga los documentos/)
    expect(acceso).toMatch(/los aspirantes sin ficha/)
  })
})
