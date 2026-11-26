import DocumentoLegal from '../../components/informativo/DocumentoLegal'
import { EnlaceContacto } from './contactoProyecto'

const Lista = ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>

export default function Privacidad() {
  return (
    <DocumentoLegal
      titulo="Privacidad y datos personales"
      introduccion="Qué datos trata SPGTH, para qué, quién puede verlos y cómo puedes consultarlos."
      secciones={[
        {
          id: 'contacto',
          titulo: 'Contacto para consultas sobre tus datos',
          children: <p>SPGTH es un proyecto académico de simulación. Para cualquier consulta sobre tus datos escribe a <EnlaceContacto />.</p>,
        },
        {
          id: 'datos',
          titulo: 'Qué datos se tratan',
          children: (
            <>
              <Lista>
                <li><strong>Tu cuenta</strong>: nombre, correo, contraseña, rol y ficha. La contraseña no se guarda tal cual, sino como una huella que no permite recuperarla.</li>
                <li><strong>Acceso con Google</strong> (opcional): nombre, correo e identificador de tu cuenta de Google.</li>
                <li><strong>Datos de cada postulación</strong>: nombres y apellidos, tipo y número de documento, fecha de nacimiento, sexo, teléfono, departamento y municipio, dirección (opcional) y nivel de formación.</li>
                <li><strong>Si eres menor de edad</strong>: también el nombre, tipo y número de documento, teléfono, correo electrónico y parentesco de tu representante legal y, si quieres, su teléfono alterno y su residencia.</li>
                <li><strong>Documentos</strong>: los PDF que cargas (identidad, hoja de vida, certificados y adicionales), con sus títulos y notas, y tus habilidades con sus certificados.</li>
                <li><strong>Evaluación y selección</strong>: resultados y observaciones, notas de entrevista y prueba técnica, citaciones y decisiones.</li>
                <li><strong>Datos técnicos</strong>: dirección IP y navegador de tus sesiones, y tus notificaciones.</li>
              </Lista>
              <p>En SPGTH pueden aparecer documentos reales y ficticios; la aplicación los trata igual. Te pedimos usar datos y documentos de práctica (ficticios); si subes documentos reales, los tratamos con el mismo cuidado.</p>
            </>
          ),
        },
        {
          id: 'para-que',
          titulo: 'Para qué se usan',
          children: <p>Para que el simulador funcione: crear tu cuenta, permitirte postularte, evaluar tus documentos, seleccionar candidatos, citarte y avisarte de lo que ocurre con tu postulación. Los datos que declaras al postularte se usan para ese proceso de selección.</p>,
        },
        {
          id: 'quien-ve',
          titulo: 'Quién puede ver tus datos',
          children: (
            <>
              <Lista>
                <li><strong>Tú</strong>: tus postulaciones, documentos, evaluaciones, citaciones y notificaciones.</li>
                <li><strong>Revisión de documentos</strong>: el super administrador, los instructores y los aprendices autorizados (subrol general o evaluador). Es de solo lectura y se limita a la ficha de cada uno; el instructor, a sus fichas, y el super administrador, a todas.</li>
                <li><strong>Evaluación</strong>: quienes evalúan ven los resultados y la información de cada postulación necesaria para evaluarla.</li>
                <li><strong>Selección</strong>: el super administrador, los instructores, los aprendices con subrol general y los seleccionadores ven el nombre del aspirante, su estado y cumplimiento documental, resultados, notas, citaciones y decisiones.</li>
                <li><strong>Gestión de usuarios</strong>: el super administrador ve todas las cuentas y el instructor las de sus fichas: nombre, correo, rol, ficha y si la cuenta está activa.</li>
              </Lista>
              <p>Fuera de su alcance de ficha, una postulación o un documento aparece como «no encontrado».</p>
            </>
          ),
        },
        {
          id: 'menores',
          titulo: 'Personas menores de edad',
          children: (
            <>
              <p>Pueden participar personas menores de edad. En su caso la postulación pide los datos de su representante legal para poder localizarlo. La autorización del representante se firma en persona al momento de la contratación: no se sube ningún documento a la postulación.</p>
              <p>Participar en el simulador no equivale a celebrar un contrato de aprendizaje ni una contratación real.</p>
            </>
          ),
        },
        {
          id: 'autorizacion',
          titulo: 'Autorización',
          children: <p>Al crear una postulación se te pide autorizar el tratamiento de tus datos personales para ese proceso de selección (Ley 1581 de 2012). Sin esa autorización no puedes enviar la postulación. Si eres menor de edad, tu representante legal también debe conocer y autorizar este tratamiento.</p>,
        },
        {
          id: 'derechos',
          titulo: 'Tus derechos',
          children: (
            <>
              <p>Puedes pedir conocer los datos que tenemos sobre ti, actualizarlos o corregirlos, pedir prueba de la autorización que diste, saber cómo se usan tus datos y acceder a ellos sin costo. Cuando la ley lo permita, también puedes pedir la supresión de tus datos o revocar tu autorización.</p>
              <p>Escribe a <EnlaceContacto /> indicando tu nombre completo, el correo de tu cuenta y qué quieres consultar o cambiar. Si no estás de acuerdo con la respuesta, puedes presentar una queja ante la Superintendencia de Industria y Comercio, después de haber hecho tu consulta o reclamo.</p>
              <p><strong>Para revocar tu autorización</strong> o pedir que se eliminen tus datos escribe al mismo correo: la administración retira tu postulación y elimina o anonimiza tus datos.</p>
            </>
          ),
        },
        {
          id: 'conservacion',
          titulo: 'Conservación',
          children: <p>Algunos procesos se conservarán para consulta. Los datos de tu postulación se conservan mientras dure el proyecto formativo; cuando este termine, o antes si lo pides, se eliminan o se anonimizan. SPGTH no elimina cuentas ni documentos de forma automática: la eliminación la realiza la administración, que también puede desactivar una cuenta.</p>,
        },
        {
          id: 'servicios',
          titulo: 'Servicios externos',
          children: <p>Intervienen Google (la tipografía y el acceso opcional con tu cuenta de Google), servicios de alojamiento para la aplicación y sus datos, y un servicio de correo para los códigos de verificación. Más detalle en la página de Cookies.</p>,
        },
        {
          id: 'medidas',
          titulo: 'Cómo se protegen los datos en la aplicación',
          children: (
            <Lista>
              <li>Las contraseñas y los códigos de verificación se guardan como huellas, no en texto legible.</li>
              <li>Los códigos de verificación vencen a los 10 minutos, admiten 3 intentos y sirven una sola vez.</li>
              <li>Hay protección contra peticiones falsas en la sesión y límites de intentos para el inicio de sesión y los códigos.</li>
              <li>Los documentos solo se entregan a quien tiene el permiso y el alcance de ficha correspondientes.</li>
            </Lista>
          ),
        },
      ]}
    />
  )
}
