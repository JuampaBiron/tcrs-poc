//auth.ts
import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { getUserRole } from "./lib/auth-utils";
 
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER!,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
      checks: ["state"], // Solo state, sin PKCE
    }),
  ],
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      console.log("🔍 SIGNIN CALLBACK");
      console.log("User:", user.email);
      console.log("Provider:", account?.provider);
 
      // Solo verificar que sea el provider correcto (sin validación de dominio)
      const isCorrectProvider = account?.provider === "microsoft-entra-id";
 
      if (!isCorrectProvider) {
        console.warn(`Sign-in rejected - wrong provider: ${account?.provider}`);
        return false;
      }
 
      console.log("✅ SIGNIN CALLBACK - Login approved for:", user.email);
      return true;
    },
 
    jwt: async ({ token, account, profile }) => {
      console.log("🔍 JWT CALLBACK STARTED");
 
      // On first login, parse groups and determine role
      if (account?.id_token) {
        try {
          const idTokenPayload = JSON.parse(
            Buffer.from(account.id_token.split(".")[1], "base64").toString()
          );
 
          const groups = idTokenPayload.groups || [];
          token.groups = groups;
 
          // *** NEW: Determine role and add it to the token ***
          // We create a temporary user object to pass to getUserRole
          const tempUser = {
            id: token.sub!,
            email: token.email!,
            name: token.name!,
            groups: groups,
          };
          token.role = getUserRole(tempUser);
 
          console.log(
            `✅ Groups and role ('${token.role}') added to JWT token.`
          );
        } catch (error) {
          console.error("❌ Error processing ID token:", error);
          token.groups = [];
          token.role = undefined; // or a default/guest role
        }
      }
      // On subsequent requests, the role will already be in the token.
 
      console.log("🔍 JWT CALLBACK FINISHED - Token has role:", token.role);
      return token;
    },
 
    session: async ({ session, token }) => {
      console.log("🔍 SESSION CALLBACK STARTED");
 
      if (token?.sub && session?.user) {
        session.user.id = token.sub;
      }
 
      session.user.groups = (token.groups as string[]) || [];
      session.user.role = token.role as string;
 
      console.log(
        `✅ Role ('${session.user.role}') and Groups added to session.`
      );
 
      console.log("🔍 SESSION CALLBACK FINISHED");
      return session;
    },
  },
});