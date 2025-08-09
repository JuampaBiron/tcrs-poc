import { User } from "next-auth"
import Image from "next/image"

interface UserProfileProps {
  user: User
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={80}
            height={80}
            className="rounded-full border-4 border-blue-200"
          />
        ) : (
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
            {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
          </div>
        )}
      </div>
      
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Welcome, {user.name || "User"}! 🎉
        </h2>
        {user.email && (
          <p className="text-gray-600 mt-1">{user.email}</p>
        )}
      </div>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-green-700 text-sm font-medium">
          ✅ Successfully authenticated with Microsoft
        </p>
      </div>
    </div>
  )
}