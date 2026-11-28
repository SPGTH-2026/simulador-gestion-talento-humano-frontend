// Entradas de los datos personales: cada campo deja escribir solo lo que le corresponde y tiene un largo máximo. El servidor repite
// las mismas reglas (DatosPersonalesRequest): aquí solo se evita que la persona escriba algo que luego rechazaría.

// Países para el código del teléfono. `digitos` = [mínimo, máximo] del número SIN el código. Colombia lleva exactamente 10.
export const PAISES_TELEFONO = [
  { codigo: '57', nombre: 'Colombia', digitos: [10, 10] },
  { codigo: '58', nombre: 'Venezuela', digitos: [10, 10] },
  { codigo: '593', nombre: 'Ecuador', digitos: [9, 9] },
  { codigo: '51', nombre: 'Perú', digitos: [9, 9] },
  { codigo: '507', nombre: 'Panamá', digitos: [7, 8] },
  { codigo: '52', nombre: 'México', digitos: [10, 10] },
  { codigo: '56', nombre: 'Chile', digitos: [9, 9] },
  { codigo: '54', nombre: 'Argentina', digitos: [10, 10] },
  { codigo: '55', nombre: 'Brasil', digitos: [10, 11] },
  { codigo: '1', nombre: 'EE. UU. / Canadá', digitos: [10, 10] },
  { codigo: '34', nombre: 'España', digitos: [9, 9] },
]

export const PAIS_POR_DEFECTO = '57'
const DIGITOS_OTRO_PAIS = [6, 12]

export const paisDe = (codigo) => PAISES_TELEFONO.find((p) => p.codigo === codigo)
export const digitosDe = (codigo) => paisDe(codigo)?.digitos ?? DIGITOS_OTRO_PAIS

// «+57 3001234567» → { codigo: '57', numero: '3001234567' }. Un teléfono guardado antes de existir el código (solo dígitos) se
// toma como colombiano.
export function partirTelefono(valor) {
  const texto = String(valor ?? '').trim()
  const con = /^\+(\d{1,3})\s*(.*)$/.exec(texto)
  if (con) return { codigo: con[1], numero: con[2].replace(/\D/g, '') }
  return { codigo: PAIS_POR_DEFECTO, numero: texto.replace(/\D/g, '') }
}

// Valor que viaja y se guarda: «+57 3001234567». Sin número, vacío (así el campo cuenta como sin llenar).
export const armarTelefono = (codigo, numero) => (numero ? `+${codigo} ${numero}` : '')

// Limpia el número a solo dígitos y lo corta al máximo del país.
export function limpiarNumeroTelefono(codigo, numero) {
  const [, maximo] = digitosDe(codigo)
  return String(numero ?? '').replace(/\D/g, '').slice(0, maximo)
}

// ¿Es un teléfono completo? Con el código del país y el largo que ese país exige.
export function telefonoValido(valor) {
  const { codigo, numero } = partirTelefono(valor)
  if (!/^[1-9]\d{0,2}$/.test(codigo)) return false
  const [minimo, maximo] = digitosDe(codigo)
  return numero.length >= minimo && numero.length <= maximo
}

// Lo que dice la ayuda bajo el campo: «10 dígitos» o «de 7 a 8 dígitos».
export function ayudaTelefono(codigo) {
  const [minimo, maximo] = digitosDe(codigo)
  return minimo === maximo ? `${minimo} dígitos` : `de ${minimo} a ${maximo} dígitos`
}

const SOLO_LETRAS = /[^\p{L}\s'’.-]/gu
const DIRECCION = /[^\p{L}\p{N}\s#\-.,°º/'’]/gu

// Nombres de personas: letras (con tildes y ñ), espacios, apóstrofo, punto y guion.
export const soloLetras = (valor, maximo) => String(valor ?? '').replace(SOLO_LETRAS, '').replace(/^[\s'’.-]+/, '').slice(0, maximo)

// Dirección: letras, números, espacios y # - . , ° /
export const limpiarDireccion = (valor, maximo = 150) => String(valor ?? '').replace(DIRECCION, '').slice(0, maximo)

// Número de documento: cédula, tarjeta de identidad, extranjería y PPT son solo números; el pasaporte admite letras.
export function limpiarDocumento(tipo, valor) {
  const texto = String(valor ?? '')
  return tipo === 'pasaporte' ? texto.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 20) : texto.replace(/\D/g, '').slice(0, 15)
}

export const ayudaDocumento = (tipo) =>
  tipo === 'pasaporte' ? 'Letras y números, sin espacios (hasta 20).' : tipo ? 'Solo números, sin puntos (5 a 15 dígitos).' : ''

// Correo: sin espacios y en minúsculas.
export const limpiarCorreo = (valor) => String(valor ?? '').replace(/\s/g, '').toLowerCase().slice(0, 150)

// Límites de largo de los campos de texto (los mismos que el servidor).
export const LARGOS = { nombres: 100, apellidos: 100, direccion: 150, representante_nombre: 150, representante_parentesco: 40 }

// Aplica a un campo la limpieza que le corresponde. `form` da el contexto (p. ej. el tipo de documento).
export function limpiarCampo(campo, valor, form = {}) {
  switch (campo) {
    case 'nombres':
    case 'apellidos':
    case 'representante_nombre':
    case 'representante_parentesco':
      return soloLetras(valor, LARGOS[campo])
    case 'direccion':
      return limpiarDireccion(valor, LARGOS.direccion)
    case 'numero_documento':
      return limpiarDocumento(form.tipo_documento_identidad, valor)
    case 'representante_documento':
      return limpiarDocumento(form.representante_tipo_documento, valor)
    case 'representante_correo':
      return limpiarCorreo(valor)
    case 'telefono':
    case 'representante_telefono':
    case 'representante_telefono_alterno': {
      const { codigo, numero } = partirTelefono(valor)
      return armarTelefono(codigo, limpiarNumeroTelefono(codigo, numero))
    }
    default:
      return valor
  }
}
