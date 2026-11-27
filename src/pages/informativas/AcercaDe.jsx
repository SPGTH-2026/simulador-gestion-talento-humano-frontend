import { Link } from 'react-router-dom'
import DocumentoLegal from '../../components/informativo/DocumentoLegal'
import { EnlaceContacto } from './contactoProyecto'

const Lista = ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>

export default function AcercaDe() {
  return (
    <DocumentoLegal
      titulo="Acerca de SPGTH"
      introduccion="SPGTH es el Simulador de Procesos de Gestión de Talento Humano: un proyecto académico para practicar, de principio a fin, cómo se gestiona una convocatoria."
      secciones={[
        {
          id: 'proyecto',
          titulo: 'Un proyecto académico de simulación',
          children: (
            <>
              <p>SPGTH se construyó como ejercicio de formación. Simula los procesos de una convocatoria; no es una contratación real y participar en él no equivale a firmar un contrato de aprendizaje ni de trabajo.</p>
            </>
          ),
        },
        {
          id: 'simula',
          titulo: 'Qué simula',
          children: (
            <>
              <p>El recorrido llega hasta la decisión de selección:</p>
              <Lista>
                <li><strong>Convocatoria</strong>: se publica, las personas se postulan y adjuntan los documentos que se piden.</li>
                <li><strong>Evaluación</strong>: se revisan los documentos de cada postulación y se pueden pedir correcciones.</li>
                <li><strong>Selección</strong>: preselección, ranking, citaciones y decisión.</li>
              </Lista>
            </>
          ),
        },
        {
          id: 'participan',
          titulo: 'Quiénes participan',
          children: (
            <>
              <p>Cada persona ve solo lo que le corresponde según el rol y los permisos de su cuenta: quienes se postulan, quienes evalúan y seleccionan, los instructores y la administración. También participan aprendices autorizados para revisar documentos.</p>
              <p>En el simulador se usan documentos reales y ficticios, y pueden participar personas menores de edad. Cómo se cuidan esos datos se explica en <Link className="font-semibold text-sena-oscuro underline underline-offset-4 dark:text-sena-acento" to="/privacidad">Privacidad</Link>.</p>
            </>
          ),
        },
        {
          id: 'entrega',
          titulo: 'Entrega del sistema',
          children: (
            <>
              <p>Los instructores Edna Margarita Correa y Jarvison Aguilar Uribe recibirán el sistema y las cuentas.</p>
              <p>Algunos procesos se conservarán para consulta.</p>
            </>
          ),
        },
        {
          id: 'contacto',
          titulo: 'Contacto',
          children: <p>Para preguntas sobre SPGTH escribe a <EnlaceContacto />.</p>,
        },
      ]}
    />
  )
}
