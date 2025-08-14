// src\app\dashboard\page.tsx
// FINAL, TYPE-SAFE VERSION
 
import { auth } from "@/auth";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import SignOutButton from "@/components/ui/sign-out-button";
import { isValidUserRole } from "@/constants"; // <-- IMPORT THE TYPE GUARD
import { redirect } from "next/navigation";
 
export const metadata = {
  title: "Dashboard - TCRS POC",
  description: "TCRS Invoice Approval Dashboard",
};
 
export default async function DashboardPage() {
  const session = await auth();
 
  // 1. Get the role from the session. It's currently 'string | undefined'.
  const userRole = session?.user?.role;
 
  // 2. Use the type guard to check if the role is valid.
  // This check is now more robust. It ensures the role is not only present
  // but is one of the allowed values ('admin', 'approver', 'requester').
  if (!session?.user || !isValidUserRole(userRole)) {
    // If the user is logged in but has an invalid/missing role...
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
    // If there's no session at all, redirect to login.
    redirect("/");
  }
 
  // 3. Pass the user object to the layout.
  // Inside this code block, TypeScript now knows that `userRole` is of type `UserRole`.
  // We explicitly construct the user prop to satisfy the component's expectation.
  return (
    <DashboardLayout
      user={{
        ...session.user,
        role: userRole,
      }}
    />
  );
}
 