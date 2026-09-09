import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

/** Gate for authenticated routes; optionally restricts to a set of roles (FR-AUTH-03 RBAC). */
export default function ProtectedRoute({ roles }) {
  const { user, accessToken } = useAuthStore();

  if (!accessToken || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
