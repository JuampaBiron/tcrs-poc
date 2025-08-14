// src/components/dashboard/stats-cards.tsx
"use client";

import { FileText, Clock, CheckCircle } from "lucide-react";
import { UserRole } from "@/types";
import { USER_ROLES } from "@/constants";

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface StatsCardsProps {
  userRole: UserRole;
  stats: Stats;
}

export default function StatsCards({ userRole, stats }: StatsCardsProps) {
  const getStatsForRole = (role: UserRole) => {
    const completionRate = stats.total > 0 
      ? Math.round(((stats.approved + stats.rejected) / stats.total) * 100) 
      : 0;

    switch (role) {
      case USER_ROLES.ADMIN:
        return [
          {
            title: "Total Requests",
            value: stats.total,
            subtitle: "All time",
            color: "purple",
            icon: FileText
          },
          {
            title: "Pending Review", 
            value: stats.pending,
            subtitle: "Needs attention",
            color: "orange",
            icon: Clock
          },
          {
            title: "Completion Rate",
            value: `${completionRate}%`,
            subtitle: "% Processed",
            color: "teal",
            icon: CheckCircle
          }
        ];
      
      case USER_ROLES.APPROVER:
        return [
          {
            title: "Requests to Review",
            value: stats.pending,
            subtitle: stats.pending > 0 ? "Awaiting your approval" : "All caught up!",
            color: "orange",
            icon: Clock
          },
          {
            title: "Approved Requests",
            value: stats.approved,
            subtitle: stats.rejected > 0 ? `${stats.rejected} rejected` : "Great job!",
            color: "teal",
            icon: CheckCircle
          },
          {
            title: "Total Handled",
            value: stats.approved + stats.rejected,
            subtitle: "This period",
            color: "purple",
            icon: FileText
          }
        ];
      
      default: // USER_ROLES.REQUESTER
        return [
          {
            title: "Your Requests",
            value: stats.total,
            subtitle: `${stats.approved + stats.rejected} completed`,
            color: "purple",
            icon: FileText
          },
          {
            title: "Pending Approval",
            value: stats.pending,
            subtitle: "Awaiting review",
            color: "orange",
            icon: Clock
          },
          {
            title: "Approved",
            value: stats.approved,
            subtitle: stats.rejected > 0 ? `${stats.rejected} rejected` : "All approved!",
            color: "teal",
            icon: CheckCircle
          }
        ];
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "purple":
        return {
          bg: "bg-purple-100",
          text: "text-purple-600",
          border: "border-purple-200"
        };
      case "orange":
        return {
          bg: "bg-orange-100",
          text: "text-orange-600",
          border: "border-orange-200"
        };
      case "teal":
        return {
          bg: "bg-teal-100",
          text: "text-teal-600",
          border: "border-teal-200"
        };
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-600",
          border: "border-gray-200"
        };
    }
  };

  const cards = getStatsForRole(userRole);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const colors = getColorClasses(card.color);
        
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 border"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${colors.text}`}>
                  {card.value}
                </div>
                <div className="text-sm text-gray-600 mt-1">{card.title}</div>
                <div className="text-xs text-gray-500 mt-1">{card.subtitle}</div>
              </div>
              <div className={`p-3 ${colors.bg} rounded-lg`}>
                <Icon className={colors.text} size={24} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}