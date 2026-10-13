"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User } from "../types";
import { api } from "../lib/api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; profileImage?: string | null }) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem("lostly_access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      if (response.data?.success) {
        setUser(response.data.data);
      }
    } catch {
      localStorage.removeItem("lostly_access_token");
      localStorage.removeItem("lostly_refresh_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener("lostly_logout", handleLogoutEvent);
    return () => {
      window.removeEventListener("lostly_logout", handleLogoutEvent);
    };
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.success) {
      const { user: userData, accessToken, refreshToken } = res.data.data;
      localStorage.setItem("lostly_access_token", accessToken);
      localStorage.setItem("lostly_refresh_token", refreshToken);
      setUser(userData);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post("/auth/register", { name, email, password });
    if (res.data?.success) {
      const { user: userData, accessToken, refreshToken } = res.data.data;
      localStorage.setItem("lostly_access_token", accessToken);
      localStorage.setItem("lostly_refresh_token", refreshToken);
      setUser(userData);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("lostly_refresh_token");
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem("lostly_access_token");
      localStorage.removeItem("lostly_refresh_token");
      setUser(null);
    }
  };

  const updateProfile = async (data: { name?: string; profileImage?: string | null }) => {
    const res = await api.put("/auth/profile", data);
    if (res.data?.success) {
      setUser(res.data.data);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshProfile: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
