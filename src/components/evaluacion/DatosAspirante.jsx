import { CLASE_META_DD, CLASE_META_DT, CLASE_TARJETA, CLASE_TEXTO_SUAVE, CLASE_TITULO_SECCION } from '../../lib/estilos'
import { edadDe } from '../../lib/datosPersonales'

// Un dato de la lista: etiqueta y valor. Sin valor no se pinta (los campos opcionales quedan fuera).
function Dato({ etiqueta, children }) {
  if (children === null || children === undefined || children === '') return null
  return (
    <div className="min-w-0">
      <dt className={CLASE_META_DT}>{etiqueta}</dt>
      <dd className={`${CLASE_META_DD} break-words`}>{children}</dd>
    </div>
  )
}

const documento = (tipo, numero) => [tipo?.nombre, numero].filter(Boolean).join(' · ')
const lugar = (departamento, municipio) => [municipio?.nombre, departamento?.nombre].filter(Boolean).join(', ')

// Datos personales de la postulación para quien evalúa o contrata, de SOLO LECTURA. Si el aspirante es menor de edad muestra
// también los de su representante legal: la autorización se firma en persona al contratar y con estos datos se le localiza.
export default function DatosAspirante({ datos, esMenor }) {
  const edad = edadDe(datos.fecha_nacimiento)

  return (
    <section aria-labelledby="datos-aspirante-titulo" className={`${CLASE_TARJETA} flex flex-col gap-4 p-4 sm:p-5`}>
      <div>
        <h2 id="datos-aspirante-titulo" className={`text-lg font-semibold ${CLASE_TITULO_SECCION}`}>
          Datos del aspirante
        </h2>
        <p className={`mt-1 text-sm ${CLASE_TEXTO_SUAVE}`}>Los declaró en esta postulación. Son de solo lectura.</p>
      </div>

      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        <Dato etiqueta="Nombre completo">{`${datos.nombres} ${datos.apellidos}`}</Dato>
        <Dato etiqueta="Documento">{documento(datos.tipo_documento_identidad, datos.numero_documento)}</Dato>
        <Dato etiqueta="Fecha de nacimiento">{edad === null ? datos.fecha_nacimiento : `${datos.fecha_nacimiento} (${edad} años)`}</Dato>
        <Dato etiqueta="Teléfono">{datos.telefono}</Dato>
        <Dato etiqueta="Residencia">{lugar(datos.departamento, datos.municipio)}</Dato>
        <Dato etiqueta="Dirección">{datos.direccion}</Dato>
        <Dato etiqueta="Nivel de formación">{datos.nivel_formacion?.nombre}</Dato>
      </dl>

      {esMenor && (
        <div className="border-t border-sena-linea/70 pt-4 dark:border-sena-borde/50">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-sena-texto">Representante legal (menor de edad)</h3>
          <p className={`mt-1 text-sm ${CLASE_TEXTO_SUAVE}`}>
            La autorización de trabajo se firma en persona al momento de la contratación.
          </p>
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <Dato etiqueta="Nombre completo">{datos.representante_nombre}</Dato>
            <Dato etiqueta="Parentesco">{datos.representante_parentesco}</Dato>
            <Dato etiqueta="Documento">{documento(datos.representante_tipo_documento, datos.representante_documento)}</Dato>
            <Dato etiqueta="Teléfono">{datos.representante_telefono}</Dato>
            <Dato etiqueta="Teléfono alterno">{datos.representante_telefono_alterno}</Dato>
            <Dato etiqueta="Correo electrónico">{datos.representante_correo}</Dato>
            <Dato etiqueta="Residencia">{lugar(datos.representante_departamento, datos.representante_municipio)}</Dato>
            <Dato etiqueta="Conoce la postulación">{datos.representante_conoce ? 'Sí' : 'No'}</Dato>
          </dl>
        </div>
      )}
    </section>
  )
}
