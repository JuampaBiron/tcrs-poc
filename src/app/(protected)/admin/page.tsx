// src/app/(protected)/admin/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { USER_ROLES } from "@/constants";
import { redirect } from "next/navigation";
import { UserRole } from "@/types";

// Components
import ErrorMessage from "@/components/ui/error-message";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import LoadingSpinner from "@/components/ui/loading-spinner";
import StatsCards from "@/components/dashboard/stats-cards";

export default function AdminPage() {
  const { data: session } = useSession();
  
  // Cast session role to UserRole safely
  const userRole = session?.user?.role as UserRole;

  // Redirect if not admin
  if (userRole && userRole !== USER_ROLES.ADMIN) {
    redirect('/dashboard');
  }

  const userEmail = session?.user?.email || "";

  // Data fetching for admin stats
  const { stats, loading, error } = useDashboardData({
    userRole: userRole || null,
    userEmail: userEmail,
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading admin panel..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!session?.user || !userRole) {
    return (
      <div className="p-6">
        <ErrorMessage message="Authentication required" />
      </div>
    );
  }

  if (userRole !== USER_ROLES.ADMIN) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700">Admin access required to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600">System administration and management</p>
      </div>

      {/* Admin Stats Overview */}
      <StatsCards userRole={userRole} stats={stats} />

      {/* Admin Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        
        {/* User Management */}
        <div className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">User Management</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Manage user roles, permissions, and access controls.
          </p>
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Manage Users
          </button>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">System Settings</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Configure system-wide settings and preferences.
          </p>
          <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
            Configure System
          </button>
        </div>

        {/* Reports */}
        <div className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Reports</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Generate and export detailed system reports.
          </p>
          <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
            View Reports
          </button>
        </div>

        {/* Audit Logs */}
        <div className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Audit Logs</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            View system activity and audit trails.
          </p>
          <button className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors">
            View Logs
          </button>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🗄️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Data Management</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Backup, restore, and maintain system data.
          </p>
          <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors">
            Manage Data
          </button>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Notifications</h3>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Configure system notifications and alerts.
          </p>
          <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
            Setup Alerts
          </button>
        </div>

      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Export All Data
          </button>
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            System Health Check
          </button>
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Clear Cache
          </button>
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Send Test Email
          </button>
        </div>
      </div>
    </div>
  );
}