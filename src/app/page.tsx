import { auth } from "@/auth"
import SignInButton from "@/components/landing/sign-in-button"
import SignOutButton from "@/components/landing/sign-out-button"
import UserProfile from "@/components/landing/user-profile"

export default async function Home() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* Logo/Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              TCRS POC
            </h1>
            <p className="text-gray-600">
              Landing page with Microsoft Authentication
            </p>
          </div>

          {/* Content based on authentication status */}
          {session?.user ? (
            <div className="space-y-6">
              <UserProfile user={session.user} />
              <SignOutButton />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-700 mb-3">
                  Welcome! 👋
                </h2>
                <p className="text-gray-500 mb-6">
                  Please sign in with your Microsoft account to continue
                </p>
              </div>
              <SignInButton />
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-400">
              Powered by Next.js, NextAuth & Neon
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}