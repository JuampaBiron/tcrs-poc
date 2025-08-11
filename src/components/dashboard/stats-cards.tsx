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
}

export default function StatsCards({ userRole = 'requester' }: StatsCardsProps) {
  // Mock data - esto vendría de la base de datos
  const getStatsForRole = (role: string): StatCard[] => {
    switch (role) {
      case 'approver':
        return [
          {
            title: "Requests to be reviewed",
            count: 6,
            subtitle: "Oldest request is from 6 days ago",
            bgColor: "bg-amber-50",
            textColor: "text-amber-800",
            icon: "👀"
          },
          {
            title: "Approved Requests", 
            count: 10,
            subtitle: "2 rejected requests",
            bgColor: "bg-green-50",
            textColor: "text-green-800", 
            icon: "✅"
          },
          {
            title: "Processing Time",
            count: 2.3,
            subtitle: "Average days",
            bgColor: "bg-blue-50",
            textColor: "text-blue-800",
            icon: "⏱️"
          }
        ]
      case 'admin':
        return [
          {
            title: "Total Requests",
            count: 45,
            subtitle: "This month",
            bgColor: "bg-purple-50",
            textColor: "text-purple-800",
            icon: "📊"
          },
          {
            title: "Active Users",
            count: 18,
            subtitle: "Last 7 days", 
            bgColor: "bg-indigo-50",
            textColor: "text-indigo-800",
            icon: "👥"
          },
          {
            title: "System Health",
            count: 99.9,
            subtitle: "% Uptime",
            bgColor: "bg-emerald-50",
            textColor: "text-emerald-800",
            icon: "🟢"
          }
        ]
      default: // requester
        return [
          {
            title: "Associated Request",
            count: 16,
            subtitle: "12 completed requests",
            bgColor: "bg-yellow-50",
            textColor: "text-yellow-800", 
            icon: "📄"
          },
          {
            title: "Pending Approval",
            count: 4,
            subtitle: "Awaiting review",
            bgColor: "bg-orange-50", 
            textColor: "text-orange-800",
            icon: "⏳"
          },
          {
            title: "Approved Requests",
            count: 10,
            subtitle: "2 rejected requests", 
            bgColor: "bg-green-50",
            textColor: "text-green-800",
            icon: "✅"
          }
        ]
    }
  }

  const stats = getStatsForRole(userRole)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`${stat.bgColor} rounded-xl p-6 border-2 border-gray-200 hover:border-yellow-300 transition-all duration-200 hover:shadow-lg`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="text-3xl">{stat.icon}</div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${stat.textColor}`}>
                {typeof stat.count === 'number' && stat.count % 1 !== 0 
                  ? stat.count.toFixed(1) 
                  : stat.count}
              </div>
            </div>
          </div>
          
          <div>
            <h3 className={`font-semibold text-lg ${stat.textColor} mb-2`}>
              {stat.title}
            </h3>
            {stat.subtitle && (
              <p className="text-gray-600 text-sm">
                {stat.subtitle}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}