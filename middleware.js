import { NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { pathname } = req.nextUrl
  
  // Refresh session to ensure it's properly available
  await supabase.auth.getSession()
  
  // Get user to ensure session is available
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  const session = user ? { user } : null
  
  console.log('Middleware session check:', {
    pathname,
    hasSession: !!session,
    userId: session?.user?.id
  })
  
  // Protected routes
  const protectedRoutes = ['/my-courses', '/profile']
  const adminRoutes = ['/admin', '/admin/*']
  const authRoutes = ['/auth/login', '/auth/register']
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = pathname.startsWith('/admin')
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  // Temporarily disable middleware auth - handle client-side for now
  // TODO: Fix middleware session detection issue
  /*
  if (!session && (isProtectedRoute || isAdminRoute)) {
    console.log('Middleware: Unauthenticated user accessing protected route', {
      pathname,
      isProtectedRoute,
      isAdminRoute
    })
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }
  */
  
  // Temporarily disable auth route redirects - handle client-side
  /*
  if (session && isAuthRoute) {
    const redirectTo = req.nextUrl.searchParams.get('redirectTo')
    
    console.log('Middleware: Authenticated user on auth route', {
      pathname,
      redirectTo,
      hasSession: !!session,
      userId: session?.user?.id
    })
    
    if (redirectTo) {
      // User is authenticated and has a redirectTo, redirect immediately
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = redirectTo
      redirectUrl.searchParams.delete('redirectTo')
      console.log('Middleware: Redirecting authenticated user to:', redirectUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    } else {
      // No redirectTo parameter, redirect to default courses page
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/courses'
      console.log('Middleware: Redirecting authenticated user to default courses page')
      return NextResponse.redirect(redirectUrl)
    }
  }
  */
  
  // Temporarily disable admin check - handle client-side
  /*
  if (isAdminRoute && session) {
    console.log('Middleware: Checking admin access for authenticated user', {
      pathname,
      userId: session.user.id
    })
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    console.log('Middleware admin check:', {
      userId: session.user.id,
      profile,
      profileError,
      pathname
    })
    
    if (!profile || profile.role !== 'admin') {
      console.log('Middleware: User is not admin, redirecting to home')
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/'
      return NextResponse.redirect(redirectUrl)
    }
    
    console.log('Middleware: Admin access granted, proceeding to admin route')
  }
  */
  
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
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.payhere.lk *.stripe.com *.google-analytics.com *.googletagmanager.com js.stripe.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com *.stripe.com *.stripe.network m.stripe.network; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob: *.supabase.co *.unsplash.com *.ytimg.com *.googletagmanager.com *.pexels.com images.pexels.com; connect-src 'self' *.supabase.co *.stripe.com *.payhere.lk *.google-analytics.com; frame-src 'self' js.stripe.com *.stripe.com *.payhere.lk sandbox.payhere.lk payhere.lk/lib/payhere.js youtube.com *.youtube.com"
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