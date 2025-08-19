// src/app/(protected)/request/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { USER_ROLES, isValidUserRole } from "@/constants";
import ErrorMessage from "@/components/ui/error-message";
import LoadingSpinner from "@/components/ui/loading-spinner";
import RequestsView from "@/components/request/requests-view";

// Type derivation from constants
type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export default function RequestPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  if (!session?.user) {
    return <ErrorMessage message="Authentication required" />;
  }

  // ✅ CORRECCIÓN: Usar el rol de la sesión, NO llamar getUserRole() en el cliente
  const userRole = session?.user?.role as UserRole;
  const userEmail = session.user.email || "";

  // Validar que el rol sea válido
  if (!userRole || !isValidUserRole(userRole)) {
    return (
      <ErrorMessage message="User not authorized - invalid or missing role" />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
        <p className="text-gray-600 mt-1">
          {userRole === USER_ROLES.REQUESTER && "Create and manage your approval requests"}
          {userRole === USER_ROLES.APPROVER && "Review and approve pending requests"}
          {userRole === USER_ROLES.ADMIN && "Manage all requests and approvals"}
        </p>
      </div>

      <RequestsView 
        userRole={userRole}
        userEmail={userEmail}
        user={session.user}
      />
    </div>
  );
}