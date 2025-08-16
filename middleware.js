import { NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { pathname } = req.nextUrl
  
  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  // Protected routes
  const protectedRoutes = ['/my-courses', '/profile']
  const adminRoutes = ['/admin', '/admin/*']
  const authRoutes = ['/auth/login', '/auth/register']
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  // Redirect if not authenticated and trying to access protected route
  if (!session && (isProtectedRoute || isAdminRoute)) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  // Redirect if authenticated and trying to access auth routes
  if (session && isAuthRoute) {
    const redirectTo = req.nextUrl.searchParams.get('redirectTo')
    
    // If there's no redirectTo parameter, redirect to courses
    // If there is a redirectTo, let the client-side handle it to avoid conflicts
    if (!redirectTo) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/courses'
      return NextResponse.redirect(redirectUrl)
    }
    
    // If there's a redirectTo parameter, let the page handle the redirect
    // to avoid middleware/client conflicts
  }
  
  // Check admin access
  if (isAdminRoute && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // Add security headers
  const response = NextResponse.next()
  // Temporarily allow framing for development (PayHere needs this)
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  } else {
    response.headers.set('X-Frame-Options', 'DENY')
  }
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.payhere.lk *.stripe.com *.google-analytics.com *.googletagmanager.com js.stripe.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com *.stripe.com *.stripe.network m.stripe.network; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob: *.supabase.co *.unsplash.com *.ytimg.com *.googletagmanager.com *.pexels.com images.pexels.com; connect-src 'self' *.supabase.co *.stripe.com *.payhere.lk *.google-analytics.com; frame-src 'self' js.stripe.com *.stripe.com *.payhere.lk sandbox.payhere.lk youtube.com *.youtube.com"
  )
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}