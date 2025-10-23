import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Define protected routes that require authentication
const protectedRoutes = [
  '/feed',
  '/messages',
  '/notifications',
  '/explore',
  '/saved',
  '/settings',
]

// Define routes that are always accessible regardless of authentication
const alwaysAccessibleRoutes = [
  '/search',
  '/_next',
  '/static',
  '/api',
  '/create',
  '/reels',
  '/profile',
  '/stories'
]

// Define auth routes that should redirect to feed if already authenticated
const authRoutes = ['/login', '/register']

// Define public paths that don't need authentication
const publicPaths = ['/api', '/_next', '/static', '/images', '/favicon.ico']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Accept either cookie name and Authorization header
  const headerAuth = request.headers.get('authorization') || ''
  const bearer = headerAuth.toLowerCase().startsWith('bearer ') ? headerAuth.split(' ')[1] : null
  const cookieToken = request.cookies.get('token')?.value || request.cookies.get('client-token')?.value || null
  const token = bearer || cookieToken
  
  // Store the original URL to redirect back after login
  const originalUrl = request.nextUrl.pathname + request.nextUrl.search
  
  // Check if the route is in alwaysAccessibleRoutes first
  if (alwaysAccessibleRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path)) || 
     pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)) {
    return NextResponse.next()
  }
  
  // Handle root path - redirect to feed if authenticated, otherwise to login
  if (pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.redirect(new URL('/feed', request.url))
  }

  // Handle auth routes - redirect to feed if already authenticated
  if (authRoutes.includes(pathname)) {
    if (token) {
      try {
        // Verify token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret')
        await jwtVerify(token, secret)
        
        // If token is valid, redirect to feed
        return NextResponse.redirect(new URL('/feed', request.url))
      } catch (error) {
        // If token is invalid, continue to login/register
        return NextResponse.next()
      }
    }
    return NextResponse.next()
  }

  // Handle protected routes - redirect to login if not authenticated
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      // Save the original URL to redirect back after login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', originalUrl)
      return NextResponse.redirect(loginUrl)
    }
    
    try {
      // Verify token
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret')
      await jwtVerify(token, secret)
      
      // If token is valid, continue to protected route
      return NextResponse.next()
    } catch (error) {
      // If token is invalid, redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', originalUrl)
      return NextResponse.redirect(loginUrl)
    }
  }

  // For all other routes, continue
  return NextResponse.next()
}