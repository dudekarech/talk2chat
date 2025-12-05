import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { MainApp } from './MainApp';
import { GlobalAdminLogin } from './pages/GlobalAdmin/GlobalAdminLogin';
import { GlobalAdminLayout } from './pages/GlobalAdmin/GlobalAdminLayout';
import { DashboardHome } from './pages/GlobalAdmin/DashboardHome';
import { Tenants } from './pages/GlobalAdmin/Tenants';
import { Billing } from './pages/GlobalAdmin/Billing';
import { Users } from './pages/GlobalAdmin/Users';
import { Analytics } from './pages/GlobalAdmin/Analytics';
import { Security } from './pages/GlobalAdmin/Security';
import { Notifications } from './pages/GlobalAdmin/Notifications';
import { ProtectedRoute } from './pages/GlobalAdmin/ProtectedRoute';
import { GlobalSharedInbox } from './pages/GlobalAdmin/GlobalSharedInbox';
import { WidgetConfiguration } from './pages/GlobalAdmin/WidgetConfiguration';
import { AgentDashboard } from './pages/AgentDashboard';
import { RoleBasedRedirect } from './components/RoleBasedRedirect';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/app" element={<MainApp />} />

        {/* Role-based dashboard redirect */}
        <Route path="/dashboard" element={<RoleBasedRedirect />} />

        {/* Agent Dashboard */}
        <Route path="/agent/dashboard" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />

        {/* Global Admin Routes */}
        <Route path="/global/admin" element={<GlobalAdminLogin />} />
        <Route path="/global" element={<ProtectedRoute><GlobalAdminLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="inbox" element={<GlobalSharedInbox />} />
          <Route path="widget" element={<WidgetConfiguration />} />
          <Route path="tenants" element={<Tenants />} />
          <Route path="billing" element={<Billing />} />
          <Route path="users" element={<Users />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="security" element={<Security />} />
          <Route path="notifications" element={<Notifications />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;