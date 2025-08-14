"use client";

import { User } from "next-auth";
import { UserRole } from "@/types";
import SignOutButton from "../ui/sign-out-button";
import Link from "next/link";

interface DashboardHeaderProps {
  user: User;
  userRole: UserRole;
}

export default function DashboardHeader({
  user,
  userRole
}: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <img
            src="/finning-cat-logo.png"
            alt="Finning CAT Logo"
            className="h-10 w-auto group-hover:scale-105 transition-transform"
            style={{ maxWidth: 200 }}
          />
          <span className="text-xl font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
            TCRS Approval System
          </span>
        </Link>

        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-end text-sm">
            <span className="font-semibold text-gray-800">{user.name}</span>
            <span className="text-xs text-gray-500">{user.email}</span>
            <span className="text-xs mt-1 px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
              {userRole}
            </span>
          </div>
          <div className="h-8 border-l border-gray-200 mx-2" />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}