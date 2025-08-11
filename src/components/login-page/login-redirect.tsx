// src/components/login-page/login-redirect.tsx
"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface LoginRedirectProps {
  session: any; // Tu tipo de session
}

export default function LoginRedirect({ session }: LoginRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      // Redireccionar al dashboard después de autenticación exitosa
      router.push('/dashboard');
    }
  }, [session, router]);

  // Este componente no renderiza nada visible
  return null;
}