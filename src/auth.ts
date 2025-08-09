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
      // Validación extra: solo permitir emails de tu dominio
      const allowedDomains = ['@sisuadigital.com'] // Cambia por tu dominio
      const isAllowedDomain = allowedDomains.some(domain => 
        user.email?.toLowerCase().endsWith(domain.toLowerCase())
      )
      
      // También verificar que viene del tenant correcto
      const isCorrectTenant = account?.provider === 'microsoft-entra-id'
      
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