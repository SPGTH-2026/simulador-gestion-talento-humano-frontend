import Boton from '../../ui/Boton'
import Campo from '../../ui/Campo'
import { CLASE_CAJA_SUAVE, CLASE_CAMPO, CLASE_META_DD, CLASE_META_DT, CLASE_TARJETA_PLANA, CLASE_TEXTO_SUAVE } from '../../../lib/estilos'

// Sección de PanelRanking. Recibe el estado y las acciones del componente en la prop ctx.
export default function ResumenRanking({ ctx }) {
  const { abrirObjetivo, avisoObjetivo, botonCambiar, cerrarObjetivo, errorObjetivo, guardandoObjetivo, guardarObjetivo, meta, modo, objetivoCambio, objetivoNumero, objetivoTexto, objetivoValido, pausaObjetivo, puedeCambiarObjetivo, setErrorObjetivo, setObjetivoTexto, textoObjetivo } = ctx
  return (
  <section aria-label="Resumen del ranking" className="flex flex-col gap-3">
    <dl className={`${CLASE_TARJETA_PLANA} grid grid-cols-2 gap-x-5 gap-y-3 p-4 @min-[520px]:grid-cols-4`}>
      <div>
        <dt className={CLASE_META_DT}>Candidatos listos</dt>
        <dd className={`${CLASE_META_DD} tabular-nums`}>
          {meta.listos}
          <span className={`font-normal ${CLASE_TEXTO_SUAVE}`}> de {meta.postuladas}</span>
        </dd>
      </div>
      <div>
        <dt className={CLASE_META_DT}>Vacantes</dt>
        <dd className={`${CLASE_META_DD} tabular-nums`}>{meta.vacantes}</dd>
      </div>
      {modo !== 'pendiente_de_configurar' && (
        <div>
          <dt className={CLASE_META_DT}>Objetivo de finalistas</dt>
          <dd className={`${CLASE_META_DD} flex flex-wrap items-center gap-x-2`}>
            <span className="tabular-nums">{meta.objetivo.valor}</span>
            {meta.objetivo.efectivo !== meta.objetivo.valor && (
              <span className={`text-xs font-normal tabular-nums ${CLASE_TEXTO_SUAVE}`}>(alcanzan {meta.objetivo.efectivo})</span>
            )}
            {puedeCambiarObjetivo && objetivoTexto == null && (
              <Boton ref={botonCambiar} variante="enlace" tamano="flexible" className="-my-3 px-1" onClick={abrirObjetivo}>
                Cambiar
              </Boton>
            )}
          </dd>
        </div>
      )}
      {modo === 'con_actividades' && (
        <div>
          <dt className={CLASE_META_DT}>Sugeridos</dt>
          <dd className={`${CLASE_META_DD} tabular-nums`}>{meta.sugeridos}</dd>
        </div>
      )}
    </dl>

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
  </section>
  )
}
