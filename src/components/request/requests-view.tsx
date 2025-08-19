// src/components/request/requests-view.tsx
"use client";

import { useState } from "react";
import { User } from "next-auth";
import { USER_ROLES } from "@/constants";
import { Plus, FileText, Clock, CheckCircle } from "lucide-react";

// Import components (to be created)
import RequesterView from "./requester-view";
import ApproverView from "./approver-view";
import AdminView from "./admin-view";

// Type derivation from constants
type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

interface RequestsViewProps {
  userRole: UserRole;
  userEmail: string;
  user: User;
}

export default function RequestsView({ userRole, userEmail, user }: RequestsViewProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'my-requests' | 'approvals'>('create');

  // Tab configuration based on role
  const getAvailableTabs = () => {
    const tabs = [];

    if (userRole === USER_ROLES.REQUESTER || userRole === USER_ROLES.ADMIN) {
      tabs.push(
        { id: 'create', label: 'Create Request', icon: Plus },
        { id: 'my-requests', label: 'My Requests', icon: FileText }
      );
    }

    if (userRole === USER_ROLES.APPROVER || userRole === USER_ROLES.ADMIN) {
      tabs.push(
        { id: 'approvals', label: 'Pending Approvals', icon: Clock }
      );
    }

    return tabs;
  };

  const tabs = getAvailableTabs();

  // Set default tab based on role
  useState(() => {
    if (userRole === USER_ROLES.APPROVER && !tabs.find(t => t.id === activeTab)) {
      setActiveTab('approvals');
    }
  });

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon
                className={`
                  -ml-0.5 mr-2 h-5 w-5
                  ${activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'}
                `}
              />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Requester Views */}
        {(userRole === USER_ROLES.REQUESTER || userRole === USER_ROLES.ADMIN) && (
          <>
            {activeTab === 'create' && (
              <RequesterView 
                mode="create"
                userEmail={userEmail}
                user={user}
              />
            )}
            {activeTab === 'my-requests' && (
              <RequesterView 
                mode="list"
                userEmail={userEmail}
                user={user}
              />
            )}
          </>
        )}

        {/* Approver Views */}
        {(userRole === USER_ROLES.APPROVER || userRole === USER_ROLES.ADMIN) && (
          <>
            {activeTab === 'approvals' && (
              <ApproverView 
                userEmail={userEmail}
                user={user}
                userRole={userRole}
              />
            )}
          </>
        )}

        {/* Admin View */}
        {userRole === USER_ROLES.ADMIN && activeTab === 'admin' && (
          <AdminView 
            userEmail={userEmail}
            user={user}
          />
        )}
      </div>
    </div>
  );
}