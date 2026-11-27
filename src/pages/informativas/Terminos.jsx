import { Link } from 'react-router-dom'
import DocumentoLegal from '../../components/informativo/DocumentoLegal'
import { EnlaceContacto } from './contactoProyecto'

const Lista = ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>
const Enlace = ({ href, children }) => (
  <Link className="font-semibold text-sena-oscuro underline underline-offset-4 dark:text-sena-acento" to={href}>{children}</Link>
)

export default function Terminos() {
  return (
    <DocumentoLegal
      titulo="Términos de uso"
      introduccion="Qué es SPGTH, quién puede participar y cómo funcionan las cuentas y los documentos."
      secciones={[
        {
          id: 'que-es',
          titulo: 'Qué es SPGTH',
          children: (
            <>
              <p>SPGTH es un simulador académico de procesos de gestión de talento humano. Recorre una convocatoria hasta la decisión de selección, sin contratación real: participar no equivale a firmar un contrato de aprendizaje ni de trabajo.</p>
              <p>No es un sistema oficial del SENA.</p>
            </>
          ),
        },
        {
          id: 'quien',
          titulo: 'Quién puede participar',
          children: (
            <>
              <p>Pueden participar personas mayores y menores de edad. Si eres menor de edad, la postulación pide además los datos de tu representante legal; su autorización se firma en persona al momento de la contratación.</p>
              <p>Qué datos se piden y cómo se tratan está en <Enlace href="/privacidad">Privacidad</Enlace>.</p>
            </>
          ),
        },
        {
          id: 'cuenta',
          titulo: 'Tu cuenta',
          children: (
            <>
              <p>Entras con tu correo y contraseña o, si lo prefieres, con tu cuenta de Google. Si olvidas la contraseña, la recuperas desde «¿Olvidaste tu contraseña?» con un código que llega a tu correo.</p>
              <p>Lo que puedes ver y hacer depende del rol y de los permisos de tu cuenta. La administración puede activar o desactivar cuentas y cambiar roles. Edna Margarita Correa y Jarvison Aguilar Uribe recibirán el sistema y las cuentas.</p>
            </>
          ),
        },
        {
          id: 'documentos',
          titulo: 'Documentos que cargas',
          children: (
            <>
              <p>Los documentos se cargan en PDF y pueden ser reales o ficticios. Los ven las personas con permiso de revisión, dentro del alcance de cada ficha; también los ven quienes evalúan y seleccionan cuando su etapa lo requiere.</p>
            </>
          ),
        },
        {
          id: 'proceso',
          titulo: 'Qué pasa con tu postulación',
          children: (
            <>
              <Lista>
                <li>Envías tu postulación con tus datos personales, tu autorización y los documentos obligatorios.</li>
                <li>Se evalúan los documentos y, si hace falta, se te pide corregir alguno.</li>
                <li>Si avanzas, hay preselección, posibles citaciones y una decisión.</li>
              </Lista>
              <p>Todo esto ocurre dentro de la simulación: las decisiones no equivalen a una contratación real.</p>
            </>
          ),
        },
        {
          id: 'conservacion',
          titulo: 'Conservación',
          children: <p>Algunos procesos se conservarán para consulta. SPGTH no elimina cuentas ni documentos de forma automática.</p>,
        },
        {
          id: 'contacto',
          titulo: 'Contacto',
          children: <p>Si tienes preguntas sobre estos términos escribe a <EnlaceContacto />.</p>,
        },
      ]}
    />
  )
}
