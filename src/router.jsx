import { Route, Routes } from 'react-router-dom'

import ProtectedRoute from './auth/ProtectedRoute'
import PermissionRoute from './auth/PermissionRoute'
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'

import Login from './pages/login/Login'
import Registro from './pages/login/Registro'
import RecuperarContrasena from './pages/login/RecuperarContrasena'
import VerificarCorreo from './pages/login/VerificarCorreo'
import CompletarFicha from './pages/login/CompletarFicha'
import NotFound from './pages/errores/NotFound'

import Dashboard from './pages/dashboard/Dashboard'
import ConvocatoriasListado from './pages/convocatorias/ConvocatoriasListado'
import ConvocatoriaNueva from './pages/convocatorias/ConvocatoriaNueva'
import ConvocatoriaEditar from './pages/convocatorias/ConvocatoriaEditar'
import ConvocatoriaDetalle from './pages/convocatorias/ConvocatoriaDetalle'
import DocumentosListado from './pages/documentos/DocumentosListado'
import PortafolioDetalle from './pages/documentos/PortafolioDetalle'
import EvaluacionListado from './pages/evaluacion/EvaluacionListado'
import EvaluacionEvaluar from './pages/evaluacion/EvaluacionEvaluar'
import SeleccionRanking from './pages/seleccion/SeleccionRanking'
import SeleccionDecidir from './pages/seleccion/SeleccionDecidir'
import Usuarios from './pages/usuarios/Usuarios'
import Reportes from './pages/reportes/Reportes'
import Supervision from './pages/supervision/Supervision'
import MisPostulaciones from './pages/aspirante/MisPostulaciones'
import DocumentosPostulacion from './pages/aspirante/DocumentosPostulacion'
import MisDocumentos from './pages/aspirante/MisDocumentos'
import MisEvaluaciones from './pages/aspirante/MisEvaluaciones'
import Notificaciones from './pages/aspirante/Notificaciones'

export default function AppRouter() {
  return (
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
          </Route>

          <Route element={<PermissionRoute permiso="seleccion:ver" />}>
            <Route path="seleccion" element={<SeleccionRanking />} />
          </Route>
          <Route element={<PermissionRoute permiso="seleccion:decidir" />}>
            <Route path="seleccion/decidir" element={<SeleccionDecidir />} />
          </Route>

          <Route element={<PermissionRoute permiso="usuarios:gestionar" />}>
            <Route path="usuarios" element={<Usuarios />} />
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
  )
}