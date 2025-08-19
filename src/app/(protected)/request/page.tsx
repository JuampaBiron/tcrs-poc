// src/app/(protected)/request/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { getUserRole } from "@/lib/auth-utils";
import { USER_ROLES } from "@/constants";
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

  let userRole: UserRole;
  try {
    userRole = getUserRole(session.user);
  } catch (error) {
    return <ErrorMessage message="User not authorized - not in any TCRS group" />;
  }

  const userEmail = session.user.email || "";

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