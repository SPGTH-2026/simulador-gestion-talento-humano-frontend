import PaginaInformativa from '../../components/informativo/PaginaInformativa'
import { CampoPendiente } from '../../components/informativo/Pendiente'

// Términos de uso: solo estructura. Ningún plazo, condición jurídica ni autorización está redactado; cada sección dice qué debe
// definirse y deja el dato como pendiente.
const P = {
  servicio: 'Descripción aprobada del servicio',
  quien: 'Quién puede usar SPGTH y condiciones de edad',
  menores: 'Condiciones para menores de edad',
  cuenta: 'Obligaciones sobre la cuenta y las credenciales',
  contenido: 'Reglas sobre el contenido y documentos que aporta cada persona',
  datosReales: 'Si se permiten datos reales, ficticios o ambos',
  uso: 'Reglas de uso aceptable',
  marcas: 'Uso del nombre y la identidad visual del SENA',
  responsabilidad: 'Límites de responsabilidad',
  cambios: 'Cómo se comunican los cambios y las versiones',
  ley: 'Ley aplicable y medio de contacto',
}

const Seccion = ({ texto, dato }) => (
  <p>
    {texto} <CampoPendiente dato={dato} />
  </p>
)

export default function Terminos() {
  return (
    <PaginaInformativa
      titulo="Términos de uso"
      introduccion="Estructura de los términos de uso de SPGTH. Cada sección describe qué debe definirse; ningún contenido está decidido."
      pendientes={Object.values(P)}
      secciones={[
        { id: 'objeto', titulo: 'Objeto y alcance del servicio', tipo: 'borrador', children: <Seccion texto="Qué es el servicio y hasta dónde llega." dato={P.servicio} /> },
        {
          id: 'quien',
          titulo: 'Quién puede usar SPGTH',
          tipo: 'borrador',
          children: (
            <>
              <Seccion texto="Requisitos para usarlo." dato={P.quien} />
              <Seccion texto="Participación de menores de edad." dato={P.menores} />
            </>
          ),
        },
        { id: 'cuenta', titulo: 'Cuenta y seguridad', tipo: 'borrador', children: <Seccion texto="Cuidado de la cuenta." dato={P.cuenta} /> },
        {
          id: 'contenido',
          titulo: 'Contenido y documentos que aportas',
          tipo: 'borrador',
          children: (
            <>
              <Seccion texto="Qué se puede subir." dato={P.contenido} />
              <Seccion texto="Tipo de datos admitidos." dato={P.datosReales} />
            </>
          ),
        },
        { id: 'uso', titulo: 'Uso aceptable', tipo: 'borrador', children: <Seccion texto="Conductas permitidas y no permitidas." dato={P.uso} /> },
        { id: 'marcas', titulo: 'Identidad visual y marcas', tipo: 'borrador', children: <Seccion texto="Cómo se usan nombres y logos." dato={P.marcas} /> },
        { id: 'responsabilidad', titulo: 'Límites de responsabilidad', tipo: 'borrador', children: <Seccion texto="Qué garantiza y qué no." dato={P.responsabilidad} /> },
        { id: 'cambios', titulo: 'Cambios y versiones', tipo: 'borrador', children: <Seccion texto="Avisos de cambios." dato={P.cambios} /> },
        { id: 'ley', titulo: 'Ley aplicable y contacto', tipo: 'borrador', children: <Seccion texto="Marco aplicable y cómo escribir al equipo." dato={P.ley} /> },
      ]}
    />
  )
}
