// src/components/ui/sign-out-button.tsx
"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { useState } from "react";

interface SignOutButtonProps {
  collapsed?: boolean;
  variant?: 'default' | 'sidebar' | 'icon';
}

export default function SignOutButton({ 
  collapsed = false,
  variant = 'default'
}: SignOutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Sign out error:", error);
      setIsLoading(false);
    }
  };

  // Icon-only variant for collapsed sidebar
  if (variant === 'icon' || collapsed) {
    return (
      <button
        onClick={handleSignOut}
        disabled={isLoading}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Sign Out"
      >
        <LogOut className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
      </button>
    );
  }

  // Sidebar variant (full width)
  if (variant === 'sidebar') {
    return (
      <button
        onClick={handleSignOut}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <LogOut className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        {!collapsed && (
          <span className="font-medium">
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </span>
        )}
      </button>
    );
  }

  // Default variant
  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <LogOut className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
      <span className="font-medium">
        {isLoading ? 'Signing out...' : 'Sign Out'}
      </span>
    </button>
  );
}