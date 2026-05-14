import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { AuthProvider, ProtectedRoute, RoleGuard, useAuth } from './Auth';
import HomeRouterPage from '@/features/dashboard/HomeRouterPage';
import LoginPage from '@/features/auth/LoginPage';
import FeatureGuard from '@/components/FeatureGuard';
import { getDefaultRouteForRole } from './nav';
import { useI18n } from '@/lib/i18n';

const BuildingsPage = lazy(() => import('@/features/buildings/BuildingsPage'));
const ManagementPage = lazy(() => import('@/features/management/ManagementPage'));
const EmployeesPage = lazy(() => import('@/features/employees/EmployeesPage'));
const UsersPage = lazy(() => import('@/features/users/UsersPage'));
const ServicesPage = lazy(() => import('@/features/services/ServicesPage'));
const ServiceDetailPage = lazy(() => import('@/features/services/ServiceDetailPage'));
const ServiceCloseoutPage = lazy(() => import('@/features/services/ServiceCloseoutPage'));
const ServiceReportPrintPage = lazy(() => import('@/features/services/ServiceReportPrintPage'));
const CustomersPage = lazy(() => import('@/features/customers/CustomersPage'));
const AssetsPage = lazy(() => import('@/features/assets/AssetsPage'));
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'));
const AiWorkspacePage = lazy(() => import('@/features/ai/AiWorkspacePage'));
const TechnicianHomePage = lazy(() => import('@/features/technician/TechnicianHomePage'));
const ClientSummaryPage = lazy(() => import('@/features/portal/ClientSummaryPage'));
const ClientServicesPage = lazy(() => import('@/features/portal/ClientServicesPage'));
const ClientReportsPage = lazy(() => import('@/features/portal/ClientReportsPage'));
const ClientSecurePortalPage = lazy(() => import('@/features/portal/ClientSecurePortalPage'));
const GroupsSettingsPage = lazy(() => import('@/features/settings/GroupsSettingsPage'));
const IssuesSettingsPage = lazy(() => import('@/features/settings/IssuesSettingsPage'));
const ContractsSettingsPage = lazy(() => import('@/features/settings/ContractsSettingsPage'));
const LabsSettingsPage = lazy(() => import('@/features/settings/LabsSettingsPage'));
const CalendarSettingsPage = lazy(() => import('@/features/settings/CalendarSettingsPage'));
const CalendarHolidaysPage = lazy(() => import('@/features/settings/CalendarHolidaysPage'));
const CalendarNonWorkingPage = lazy(() => import('@/features/settings/CalendarNonWorkingPage'));
const ServiceTypesSettingsPage = lazy(() => import('@/features/settings/ServiceTypesSettingsPage'));
const TenantAutomationSettingsPage = lazy(() => import('@/features/settings/TenantAutomationSettingsPage'));
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage'));

