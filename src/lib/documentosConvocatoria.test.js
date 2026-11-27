import { describe, expect, it } from 'vitest'
import { checklistConFijos, itemsDeTexto, itemsFijos } from './documentosConvocatoria'

describe('checklist de documentos', () => {
  it('itemsDeTexto ignora líneas vacías y espacios', () => {
    expect(itemsDeTexto('  Firmada \n\n Fotocopia legible \n')).toEqual(['Firmada', 'Fotocopia legible'])
  })

  it('un básico siempre tiene sus ítems fijos, aunque se hayan guardado otros', () => {
    const fijos = itemsFijos('documento_identidad')
    expect(fijos).toContain('Fotocopia legible')

    const texto = checklistConFijos('documento_identidad', 'Número de identificación')
    expect(itemsDeTexto(texto)).toEqual([...fijos, 'Número de identificación'])
  })

  it('no duplica un ítem fijo que ya estaba guardado', () => {
    const fijos = itemsFijos('hoja_de_vida')
    const texto = checklistConFijos('hoja_de_vida', fijos.join('\n'))
    expect(itemsDeTexto(texto)).toEqual(fijos)
  })

  it('un documento sin ítems fijos conserva su texto tal cual', () => {
    expect(checklistConFijos('tarjeta_extra', 'Lo que sea')).toBe('Lo que sea')
  })
})
