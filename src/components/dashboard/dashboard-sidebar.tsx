// src/components/dashboard/dashboard-sidebar.tsx
"use client";

import { BarChart3, FileText, Settings } from "lucide-react";
import { UserRole } from "@/types";
import { USER_ROLES } from "@/constants";

interface DashboardSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  userRole: UserRole;
}

export default function DashboardSidebar({ 
  activeView, 
  onViewChange, 
  userRole 
}: DashboardSidebarProps) {
  const canAccessAdmin = userRole === USER_ROLES.ADMIN;

  const navigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      available: true,
    },
    {
      id: "requests",
      label: "Requests View",
      icon: FileText,
      available: true,
    },
    {
      id: "admin",
      label: "Admin View",
      icon: Settings,
      available: canAccessAdmin,
    },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm min-h-screen border-r">
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          if (!item.available) return null;
          
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}