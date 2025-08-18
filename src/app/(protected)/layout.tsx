// src/app/(protected)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import DashboardSidebar from "@/components/navigation/navigation-sidebar";
import { isValidUserRole, USER_ROLES } from "@/constants";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/navigation/sign-out-button";
import LoadingSpinner from "@/components/ui/loading-spinner";

// Type derivation from constants
type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  const userRole = session?.user?.role as UserRole;

  // Validate user session and role
  if (!session?.user || !isValidUserRole(userRole)) {
    if (session?.user) {
      // User is authenticated but doesn't have valid role
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-6">
              You are authenticated, but your account does not have the
              necessary permissions (TCRS group) to access this application.
              Please contact your administrator.
            </p>
            <div className="text-sm text-gray-500 mb-4 p-3 bg-gray-100 rounded">
              <strong>User:</strong> {session.user.email}
            </div>
            <SignOutButton />
          </div>
        </div>
      );
    }
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar 
        user={{
          ...session.user,
          role: userRole,
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={`flex-1 overflow-auto transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-80'
      }`}>
        {children}
      </main>
    </div>
  );
}