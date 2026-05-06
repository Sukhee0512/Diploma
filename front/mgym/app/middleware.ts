// app/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Cookie-оос user авах
  const userCookie = request.cookies.get('user')?.value;
  const path = request.nextUrl.pathname;
  
  // Public routes
  const publicPaths = ['/login', '/register', '/', '/gyms', '/plans'];
  const isPublicPath = publicPaths.some(publicPath => path === publicPath || path.startsWith('/gyms/') || path.startsWith('/plans/'));
  
  // Check if trying to access protected routes without auth
  if (!userCookie && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }
  
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);
      
      // Admin only routes
      if (path.startsWith('/admin') && user.role !== 'admin') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Gym owner only routes
      if (path.startsWith('/gym-owner') && user.role !== 'gym_manager') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Regular user only routes
      if (path.startsWith('/dashboard') && user.role !== 'user') {
        if (user.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        } else if (user.role === 'gym_manager') {
          return NextResponse.redirect(new URL('/gym-owner/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (e) {
      console.error('Error parsing user cookie:', e);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};