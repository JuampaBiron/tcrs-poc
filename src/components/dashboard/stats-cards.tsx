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
          bg: "bg-gradient-to-br from-blue-50 to-blue-100",
          text: "text-blue-700",
          border: "border-blue-200 shadow-blue-100/50",
          glow: "shadow-lg shadow-blue-200/40"
        };
      case "orange":
        return {
          bg: "bg-gradient-to-br from-orange-50 to-orange-100",
          text: "text-orange-700",
          border: "border-orange-200 shadow-orange-100/50",
          glow: "shadow-lg shadow-orange-200/40"
        };
      case "green":
        return {
          bg: "bg-gradient-to-br from-green-50 to-green-100",
          text: "text-green-700",
          border: "border-green-200 shadow-green-100/50",
          glow: "shadow-lg shadow-green-200/40"
        };
      case "red":
        return {
          bg: "bg-gradient-to-br from-red-50 to-red-100",
          text: "text-red-700",
          border: "border-red-200 shadow-red-100/50",
          glow: "shadow-lg shadow-red-200/40"
        };
      default:
        return {
          bg: "bg-gradient-to-br from-gray-50 to-gray-100",
          text: "text-gray-700",
          border: "border-gray-200 shadow-gray-100/50",
          glow: "shadow-lg shadow-gray-200/40"
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
            className={`bg-gradient-to-br from-white via-gray-50/30 to-gray-100/20 rounded-xl shadow-sm border ${colors.border} p-6 hover:shadow-md hover:scale-[1.02] transition-all duration-300`}
          >
            <div className="flex items-center">
              {/* Number Section */}
              <div className="flex-shrink-0">
                <div className={`text-4xl font-bold ${colors.text}`}>
                  {card.value}
                </div>
              </div>
              
              {/* Vertical Divider */}
              <div className={`w-px h-12 bg-gray-300 mx-4`}></div>
              
              {/* Text Section */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 mb-1">{card.title}</div>
                <div className="text-xs text-gray-600 font-medium">{card.subtitle}</div>
              </div>
              
              {/* Icon Section */}
              <div className={`p-3 ${colors.bg} rounded-xl flex-shrink-0 ml-3 shadow-md border border-white/50`}>
                <Icon className={`${colors.text} w-6 h-6`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}