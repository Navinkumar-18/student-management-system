import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, role: userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    const redirectMap = { admin: '/admin/dashboard', teacher: '/teacher/dashboard', student: '/student/dashboard' };
    return <Navigate to={redirectMap[userRole] || '/login'} replace />;
  }

  return children;
}
 