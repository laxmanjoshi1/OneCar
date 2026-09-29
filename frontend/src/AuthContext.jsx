import { createContext, useContext, useEffect, useState } from 'react';
import { checkSession } from './services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const res = await checkSession();
      if (res.success && res.data?.type === 'user') {
        setUser(res.data.user);
        setIsAdmin(false);
      } else if (res.success && res.data?.type === 'admin') {
        setIsAdmin(true);
        setUser(null);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    } catch (e) {
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isAdmin, setIsAdmin, loading, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
