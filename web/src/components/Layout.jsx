import React from "react";
import { useAuth } from "../context/AuthContext";

export default function Layout({ tabs, active, onChange, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-parchment">
      <aside className="w-64 bg-ink text-white flex flex-col shrink-0">
        <div className="px-6 py-6 border-b border-white/10">
          <h1 className="font-display text-xl font-semibold tracking-tight">CampusHub</h1>
          <p className="text-xs text-white/50 mt-1">College LMS</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`w-full text-left px-3 py-2.5 rounded-card text-sm font-medium transition-colors ${
                active === t.key ? "bg-gold text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-white/50 capitalize">{user?.role?.toLowerCase()}</p>
          <button onClick={logout} className="mt-3 text-xs text-gold hover:underline">
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">{children}</main>
    </div>
  );
}
