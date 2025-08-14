// src/auth.ts - SOLUCIÓN FINAL
import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"
// REMOVER: import { DrizzleAdapter } from "@auth/drizzle-adapter"
// REMOVER: import { db } from "@/db"

export const { handlers, signIn, signOut, auth } = NextAuth({
  // REMOVER: adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt"  // CRÍTICO: Usar JWT strategy
  },
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email User.Read"
        }
      }
    }),
  ],
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      console.log('🔍 SIGNIN CALLBACK')
      
      // Domain validation
      const allowedDomainsEnv = process.env.ALLOWED_EMAIL_DOMAINS
      if (!allowedDomainsEnv) {
        console.error('ALLOWED_EMAIL_DOMAINS environment variable not configured')
        return false
      }
      
      const allowedDomains = allowedDomainsEnv.split(',').map(domain => domain.trim())
      const isAllowedDomain = allowedDomains.some(domain => 
        user.email?.toLowerCase().endsWith(domain.toLowerCase())
      )
      
      const isCorrectTenant = account?.provider === 'microsoft-entra-id'
      
      if (!isAllowedDomain) {
        console.warn(`Sign-in rejected for domain: ${user.email}`)
      }
      
      return isAllowedDomain && isCorrectTenant
    },
    
    jwt: async ({ token, account, profile }) => {
      console.log('🔍 JWT CALLBACK STARTED')
      
      // Include groups from ID token in JWT token (ONLY on first login)
      if (account?.id_token) {
        try {
          console.log('🔍 Parsing ID token for groups...')
          
          const idTokenPayload = JSON.parse(
            Buffer.from(account.id_token.split('.')[1], 'base64').toString()
          )
          
          console.log('🔍 Groups in payload:', idTokenPayload.groups)
          console.log('🔍 Groups count:', idTokenPayload.groups?.length)
          
          // Add groups to our token
          token.groups = idTokenPayload.groups || []
          
          console.log('✅ Groups added to JWT token:', (token.groups as string[]).length, 'groups')
        } catch (error) {
          console.error('❌ Error parsing ID token for groups:', error)
          token.groups = []
        }
      } else {
        // CRÍTICO: Preservar groups existentes en llamadas subsecuentes
        console.log('⚠️ No id_token - preserving existing groups')
        const existingGroups = token.groups as string[] | undefined
        console.log('🔍 Existing groups in token:', existingGroups?.length || 0)
        // No modificar token.groups - mantener los existentes
      }
      
      const finalGroups = token.groups as string[] | undefined
      console.log('🔍 JWT CALLBACK FINISHED - Token has groups:', finalGroups?.length || 0)
      return token
    },
    
    session: async ({ session, token }) => {
      console.log('🔍 SESSION CALLBACK STARTED')
      
      if (token?.sub && session?.user) {
        session.user.id = token.sub
      }
      
      // Add groups to session from JWT token
      if (token?.groups) {
        session.user.groups = token.groups as string[]
        console.log('✅ Groups added to session from JWT:', session.user.groups.length, 'groups')
      } else {
        console.log('⚠️ No groups in JWT token')
        session.user.groups = []
      }
      
      console.log('🔍 SESSION CALLBACK FINISHED')
      return session
    },
  },
})