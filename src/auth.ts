import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      
    }),
  ],
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      // Domain validation from environment variables
      const allowedDomainsEnv = process.env.ALLOWED_EMAIL_DOMAINS
      if (!allowedDomainsEnv) {
        console.error('ALLOWED_EMAIL_DOMAINS environment variable not configured')
        return false
      }
      
      const allowedDomains = allowedDomainsEnv.split(',').map(domain => domain.trim())
      const isAllowedDomain = allowedDomains.some(domain => 
        user.email?.toLowerCase().endsWith(domain.toLowerCase())
      )
      
      // Verify correct provider
      const isCorrectTenant = account?.provider === 'microsoft-entra-id'
      
      if (!isAllowedDomain) {
        console.warn(`Sign-in rejected for domain: ${user.email}`)
      }
      
      return isAllowedDomain && isCorrectTenant
    },
    session: ({ session, token }) => {
      if (token?.sub && session?.user) {
        session.user.id = token.sub
      }
      return session
    },
  },
})