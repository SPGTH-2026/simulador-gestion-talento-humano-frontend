import { useCallback, useEffect, useSyncExternalStore } from 'react'

const CLAVE = 'spgth-tema'

function preferenciaGuardada() {
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

function aplicar(oscuro) {
  document.documentElement.classList.toggle('dark', oscuro)
  // Hace que los controles nativos y las barras del sistema tambien se
  // pinten oscuros; sin esto el tema queda a medias en inputs del navegador.
  document.documentElement.style.colorScheme = oscuro ? 'dark' : 'light'
}

// Estado ÚNICO para toda la app. Antes cada componente que llamaba useTema()
// tenía su propia copia: al cambiar el tema en un lado (Topbar) el otro (Sidebar)
// no se enteraba hasta recargar. Ahora todos leen y escriben el mismo estado.
let estado = {
  oscuro: document.documentElement.classList.contains('dark'),
  siguiendo: preferenciaGuardada() === null,
}
const oyentes = new Set()

function emitir(cambio) {
  estado = { ...estado, ...cambio }
  oyentes.forEach((avisar) => avisar())
}

function suscribir(avisar) {
  oyentes.add(avisar)
  return () => oyentes.delete(avisar)
}

// Un solo listener del sistema para toda la app: solo actúa mientras no haya elección manual.
let vigilandoSistema = false
function vigilarSistema() {
  if (vigilandoSistema) return
  vigilandoSistema = true
  const medio = window.matchMedia('(prefers-color-scheme: dark)')
  medio.addEventListener('change', (e) => {
    if (!estado.siguiendo) return
    aplicar(e.matches)
    emitir({ oscuro: e.matches })
  })
}

// El script de index.html ya aplicó la clase antes de montar React. Aquí se
// parte de lo que hay en el DOM en vez de recalcularlo, para que la app y el
// HTML inicial nunca discrepen.
export function useTema() {
  const snapshot = useSyncExternalStore(suscribir, () => estado, () => estado)

  // Mientras no haya elección manual, el cambio del sistema debe verse.
  useEffect(() => {
    vigilarSistema()
  }, [])

  const alternar = useCallback(() => {
    const nuevo = !estado.oscuro
    aplicar(nuevo)
    try {
      localStorage.setItem(CLAVE, nuevo ? 'oscuro' : 'claro')
    } catch {
      /* sin persistencia, el tema funciona igual mientras la pagina viva */
    }
    emitir({ oscuro: nuevo, siguiendo: false })
  }, [])

  return { oscuro: snapshot.oscuro, alternar, siguiendo: snapshot.siguiendo }
}
