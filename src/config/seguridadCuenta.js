// Seguridad de la cuenta (establecer o cambiar la contraseña desde la sesión). Está DESACTIVADA por defecto: la pantalla, su
// ruta y sus enlaces solo existen con VITE_SEGURIDAD_CUENTA='true' al arrancar o construir (hoy, solo en el aislado de revisión),
// y el backend la mantiene apagada con SEGURIDAD_CONTRASENA_SESION. Se lee al llamar para poder probar ambos estados.
export const seguridadCuentaActiva = () => import.meta.env.VITE_SEGURIDAD_CUENTA === 'true'
