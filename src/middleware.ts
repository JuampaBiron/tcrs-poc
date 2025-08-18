// src/middleware.ts - VERSIÓN COMPLETA ACTUALIZADA
import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth?.user

  console.log(`🛡️ Middleware: ${pathname} - Auth: ${isAuthenticated}`)

  // Protected routes - require authentication
  const protectedRoutes = [
    '/dashboard',
    '/request', 
    '/admin'
  ]
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute && !isAuthenticated) {
    console.log(`🚫 Redirecting to login: ${pathname}`)
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Redirect authenticated users from login to dashboard
  if (pathname === '/' && isAuthenticated) {
    console.log(`✅ Redirecting to dashboard`)
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Allow the request to continue
  return NextResponse.next()
})

export const config = {
  // Match all paths except API routes, static files, and Next.js internals
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|finning-cat-logo.png).*)'
  ]
}