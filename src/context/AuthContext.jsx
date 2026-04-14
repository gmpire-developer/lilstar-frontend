import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { fetchCurrentUser, loginAdmin } from "../services/authService";

const AuthContext = createContext(null);

function parseStoredUser() {
  const rawUser = localStorage.getItem("admin_user");
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch (error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(parseStoredUser);

  const [token, setToken] = useState(() => localStorage.getItem("admin_token"));

  const isAuthenticated = Boolean(token);

  const setUserState = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem("admin_user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("admin_user");
    }
  };

  const login = async (email, password) => {
    const result = await loginAdmin({ email, password });

    localStorage.setItem("admin_token", result.token);
    setToken(result.token);
    setUserState(result.user);

    return result.user;
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) {
      return null;
    }

    try {
      const data = await fetchCurrentUser();
      setUserState(data.user);
      return data.user;
    } catch (error) {
      logout();
      return null;
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    }
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      login,
      logout,
      refreshUser,
      setUserState
    }),
    [user, token, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
