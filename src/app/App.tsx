import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { AuthProvider, ProtectedRoute, RoleGuard } from './Auth';
import DashboardPage from '@/features/dashboard/DashboardPage';
import BuildingsPage from '@/features/buildings/BuildingsPage';
import ManagementPage from '@/features/management/ManagementPage';
import EmployeesPage from '@/features/employees/EmployeesPage';
import SchedulingPage from '@/features/scheduling/SchedulingPage';
import LoginPage from '@/features/auth/LoginPage';
import HomePage from '@/features/HomePage';
import UsersPage from '@/features/users/UsersPage';
import FeatureGuard from '@/components/FeatureGuard';
import BuildingAdminPage from '@/features/buildingAdmin/BuildingAdminPage';
import GroupsSettingsPage from '@/features/settings/GroupsSettingsPage';
import IssuesSettingsPage from '@/features/settings/IssuesSettingsPage';
import ContractsSettingsPage from '@/features/settings/ContractsSettingsPage';
import LabsSettingsPage from '@/features/settings/LabsSettingsPage';
import CalendarSettingsPage from '@/features/settings/CalendarSettingsPage';
import CalendarHolidaysPage from '@/features/settings/CalendarHolidaysPage';
import CalendarNonWorkingPage from '@/features/settings/CalendarNonWorkingPage';
import QuoteTemplatesPage from '@/features/settings/QuoteTemplatesPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <RoleGuard allow={['admin', 'editor', 'view', 'emergency_scheduler']}>
                <FeatureGuard feature="dashboard">
                  <DashboardPage />
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
              <RoleGuard allow={['admin', 'editor', 'view', 'emergency_scheduler']}>
                <FeatureGuard feature="scheduling">
                  <SchedulingPage />
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
                <BuildingAdminPage />
              </RoleGuard>
            }
          />
          <Route
            path="settings"
            element={
              <RoleGuard allow={['admin']}>
                <FeatureGuard feature="settings">
                  <Navigate to="/app/settings/groups" replace />
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
          <Route
            path="settings/quote-templates"
            element={
              <RoleGuard allow={['admin']}>
                <FeatureGuard feature="settings">
                  <QuoteTemplatesPage />
                </FeatureGuard>
              </RoleGuard>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
