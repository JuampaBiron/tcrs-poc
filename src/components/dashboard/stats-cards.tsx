interface StatCard {
  title: string
  count: number
  subtitle?: string
  bgColor: string
  textColor: string
  icon: string
}

interface StatsCardsProps {
  userRole?: 'requester' | 'approver' | 'admin'
  stats: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
}

export default function StatsCards({ userRole = 'requester', stats }: StatsCardsProps) {
  
  const getStatsForRole = (role: string): StatCard[] => {
    switch (role) {
      case 'approver':
        return [
          {
            title: "Requests to be reviewed",
            count: stats.pending,
            subtitle: stats.pending > 0 ? "Awaiting your approval" : "All caught up!",
            bgColor: "bg-amber-50",
            textColor: "text-amber-800",
            icon: "👀"
          },
          {
            title: "Approved Requests", 
            count: stats.approved,
            subtitle: stats.rejected > 0 ? `${stats.rejected} rejected requests` : "Great job!",
            bgColor: "bg-green-50",
            textColor: "text-green-800", 
            icon: "✅"
          },
          {
            title: "Total Handled",
            count: stats.approved + stats.rejected,
            subtitle: "This period",
            bgColor: "bg-blue-50",
            textColor: "text-blue-800",
            icon: "📊"
          }
        ]
      case 'admin':
        return [
          {
            title: "Total Requests",
            count: stats.total,
            subtitle: "All time",
            bgColor: "bg-purple-50",
            textColor: "text-purple-800",
            icon: "📊"
          },
          {
            title: "Pending Review",
            count: stats.pending,
            subtitle: "Needs attention", 
            bgColor: "bg-orange-50",
            textColor: "text-orange-800",
            icon: "⏳"
          },
          {
            title: "Completion Rate",
            count: stats.total > 0 ? Math.round(((stats.approved + stats.rejected) / stats.total) * 100) : 0,
            subtitle: "% Processed",
            bgColor: "bg-emerald-50",
            textColor: "text-emerald-800",
            icon: "🎯"
          }
        ]
      default: // requester
        return [
          {
            title: "Your Requests",
            count: stats.total,
            subtitle: `${stats.approved + stats.rejected} completed`,
            bgColor: "bg-yellow-50",
            textColor: "text-yellow-800", 
            icon: "📄"
          },
          {
            title: "Pending Approval",
            count: stats.pending,
            subtitle: "Awaiting review",
            bgColor: "bg-orange-50", 
            textColor: "text-orange-800",
            icon: "⏳"
          },
          {
            title: "Approved",
            count: stats.approved,
            subtitle: stats.rejected > 0 ? `${stats.rejected} rejected` : "All approved!", 
            bgColor: "bg-green-50",
            textColor: "text-green-800",
            icon: "✅"
          }
        ]
    }
  }

  const cards = getStatsForRole(userRole)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`${card.bgColor} rounded-xl p-6 border-2 border-gray-200 hover:border-yellow-300 transition-all duration-200 hover:shadow-lg`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">{card.icon}</div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${card.textColor}`}>
                {typeof card.count === 'number' && card.count % 1 !== 0 
                  ? card.count.toFixed(1) 
                  : card.count}
              </div>
            </div>
          </div>
          
          <div>
            <h3 className={`font-semibold text-lg ${card.textColor} mb-2`}>
              {card.title}
            </h3>
            {card.subtitle && (
              <p className="text-gray-600 text-sm">
                {card.subtitle}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}