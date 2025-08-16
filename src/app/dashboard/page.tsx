// src/app/dashboard/page.tsx
import { auth } from "@/auth";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import SignOutButton from "@/components/ui/sign-out-button";
import { isValidUserRole } from "@/constants";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard - TCRS POC",
  description: "TCRS Invoice Approval Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  const userRole = session?.user?.role;

  // Validate user session and role
  if (!session?.user || !isValidUserRole(userRole)) {
    if (session?.user) {
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

  // Render the new dashboard layout
  return (
    <DashboardLayout
      user={{
        ...session.user,
        role: userRole,
      }}
    />
  );
}