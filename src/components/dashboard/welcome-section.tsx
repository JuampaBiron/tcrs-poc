import { User } from "next-auth"
import { UserRole, Stats } from "@/types"
import { USER_ROLES } from "@/constants"

interface WelcomeSectionProps {
  user: User
  userRole: UserRole
  stats: Stats
}

export default function WelcomeSection({ user, userRole, stats }: WelcomeSectionProps) {
  const getWelcomeMessage = () => {
    switch (userRole) {
      case USER_ROLES.APPROVER:
        return `You have ${stats.pending} pending requests waiting for your review.`
      case USER_ROLES.ADMIN:
        return `System overview: ${stats.total} total requests this period.`
      default:
        return `You have ${stats.pending} requests pending approval.`
    }
  }

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 rounded-xl p-6 text-black">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {user.name?.split(' ')[0] || 'User'}! {userRole}
        </h2>
        <p className="text-black/80">
          {getWelcomeMessage()}
        </p>
      </div>
    </div>
  )
}