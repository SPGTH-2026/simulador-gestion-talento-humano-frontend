import PaginaInformativa from '../../components/informativo/PaginaInformativa'
import { CampoPendiente } from '../../components/informativo/Pendiente'

// Privacidad y tratamiento de datos. Las secciones «verificadas» describen lo que hoy hace el código; las demás son estructura con
// datos pendientes. Ninguna finalidad, plazo, autorización ni condición jurídica está redactada.
const P = {
  responsable: 'Responsable del tratamiento',
  contacto: 'Correo o canal de contacto',
  finalidades: 'Finalidades del tratamiento',
  autorizacion: 'Forma de autorización y su registro',
  datosReales: 'Si se permiten datos reales, ficticios o ambos',
  menores: 'Tratamiento de datos de menores de edad',
  conservacion: 'Plazos de conservación y supresión',
  derechos: 'Cómo ejercer los derechos y plazos de respuesta',
  proveedores: 'Proveedores y país de almacenamiento en producción',
  seguridad: 'Descripción aprobada de las medidas de seguridad',
  version: 'Versión y fecha del texto',
}

const Pendiente = ({ texto, dato }) => (
  <p>
    {texto} <CampoPendiente dato={dato} />
  </p>
)

export default function Privacidad() {
  return (
    <PaginaInformativa
      titulo="Privacidad y tratamiento de datos"
      introduccion="Estructura de la información sobre datos personales en SPGTH. Las partes técnicas describen lo que hoy hace la aplicación; lo jurídico está pendiente."
      pendientes={Object.values(P)}
      secciones={[
        {
          id: 'responsable',
          titulo: 'Responsable y contacto',
          tipo: 'borrador',
          children: (
            <>
              <Pendiente texto="Quién es el responsable:" dato={P.responsable} />
              <Pendiente texto="Cómo contactarlo:" dato={P.contacto} />
            </>
          ),
        },
        {
          id: 'datos',
          titulo: 'Qué datos trata hoy la aplicación',
          tipo: 'verificado',
          children: (
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Cuenta</strong>: nombre, correo, contraseña (guardada cifrada), rol y ficha.</li>
              <li><strong>Acceso con Google</strong>: nombre, correo e identificador de la cuenta de Google.</li>
              <li><strong>Perfil del aspirante</strong>: sexo (se usa para decidir si se pide la libreta militar).</li>
              <li><strong>Postulaciones y documentos</strong>: los PDF que cargas (identidad, hoja de vida, certificados, libreta militar y adicionales), sus títulos y notas, y tus skills con certificados.</li>
              <li><strong>Evaluación y selección</strong>: resultados, observaciones, decisiones y su historial.</li>
              <li><strong>Datos técnicos</strong>: dirección IP y navegador de las sesiones, y tus notificaciones.</li>
            </ul>
          ),
        },
        {
          id: 'acceso',
          titulo: 'Quién puede ver cada información',
          tipo: 'verificado',
          children: (
            <ul className="list-disc space-y-1 pl-5">
              <li>Cada aspirante ve solo lo suyo.</li>
              <li>Instructores y aprendices con permisos de evaluación o selección ven la información de las postulaciones de su ficha.</li>
              <li>El administrador ve toda la información.</li>
            </ul>
          ),
        },
        {
          id: 'finalidades',
          titulo: 'Finalidades y autorización',
          tipo: 'borrador',
          children: (
            <>
              <Pendiente texto="Para qué se usan los datos:" dato={P.finalidades} />
              <Pendiente texto="Cómo se autoriza y se deja constancia:" dato={P.autorizacion} />
              <Pendiente texto="Tipo de datos admitidos:" dato={P.datosReales} />
              <Pendiente texto="Datos de menores de edad:" dato={P.menores} />
            </>
          ),
        },
        {
          id: 'conservacion',
          titulo: 'Conservación y supresión',
          tipo: 'borrador',
          children: (
            <>
              <p>Hoy la aplicación no elimina datos automáticamente ni tiene plazos definidos.</p>
              <Pendiente texto="Plazos y procedimiento:" dato={P.conservacion} />
            </>
          ),
        },
        {
          id: 'derechos',
          titulo: 'Tus derechos',
          tipo: 'borrador',
          children: <Pendiente texto="Cómo consultar, corregir o suprimir tus datos y cuánto tarda la respuesta:" dato={P.derechos} />,
        },
        {
          id: 'terceros',
          titulo: 'Servicios externos y almacenamiento',
          tipo: 'verificado',
          children: (
            <>
              <p>Intervienen Google (tipografía y acceso opcional con Google), un proveedor de alojamiento para la aplicación y los datos, y un proveedor de correo para los códigos de verificación.</p>
              <Pendiente texto="Proveedores concretos y país en producción:" dato={P.proveedores} />
            </>
          ),
        },
        {
          id: 'seguridad',
          titulo: 'Seguridad',
          tipo: 'borrador',
          children: <Pendiente texto="Medidas de seguridad descritas y aprobadas:" dato={P.seguridad} />,
        },
        {
          id: 'version',
          titulo: 'Versión de este texto',
          tipo: 'borrador',
          children: <Pendiente texto="Identificación de la versión:" dato={P.version} />,
        },
      ]}
    />
  )
}
