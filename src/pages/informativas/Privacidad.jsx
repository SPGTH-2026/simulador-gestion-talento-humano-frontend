import PaginaInformativa from '../../components/informativo/PaginaInformativa'
import { CampoPendiente } from '../../components/informativo/Pendiente'
import { EnlaceContacto } from './contactoProyecto'

// Privacidad y tratamiento de datos. «Verificado en el código»: lo que hoy hace la aplicación. «Confirmado por el equipo»: lo que el
// equipo comunicó. «Borrador»: sin aprobar. No se cita ninguna norma ni se redacta una condición jurídica: lo que falta está marcado.
const P = {
  responsable: 'Identidad jurídica del responsable del tratamiento',
  autorizacion: 'Alcance de la autorización institucional',
  conservacion: 'Procesos que se conservan, plazo y procedimiento de conservación y supresión',
  solicitudes: 'Procedimiento y plazos para consultas, correcciones y supresión',
  menores: 'Cómo se obtiene y se registra la autorización del representante legal de usuarios menores',
  finalidades: 'Texto formal de las finalidades del tratamiento',
  proveedores: 'Proveedor de correo y país de almacenamiento en producción',
  version: 'Versión y fecha del texto',
}

const Lista = ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>

export default function Privacidad() {
  return (
    <PaginaInformativa
      titulo="Privacidad y tratamiento de datos"
      introduccion="Qué datos trata SPGTH, quién puede verlos y qué está todavía por definir. Es un borrador para revisión: no está aprobado."
      pendientes={Object.values(P)}
      secciones={[
        {
          id: 'responsable',
          titulo: 'Responsable y contacto',
          tipo: 'confirmado',
          children: (
            <>
              <p>SPGTH es un proyecto académico. Para preguntas sobre tus datos puedes escribir a <EnlaceContacto />.</p>
              <p>Los instructores Edna Margarita Correa y Jarvison Aguilar Uribe son los destinatarios previstos de la entrega del sistema y de la administración de las cuentas. Esto no define quién es el responsable jurídico del tratamiento de datos.</p>
              <p>Quién es el responsable del tratamiento a nivel jurídico: <CampoPendiente dato={P.responsable} /></p>
            </>
          ),
        },
        {
          id: 'datos',
          titulo: 'Qué datos trata hoy la aplicación',
          tipo: 'verificado',
          children: (
            <>
              <Lista>
                <li><strong>Cuenta</strong>: nombre, correo, contraseña, rol y ficha. La contraseña no se guarda tal cual: se guarda su hash, una huella que no permite recuperar la contraseña.</li>
                <li><strong>Acceso con Google</strong> (opcional): nombre, correo e identificador de la cuenta de Google.</li>
                <li><strong>Perfil del aspirante</strong>: sexo, que se usa para decidir si se pide la libreta militar.</li>
                <li><strong>Postulaciones y documentos</strong>: los PDF que cargas (identidad, hoja de vida, certificados, libreta militar y adicionales), sus títulos y notas, y tus skills con certificados.</li>
                <li><strong>Evaluación y selección</strong>: resultados y observaciones de la evaluación, notas de entrevista y prueba técnica, decisiones y su historial.</li>
                <li><strong>Datos técnicos</strong>: dirección IP y navegador de las sesiones, códigos de verificación (se guarda su hash, no el código) y tus notificaciones.</li>
              </Lista>
              <p>En SPGTH pueden aparecer documentos reales y ficticios, y la aplicación no distingue entre unos y otros: se tratan igual.</p>
            </>
          ),
        },
        {
          id: 'acceso',
          titulo: 'Quién puede ver cada información',
          tipo: 'verificado',
          children: (
            <>
              <Lista>
                <li><strong>Tú</strong>: tus postulaciones, documentos, evaluaciones y notificaciones.</li>
                <li><strong>Revisión de documentos</strong> (permiso «ver documentos»): el super administrador, los instructores y los aprendices con subrol general o evaluador. Es solo lectura y se limita a las postulaciones de la ficha de cada uno; el instructor, a sus fichas, y el super administrador, a todas.</li>
                <li><strong>Evaluación</strong>: quienes evalúan ven los resultados de cada postulación y el sexo registrado en el perfil, que se usa para la regla de la libreta militar.</li>
                <li><strong>Selección</strong> (permisos «ver» y «decidir» selección): el super administrador, los instructores, los aprendices con subrol general y los seleccionadores. Ven el nombre del aspirante, el estado y el cumplimiento documental, el resultado, las notas y las decisiones; el ranking no carga los documentos.</li>
                <li><strong>Gestión de usuarios</strong>: el super administrador ve todos los usuarios y el instructor, los de sus fichas más los aspirantes sin ficha: nombre, correo, rol, ficha y si la cuenta está activa.</li>
              </Lista>
              <p>Fuera de su alcance de ficha, una postulación o un documento responde como «no encontrado».</p>
            </>
          ),
        },
        {
          id: 'menores',
          titulo: 'Usuarios menores de edad',
          tipo: 'confirmado',
          children: (
            <>
              <p>Puede haber usuarios menores de edad. Sus datos se tratan igual que los de cualquier otra persona y quedan bajo los mismos permisos de la sección anterior.</p>
              <p>La aplicación hoy no pide la fecha de nacimiento, no verifica la edad ni distingue a una persona menor de otra.</p>
              <p>Participar en el simulador no equivale a celebrar un contrato de aprendizaje ni una contratación real. La documentación laboral que dependa de la edad la coordina otra parte del equipo y no se describe aquí.</p>
              <p>Autorización del representante legal: <CampoPendiente dato={P.menores} /></p>
            </>
          ),
        },
        {
          id: 'finalidades',
          titulo: 'Para qué se usan los datos',
          tipo: 'verificado',
          children: (
            <>
              <p>Los datos se usan para que el simulador funcione: crear tu cuenta, permitirte postularte, evaluar tus documentos, seleccionar candidatos y avisarte de lo que ocurre con tu postulación.</p>
              <p>Redacción formal de las finalidades: <CampoPendiente dato={P.finalidades} /></p>
            </>
          ),
        },
        {
          id: 'autorizacion',
          titulo: 'Autorización y aceptación',
          tipo: 'borrador',
          children: (
            <>
              <p>Hoy la aplicación no te pide aceptar estos textos ni guarda constancia de ninguna aceptación.</p>
              <p>Alcance de la autorización institucional: <CampoPendiente dato={P.autorizacion} /></p>
            </>
          ),
        },
        {
          id: 'conservacion',
          titulo: 'Conservación y supresión',
          tipo: 'confirmado',
          children: (
            <>
              <p>Es un proyecto académico y algunos procesos se conservarán para consulta. Hoy la aplicación no elimina datos automáticamente y no tiene una función para que pidas tú mismo la supresión; un administrador puede desactivar una cuenta.</p>
              <p>Qué se conserva, durante cuánto tiempo y cómo se suprime: <CampoPendiente dato={P.conservacion} /></p>
            </>
          ),
        },
        {
          id: 'derechos',
          titulo: 'Consultas sobre tus datos',
          tipo: 'borrador',
          children: (
            <>
              <p>Puedes escribir a <EnlaceContacto /> con consultas sobre tus datos.</p>
              <p>Cómo se tramitan las consultas, correcciones y supresiones y en cuánto tiempo: <CampoPendiente dato={P.solicitudes} /></p>
            </>
          ),
        },
        {
          id: 'terceros',
          titulo: 'Servicios externos y almacenamiento',
          tipo: 'verificado',
          children: (
            <>
              <p>Intervienen Google (tipografía y acceso opcional con Google), servicios de alojamiento para la aplicación y los datos, y un proveedor de correo para los códigos de verificación.</p>
              <p>Proveedor de correo y país de almacenamiento: <CampoPendiente dato={P.proveedores} /></p>
            </>
          ),
        },
        {
          id: 'seguridad',
          titulo: 'Medidas técnicas del código',
          tipo: 'verificado',
          children: (
            <>
              <p>Esto describe lo que hace el código de la aplicación; no afirma nada sobre la configuración de producción, que no se ha comprobado en esta revisión.</p>
              <Lista>
                <li>Las contraseñas se guardan como hash.</li>
                <li>Los códigos de verificación se guardan como hash, vencen a los 10 minutos, admiten 3 intentos y sirven una sola vez.</li>
                <li>La aplicación incluye protección contra peticiones falsas en la sesión y límites de intentos para el inicio de sesión y los códigos.</li>
                <li>Los documentos solo se entregan a quien tiene el permiso y el alcance de ficha correspondientes.</li>
              </Lista>
            </>
          ),
        },
        {
          id: 'version',
          titulo: 'Versión de este texto',
          tipo: 'borrador',
          children: <p>Identificación de la versión: <CampoPendiente dato={P.version} /></p>,
        },
      ]}
    />
  )
}
