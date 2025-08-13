import { Clock, Eye, CheckCircle, XCircle } from 'lucide-react'
import { RequestStatus } from '@/types'
import { STATUS_COLORS, REQUEST_STATUS } from '@/constants'

interface StatusBadgeProps {
  status: RequestStatus
  className?: string
}

const statusIcons = {
  [REQUEST_STATUS.PENDING]: Clock,
  [REQUEST_STATUS.IN_REVIEW]: Eye,
  [REQUEST_STATUS.APPROVED]: CheckCircle,
  [REQUEST_STATUS.REJECTED]: XCircle
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = STATUS_COLORS[status] || STATUS_COLORS[REQUEST_STATUS.PENDING]
  const Icon = statusIcons[status] || statusIcons[REQUEST_STATUS.PENDING]

  return (
    <span 
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text} ${className}`}
    >
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  )
}