import { lazy, Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import ProtectedRoute from './auth/ProtectedRoute'
import PermissionRoute from './auth/PermissionRoute'
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import PantallaCarga from './components/ui/PantallaCarga'

import Login from './pages/login/Login'
const Registro = lazy(() => import('./pages/login/Registro'))
const RecuperarContrasena = lazy(() => import('./pages/login/RecuperarContrasena'))
const VerificarCorreo = lazy(() => import('./pages/login/VerificarCorreo'))
const CompletarFicha = lazy(() => import('./pages/login/CompletarFicha'))
const NotFound = lazy(() => import('./pages/errores/NotFound'))

import Dashboard from './pages/dashboard/Dashboard'
const ConvocatoriasListado = lazy(() => import('./pages/convocatorias/ConvocatoriasListado'))
const ConvocatoriaNueva = lazy(() => import('./pages/convocatorias/ConvocatoriaNueva'))
const ConvocatoriaEditar = lazy(() => import('./pages/convocatorias/ConvocatoriaEditar'))
const ConvocatoriaDetalle = lazy(() => import('./pages/convocatorias/ConvocatoriaDetalle'))
const DocumentosListado = lazy(() => import('./pages/documentos/DocumentosListado'))
const PortafolioDetalle = lazy(() => import('./pages/documentos/PortafolioDetalle'))
const EvaluacionListado = lazy(() => import('./pages/evaluacion/EvaluacionListado'))
const EvaluacionEvaluar = lazy(() => import('./pages/evaluacion/EvaluacionEvaluar'))
const SeleccionRanking = lazy(() => import('./pages/seleccion/SeleccionRanking'))
const SeleccionDecidir = lazy(() => import('./pages/seleccion/SeleccionDecidir'))
const Usuarios = lazy(() => import('./pages/usuarios/Usuarios'))
const FichasListado = lazy(() => import('./pages/fichas/FichasListado'))
const Reportes = lazy(() => import('./pages/reportes/Reportes'))
const Supervision = lazy(() => import('./pages/supervision/Supervision'))
const MisPostulaciones = lazy(() => import('./pages/aspirante/MisPostulaciones'))
const DocumentosPostulacion = lazy(() => import('./pages/aspirante/DocumentosPostulacion'))
const MisDocumentos = lazy(() => import('./pages/aspirante/MisDocumentos'))
const MisEvaluaciones = lazy(() => import('./pages/aspirante/MisEvaluaciones'))
const Notificaciones = lazy(() => import('./pages/aspirante/Notificaciones'))

export default function AppRouter() {
  // El id distingue una espera de código de otra (cada ruta es una operación).
  const { pathname } = useLocation()

  return (
    <Suspense fallback={<PantallaCarga operacion="codigo" id={pathname} />}>
    <Routes>
      {/* Sin sesión: login, registro y recuperación de contraseña */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar" element={<RecuperarContrasena />} />
      </Route>

      {/* Con sesión. /verificar-correo vive FUERA de AppLayout a propósito:
          ProtectedRoute manda aquí a quien no tenga el correo confirmado, y si
          compartiera layout con las rutas de negocio acabaríamos en un bucle. */}
      <Route element={<ProtectedRoute />}>
        <Route path="/verificar-correo" element={<VerificarCorreo />} />

        {/* El aspirante sin ficha solo puede ver esta pantalla hasta asociarla. */}
        <Route path="/completar-ficha" element={<CompletarFicha />} />

        <Route element={<AppLayout />}>
          <Route element={<PermissionRoute permiso="dashboard:ver" />}>
            <Route index element={<Dashboard />} />
          </Route>

          <Route element={<PermissionRoute permiso="convocatorias:ver" />}>
            <Route path="convocatorias" element={<ConvocatoriasListado />} />
            <Route path="convocatorias/:id" element={<ConvocatoriaDetalle />} />
          </Route>
          <Route element={<PermissionRoute permiso="convocatorias:gestionar" />}>
            <Route path="convocatorias/nueva" element={<ConvocatoriaNueva />} />
            <Route path="convocatorias/:id/editar" element={<ConvocatoriaEditar />} />
          </Route>

          <Route element={<PermissionRoute permiso="usuarios:gestionar" />}>
            <Route path="documentos" element={<DocumentosListado />} />
            <Route path="documentos/:userId" element={<PortafolioDetalle />} />
          </Route>

          <Route element={<PermissionRoute permiso="evaluacion:ver" />}>
            <Route path="evaluacion" element={<EvaluacionListado />} />
          </Route>
          <Route element={<PermissionRoute permiso="evaluacion:evaluar" />}>
            <Route path="evaluacion/evaluar" element={<EvaluacionEvaluar />} />
            <Route path="evaluacion/evaluar/:postulacionId" element={<EvaluacionEvaluar />} />
          </Route>

          <Route element={<PermissionRoute permiso="seleccion:ver" />}>
            <Route path="seleccion" element={<SeleccionRanking />} />
          </Route>
          <Route element={<PermissionRoute permiso="seleccion:decidir" />}>
            <Route path="seleccion/decidir" element={<SeleccionDecidir />} />
          </Route>

          <Route element={<PermissionRoute permiso="usuarios:gestionar" />}>
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="fichas" element={<FichasListado />} />
          </Route>
          <Route element={<PermissionRoute permiso="reportes:ver" />}>
            <Route path="reportes" element={<Reportes />} />
          </Route>
          <Route element={<PermissionRoute permiso="supervision:gestionar" />}>
            <Route path="supervision" element={<Supervision />} />
          </Route>

          <Route element={<PermissionRoute permiso="propio:postulaciones" />}>
            <Route path="mis-postulaciones" element={<MisPostulaciones />} />
          </Route>
          <Route element={<PermissionRoute permiso="propio:documentos" />}>
            <Route path="mis-documentos" element={<MisDocumentos />} />
            {/* Paso de documentos/skills de UNA postulación propia. Va aquí
                porque el backend lo protege con el permiso 'propio:documentos'. */}
            <Route path="postulaciones/:id/documentos" element={<DocumentosPostulacion />} />
          </Route>
          <Route element={<PermissionRoute permiso="propio:evaluaciones" />}>
            <Route path="mis-evaluaciones" element={<MisEvaluaciones />} />
          </Route>
          <Route element={<PermissionRoute permiso="propio:notificaciones" />}>
            <Route path="notificaciones" element={<Notificaciones />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
    </Suspense>
  )
}
