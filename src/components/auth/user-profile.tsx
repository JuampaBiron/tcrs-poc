import { User } from "next-auth"
import Image from "next/image"

interface UserProfileProps {
  user: User
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200 space-y-4">
      {/* Profile Image */}
      <div className="flex justify-center">
        {user.image ? (
          <div className="relative">
            <Image
              src={user.image}
              alt={user.name || "User"}
              width={96}
              height={96}
              className="rounded-full border-4 border-gradient-to-r from-green-400 to-yellow-400 shadow-lg"
            />
            {/* Online indicator */}
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-lg"></div>
          </div>
        ) : (
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-yellow-400 rounded-full flex items-center justify-center text-black text-3xl font-bold shadow-lg">
              {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full shadow-lg"></div>
          </div>
        )}
      </div>
      
      {/* User Info */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">
          {user.name || "Usuario"}
        </h3>
        {user.email && (
          <p className="text-gray-600 bg-gray-50 px-4 py-2 rounded-lg text-sm">
            📧 {user.email}
          </p>
        )}
      </div>
      
      {/* Status Badge */}
      <div className="bg-gradient-to-r from-green-50 to-yellow-50 border-2 border-green-200 rounded-xl p-3">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-green-700 text-sm font-semibold">
            Sesión Activa
          </p>
        </div>
      </div>

      {/* User Details */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="font-semibold text-gray-700">Estado</div>
          <div className="text-green-600 font-bold">En línea</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="font-semibold text-gray-700">Autenticación</div>
          <div className="text-blue-600 font-bold">Microsoft</div>
        </div>
      </div>
    </div>
  )
}