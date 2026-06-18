import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { clerkEnabled } from '@/lib/auth/clerk-enabled'

const isProtectedRoute = createRouteMatcher([
  '/import(.*)',
  '/dashboard(.*)',
  '/analytics(.*)',
  '/mentor(.*)',
  '/settings(.*)'
])

const protectedProxy = clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    auth().protect()
  }

  return NextResponse.next()
})

export default function proxy(req: Parameters<typeof protectedProxy>[0]) {
  if (!clerkEnabled()) return NextResponse.next()
  return protectedProxy(req)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/:path*',
    '/(api|trpc)(.*)'
  ]
}