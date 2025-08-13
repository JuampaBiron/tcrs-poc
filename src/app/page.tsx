import { auth } from "@/auth"
import { redirect } from "next/navigation"
import SignInButton from "@/components/auth/sign-in-button"
import FinningLogo from "@/components/ui/finning-logo"
import BackgroundImage from "@/components/auth/background-image"

export default async function LoginPage() {
  const session = await auth()

  // Redirect authenticated users to dashboard (middleware will also handle this)
  if (session?.user) {
    redirect("/dashboard")
  }

  // Show login page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500 flex items-center justify-center relative overflow-hidden">
      <BackgroundImage />
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
      <div 
        className="flex rounded-3xl shadow-2xl backdrop-blur-md overflow-hidden max-w-7xl w-11/12 min-h-[750px] relative z-10 border-2 border-yellow-200"
        style={{ backgroundColor: "rgba(255,255,255,0.75)" }} // 85% opacidad
        >
        {/* Left Panel - TCRS Branding */}
        <div className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-800 p-20 flex flex-col justify-center text-white relative">
          <div className="mb-12">
            <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              TCRS
            </h1>
            <h2 className="text-3xl font-bold mb-4 text-gray-100">
              Invoice Approval System
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Streamlined approval workflow for Accounts Payable invoices with automated routing and digital signatures.
            </p>
            
            <div className="space-y-4 text-gray-400">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Automated GL coding validation</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Role-based approval routing</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Real-time status tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Enterprise security compliance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login */}
        <div className="flex-1 p-20 flex flex-col justify-center">
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
                    Your credentials are protected by Microsoft&apos;s enterprise-grade security. 
                  </p>
                </div>
              </div>
            </div>
          </div>

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
  )
}