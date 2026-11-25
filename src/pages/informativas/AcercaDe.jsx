import PaginaInformativa from '../../components/informativo/PaginaInformativa'
import { CampoPendiente } from '../../components/informativo/Pendiente'

// Acerca de SPGTH. Solo hechos confirmados: proyecto formativo del equipo ADSO de la ficha 3173334 que simula convocatorias,
// evaluación y selección. No se presenta como sistema oficial del SENA ni se atribuyen responsabilidades a personas.
const P = {
  relacion: 'Descripción de la relación con el SENA',
  contacto: 'Medio de contacto',
  alcance: 'Alcance de la simulación respecto a datos reales',
  version: 'Versión y fecha del texto',
}

export default function AcercaDe() {
  return (
    <PaginaInformativa
      titulo="Acerca de SPGTH"
      introduccion="SPGTH es el Simulador de Procesos de Gestión de Talento Humano."
      pendientes={Object.values(P)}
      secciones={[
        {
          id: 'proposito',
          titulo: 'Propósito formativo',
          tipo: 'confirmado',
          children: (
            <>
              <p>
                SPGTH es un proyecto formativo del equipo ADSO de la ficha 3173334. Su propósito es aprender haciendo: construir y probar,
                como ejercicio de formación, un sistema que recorre las etapas de una convocatoria.
              </p>
            </>
          ),
        },
        {
          id: 'simulacion',
          titulo: 'Qué simula',
          tipo: 'verificado',
          children: (
            <>
              <p>La aplicación simula, de principio a fin, tres procesos:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>La <strong>convocatoria</strong>: su creación, publicación, postulación y documentos requeridos.</li>
                <li>La <strong>evaluación</strong> de los documentos de cada aspirante, con correcciones.</li>
                <li>La <strong>selección</strong>: preselección, ranking de candidatos y decisiones.</li>
              </ul>
              <p>
                Alcance de la simulación respecto a datos reales: <CampoPendiente dato={P.alcance} />
              </p>
            </>
          ),
        },
        {
          id: 'sena',
          titulo: 'Relación con el SENA',
          tipo: 'confirmado',
          children: (
            <>
              <p>SPGTH no se presenta como un sistema oficial del SENA.</p>
              <p>
                Descripción de la relación del proyecto con el SENA: <CampoPendiente dato={P.relacion} />
              </p>
            </>
          ),
        },
        {
          id: 'contacto',
          titulo: 'Contacto',
          tipo: 'borrador',
          children: (
            <p>
              Cómo comunicarse con el equipo: <CampoPendiente dato={P.contacto} />
            </p>
          ),
        },
        {
          id: 'version',
          titulo: 'Versión de este texto',
          tipo: 'borrador',
          children: (
            <p>
              <CampoPendiente dato={P.version} />
            </p>
          ),
        },
      ]}
    />
  )
}
