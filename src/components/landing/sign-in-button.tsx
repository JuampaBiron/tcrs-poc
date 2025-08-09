"use client"

import { signIn } from "next-auth/react"

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn("microsoft-entra-id")}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
      </svg>
      Sign in with Microsoft
    </button>
  )
}