import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { AuthProvider, ProtectedRoute, RoleGuard } from './Auth';
import HomeRouterPage from '@/features/dashboard/HomeRouterPage';
import LoginPage from '@/features/auth/LoginPage';
import FeatureGuard from '@/components/FeatureGuard';

const BuildingsPage = lazy(() => import('@/features/buildings/BuildingsPage'));
const ManagementPage = lazy(() => import('@/features/management/ManagementPage'));
const EmployeesPage = lazy(() => import('@/features/employees/EmployeesPage'));
const SchedulingPage = lazy(() => import('@/features/scheduling/SchedulingPage'));
const UsersPage = lazy(() => import('@/features/users/UsersPage'));
const BuildingAdminPage = lazy(() => import('@/features/buildingAdmin/BuildingAdminPage'));
const ServicesPage = lazy(() => import('@/features/services/ServicesPage'));
const ServiceDetailPage = lazy(() => import('@/features/services/ServiceDetailPage'));
const ServiceCloseoutPage = lazy(() => import('@/features/services/ServiceCloseoutPage'));
const CustomersPage = lazy(() => import('@/features/customers/CustomersPage'));
const AssetsPage = lazy(() => import('@/features/assets/AssetsPage'));
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'));
const AiWorkspacePage = lazy(() => import('@/features/ai/AiWorkspacePage'));
const TechnicianHomePage = lazy(() => import('@/features/technician/TechnicianHomePage'));
const ClientSummaryPage = lazy(() => import('@/features/portal/ClientSummaryPage'));
const GroupsSettingsPage = lazy(() => import('@/features/settings/GroupsSettingsPage'));
const IssuesSettingsPage = lazy(() => import('@/features/settings/IssuesSettingsPage'));
const ContractsSettingsPage = lazy(() => import('@/features/settings/ContractsSettingsPage'));
const LabsSettingsPage = lazy(() => import('@/features/settings/LabsSettingsPage'));
const CalendarSettingsPage = lazy(() => import('@/features/settings/CalendarSettingsPage'));
const CalendarHolidaysPage = lazy(() => import('@/features/settings/CalendarHolidaysPage'));
const CalendarNonWorkingPage = lazy(() => import('@/features/settings/CalendarNonWorkingPage'));
const ServiceTypesSettingsPage = lazy(() => import('@/features/settings/ServiceTypesSettingsPage'));
const TenantAutomationSettingsPage = lazy(() => import('@/features/settings/TenantAutomationSettingsPage'));

function RouteLoader() {
  return <div className="p-8 text-sm text-ink-600">Cargando modulo...</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
              <RoleGuard allow={['admin', 'editor', 'view', 'supervisor', 'scheduler', 'operator', 'auditoria']}>
                <FeatureGuard feature="dashboard">
                  <HomeRouterPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="technician"
            element={
              <RoleGuard allow={['emergency_scheduler']}>
                <FeatureGuard feature="technicianHome">
                  <TechnicianHomePage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="services"
            element={
              <RoleGuard allow={['admin', 'editor', 'view', 'emergency_scheduler', 'supervisor', 'scheduler', 'operator', 'auditoria']}>
                <FeatureGuard feature="services">
                  <ServicesPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="services/:serviceOrderId"
            element={
              <RoleGuard allow={['admin', 'editor', 'view', 'emergency_scheduler', 'supervisor', 'scheduler', 'operator', 'auditoria']}>
                <FeatureGuard feature="services">
                  <ServiceDetailPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="services/:serviceOrderId/closeout"
            element={
              <RoleGuard allow={['admin', 'editor', 'view', 'emergency_scheduler', 'supervisor', 'scheduler', 'operator', 'auditoria']}>
                <FeatureGuard feature="services">
                  <ServiceCloseoutPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="buildings"
            element={
              <RoleGuard allow={['admin', 'editor', 'view']}>
                <FeatureGuard feature="buildings">
                  <BuildingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="customers"
            element={
              <RoleGuard allow={['admin', 'editor', 'view']}>
                <FeatureGuard feature="customers">
                  <CustomersPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="assets"
            element={
              <RoleGuard allow={['admin', 'editor', 'view']}>
                <FeatureGuard feature="assets">
                  <AssetsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="management"
            element={
              <RoleGuard allow={['admin', 'editor', 'view']}>
                <FeatureGuard feature="management">
                  <ManagementPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="employees"
            element={
              <RoleGuard allow={['admin', 'editor', 'view']}>
                <FeatureGuard feature="employees">
                  <EmployeesPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="scheduling"
            element={
              <RoleGuard allow={['admin', 'editor', 'scheduler', 'supervisor', 'emergency_scheduler']}>
                <FeatureGuard feature="scheduling">
                  <SchedulingPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="reports"
            element={
              <RoleGuard allow={['admin', 'editor', 'view', 'supervisor', 'auditoria']}>
                <FeatureGuard feature="reports">
                  <ReportsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="ai"
            element={
              <RoleGuard allow={['admin', 'editor', 'view', 'supervisor', 'scheduler', 'operator', 'auditoria']}>
                <FeatureGuard feature="aiWorkspace">
                  <AiWorkspacePage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="users"
            element={
              <RoleGuard allow={['admin']}>
                <FeatureGuard feature="users">
                  <UsersPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="portal"
            element={
              <RoleGuard allow={['building_admin']}>
                <FeatureGuard feature="clientSummary">
                  <ClientSummaryPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="portal/services"
            element={
              <RoleGuard allow={['building_admin']}>
                <BuildingAdminPage />
              </RoleGuard>
            }
          />
          <Route
            path="portal/reports"
            element={
              <RoleGuard allow={['building_admin']}>
                <BuildingAdminPage />
              </RoleGuard>
            }
          />
          <Route
            path="settings"
            element={
              <RoleGuard allow={['admin']}>
                <FeatureGuard feature="settings">
                  <Navigate to="/settings/groups" replace />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/groups"
            element={
              <RoleGuard allow={['admin']}>
                <FeatureGuard feature="settings">
                  <GroupsSettingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/issues"
            element={
              <RoleGuard allow={['admin']}>
                <FeatureGuard feature="settings">
                  <IssuesSettingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/service-types"
            element={
              <RoleGuard allow={['admin']}>
                <FeatureGuard feature="settings">
                  <ServiceTypesSettingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/automation"
            element={
              <RoleGuard allow={['admin', 'editor', 'building_admin', 'client', 'supervisor']}>
                <FeatureGuard feature="settings">
                  <TenantAutomationSettingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/contracts"
            element={
              <RoleGuard allow={['admin']}>
                <FeatureGuard feature="settings">
                  <ContractsSettingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/labs"
            element={
              <RoleGuard allow={['admin']}>
                <FeatureGuard feature="settings">
                  <LabsSettingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/calendar"
            element={
              <RoleGuard allow={['admin']}>
                <FeatureGuard feature="settings">
                  <CalendarSettingsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/calendar/holidays"
            element={
              <RoleGuard allow={['admin']}>
                <FeatureGuard feature="settings">
                  <CalendarHolidaysPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="settings/calendar/non-working"
            element={
              <RoleGuard allow={['admin']}>
                <FeatureGuard feature="settings">
                  <CalendarNonWorkingPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
        </Route>
      </Routes>
      </Suspense>
    </AuthProvider>
  );
}
