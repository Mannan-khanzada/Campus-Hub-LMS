import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("lms_token");
      if (saved) {
        try {
          const profile = await api.me(saved);
          if (profile.role !== "STUDENT") throw new Error("Not a student account");
          setToken(saved);
          setUser(profile);
        } catch {
          await AsyncStorage.removeItem("lms_token");
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    if (data.user.role !== "STUDENT") {
      throw new Error("This app is for students only. Teachers/Admins should use the web portal.");
    }
    await AsyncStorage.setItem("lms_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("lms_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
