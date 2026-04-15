import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { AuthProvider, ProtectedRoute, RoleGuard } from './Auth';
import HomeRouterPage from '@/features/dashboard/HomeRouterPage';
import BuildingsPage from '@/features/buildings/BuildingsPage';
import ManagementPage from '@/features/management/ManagementPage';
import EmployeesPage from '@/features/employees/EmployeesPage';
import SchedulingPage from '@/features/scheduling/SchedulingPage';
import LoginPage from '@/features/auth/LoginPage';
import UsersPage from '@/features/users/UsersPage';
import FeatureGuard from '@/components/FeatureGuard';
import BuildingAdminPage from '@/features/buildingAdmin/BuildingAdminPage';
import ServicesPage from '@/features/services/ServicesPage';
import ServiceDetailPage from '@/features/services/ServiceDetailPage';
import ServiceCloseoutPage from '@/features/services/ServiceCloseoutPage';
import CustomersPage from '@/features/customers/CustomersPage';
import AssetsPage from '@/features/assets/AssetsPage';
import ReportsPage from '@/features/reports/ReportsPage';
import AiWorkspacePage from '@/features/ai/AiWorkspacePage';
import TechnicianHomePage from '@/features/technician/TechnicianHomePage';
import ClientSummaryPage from '@/features/portal/ClientSummaryPage';
import GroupsSettingsPage from '@/features/settings/GroupsSettingsPage';
import IssuesSettingsPage from '@/features/settings/IssuesSettingsPage';
import ContractsSettingsPage from '@/features/settings/ContractsSettingsPage';
import LabsSettingsPage from '@/features/settings/LabsSettingsPage';
import CalendarSettingsPage from '@/features/settings/CalendarSettingsPage';
import CalendarHolidaysPage from '@/features/settings/CalendarHolidaysPage';
import CalendarNonWorkingPage from '@/features/settings/CalendarNonWorkingPage';

export default function App() {
  return (
    <AuthProvider>
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
              <RoleGuard allow={['admin', 'editor', 'view']}>
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
              <RoleGuard allow={['admin', 'editor', 'view', 'emergency_scheduler']}>
                <FeatureGuard feature="services">
                  <ServicesPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="services/:serviceOrderId"
            element={
              <RoleGuard allow={['admin', 'editor', 'view', 'emergency_scheduler']}>
                <FeatureGuard feature="services">
                  <ServiceDetailPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="services/:serviceOrderId/closeout"
            element={
              <RoleGuard allow={['admin', 'editor', 'view', 'emergency_scheduler']}>
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
              <RoleGuard allow={['admin', 'editor']}>
                <FeatureGuard feature="scheduling">
                  <SchedulingPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="reports"
            element={
              <RoleGuard allow={['admin', 'editor', 'view']}>
                <FeatureGuard feature="reports">
                  <ReportsPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
          <Route
            path="ai"
            element={
              <RoleGuard allow={['admin', 'editor', 'view']}>
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
    </AuthProvider>
  );
}
