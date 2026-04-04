import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  console.log('🛡️ [Middleware] Request:', request.nextUrl.pathname);
  
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('🛡️ [Middleware] User:', user ? user.id : 'No user');

  // Define public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/auth',
    '/forgot-password',
    '/reset-password',
    '/set-password',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/magic-link',
    '/api/seed-admin',
  ];

  // Define auth pages that logged-in users shouldn't access
  // NOTE: /set-password is NOT here because users need to access it after magic link
  const authPages = ['/login', '/forgot-password', '/reset-password'];

  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  const isAuthPage = authPages.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  console.log('🛡️ [Middleware] isPublicPath:', isPublicPath, 'isAuthPage:', isAuthPage);

  // Redirect authenticated users away from auth pages (but allow /set-password)
  if (user && isAuthPage) {
    console.log('🛡️ [Middleware] Authenticated user on auth page, redirecting to /dashboard');
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (!user && !isPublicPath) {
    console.log('🛡️ [Middleware] Unauthenticated user on protected path, redirecting to /login');
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  console.log('🛡️ [Middleware] Allowing request to proceed');
  return supabaseResponse;
}
