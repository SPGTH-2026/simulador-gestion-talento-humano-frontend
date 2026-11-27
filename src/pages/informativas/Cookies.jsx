import DocumentoLegal from '../../components/informativo/DocumentoLegal'
import { EnlaceContacto } from './contactoProyecto'
import { CLASE_CHIP, CLASE_TEXTO_SUAVE } from '../../lib/estilos'

const FILAS = [
  ['Cookie de sesión', 'Cookie', 'Mantiene tu sesión iniciada. Es necesaria para entrar.', 'Necesaria'],
  ['XSRF-TOKEN', 'Cookie', 'Protege los formularios y las acciones contra peticiones falsas. Es necesaria.', 'Necesaria'],
  ['spgth-tema', 'Almacenamiento local', 'Recuerda si prefieres el modo claro o el oscuro.', 'Preferencia'],
  ['Avance de verificación y último filtro de Selección', 'Almacenamiento de la pestaña', 'Recuerda el avance del código de verificación y el último filtro elegido mientras la pestaña está abierta.', 'Funcional'],
]

export default function Cookies() {
  return (
    <DocumentoLegal
      titulo="Cookies"
      introduccion="Qué guarda SPGTH en tu navegador y qué servicios externos intervienen."
      secciones={[
        {
          id: 'que-se-guarda',
          titulo: 'Qué se guarda en tu navegador',
          children: (
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
          ),
        },
        {
          id: 'opcionales',
          titulo: 'Análisis y publicidad',
          children: <p>SPGTH no usa cookies de análisis, de publicidad ni de seguimiento de terceros. Por eso no hay un aviso para aceptarlas o rechazarlas.</p>,
        },
        {
          id: 'externos',
          titulo: 'Servicios externos',
          children: (
            <ul className="list-disc space-y-1 pl-5">
              <li><strong>Google Fonts</strong>: la tipografía se descarga de los servidores de Google al abrir la aplicación, lo que les permite ver la dirección IP de quien visita.</li>
              <li><strong>Acceso con Google</strong>: solo interviene si eliges entrar con tu cuenta de Google.</li>
              <li><strong>Correo electrónico</strong>: se usa un servicio de envío para los códigos de verificación.</li>
            </ul>
          ),
        },
        { id: 'contacto', titulo: 'Contacto', children: <p>Para preguntas sobre esta página escribe a <EnlaceContacto />.</p> },
      ]}
    />
  )
}
