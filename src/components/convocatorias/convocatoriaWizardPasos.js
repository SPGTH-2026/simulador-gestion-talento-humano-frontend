import { ETAPAS, ETAPA_DE_CAMPO } from './convocatoriaWizardUtils'

// Errores de skills agrupados en un texto. Pueden venir en 'skills' y en 'skills.0', 'skills.1'... (el backend
// los separa por conjunto e ítem).
export function errorDeSkillsDe(errores) {
  const partes = []
  for (const [campo, mensaje] of Object.entries(errores ?? {})) {
    if (campo !== 'skills' && !campo.startsWith('skills.')) continue
    if (Array.isArray(mensaje)) partes.push(...mensaje.filter(Boolean))
    else if (mensaje) partes.push(String(mensaje))
  }
  return partes.join(' ')
}

// Estado de cada paso para la lista lateral: 'rojos' (a corregir: el último intento falló o el servidor lo rechazó),
// 'faltan' (lo que aún se necesita para publicar) y 'completo' (el paso exige algo y ya lo tiene).
export function estadoDePasos({ errores, erroresDelIntento, pendientes, puedePublicar, editable }) {
  const pendientesDeEtapa = (numero) => pendientes.filter((c) => ETAPA_DE_CAMPO[c] === numero).length
  return ETAPAS.map((e) => {
    const rojos =
      Object.keys(errores ?? {}).filter((c) => (ETAPA_DE_CAMPO[c] ?? ETAPA_DE_CAMPO[c.split('.')[0]]) === e.numero).length +
      Object.keys(erroresDelIntento).filter((c) => ETAPA_DE_CAMPO[c] === e.numero).length
    const faltan = puedePublicar && editable ? pendientesDeEtapa(e.numero) : 0
    const exige = [1, 2, 5].includes(e.numero)
    return {
      numero: e.numero,
      nombre: e.nombre,
      rojos,
      faltan,
      completo: exige && puedePublicar && editable && faltan === 0 && rojos === 0,
      opcional: [3, 4, 6].includes(e.numero),
    }
  })
}
