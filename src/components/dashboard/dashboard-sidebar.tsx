// src/components/dashboard/dashboard-sidebar.tsx
"use client";

import { User } from "next-auth";
import { UserRole } from "@/types";
import { USER_ROLES } from "@/constants";
import { useState } from "react";
import {
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from "lucide-react";
import EnhancedSignOutButton from "../ui/sign-out-button";

interface NewSidebarProps {
  user: User & { role: UserRole };
  userRole: UserRole;
  activeView: string;
  onViewChange: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function NewSidebar({
  user,
  userRole,
  activeView,
  onViewChange,
  collapsed,
  onToggleCollapse
}: NewSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      available: true
    },
    {
      id: 'requests',
      label: 'Requests View',
      icon: FileText,
      color: 'from-amber-400 to-amber-500',
      hoverColor: 'hover:from-amber-500 hover:to-amber-600',
      available: true
    },
    {
      id: 'admin',
      label: 'Admin View',
      icon: Settings,
      color: 'from-red-500 to-red-600',
      hoverColor: 'hover:from-red-600 hover:to-red-700',
      available: userRole === USER_ROLES.ADMIN
    }
  ];

  const toggleMobile = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleViewChange = (viewId: string) => {
    onViewChange(viewId);
    setMobileOpen(false); // Close mobile menu when selecting a view
  };

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border"
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white shadow-lg border-r border-gray-200 z-40
        transition-all duration-300 ease-in-out flex flex-col
        ${collapsed ? 'w-16' : 'w-80'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Header Section */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center space-x-3 mb-4">
              <img
                src="/finning-cat-logo.png"
                alt="Finning CAT Logo"
                className="h-10 w-auto transition-transform hover:scale-105"
                style={{ maxWidth: 200 }}
              />
            </div>
          )}
          
          {!collapsed && (
            <div className="mb-4">
              <h1 className="text-lg font-bold text-gray-900">TCRS Approval</h1>
              <p className="text-sm text-gray-600">System</p>
            </div>
          )}

          {/* Collapse Button - Desktop only */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors ml-auto"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Section - Flex grow para ocupar espacio disponible */}
        <div className="flex-1 p-4">
          <nav className="space-y-3">
            {navigationItems
              .filter(item => item.available)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`
                      w-full flex items-center gap-3 p-3 rounded-xl font-medium
                      transition-all duration-200 transform hover:-translate-y-0.5
                      ${collapsed ? 'justify-center' : 'justify-start'}
                      ${
                        isActive
                          ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                          : `bg-gray-100 hover:bg-gray-200 text-gray-700 hover:shadow-md ${item.hoverColor.replace('hover:from-', 'hover:bg-').replace('hover:to-', '').split(' ')[0]}`
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && (
                      <span className="font-semibold">{item.label}</span>
                    )}
                  </button>
                );
              })}
          </nav>
        </div>

        {/* User Info Section - Ahora en la parte inferior */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          {!collapsed && (
            <div className="mb-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-md">
                    {userRole}
                  </span>
                </div>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          )}

          {/* Sign Out Button */}
          <div className="flex justify-center">
            <EnhancedSignOutButton 
              variant={collapsed ? 'icon' : 'sidebar'}
              collapsed={collapsed}
            />
          </div>
        </div>
      </div>
    </>
  );
}