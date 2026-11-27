import Boton from '../../ui/Boton'
import Campo from '../../ui/Campo'
import { Metrica, ResumenSeleccion } from '../ResumenSeleccion'
import { CLASE_CAJA_SUAVE, CLASE_CAMPO, CLASE_TEXTO_SUAVE } from '../../../lib/estilos'

// Sección de PanelRanking. Recibe solo lo que muestra, por props.
export default function ResumenRanking({ abrirObjetivo, avisoObjetivo, botonCambiar, cerrarObjetivo, errorObjetivo, guardandoObjetivo, guardarObjetivo, meta, modo, objetivoCambio, objetivoNumero, objetivoTexto, objetivoValido, pausaObjetivo, puedeCambiarObjetivo, setErrorObjetivo, setObjetivoTexto, textoObjetivo }) {
  return (
    <div className="flex flex-col gap-3">
      <ResumenSeleccion etiqueta="Resumen del ranking">
        <Metrica titulo="Candidatos listos">
          {meta.listos}
          <span className={`font-normal ${CLASE_TEXTO_SUAVE}`}> de {meta.postuladas}</span>
        </Metrica>
        <Metrica titulo="Vacantes">{meta.vacantes}</Metrica>
        {modo !== 'pendiente_de_configurar' && (
          <Metrica titulo="Objetivo de finalistas">
            <span className="flex flex-wrap items-center gap-x-2">
              <span className="tabular-nums">{meta.objetivo.valor}</span>
              {meta.objetivo.efectivo !== meta.objetivo.valor && (
                <span className={`text-xs font-normal tabular-nums ${CLASE_TEXTO_SUAVE}`}>(alcanzan {meta.objetivo.efectivo})</span>
              )}
              {puedeCambiarObjetivo && objetivoTexto == null && (
                <Boton ref={botonCambiar} variante="enlace" tamano="flexible" className="-my-3 px-1" onClick={abrirObjetivo}>
                  Cambiar
                </Boton>
              )}
            </span>
          </Metrica>
        )}
        {modo === 'con_actividades' && <Metrica titulo="Sugeridos">{meta.sugeridos}</Metrica>}
      </ResumenSeleccion>

      {avisoObjetivo && objetivoTexto == null && (
        <p role="status" className="text-sm font-medium text-exito" {...pausaObjetivo}>
          {avisoObjetivo.texto}
        </p>
      )}

      {puedeCambiarObjetivo && objetivoTexto != null && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (objetivoValido && objetivoCambio && !guardandoObjetivo) guardarObjetivo(objetivoNumero)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && !guardandoObjetivo) cerrarObjetivo()
          }}
          className={`${CLASE_CAJA_SUAVE} flex flex-col gap-3 p-3 @min-[600px]:flex-row @min-[600px]:items-end`}
          aria-busy={guardandoObjetivo}
        >
          <Campo
            etiqueta="Objetivo de finalistas"
            error={errorObjetivo || (!objetivoValido ? 'Escribe un entero entre 1 y 500.' : '')}
            ayuda={`Sin fijarlo se usa 2 × vacantes (${2 * meta.vacantes}).`}
            className="@min-[600px]:w-60"
          >
            {({ id, describedby, invalid }) => (
              <input
                id={id}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                autoFocus
                value={textoObjetivo}
                onChange={(e) => {
                  setErrorObjetivo('')
                  setObjetivoTexto(e.target.value.replace(/\D/g, '').slice(0, 3))
                }}
                disabled={guardandoObjetivo}
                aria-describedby={describedby}
                aria-invalid={invalid || undefined}
                className={CLASE_CAMPO}
              />
            )}
          </Campo>
          <div className="flex flex-wrap gap-2 @min-[600px]:pb-px">
            <Boton type="submit" tamano="tactil" ocupado={guardandoObjetivo} disabled={!objetivoValido || !objetivoCambio}>
              {guardandoObjetivo ? 'Guardando…' : 'Guardar'}
            </Boton>
            <Boton variante="contorno" tamano="tactil" disabled={guardandoObjetivo} onClick={cerrarObjetivo}>
              Cancelar
            </Boton>
            {meta.objetivo.configurado && (
              <Boton variante="enlace" tamano="tactil" disabled={guardandoObjetivo} onClick={() => guardarObjetivo(null)}>
                Volver a 2 × vacantes
              </Boton>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
