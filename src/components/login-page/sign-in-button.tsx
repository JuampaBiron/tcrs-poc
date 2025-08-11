"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function SignInButton() {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleSignIn = async () => {
    setIsConnecting(true)
    try {
      await signIn("microsoft-entra-id")
    } catch (error) {
      setIsConnecting(false)
    }
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isConnecting}
      className="w-full bg-[#0078d4] hover:bg-[#106ebe] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
    >
      {isConnecting ? (
        <>
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Connecting to Microsoft...
        </>
      ) : (
        <>
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
          </svg>
          Sign in with Microsoft
        </>
      )}
    </button>
  )
}