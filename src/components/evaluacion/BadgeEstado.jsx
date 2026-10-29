const COLORES = {
  'En evaluación': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  'Documentación validada': 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  'En revisión': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  Seleccionado: 'bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200',
  Postulado: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  Completada: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  Pendiente: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  Validado: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  Cargado: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  Rechazado: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  'Sin cargar': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
}

export default function BadgeEstado({ estado }) {
  const clase = COLORES[estado] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${clase}`}>
      {estado}
    </span>
  )
}
