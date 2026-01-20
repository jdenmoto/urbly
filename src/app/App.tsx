import { Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import { AuthProvider, ProtectedRoute } from './Auth';
import DashboardPage from '@/features/dashboard/DashboardPage';
import BuildingsPage from '@/features/buildings/BuildingsPage';
import ManagementPage from '@/features/management/ManagementPage';
import EmployeesPage from '@/features/employees/EmployeesPage';
import SchedulingPage from '@/features/scheduling/SchedulingPage';
import LoginPage from '@/features/auth/LoginPage';
import UsersPage from '@/features/users/UsersPage';
import FeatureGuard from '@/components/FeatureGuard';

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
              <FeatureGuard feature="dashboard">
                <DashboardPage />
              </FeatureGuard>
            }
          />
          <Route
            path="buildings"
            element={
              <FeatureGuard feature="buildings">
                <BuildingsPage />
              </FeatureGuard>
            }
          />
          <Route
            path="management"
            element={
              <FeatureGuard feature="management">
                <ManagementPage />
              </FeatureGuard>
            }
          />
          <Route
            path="employees"
            element={
              <FeatureGuard feature="employees">
                <EmployeesPage />
              </FeatureGuard>
            }
          />
          <Route
            path="scheduling"
            element={
              <FeatureGuard feature="scheduling">
                <SchedulingPage />
              </FeatureGuard>
            }
          />
          <Route
            path="users"
            element={
              <FeatureGuard feature="users">
                <UsersPage />
              </FeatureGuard>
            }
          />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
