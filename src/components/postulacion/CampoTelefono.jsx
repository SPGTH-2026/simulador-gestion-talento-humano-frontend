import { useState } from 'react'
import Campo from '../ui/Campo'
import { CLASE_CAMPO } from '../../lib/estilos'
import {
  PAISES_TELEFONO,
  PAIS_POR_DEFECTO,
  armarTelefono,
  ayudaTelefono,
  digitosDe,
  limpiarNumeroTelefono,
  paisDe,
  partirTelefono,
} from '../../lib/camposPersonales'

// Teléfono con el código del país: una lista para el código (Colombia +57 por defecto) y una entrada que solo acepta números y se
// corta al largo del país (Colombia, 10 dígitos). El valor que viaja y se guarda es «+57 3001234567».
// Con el número vacío el valor es '' (el campo cuenta como sin llenar), así que el país elegido se recuerda aparte.
export default function CampoTelefono({ etiqueta, requerido = false, valor, onCambio, deshabilitado = false, error, autoComplete = 'tel-national' }) {
  const [elegido, setElegido] = useState(null)
  const partido = partirTelefono(valor)
  const codigo = valor ? partido.codigo : (elegido ?? PAIS_POR_DEFECTO)
  const [, maximo] = digitosDe(codigo)

  const cambiarPais = (nuevo) => {
    setElegido(nuevo)
    onCambio(armarTelefono(nuevo, limpiarNumeroTelefono(nuevo, partido.numero)))
  }

  return (
    <Campo etiqueta={etiqueta} requerido={requerido} error={error} ayuda={`Código del país y número: ${ayudaTelefono(codigo)}, solo números.`}>
      {({ id, describedby, invalid }) => (
        <div className="flex gap-2">
          <select
            aria-label={`País del ${etiqueta.toLowerCase().replace(' (opcional)', '')}`}
            value={codigo}
            disabled={deshabilitado}
            onChange={(e) => cambiarPais(e.target.value)}
            className={`${CLASE_CAMPO} w-32 shrink-0`}
          >
            {PAISES_TELEFONO.map((pais) => (
              <option key={pais.codigo} value={pais.codigo}>
                {pais.bandera} +{pais.codigo}
              </option>
            ))}
            {!paisDe(codigo) && <option value={codigo}>+{codigo}</option>}
          </select>
          <input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete={autoComplete}
            maxLength={maximo}
            placeholder={codigo === '57' ? '3001234567' : ''}
            value={partido.numero}
            disabled={deshabilitado}
            aria-describedby={describedby}
            aria-invalid={invalid || undefined}
            onChange={(e) => {
              setElegido(codigo)
              onCambio(armarTelefono(codigo, limpiarNumeroTelefono(codigo, e.target.value)))
            }}
            className={`${CLASE_CAMPO} min-w-0 flex-1`}
          />
        </div>
      )}
    </Campo>
  )
}
