/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('edutrack_token');
    const role = localStorage.getItem('edutrack_role');
    const name = localStorage.getItem('edutrack_name');
    const email = localStorage.getItem('edutrack_email');
    return token ? { token, role, name, email } : null;
  });

  const login = useCallback((data) => {
    localStorage.setItem('edutrack_token', data.token);
    localStorage.setItem('edutrack_role', data.role);
    localStorage.setItem('edutrack_name', data.name || '');
    localStorage.setItem('edutrack_email', data.email || '');
    setUser({ token: data.token, role: data.role, name: data.name, email: data.email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('edutrack_token');
    localStorage.removeItem('edutrack_role');
    localStorage.removeItem('edutrack_name');
    localStorage.removeItem('edutrack_email');
    setUser(null);
  }, []);

  const role = user?.role || localStorage.getItem('edutrack_role');

  return (
    <AuthContext.Provider value={{ user, role, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
