import { AlertCircle, RefreshCcw } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
  className?: string
}

export default function ErrorMessage({ 
  message, 
  onRetry, 
  className = '' 
}: ErrorMessageProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            Error
          </h3>
          <p className="text-sm text-red-700">
            {message}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              <RefreshCcw className="w-4 h-4" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}