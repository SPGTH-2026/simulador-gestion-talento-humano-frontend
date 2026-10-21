import { useEffect, useRef, useState } from 'react'

// Modal para previsualizar PDFs usando iframe nativo del navegador
export default function PdfViewerModal({ isOpen, onClose, url, title }) {
  const iframeRef = useRef(null)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  useEffect(() => {
    if (isOpen && iframeRef.current && url) {
      iframeRef.current.src = url
      setIframeLoaded(false)
    }
  }, [isOpen, url])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
    >
      <div
        className="w-full max-w-4xl h-[85vh] bg-white dark:bg-slate-800 rounded-xl overflow-hidden relative flex flex-col"
        role="document"
      >
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3 min-w-0">
            <svg
              className="w-5 h-5 text-sena-azul flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <h2 id="pdf-modal-title" className="text-lg font-semibold text-slate-900 dark:text-white truncate max-w-[300px]">
              {title || 'Documento PDF'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block" id="page-info">
              Página <span id="current-page">1</span> de <span id="total-pages">-</span>
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
              aria-label="Cerrar visor PDF"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 sticky top-[52px] z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'ZOOM_OUT' }, '*')}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
              aria-label="Alejar zoom"
              title="Alejar zoom"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 10-18 0 9 9 0 0018 0z" />
              </svg>
            </button>
            <span className="w-16 text-center text-sm text-slate-700 dark:text-slate-300 font-mono" id="zoom-level">100%</span>
            <button
              onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'ZOOM_IN' }, '*')}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
              aria-label="Acercar zoom"
              title="Acercar zoom"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v6m3-3H9m12 0a9 9 0 10-18 0 9 9 0 0018 0z" />
              </svg>
            </button>
            <button
              onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'RESET_ZOOM' }, '*')}
              className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-sena-azul transition-colors"
              title="Zoom 100%"
            >
              100%
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'PREV_PAGE' }, '*')}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
              aria-label="Página anterior"
              title="Página anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-300 font-mono w-20 text-center" id="page-counter">
              Página <span id="current-page-display">1</span> de <span id="total-pages-display">-</span>
            </span>
            <button
              onClick={() => iframeRef.current?.contentWindow?.postMessage({ type: 'NEXT_PAGE' }, '*')}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
              aria-label="Página siguiente"
              title="Página siguiente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <a
              id="download-link"
              href="#"
              download
              className="px-3 py-1.5 text-sm font-medium text-white bg-sena-azul rounded-lg hover:bg-sena-azul/90 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Descargar
            </a>
          </div>
        </div>

        {/* Iframe PDF */}
        <div className="flex-1 relative overflow-hidden">
          <div
            className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900"
            aria-hidden={iframeLoaded}
          >
            <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
              <svg className="w-12 h-12 text-sena-azul" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Cargando documento...</p>
            </div>
          </div>
          <iframe
            ref={iframeRef}
            src={isOpen ? url : 'about:blank'}
            className={`w-full h-full border-0 transition-opacity duration-300 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
            title={`Vista previa: ${title}`}
            onLoad={() => setIframeLoaded(true)}
            sandbox="allow-scripts allow-same-origin"
            allow="fullscreen"
          />
        </div>

        {/* Footer con nombre del archivo */}
        <footer className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <p className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[400px]" id="pdf-title-display">
            {title}
          </p>
        </footer>
      </div>

      {/* Overlay para cerrar al hacer click fuera */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
    </div>
  )
}