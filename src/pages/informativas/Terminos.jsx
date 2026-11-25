import PaginaInformativa from '../../components/informativo/PaginaInformativa'
import { CampoPendiente } from '../../components/informativo/Pendiente'
import { EnlaceContacto } from './contactoProyecto'

// Términos de uso: lo que ya se sabe (proyecto académico, simulador, cuentas administradas, documentos reales y ficticios, menores)
// y, en cada sección, lo que falta decidir. No se redactan obligaciones, límites de responsabilidad ni leyes aplicables que nadie
// haya aprobado. Una referencia normativa solo puede incluirse si su texto oficial y su vigencia están verificados.
const P = {
  edad: 'Condiciones de edad y de participación de menores',
  documentosReales: 'Reglas sobre qué documentos reales pueden subirse',
  uso: 'Reglas de uso aceptable',
  marcas: 'Uso del nombre y la identidad visual del SENA',
  responsabilidad: 'Límites de responsabilidad',
  cambios: 'Cómo se comunican los cambios y las versiones',
  ley: 'Marco legal aplicable',
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
      introduccion="Qué es SPGTH, cómo se usa y qué reglas faltan por definir. Es un borrador para revisión: no está aprobado."
      pendientes={Object.values(P)}
      secciones={[
        {
          id: 'objeto',
          titulo: 'Qué es SPGTH',
          tipo: 'confirmado',
          children: (
            <>
              <p>SPGTH es un proyecto académico: un simulador de procesos de gestión de talento humano (convocatorias, evaluación y selección).</p>
              <p>No es un sistema oficial del SENA. Participar en el simulador no equivale a celebrar un contrato de aprendizaje ni una contratación real.</p>
            </>
          ),
        },
        {
          id: 'quien',
          titulo: 'Quién puede usar SPGTH',
          tipo: 'confirmado',
          children: (
            <>
              <p>Pueden participar personas mayores y menores de edad. La aplicación hoy no pide la fecha de nacimiento ni verifica la edad.</p>
              <Seccion texto="Condiciones de edad y participación de menores:" dato={P.edad} />
            </>
          ),
        },
        {
          id: 'cuenta',
          titulo: 'Cuenta y administración',
          tipo: 'verificado',
          children: (
            <>
              <p>Entras con tu correo y contraseña o, de forma opcional, con tu cuenta de Google. Si olvidas la contraseña, la recuperas con «¿Olvidaste tu contraseña?», con un código que se envía a tu correo.</p>
              <p>Los instructores Edna Margarita Correa y Jarvison Aguilar Uribe son los destinatarios previstos de la entrega y la administración del sistema. Un administrador puede activar o desactivar una cuenta y cambiar su rol. Esto no define responsabilidades jurídicas.</p>
            </>
          ),
        },
        {
          id: 'contenido',
          titulo: 'Documentos que aportas',
          tipo: 'confirmado',
          children: (
            <>
              <p>En SPGTH pueden usarse documentos reales y ficticios. Los documentos se cargan en PDF y los ven las personas con permiso de revisión dentro del alcance de la ficha, como se explica en la página de privacidad.</p>
              <Seccion texto="Reglas sobre los documentos reales:" dato={P.documentosReales} />
            </>
          ),
        },
        { id: 'uso', titulo: 'Uso aceptable', tipo: 'borrador', children: <Seccion texto="Conductas permitidas y no permitidas:" dato={P.uso} /> },
        {
          id: 'marcas',
          titulo: 'Identidad visual y marcas',
          tipo: 'borrador',
          children: <Seccion texto="Cómo se usan el nombre y los logos del SENA:" dato={P.marcas} />,
        },
        {
          id: 'responsabilidad',
          titulo: 'Límites de responsabilidad',
          tipo: 'borrador',
          children: <Seccion texto="Qué garantiza y qué no el proyecto:" dato={P.responsabilidad} />,
        },
        { id: 'cambios', titulo: 'Cambios y versiones', tipo: 'borrador', children: <Seccion texto="Avisos de cambios:" dato={P.cambios} /> },
        {
          id: 'ley',
          titulo: 'Contacto y marco aplicable',
          tipo: 'borrador',
          children: (
            <>
              <p>Puedes escribir al equipo a <EnlaceContacto />.</p>
              <Seccion texto="Marco legal aplicable:" dato={P.ley} />
            </>
          ),
        },
      ]}
    />
  )
}
