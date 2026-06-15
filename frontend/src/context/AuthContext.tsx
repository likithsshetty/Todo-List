"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const API_URL = "http://localhost:5000/api";

  useEffect(() => {
    // Check if token exists in localStorage on mount
    const storedToken = localStorage.getItem("todo_auth_token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Token is invalid or expired
        logout();
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("todo_auth_token", data.token);
        setToken(data.token);
        setUser(data.user);
        router.push("/todos");
        return { success: true };
      } else {
        return { success: false, error: data.message || "Login failed" };
      }
    } catch (err) {
      return { success: false, error: "Network error. Make sure the server is running." };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("todo_auth_token", data.token);
        setToken(data.token);
        setUser(data.user);
        router.push("/todos");
        return { success: true };
      } else {
        return { success: false, error: data.message || "Registration failed" };
      }
    } catch (err) {
      return { success: false, error: "Network error. Make sure the server is running." };
    }
  };

  const logout = () => {
    localStorage.removeItem("todo_auth_token");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const deleteAccount = async () => {
    const storedToken = token || localStorage.getItem("todo_auth_token");
    if (!storedToken) return { success: false, error: "Not authenticated" };
    try {
      const res = await fetch(`${API_URL}/auth/delete-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem("todo_auth_token");
        setToken(null);
        setUser(null);
        router.push("/login");
        return { success: true };
      } else {
        return { success: false, error: data.message || "Failed to delete account" };
      }
    } catch (err) {
      return { success: false, error: "Network error. Make sure the server is running." };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
