// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, profile, authChecked } = useAuth();

  // ✅ Wait for initial session check only if no user
  if (!authChecked && !user) return null;

  // Not logged in → redirect
  if (!user) {
    const loginPath = requiredRole === 'teacher' ? '/teacher-login' : '/login';
    return <Navigate to={loginPath} replace />;
  }

  // Role mismatch → redirect
  if (profile && requiredRole && profile.role !== requiredRole) {
    const redirectPath = profile.role === 'student' ? '/dashboard' : '/teacher-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // ✅ Allow access
  return children;
};

export default ProtectedRoute;
