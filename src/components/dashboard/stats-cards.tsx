// src/components/dashboard/stats-cards.tsx
"use client";

import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";
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
    switch (role) {
      case USER_ROLES.ADMIN:
        return [
          {
            title: "Total Requests",
            value: stats.total,
            subtitle: "All time",
            color: "blue",
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
            title: "Accepted Requests",
            value: stats.approved,
            subtitle: "Approved",
            color: "green",
            icon: CheckCircle
          },
          {
            title: "Rejected Requests",
            value: stats.rejected,
            subtitle: "Declined",
            color: "red",
            icon: XCircle
          }
        ];
      
      case USER_ROLES.APPROVER:
        return [
          {
            title: "Total Assigned",
            value: stats.total,
            subtitle: "Your queue",
            color: "blue",
            icon: FileText
          },
          {
            title: "Pending Review",
            value: stats.pending,
            subtitle: stats.pending > 0 ? "Awaiting your approval" : "All caught up!",
            color: "orange",
            icon: Clock
          },
          {
            title: "Accepted Requests",
            value: stats.approved,
            subtitle: "You approved",
            color: "green",
            icon: CheckCircle
          },
          {
            title: "Rejected Requests",
            value: stats.rejected,
            subtitle: "You declined",
            color: "red",
            icon: XCircle
          }
        ];
      
      default: // USER_ROLES.REQUESTER
        return [
          {
            title: "Your Requests",
            value: stats.total,
            subtitle: "Total submitted",
            color: "blue",
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
            title: "Accepted Requests",
            value: stats.approved,
            subtitle: "Approved",
            color: "green",
            icon: CheckCircle
          },
          {
            title: "Rejected Requests",
            value: stats.rejected,
            subtitle: "Need revision",
            color: "red",
            icon: XCircle
          }
        ];
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          bg: "bg-blue-100",
          text: "text-blue-600",
          border: "border-blue-200"
        };
      case "orange":
        return {
          bg: "bg-orange-100",
          text: "text-orange-600",
          border: "border-orange-200"
        };
      case "green":
        return {
          bg: "bg-green-100",
          text: "text-green-600",
          border: "border-green-200"
        };
      case "red":
        return {
          bg: "bg-red-100",
          text: "text-red-600",
          border: "border-red-200"
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const colors = getColorClasses(card.color);
        
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`text-2xl font-bold ${colors.text} mb-1`}>
                  {card.value}
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">{card.title}</div>
                <div className="text-xs text-gray-500">{card.subtitle}</div>
              </div>
              <div className={`p-3 ${colors.bg} rounded-lg flex-shrink-0 ml-4`}>
                <Icon className={`${colors.text} w-6 h-6`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}