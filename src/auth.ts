// src/auth.ts - REEMPLAZAR TODO EL ARCHIVO
import NextAuth from "next-auth"
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt"
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
      }
    },  
  },
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER!,
      authorization: {
        params: {
          scope: "openid profile email User.Read"
        }
      },
      checks: ["state"]  // Solo state, sin PKCE
    }),
  ],
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      console.log('🔍 SIGNIN CALLBACK')
      console.log('User:', user.email)
      console.log('Provider:', account?.provider)
      
      // Solo verificar que sea el provider correcto (sin validación de dominio)
      const isCorrectProvider = account?.provider === 'microsoft-entra-id'
      
      if (!isCorrectProvider) {
        console.warn(`Sign-in rejected - wrong provider: ${account?.provider}`)
        return false
      }
      
      console.log('✅ SIGNIN CALLBACK - Login approved for:', user.email)
      return true
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