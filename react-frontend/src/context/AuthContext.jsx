import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, getSession } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSessionState] = useState(() => getSession());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentSession = getSession();
    if (currentSession) {
      setSessionState(currentSession);
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const sessionData = await authService.login(email, password);
      setSessionState(sessionData);
      return sessionData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setSessionState(null);
  };

  const user = session?.user || null;
  const role = session?.role || 'Guest';

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        role,
        loading,
        login,
        logout,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
