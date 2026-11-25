import PaginaInformativa from '../../components/informativo/PaginaInformativa'
import { CampoPendiente } from '../../components/informativo/Pendiente'
import { CLASE_CHIP, CLASE_TEXTO_SUAVE } from '../../lib/estilos'

// Información sobre cookies. La tabla describe lo que hoy hace el código (verificado); la configuración de producción y cualquier
// uso opcional futuro quedan pendientes. No hay banner ni consentimiento: hoy no existen usos opcionales.
const P = {
  duracion: 'Duración real de la sesión en producción',
  proveedor: 'Proveedor del envío de correos de verificación en producción',
  opcional: 'Decisión sobre usos opcionales futuros (analítica u otros)',
  contacto: 'Medio de contacto',
}

const FILAS = [
  ['laravel-session', 'Cookie (servidor)', 'Mantiene la sesión iniciada. Necesaria para entrar.', 'Necesaria'],
  ['XSRF-TOKEN', 'Cookie', 'Protege los formularios y acciones contra peticiones falsas. Necesaria.', 'Necesaria'],
  ['spgth-tema', 'Almacenamiento local', 'Recuerda si prefieres modo claro u oscuro.', 'Preferencia'],
  ['Estado de verificación y filtro de Selección', 'Almacenamiento de sesión', 'Recuerda el avance del código de verificación y el último filtro elegido mientras la pestaña está abierta.', 'Funcional'],
]

export default function Cookies() {
  return (
    <PaginaInformativa
      titulo="Información sobre cookies"
      introduccion="Qué guarda SPGTH en tu navegador hoy y qué servicios externos intervienen."
      pendientes={Object.values(P)}
      secciones={[
        {
          id: 'hoy',
          titulo: 'Qué se guarda hoy en tu navegador',
          tipo: 'verificado',
          children: (
            <>
              {/* Lista y no tabla: en el teléfono una tabla de cuatro columnas obligaba a desplazar de lado para leer el «para qué sirve». */}
              <ul aria-label="Cookies y almacenamiento del navegador que usa SPGTH" className="flex flex-col divide-y divide-sena-linea/70 dark:divide-sena-borde/50">
                {FILAS.map(([nombre, tipo, uso, clase]) => (
                  <li key={nombre} className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0">
                    <p className="font-semibold text-slate-800 [overflow-wrap:anywhere] dark:text-sena-texto">{nombre}</p>
                    <p className="flex flex-wrap gap-2">
                      <span className={CLASE_CHIP}>{tipo}</span>
                      <span className={CLASE_CHIP}>{clase}</span>
                    </p>
                    <p className={CLASE_TEXTO_SUAVE}>{uso}</p>
                  </li>
                ))}
              </ul>
              <p>
                Duración de la sesión en producción: <CampoPendiente dato={P.duracion} />
              </p>
            </>
          ),
        },
        {
          id: 'opcionales',
          titulo: 'Usos opcionales',
          tipo: 'verificado',
          children: (
            <>
              <p>El código actual no incluye cookies de análisis, publicidad ni seguimiento de terceros.</p>
              <p>
                Si más adelante se añadiera un uso opcional, se pediría un consentimiento propio y separado. Decisión:{' '}
                <CampoPendiente dato={P.opcional} />
              </p>
            </>
          ),
        },
        {
          id: 'externos',
          titulo: 'Servicios externos que intervienen',
          tipo: 'verificado',
          children: (
            <>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Google Fonts</strong>: la tipografía se descarga de los servidores de Google al abrir la aplicación, lo que les permite ver la dirección IP de quien visita.</li>
                <li><strong>Acceso con Google</strong>: solo si eliges entrar con tu cuenta de Google.</li>
                <li><strong>Envío de correos de verificación</strong>: proveedor en producción <CampoPendiente dato={P.proveedor} />.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'contacto',
          titulo: 'Contacto',
          tipo: 'borrador',
          children: (
            <p>
              Para preguntas sobre esta página: <CampoPendiente dato={P.contacto} />
            </p>
          ),
        },
      ]}
    />
  )
}
