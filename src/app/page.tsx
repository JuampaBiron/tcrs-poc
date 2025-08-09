import { auth } from "@/auth"
import SignInButton from "@/components/landing/sign-in-button"
import SignOutButton from "@/components/landing/sign-out-button"
import UserProfile from "@/components/landing/user-profile"
import FinningLogo from "@/components/landing/finning-logo"
import BackgroundImage from "@/components/landing/background-image"

export default async function Home() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 flex items-center justify-center relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(0,0,0,0.1) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(0,0,0,0.1) 0%, transparent 50%),
              linear-gradient(45deg, transparent 30%, rgba(0,0,0,0.05) 50%, transparent 70%)
            `
          }}
        />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-16 text-3xl opacity-20 animate-pulse">📄</div>
        <div className="absolute top-40 right-20 text-3xl opacity-20 animate-bounce">✅</div>
        <div className="absolute bottom-32 left-20 text-3xl opacity-20 animate-pulse">🏢</div>
        <div className="absolute bottom-20 right-16 text-3xl opacity-20 animate-bounce">⚡</div>
        <div className="absolute top-60 left-1/3 text-2xl opacity-15 animate-pulse">💰</div>
      </div>

      {/* Main Container */}
      <div className="flex bg-white rounded-3xl shadow-2xl backdrop-blur-md overflow-hidden max-w-7xl w-11/12 min-h-[750px] relative z-10 border-2 border-yellow-200">
        
        {/* Left Panel */}
        <div className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-800 p-20 flex flex-col justify-center text-white relative">
          
          {/* Geometric Pattern Overlay */}
          {/*<div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><pattern id='hexagon' width='20' height='20' patternUnits='userSpaceOnUse'><polygon points='10,2 18,7 18,13 10,18 2,13 2,7' fill='none' stroke='rgba(255,193,7,0.3)' stroke-width='0.5'/></pattern></defs><rect width='100' height='100' fill='url(%23hexagon)'/></svg>")`,
              backgroundRepeat: 'repeat'
            
          />*/}
          <BackgroundImage />
          
          
          <div className="relative z-10">
            {/* Logo Area */}
            <div className="mb-8">
              <div className="text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">
                TCRS
              </div>
              <div className="text-lg text-yellow-400 font-semibold tracking-wider">
                AP INVOICE APP & AUTOMATION
              </div>
              <div className="w-20 h-1 bg-yellow-400 mt-3"></div>
            </div>
            
            {/* Description */}
            <div className="text-xl mb-10 opacity-90 leading-relaxed text-gray-300">
              Transform your manual, email-driven invoice approval process into a streamlined, 
              efficient, and secure automated workflow. Built specifically for Finning's Accounts 
              Payable operations with role-based access and automated notifications.
            </div>
            
            {/* Key Features */}
            <div className="mb-12 space-y-5">
              <div className="flex items-center text-lg opacity-90">
                <div className="bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">✓</div>
                <span>Centralized invoice submission and approval workflow</span>
              </div>
              <div className="flex items-center text-lg opacity-90">
                <div className="bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">✓</div>
                <span>Built-in GL Coding Block data entry and validation</span>
              </div>
              <div className="flex items-center text-lg opacity-90">
                <div className="bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">✓</div>
                <span>Role-based access for Requesters, Approvers & Admins</span>
              </div>
              <div className="flex items-center text-lg opacity-90">
                <div className="bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">✓</div>
                <span>Automated PDF merging and TIFF file generation</span>
              </div>
              <div className="flex items-center text-lg opacity-90">
                <div className="bg-yellow-400 text-black rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0">✓</div>
                <span>Real-time notifications and comprehensive audit trails</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-20 flex flex-col justify-center bg-gradient-to-br from-gray-50 to-white">
          <div className="w-full max-w-md mx-auto">
            
            {session?.user ? (
              // Authenticated User View
              <div className="space-y-8">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Welcome Back! 🎉
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Successfully authenticated
                  </p>
                </div>
                
                {/* User Profile */}
                <UserProfile user={session.user} />
                
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm mr-3">✓</div>
                    <p className="text-green-700 font-medium">
                      Successfully authenticated with Microsoft Entra ID
                    </p>
                  </div>
                </div>
                
                <SignOutButton />
              </div>
            ) : (
              // Login View
              <div className="space-y-8">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Access TCRS
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Sign in with your Microsoft account to access the AP Invoice automation system
                  </p>
                </div>
                
                {/* Login Card */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
                  <SignInButton />
                </div>

                {/* Security Notice */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-black text-sm mr-3 mt-0.5 flex-shrink-0">🔒</div>
                    <div>
                      <p className="text-yellow-800 font-medium mb-1">Secure Authentication</p>
                      <p className="text-yellow-700 text-sm">
                        Your credentials are protected by Microsoft's enterprise-grade security. 
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-8 border-t-2 border-gray-200 text-center">
              <div className="flex items-center justify-center mb-3">
                <FinningLogo />
              </div>
              <p className="text-sm text-gray-500">
                Powered by Sisua Digital
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}