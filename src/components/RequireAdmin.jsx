import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAdmin({ children }) {
  const { configured, loading, user, isAdmin } = useAuth();
  const location = useLocation();

  if (!configured) return <Navigate to="/admin/login?setup=required" replace />;
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-cream"><p className="eyebrow">Checking secure access</p></div>;
  }
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}
