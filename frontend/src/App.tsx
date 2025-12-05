import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SuperadminDashboard from './pages/SuperadminDashboard'
import CompanyDashboard from './pages/CompanyDashboard'
import AgentPanel from './pages/AgentPanel'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected routes */}
          <Route path="/superadmin" element={
            <ProtectedRoute requiredRole="SUPERADMIN">
              <SuperadminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/company" element={
            <ProtectedRoute requiredRole="COMPANY_ADMIN">
              <CompanyDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/agent" element={
            <ProtectedRoute requiredRole="AGENT">
              <AgentPanel />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
