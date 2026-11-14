import { useMemo, useState } from 'react'
import { MAXIMO_COMPARAR } from '../lib/seleccion'

const SIN_MARCAS = new Map()

// Candidatos marcados para comparar (CU-SEL-017) en «Ranking y finalistas». Las marcas son de UNA convocatoria y las
// comparten las pestañas Ranking y Finalistas: al cambiar de pestaña se conservan y al cambiar de convocatoria (también
// con atrás/adelante del navegador) se descartan. Son independientes de las marcas de «Elegir» para confirmar finalistas.
//  - 'marcas': Map id de la postulación -> { aspirante }. Se guarda el nombre para poder mostrar y quitar las marcas de
//    candidatos que no están en la página o pestaña a la vista.
//  - Nunca hay más de MAXIMO_COMPARAR: alternar un candidato nuevo con el cupo lleno no hace nada.
//  - 'abierto': el comparador está a la vista. Abrirlo y cerrarlo no toca las marcas.
//  - 'modo': el modo «comparar» de las tablas está activo (casillas de comparar y barra, sin las acciones de elegir y
//    confirmar finalistas). Es el mismo para Ranking y Finalistas. Salir del modo conserva las marcas.
export default function useMarcasComparacion(convocatoriaId) {
  const clave = String(convocatoriaId ?? '')
  const [estado, setEstado] = useState({ clave: null, marcas: SIN_MARCAS, abierto: false, modo: false })

  // Al cambiar de convocatoria (incluido atrás/adelante) las marcas anteriores se descartan de verdad: si no, volver a la
  // anterior las «resucitaría». Se reinicia durante el render, sin pasar por un render con marcas ajenas.
  if (estado.clave !== clave) setEstado({ clave, marcas: SIN_MARCAS, abierto: false, modo: false })

  const vigente = estado.clave === clave
  const marcas = vigente ? estado.marcas : SIN_MARCAS
  const abierto = vigente && estado.abierto
  const modo = vigente && estado.modo

  return useMemo(() => {
    // Cada cambio parte de lo vigente de ESTA convocatoria: lo que quedó de otra se ignora.
    const sobre = (previo, cambio) => {
      const base = previo.clave === clave ? previo : { clave, marcas: SIN_MARCAS, abierto: false, modo: false }
      return { ...base, ...cambio(base) }
    }
    return {
      marcas,
      abierto,
      modo,
      maximo: MAXIMO_COMPARAR,
      entrar: () => setEstado((previo) => sobre(previo, () => ({ modo: true }))),
      salir: () => setEstado((previo) => sobre(previo, () => ({ modo: false, abierto: false }))),
      alternar: (id, aspirante) =>
        setEstado((previo) =>
          sobre(previo, (base) => {
            const siguiente = new Map(base.marcas)
            if (siguiente.has(id)) siguiente.delete(id)
            else if (siguiente.size < MAXIMO_COMPARAR) siguiente.set(id, { aspirante })
            return { marcas: siguiente }
          }),
        ),
      quitar: (id) =>
        setEstado((previo) =>
          sobre(previo, (base) => {
            const siguiente = new Map(base.marcas)
            siguiente.delete(id)
            return { marcas: siguiente }
          }),
        ),
      limpiar: () => setEstado((previo) => sobre(previo, () => ({ marcas: new Map() }))),
      abrir: () => setEstado((previo) => sobre(previo, () => ({ abierto: true }))),
      cerrar: () => setEstado((previo) => sobre(previo, () => ({ abierto: false }))),
    }
  }, [clave, marcas, abierto, modo])
}
