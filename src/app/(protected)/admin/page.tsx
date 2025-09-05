// src/app/(protected)/admin/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { USER_ROLES } from "@/constants";
import ErrorMessage from "@/components/ui/error-message";
import LoadingSpinner from "@/components/ui/loading-spinner";
import DictionaryGrid from "@/components/admin/dictionary-grid";

// Type derivation from constants
type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export default function AdminPage() {
  const { data: session, status } = useSession();
  
  // Loading state
  if (status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="Loading admin panel..." />
      </div>
    );
  }

  // Cast session role to UserRole safely
  const userRole = session?.user?.role as UserRole;

  // Authentication check
  if (!session?.user || !userRole) {
    return (
      <div className="p-6">
        <ErrorMessage message="Authentication required" />
      </div>
    );
  }

  // Authorization check - Only admins can access
  if (userRole !== USER_ROLES.ADMIN) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You do not have administrator privileges to access this section.
            Only users with Admin role can manage dictionaries.
          </p>
          <div className="text-sm text-gray-500 mb-4 p-3 bg-gray-100 rounded">
            <strong>Current Role:</strong> {userRole}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
            <p className="text-gray-600">
              Manage dictionary entries and system configurations
            </p>
          </div>
          <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-lg">
            Admin Panel
          </div>
        </div>
      </div>

      {/* Dictionary Management Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Dictionary Management
          </h2>
          <p className="text-gray-600 text-sm">
            Manage key-value pairs for dropdowns and system configurations. 
            Changes will sync in real-time with the application.
          </p>
        </div>
        
        <DictionaryGrid userEmail={session.user.email || ""} />
      </div>
    </div>
  );
}