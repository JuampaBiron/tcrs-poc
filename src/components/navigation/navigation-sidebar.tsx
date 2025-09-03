// src/components/dashboard/dashboard-sidebar.tsx - MINIMALISTA + CORPORATE FINNING
"use client";

import { User } from "next-auth";
import { USER_ROLES } from "@/constants";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut
} from "lucide-react";
import SignOutButton from "./sign-out-button"; // ✅ Usar el componente correcto

// Type derivation from constants
type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

interface DashboardSidebarProps {
  user: User & { role: UserRole };
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function DashboardSidebar({
  user,
  collapsed,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const userRole = user.role;

  // Clear loading state when pathname changes (navigation complete)
  useEffect(() => {
    if (loadingRoute && pathname === loadingRoute) {
      // Add a small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setLoadingRoute(null);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, loadingRoute]);

  const navigationItems = [
    {
      href: '/dashboard',
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      available: true
    },
    {
      href: '/request',
      id: 'request',
      label: 'Request',
      icon: FileText,
      available: true
    },
    {
      href: '/admin',
      id: 'admin',
      label: 'Administration',
      icon: Settings,
      available: userRole === USER_ROLES.ADMIN
    }
  ];

  const toggleMobile = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    
    // Don't navigate if already on the same route
    if (pathname === href) {
      return;
    }
    
    // Only show loading for dashboard and request routes
    if (href === '/dashboard' || href === '/request') {
      setLoadingRoute(href);
      router.push(href);
      // Loading state will be cleared by useEffect when pathname changes
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:bg-blue-50/50 hover:border-blue-200 transition-all duration-200"
      >
        {mobileOpen ? <X className="w-6 h-6 text-gray-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-100 z-40
        transition-all duration-300 ease-in-out flex flex-col
        ${collapsed ? 'w-20' : 'w-72'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Header Section */}
        <div className={`flex-shrink-0 py-8 border-b border-gray-50 ${collapsed ? 'px-2' : 'px-6'}`}>
          {!collapsed ? (
            <>
              {/* Logo */}
              <div className="flex items-center justify-center mb-8">
                <img
                  src="/finning-cat-logo.png"
                  alt="Finning CAT Logo"
                  className="h-20 w-auto"
                  style={{ maxWidth: 250 }}
                />
              </div>
              
              {/* Title */}
              <div className="text-center">
                <h1 className="text-lg font-semibold text-gray-900 mb-1">
                  TCRS Approval
                </h1>
                <p className="text-sm text-gray-500">System</p>
              </div>
            </>
          ) : (
            <div className="flex justify-center py-2">
              <img
                src="/finningF.png"
                alt="Finning F"
                className="h-16 w-16 object-contain"
              />
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-4 py-6">
          <nav className="space-y-2">
            {navigationItems
              .filter(item => item.available)
              .map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                const isLoading = loadingRoute === item.href;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.href)}
                    disabled={isLoading}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                      ${collapsed ? 'justify-center' : 'justify-start'}
                      ${
                        isActive
                          ? 'bg-yellow-400 text-black font-medium shadow-sm'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 hover:shadow-sm'
                      }
                      ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}
                    `}
                  >
                    {isLoading ? (
                      <div className={`w-5 h-5 flex-shrink-0 border-2 rounded-full animate-spin ${
                        isActive ? 'border-black border-t-transparent' : 'border-gray-500 border-t-transparent'
                      }`} />
                    ) : (
                      <Icon className={`
                        w-5 h-5 flex-shrink-0
                        ${isActive ? 'text-black' : 'text-gray-500'}
                      `} />
                    )}
                    {!collapsed && (
                      <span className="font-medium">
                        {isLoading ? 'Loading...' : item.label}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Collapse Button */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-gray-50">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-full h-10 text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-all duration-200 hover:shadow-sm"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Collapse</span>
              </div>
            )}
          </button>
        </div>

        {/* User Section */}
        <div className={`flex-shrink-0 border-t border-gray-100 ${collapsed ? 'p-2' : 'p-4'}`}>
          {!collapsed ? (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-semibold">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="flex justify-center">
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full border border-yellow-200">
                  {userRole}
                </span>
              </div>

              {/* ✅ FIXED: Sign Out Button con funcionalidad */}
              <SignOutButton 
                variant="sidebar" 
                collapsed={false} 
              />
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              {/* Collapsed User Avatar */}
              <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-semibold text-sm">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              
              {/* ✅ FIXED: Collapsed Sign Out con funcionalidad */}
              <SignOutButton 
                variant="icon" 
                collapsed={true} 
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}