import { Navigate } from 'react-router-dom';
import DashboardPage from '@/features/dashboard/DashboardPage';
import { useAuth } from '@/app/Auth';

export default function HomeRouterPage() {
  const { role } = useAuth();

  if (role === 'emergency_scheduler') {
    return <Navigate to="/technician" replace />;
  }

  if (role === 'building_admin' || role === 'client') {
    return <Navigate to="/portal" replace />;
  }

  return <DashboardPage />;
}
