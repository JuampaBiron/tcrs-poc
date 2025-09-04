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
          className="lg:hidden fixed inset-0 bg-gradient-to-r from-black/30 via-black/20 to-black/10 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full bg-gradient-to-b from-white via-gray-50/30 to-gray-100/20 z-40
        transition-all duration-300 ease-in-out flex flex-col
        shadow-xl shadow-gray-900/10
        ${collapsed ? 'w-20' : 'w-72'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Header Section */}
        <div className={`flex-shrink-0 py-8 border-b border-gray-100/60 bg-gradient-to-r from-transparent via-white/40 to-transparent ${collapsed ? 'px-2' : 'px-6'}`}>
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
                <h1 className="text-xl font-bold text-gray-900 mb-1 tracking-wide">
                  TCRS APPROVAL
                </h1>
                <p className="text-sm font-medium text-gray-600 tracking-wider uppercase">System</p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex justify-center py-2 mb-8">
                <img
                  src="/finningF.png"
                  alt="Finning F"
                  className="h-16 w-16 object-contain"
                />
              </div>
              {/* Spacer to match expanded state height */}
              <div className="h-12"></div>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-4 py-6 bg-gradient-to-b from-transparent via-white/20 to-transparent">
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
                      w-full flex items-center rounded-lg transition-all duration-200
                      ${collapsed ? 'justify-center px-3 py-3' : 'justify-start gap-3 px-3 py-3'}
                      ${
                        isActive
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-medium shadow-lg shadow-yellow-500/25'
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
                      <span className="font-semibold text-sm tracking-wide">
                        {isLoading ? 'Loading...' : item.label}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Lower Section Container - Organized 4 elements */}
        <div className="flex-shrink-0">
          {/* 1. Collapse Button */}
          <div className={`border-t border-gray-100/60 bg-gradient-to-r from-transparent via-white/30 to-transparent ${collapsed ? 'px-2 py-3' : 'px-4 py-3'}`}>
            <button
              onClick={onToggleCollapse}
              className={`hidden lg:flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-all duration-200 hover:shadow-sm ${collapsed ? 'w-12 h-9 mx-auto' : 'w-full h-9'}`}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <div className="flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  <span className="text-xs font-semibold tracking-wide uppercase">Collapse</span>
                </div>
              )}
            </button>
          </div>

          {/* 2-4. User Section Container */}
          <div className={`border-t border-gray-100/60 bg-gradient-to-b from-gray-50/20 to-gray-100/30 ${collapsed ? 'px-2 py-4' : 'px-4 py-4'}`}>
            <div className="relative h-40">
              {/* Expanded State */}
              <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}>
                <div className="h-full flex flex-col space-y-3">
                  {/* 2. User Info Card */}
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-white via-gray-50 to-gray-100/70 rounded-lg shadow-sm border border-gray-200/40 h-14">
                    <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center text-black font-semibold shadow-md flex-shrink-0">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                        {user.name}
                      </p>
                      <p className="text-xs font-medium text-gray-500 truncate leading-relaxed">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* 3. Role Badge */}
                  <div className="flex justify-center h-10">
                    <span className="inline-flex items-center px-3 py-1 text-sm font-bold text-yellow-800 bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-xl border border-yellow-200 shadow-sm tracking-wider uppercase">
                      {userRole}
                    </span>
                  </div>

                  {/* 4. Sign Out Button */}
                  <div className="h-10 flex items-center">
                    <SignOutButton 
                      variant="sidebar" 
                      collapsed={false} 
                    />
                  </div>
                </div>
              </div>

              {/* Collapsed State - Perfectly aligned */}
              <div className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                collapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}>
                <div className="h-full flex flex-col items-center space-y-3">
                  {/* 2. Collapsed User Avatar */}
                  <div className="h-14 flex items-center">
                    <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center text-black font-bold text-sm shadow-md">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  </div>
                  
                  {/* 3. Collapsed Role Badge */}
                  <div className="h-14 flex items-center">
                    <div className="w-9 h-9 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg flex items-center justify-center border border-yellow-300/50 shadow-sm">
                      <span className="text-[14px] font-bold text-yellow-800 uppercase">
                        {userRole.charAt(0)}
                      </span>
                    </div>
                  </div>
                  
                  {/* 4. Collapsed Sign Out */}
                  <div className="h-8 flex items-center">
                    <SignOutButton 
                      variant="icon" 
                      collapsed={true} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}