import { describe, it, expect } from 'vitest'

// Regresión del refactor «hooks + vistas»: un hook que, mientras carga, falla o no está abierto, devuelve la propia pantalla
// (un elemento de React o null) en vez del contexto obliga a la vista a comprobarlo ANTES de desestructurar. Sin esa guardia la
// pantalla termina en el ErrorBoundary. Esta prueba revisa el código fuente: toda vista que consume un hook así debe llevar
// `if (ctx === null || isValidElement(ctx)) return ctx` (o `if (ctx === null) return null` cuando el hook solo devuelve null).
const fuentes = import.meta.glob('/src/**/*.{js,jsx}', { query: '?raw', import: 'default', eager: true })
const sinPruebas = Object.entries(fuentes).filter(([ruta]) => !/\.test\./.test(ruta))

// Líneas del cuerpo del hook (indentación de 2 espacios) que devuelven una pantalla: `if (...) return <...` / `return null`.
function retornosDePantalla(fuenteHook, nombre) {
  const lineas = fuenteHook.split('\n')
  const inicio = lineas.findIndex((l) => l.startsWith(`export function ${nombre}`))
  let fin = lineas.findIndex((l, i) => i > inicio && l === '}')
  if (fin < 0) fin = lineas.length
  const hallados = []
  for (let i = inicio + 1; i < fin; i++) {
    const l = lineas[i]
    if (/^ {2}if \(.*\) return (null|<|\()/.test(l)) hallados.push(i + 1)
    else if (/^ {2}if \(.*\) \{\s*$/.test(l) && /^ {4}return (null|<|\()/.test(lineas[i + 1] ?? '')) hallados.push(i + 2)
  }
  return hallados
}

const vistas = sinPruebas
  .filter(([ruta, fuente]) => ruta.endsWith('.jsx') && /const ctx = use\w+\(/.test(fuente))
  .map(([ruta, fuente]) => {
    const hook = fuente.match(/const ctx = (use\w+)\(/)[1]
    const origen = sinPruebas.find(([, f]) => f.includes(`export function ${hook}`))
    return { ruta, fuente, hook, retornos: origen ? retornosDePantalla(origen[1], hook) : [] }
  })

describe('vistas que consumen un hook de pantalla', () => {
  it('encuentra las vistas del patrón (la prueba no queda vacía)', () => {
    expect(vistas.length).toBeGreaterThan(10)
  })

  it.each(vistas.filter((v) => v.retornos.length > 0).map((v) => [v.ruta.replace('/src/', ''), v]))(
    '%s comprueba el retorno del hook antes de usarlo',
    (_ruta, vista) => {
      expect(vista.fuente).toMatch(/isValidElement\(ctx\)|ctx === null/)
    },
  )
})