function RouteLoader() {
  const { t } = useI18n();
  return <div className="p-8 text-sm text-ink-600">{t('common.loading.module')}</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/__qa__/:role" element={<QaRoleEntryRedirect />} />
        <Route path="/portal/access" element={<ClientSecurePortalPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <RoleGuard allow={['owner', 'admin', 'editor', 'view', 'supervisor', 'scheduler', 'operator', 'auditoria']}>
                <FeatureGuard feature="dashboard">
                  <HomeRouterPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="technician"
            element={
              <RoleGuard allow={['technician', 'emergency_scheduler']}>
                <FeatureGuard feature="technicianHome">
                  <TechnicianHomePage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="services"
            element={
              <RoleGuard allow={['owner', 'admin', 'editor', 'view', 'technician', 'emergency_scheduler', 'supervisor', 'scheduler', 'operator', 'auditoria']}>
                <FeatureGuard feature="services">
                  <ServicesPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="services/:serviceOrderId"
            element={
              <RoleGuard allow={['owner', 'admin', 'editor', 'view', 'technician', 'emergency_scheduler', 'supervisor', 'scheduler', 'operator', 'auditoria']}>
                <FeatureGuard feature="services">
                  <ServiceDetailPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="services/:serviceOrderId/print"
            element={
              <RoleGuard allow={['owner', 'admin', 'editor', 'view', 'technician', 'emergency_scheduler', 'supervisor', 'scheduler', 'operator', 'auditoria']}>
                <FeatureGuard feature="services">
                  <ServiceReportPrintPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="services/:serviceOrderId/closeout"
            element={
              <RoleGuard allow={['owner', 'admin', 'editor', 'view', 'technician', 'emergency_scheduler', 'supervisor', 'scheduler', 'operator', 'auditoria']}>
                <FeatureGuard feature="services">
                  <ServiceCloseoutPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="buildings"
            element={
              <RoleGuard allow={['owner', 'admin', 'editor', 'view']}>
                <FeatureGuard feature="buildings">
                  <BuildingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="customers"
            element={
              <RoleGuard allow={['owner', 'admin', 'editor', 'view']}>
                <FeatureGuard feature="customers">
                  <CustomersPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="assets"
            element={
              <RoleGuard allow={['owner', 'admin', 'editor', 'view']}>
                <FeatureGuard feature="assets">
                  <AssetsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="management"
            element={
              <RoleGuard allow={['owner', 'admin', 'editor', 'view']}>
                <FeatureGuard feature="management">
                  <ManagementPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="employees"
            element={
              <RoleGuard allow={['owner', 'admin', 'editor', 'view']}>
                <FeatureGuard feature="employees">
                  <EmployeesPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route path="scheduling" element={<Navigate to="/services" replace />} />
          <Route
            path="notifications"
            element={
              <RoleGuard allow={['owner', 'admin', 'editor', 'view', 'supervisor', 'scheduler', 'operator', 'auditoria']}>
                <NotificationsPage />
              </RoleGuard>
            }
          />
          <Route
            path="reports"
            element={
              <RoleGuard allow={['owner', 'admin', 'editor', 'view', 'supervisor', 'auditoria']}>
                <FeatureGuard feature="reports">
                  <ReportsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="ai"
            element={
              <RoleGuard allow={['owner', 'admin', 'editor', 'view', 'supervisor', 'scheduler', 'operator', 'auditoria']}>
                <FeatureGuard feature="aiWorkspace">
                  <AiWorkspacePage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="users"
            element={
              <RoleGuard allow={['owner', 'admin']}>
                <FeatureGuard feature="users">
                  <UsersPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="portal"
            element={
              <RoleGuard allow={['building_admin', 'client']}>
                <FeatureGuard feature="clientSummary">
                  <ClientSummaryPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="portal/services"
            element={
              <RoleGuard allow={['building_admin', 'client']}>
                <ClientServicesPage />
              </RoleGuard>
            }
          />
          <Route
            path="portal/reports"
            element={
              <RoleGuard allow={['building_admin', 'client']}>
                <ClientReportsPage />
              </RoleGuard>
            }
          />
          <Route
            path="settings"
            element={
              <RoleGuard allow={['owner', 'admin']}>
                <FeatureGuard feature="settings">
                  <Navigate to="/settings/groups" replace />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/groups"
            element={
              <RoleGuard allow={['owner', 'admin']}>
                <FeatureGuard feature="settings">
                  <GroupsSettingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/issues"
            element={
              <RoleGuard allow={['owner', 'admin']}>
                <FeatureGuard feature="settings">
                  <IssuesSettingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/service-types"
            element={
              <RoleGuard allow={['owner', 'admin']}>
                <FeatureGuard feature="settings">
                  <ServiceTypesSettingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/automation"
            element={
              <RoleGuard allow={['owner', 'admin', 'editor', 'building_admin', 'client', 'supervisor']}>
                <FeatureGuard feature="settings">
                  <TenantAutomationSettingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/contracts"
            element={
              <RoleGuard allow={['owner', 'admin']}>
                <FeatureGuard feature="settings">
                  <ContractsSettingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/labs"
            element={
              <RoleGuard allow={['owner', 'admin']}>
                <FeatureGuard feature="settings">
                  <LabsSettingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/calendar"
            element={
              <RoleGuard allow={['owner', 'admin']}>
                <FeatureGuard feature="settings">
                  <CalendarSettingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/calendar/holidays"
            element={
              <RoleGuard allow={['owner', 'admin']}>
                <FeatureGuard feature="settings">
                  <CalendarHolidaysPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/calendar/non-working"
            element={
              <RoleGuard allow={['owner', 'admin']}>
                <FeatureGuard feature="settings">
                  <CalendarNonWorkingPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route path="*" element={<NavigateToRoleHome />} />
        </Route>
      </Routes>
      </Suspense>
    </AuthProvider>
  );
}

function NavigateToRoleHome() {
  return (
    <RoleGuard allow={['owner', 'admin', 'editor', 'view', 'building_admin', 'client', 'technician', 'emergency_scheduler', 'supervisor', 'scheduler', 'operator', 'auditoria']}>
      <RoleAwareRedirect />
    </RoleGuard>
  );
}

function RoleAwareRedirect() {
  const { role } = useAuth();
  return <Navigate to={getDefaultRouteForRole(role)} replace />;
}

function QaRoleEntryRedirect() {
  const params = useParams<{ role: string }>();
  const qaRole = params.role ?? 'admin';
  return <Navigate to={`/login?qa=1&role=${encodeURIComponent(qaRole)}`} replace />;
}
