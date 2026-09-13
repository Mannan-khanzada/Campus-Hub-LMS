import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate">Loading...</div>;

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  if (user.role === "STUDENT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment px-4 text-center">
        <div>
          <h2 className="font-display text-xl mb-2">Students use the CampusHub mobile app</h2>
          <p className="text-slate text-sm">Please download the mobile app to log in, mark attendance, submit assignments, and take exams.</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="*" element={user.role === "ADMIN" ? <AdminDashboard /> : <TeacherDashboard />} />
    </Routes>
  );
}
