import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Settings from './pages/Settings'
import Import from './pages/Import'
import Logs from './pages/Logs'
import KpiDefinitions from './pages/KpiDefinitions'
import ModelRuns from './pages/ModelRuns'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token')
  const user  = JSON.parse(localStorage.getItem('user') || '{}')
  if (!token) return <Navigate to="/login" replace />
  if (user.role !== 'Admin') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"       element={<Login />} />
        <Route path="/register"    element={<Register />} />
        <Route path="/dashboard"   element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/users"       element={<AdminRoute><Users /></AdminRoute>} />
        <Route path="/settings"    element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/import"      element={<AdminRoute><Import /></AdminRoute>} />
        <Route path="/logs"        element={<PrivateRoute><Logs /></PrivateRoute>} />
        <Route path="/kpis"        element={<PrivateRoute><KpiDefinitions /></PrivateRoute>} />
        <Route path="/model-runs"  element={<PrivateRoute><ModelRuns /></PrivateRoute>} />
        <Route path="*"            element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}