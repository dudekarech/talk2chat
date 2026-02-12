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
import { TicketManagement } from './pages/GlobalAdmin/TicketManagement';
import { ProtectedRoute } from './pages/GlobalAdmin/ProtectedRoute';
import { GlobalSharedInbox } from './pages/GlobalAdmin/GlobalSharedInbox';
import { WidgetConfiguration } from './pages/GlobalAdmin/WidgetConfiguration';
import { AgentDashboard } from './pages/AgentDashboard';
import { RoleBasedRedirect } from './components/RoleBasedRedirect';
import { AuthenticatedRoute } from './components/AuthenticatedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TenantsManagement } from './pages/GlobalAdmin/TenantsManagement';
import { TenantLayout } from './pages/Tenant/TenantLayout';
import { TenantDashboardHome } from './pages/Tenant/TenantDashboardHome';
import { TenantWidgetConfiguration } from './pages/Tenant/TenantWidgetConfiguration';
import { SupportTickets } from './pages/Tenant/SupportTickets';
import { TenantNotifications } from './pages/Tenant/Notifications';
import { Settings as TenantSettings } from './pages/Tenant/Settings';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Cookies } from './pages/Cookies';
import { About } from './pages/About';
import { Careers } from './pages/Careers';
import { WidgetEmbedPage } from './pages/WidgetEmbedPage';
import { VisitorIntelligence } from './pages/GlobalAdmin/VisitorIntelligence';
import { TenantIntelligence } from './pages/Tenant/TenantIntelligence';


const App: React.FC = () => {
  // SPECIAL BYPASS: If loaded via /widget-embed (server path), render directly
  // This is used for iframe embedding to bypass X-Frame-Options DENY on the root path
  if (window.location.pathname === '/widget-embed') {
    return <WidgetEmbedPage />;
  }

  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/app" element={<MainApp />} />

          {/* Static Pages */}
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/about" element={<About />} />
          <Route path="/careers" element={<Careers />} />

          {/* Role-based dashboard redirect */}
          <Route path="/dashboard" element={<RoleBasedRedirect />} />

          {/* Agent Dashboard */}
          <Route path="/agent/dashboard" element={<AuthenticatedRoute><AgentDashboard /></AuthenticatedRoute>} />

          {/* Tenant Routes */}
          <Route path="/tenant" element={<TenantLayout />}>
            <Route path="dashboard" element={<TenantDashboardHome />} />
            <Route path="widget" element={<TenantWidgetConfiguration />} />
            <Route path="team" element={<Users />} />
            <Route path="chats" element={<GlobalSharedInbox isGlobalMode={false} />} />
            <Route path="settings" element={<TenantSettings />} />
            <Route path="analytics" element={<TenantDashboardHome />} /> {/* Placeholder */}
            <Route path="support" element={<SupportTickets />} />
            <Route path="notifications" element={<TenantNotifications />} />
            <Route path="intelligence" element={<TenantIntelligence />} />
            <Route index element={<Navigate to="dashboard" replace />} />

          </Route>

          {/* Global Admin Routes */}
          <Route path="/global/admin" element={<GlobalAdminLogin />} />
          <Route path="/global" element={<ProtectedRoute><GlobalAdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="inbox" element={<GlobalSharedInbox isGlobalMode={true} />} />
            <Route path="widget" element={<WidgetConfiguration forceGlobal={true} />} />
            <Route path="tenants" element={<TenantsManagement />} />
            <Route path="billing" element={<Billing />} />
            <Route path="users" element={<Users />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="security" element={<Security />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="intelligence" element={<VisitorIntelligence />} />
            <Route path="tickets" element={<TicketManagement />} />

            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route path="/widget-embed" element={<WidgetEmbedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;