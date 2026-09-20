import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kukufarm_auth')) || null; }
    catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem('kukufarm_auth', JSON.stringify(user));
    else localStorage.removeItem('kukufarm_auth');
  }, [user]);

  const login = (email, password) => {
    if (!email || !password) return { success: false, message: 'Email and password are required.' };
    const loggedUser = { id: 1, name: 'Kelvin', email, role: 'Administrator' };
    setUser(loggedUser);
    return { success: true };
  };

  const logout = () => setUser(null);
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);