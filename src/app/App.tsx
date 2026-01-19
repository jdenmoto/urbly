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
          <Route index element={<DashboardPage />} />
          <Route path="buildings" element={<BuildingsPage />} />
          <Route path="management" element={<ManagementPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="scheduling" element={<SchedulingPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
