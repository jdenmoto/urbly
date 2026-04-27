import { Navigate } from 'react-router-dom';
import DashboardPage from '@/features/dashboard/DashboardPage';
import { useAuth } from '@/app/Auth';
import { getDefaultRouteForRole } from '@/app/nav';

export default function HomeRouterPage() {
  const { role } = useAuth();
  const defaultRoute = getDefaultRouteForRole(role);

  if (defaultRoute !== '/') {
    return <Navigate to={defaultRoute} replace />;
  }

  return <DashboardPage />;
}
