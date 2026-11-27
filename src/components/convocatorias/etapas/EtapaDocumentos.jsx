import Boton from '../../ui/Boton'

// Etapa 6 del asistente de convocatorias. Recibe el estado y las acciones del asistente en la prop ctx.
export default function EtapaDocumentos({ ctx }) {
  const { agregarDocumentoCatalogo, bloquearDocumentos, documentosBloqueados, documentosObligatorios, documentosOpcionales, errorDe, errorDocumento, filaDocumento, guardandoDocumento, mostrarNuevoDocumento, nuevoDocumento, repartirPonderaciones, repartoAuto, setErrorDocumento, setMostrarNuevoDocumento, setNuevoDocumento, sumaPonderaciones, sumaTotal } = ctx
  return (
      <div className="flex flex-col gap-3">
        {/* Encabezado del paso con la acción de cargar un documento nuevo. */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500 dark:text-sena-texto-suave">
              Los cuatro documentos básicos se incluyen siempre. Elegir otros
              documentos es opcional (por eso este paso figura como
              «Opcional»), pero todo documento que selecciones aquí será
              obligatorio para postularse.
            </p>
            <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
              No es lo mismo que los «Documentos adicionales» que el aspirante
              puede aportar de forma voluntaria al postularse. Solo se aceptan
              archivos PDF.
            </p>
          </div>
          {!documentosBloqueados && (
            <Boton
              variante="contorno"
              tamano="tactil"
              onClick={() => {
                setMostrarNuevoDocumento((v) => !v)
                setErrorDocumento('')
              }}
            >
              Agregar nuevo documento
            </Boton>
          )}
        </div>

        {/* Alta de un documento que no está en el catálogo (especialización,
            maestría, diplomado...). Queda disponible para esta y otras
            convocatorias. */}
        {mostrarNuevoDocumento && !documentosBloqueados && (
          <div className="flex flex-col gap-2 rounded-lg border border-sena-azul/30 bg-white p-3 dark:border-sena-borde dark:bg-sena-superficie">
            <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
              Agrega un requisito que no está en el catálogo (por ejemplo
              Especialización o Maestría). Se sumará a esta convocatoria; luego
              le asignas su porcentaje.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={nuevoDocumento}
                onChange={(e) => setNuevoDocumento(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    agregarDocumentoCatalogo()
                  }
                }}
                maxLength={80}
                placeholder="Nombre del documento (ej. Especialización en SST)"
                className="min-w-56 flex-1 rounded border border-slate-300 bg-white p-2 text-sm text-slate-800 focus:border-sena focus:outline-none focus:ring-2 focus:ring-sena/40 dark:border-sena-borde dark:bg-sena-noche dark:text-sena-texto"
              />
              {/* 'ocupado' del sistema: bloquea el botón, lo marca con aria-busy y muestra la rueda junto a «Guardando…». */}
              <Boton tamano="tactil" onClick={agregarDocumentoCatalogo} ocupado={guardandoDocumento}>
                {guardandoDocumento ? 'Guardando…' : 'Agregar'}
              </Boton>
              <Boton
                variante="contorno"
                tamano="tactil"
                onClick={() => {
                  setMostrarNuevoDocumento(false)
                  setNuevoDocumento('')
                  setErrorDocumento('')
                }}
              >
                Cancelar
              </Boton>
            </div>
            {errorDocumento && (
              <span className="text-xs text-red-600 dark:text-red-400">{errorDocumento}</span>
            )}
          </div>
        )}

        {/* Porcentajes de la evaluación: propios de esta convocatoria. */}
        <div className="rounded-lg border border-sena-azul/20 bg-sena-cielo/20 p-3 dark:border-sena-borde dark:bg-sena-superficie-alta/30">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-sena-texto">
                Porcentaje de cada documento en la evaluación
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-sena-texto-suave">
                Define el peso de cada documento para calificar esta
                convocatoria. Si los dejas vacíos, todos valen lo mismo.
                {repartoAuto && ' El reparto es automático: se rehace solo al marcar o quitar documentos; si escribes un porcentaje a mano, deja de serlo.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`text-sm font-semibold ${
                  Math.abs(sumaPonderaciones() - 100) <= 0.01 && sumaPonderaciones() > 0
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-amber-700 dark:text-amber-300'
                }`}
              >
                Suma: {Math.round(sumaPonderaciones() * 100) / 100}% · Total con habilidades: {sumaTotal ? sumaTotal() : sumaPonderaciones()}% de 100%
              </span>
              {!documentosBloqueados && (
                <Boton variante="contorno" tamano="flexible" onClick={repartirPonderaciones}>
                  Repartir en partes iguales
                </Boton>
              )}
            </div>
          </div>
        </div>

        {errorDe('documentos') && (
          <span className="text-xs text-red-600 dark:text-red-400">{errorDe('documentos')}</span>
        )}
        {bloquearDocumentos && (
          <p className="text-xs text-slate-500 dark:text-sena-texto-suave">
            La convocatoria ya tiene postulaciones: los documentos no se pueden cambiar.
          </p>
        )}

        {documentosObligatorios.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
              Básicos (siempre incluidos)
            </h3>
            <div className="flex flex-col gap-2">
              {documentosObligatorios.map((d) => filaDocumento(d, true))}
            </div>
          </div>
        )}

        {documentosOpcionales.length > 0 && (
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-sena-texto-suave">
              Otros documentos (los que elijas serán obligatorios)
            </h3>
            <div className="flex flex-col gap-2">
              {documentosOpcionales.map((d) => filaDocumento(d))}
            </div>
          </div>
        )}
      </div>
  )
}
