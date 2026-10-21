import { useState } from 'react'
import PdfViewerModal from './PdfViewerModal'

// Componente unificado para acciones de documento: solo "Ver" (preview en modal)
export default function DocumentActions({
  // Datos del archivo
  file,
  // URL para preview (endpoint que devuelve el PDF)
  previewUrl,
  // Título para el modal
  title,
  // Tamaño del botón: 'sm' | 'md' | 'lg'
  size = 'sm',
  // Variante visual: 'primary' | 'ghost' | 'outline'
  variant = 'primary',
  // Texto personalizado del botón
  label = 'Ver',
  // Clases adicionales
  className = '',
  // Deshabilitado
  disabled = false,
  // Tooltip personalizado
  tooltip,
} = {}) {
  const [modalOpen, setModalOpen] = useState(false)

  const openModal = () => setModalOpen(true)
  const closeModal = () => setModalOpen(false)

  // Determinar clases según variante y tamaño
  const baseClasses = 'inline-flex items-center gap-1.5 font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-sena-azul/50 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    primary: 'bg-sena-azul text-white hover:bg-sena-azul/90 focus:ring-sena-azul dark:bg-sena-azul dark:hover:bg-sena-azul/90',
    ghost: 'bg-transparent text-sena-azul hover:bg-sena-cielo/20 dark:hover:bg-sena-cielo/30 focus:ring-sena-azul',
    outline: 'border border-sena-azul/25 text-sena-azul hover:bg-sena-cielo/30 dark:hover:bg-sena-cielo/30 focus:ring-sena-azul dark:border-sena-borde dark:text-sena-texto',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-semibold',
    md: 'px-4 py-2 text-sm font-semibold',
    lg: 'px-5 py-2.5 text-base font-semibold',
  }

  const baseButtonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  const fileName = file?.nombre_original || file?.titulo || file?.nombre_original || 'Documento'

  return (
    <>
      <button
        type="button"
        onClick={() => !disabled && setModalOpen(true)}
        disabled={disabled}
        className={baseButtonClasses}
        title={tooltip || `Ver ${fileName}`}
        aria-label={`Ver ${fileName}`}
        aria-label={tooltip || `Ver ${fileName}`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 5.943 7.523 0 12 0c4.478 0 8.268 5.943 8.008 10.734C16.732 18.057 11.278 24 12 24c-4.478 0-8.268-5.943-8.008-10.734z"
          />
        </svg>
        <span className="hidden sm:inline">{label}</span>
      </button>

      {/* Modal Preview PDF */}
      <PdfViewerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        url={previewUrl}
        title={fileName}
      />
    </>
  )
}