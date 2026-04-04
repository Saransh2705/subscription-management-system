"use client";

import Link from "next/link";
import { useState } from "react";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";

export default function DashboardNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="glass-card px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-lg">
          S
        </div>
        <div>
          <h1 className="font-bold text-lg gradient-text-primary">Sublytics</h1>
          <p className="text-xs text-muted-foreground">AI-Powered Platform</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="glass-card px-3 py-1.5 rounded-lg text-xs">
          <span className="text-muted-foreground">Plan:</span>{" "}
          <span className="font-semibold gradient-text-primary">Pro</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 glass-card px-3 py-2 rounded-lg hover:bg-muted/50 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-bold">
              A
            </div>
            <span className="text-sm font-medium hidden md:block">Admin</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 glass-card rounded-xl shadow-xl border border-border overflow-hidden">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-all"
                onClick={() => setDropdownOpen(false)}
              >
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm">Profile</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-all"
                onClick={() => setDropdownOpen(false)}
              >
                <Settings className="w-4 h-4 text-secondary" />
                <span className="text-sm">Settings</span>
              </Link>
              <button
                className="flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 transition-all w-full text-left border-t border-border"
                onClick={() => {
                  setDropdownOpen(false);
                  // Handle logout
                }}
              >
                <LogOut className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
