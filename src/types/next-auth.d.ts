import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";
 
declare module "next-auth" {
  /**
   * El objeto de la sesión devuelto por `auth`, `useSession`, etc.
   */
  interface Session {
    user: {
      id: string;
      groups?: string[];
      role?: string;
    } & DefaultSession["user"];
  }
 
  /**
   * El objeto de usuario devuelto cuando se utiliza un adaptador de base de datos.
   */
  interface User extends DefaultUser {
    groups?: string[]; // Agregar groups al user
  }
}
 
declare module "next-auth/jwt" {
  /**
   * El token JWT devuelto por el callback `jwt`.
   */
  interface JWT extends DefaultJWT {
    groups?: string[]; // Agregar groups al JWT token
    role?: string;
  }
}