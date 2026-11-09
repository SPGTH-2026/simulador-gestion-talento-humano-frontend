import LogoSena from './LogoSena'
import ThemeToggle from '../ThemeToggle'

// Detalle gráfico del panel institucional: una red de nodos unidos por
// conexiones, como las etapas de un proceso. Es estático, decorativo y muy
// tenue: va detrás del texto y se desvanece hacia la esquina del contenido.
// Solo se ve desde 'lg', donde el panel tiene espacio de sobra.
const NODOS = [
  [250, 60],
  [330, 140],
  [210, 170],
  [300, 250],
  [170, 280],
  [260, 350],
  [90, 330],
  [350, 340],
]
const CONEXIONES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [2, 4],
  [3, 5],
  [4, 5],
  [4, 6],
  [3, 7],
  [5, 7],
]
// Nodos que llevan el verde institucional, el único acento del detalle.
const NODOS_VERDES = [0, 3, 5]

function RedDecorativa() {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-8 -right-8 hidden size-80 text-white/10 dark:text-sena-cielo/[0.14] lg:block xl:size-96"
      style={{
        WebkitMaskImage: 'linear-gradient(to top left, #000 20%, transparent 72%)',
        maskImage: 'linear-gradient(to top left, #000 20%, transparent 72%)',
      }}
    >
      <g stroke="currentColor" strokeWidth="1.5">
        {CONEXIONES.map(([a, b]) => (
          <line
            key={`${a}-${b}`}
            x1={NODOS[a][0]}
            y1={NODOS[a][1]}
            x2={NODOS[b][0]}
            y2={NODOS[b][1]}
          />
        ))}
      </g>
      {NODOS.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={NODOS_VERDES.includes(i) ? 7 : 5}
          className={NODOS_VERDES.includes(i) ? 'fill-sena/40' : 'fill-current'}
        />
      ))}
    </svg>
  )
}

// Marco de las pantallas de acceso (login, registro, recuperación, verificación
// y ficha). Desde 'lg' son dos paneles: a la izquierda (≈40 %) la identidad de
// SPGTH sobre el azul institucional (más profundo en oscuro) y a la derecha el
// formulario sobre el lienzo. Por debajo de 'lg' es una sola columna: una
// cabecera compacta y el formulario.
// Paleta y tipografía: Manual de Identidad Visual SENA 2024 (src/index.css).
export default function TarjetaAuth({ children }) {
  return (
    <div className="flex min-h-dvh flex-col bg-sena-lienzo dark:bg-sena-noche lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <header className="relative overflow-hidden bg-sena-menu px-4 py-5 text-white dark:bg-sena-menu-bajo sm:px-6 lg:flex lg:flex-col lg:justify-center lg:border-r lg:border-white/5 dark:lg:border-sena-borde/50 lg:px-10 lg:py-12 xl:px-14">
        <RedDecorativa />
        {/* El logosímbolo ya contiene las letras SENA: va sobre el texto y no
            al lado para que no compitan. */}
        <div className="relative mx-auto flex w-full max-w-md items-center gap-4 lg:mx-0 lg:max-w-sm lg:flex-col lg:items-start lg:gap-8">
          <LogoSena className="size-12 text-sena lg:size-20" />
          <div>
            <h1 className="text-xl font-bold tracking-tight lg:text-4xl">SPGTH</h1>
            <p className="mt-0.5 text-sm text-slate-200 lg:mt-2 lg:text-lg">
              Simulador de Procesos de Gestión de Talento Humano
            </p>
            <p className="mt-6 hidden text-base text-slate-200 lg:block">
              Un espacio formativo para explorar los procesos de gestión del talento humano
            </p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 pb-8 pt-3 sm:px-6 lg:px-10">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col py-4 lg:justify-center">
          {children}
        </div>
      </main>
    </div>
  )
}
