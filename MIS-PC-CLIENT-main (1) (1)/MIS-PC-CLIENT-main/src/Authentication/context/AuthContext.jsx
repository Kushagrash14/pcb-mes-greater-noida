
import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../../services/API/api"; 

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
    
  const [initializing, setInitializing] = useState(true);            

  // On first mount, ask the backend "am I logged in?" using the cookie
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.get("/users/me");
        if (res.data.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        // no valid session cookie - user is simply not logged in, that's fine
        setUser(null);
      } finally {
        setInitializing(false);
      }
    };
    checkSession();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post("/users/login", { username, password });
      const data = res.data;
      localStorage.setItem("token", data.token); 
      if (!data.success) {
        return { success: false, message: data.message || "Invalid credentials." };
      }

      // token is in an httpOnly cookie now, set by the backend - nothing to store here
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (err) {
      let message = "Something went wrong. Please try again.";
      if (err.response) {
        message = err.response.data?.message || "Incorrect username or password.";
      } else if (err.request) {
        message = "No response from server. Please check your network connection.";
      }
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem("token");
      await api.post("/users/logout"); // clears the httpOnly cookie server-side
    } catch (err) {
      // even if the request fails, still clear local state below
    }
    setUser(null);
  };

  const value = {
    user,
    loading,
    initializing,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used inside an <AuthProvider>");
  }
  return ctx;
}