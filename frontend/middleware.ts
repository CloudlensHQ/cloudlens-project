import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route patterns
const publicRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password'];
const authRoutes = ['/signin', '/signup'];
const protectedRoutes = ['/dashboard', '/scans', '/settings', '/profile'];

// Function to check if token is expired
function isTokenExpired(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
    } catch {
        return true;
    }
}

// Function to check if token expires within threshold (5 minutes)
function isTokenNearExpiry(token: string): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const threshold = 5 * 60; // 5 minutes
        return payload.exp - currentTime < threshold;
    } catch {
        return true;
    }
}

// Function to attempt token refresh
async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
            };
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }
    return null;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip middleware for static files and API routes
    if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/api/') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    // Get tokens from cookies or headers
    const accessToken = request.cookies.get('cloudlens_access_token')?.value ||
        request.headers.get('authorization')?.replace('Bearer ', '');
    const refreshToken = request.cookies.get('cloudlens_refresh_token')?.value;
    const userDataCookie = request.cookies.get('cloudlens_user')?.value;

    let userData = null;
    try {
        userData = userDataCookie ? JSON.parse(userDataCookie) : null;
    } catch {
        userData = null;
    }

    const isAuthenticated = !!accessToken && !isTokenExpired(accessToken);
    const hasValidRefreshToken = !!refreshToken && !isTokenExpired(refreshToken);

    // Handle token refresh if access token is expired but refresh token is valid
    if (!isAuthenticated && hasValidRefreshToken) {
        const refreshedTokens = await refreshTokens(refreshToken);

        if (refreshedTokens) {
            const response = NextResponse.next();

            // Set new tokens in cookies
            response.cookies.set('cloudlens_access_token', refreshedTokens.accessToken, {
                httpOnly: false, // Allow JavaScript access for client-side usage
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 60, // 30 minutes
            });

            response.cookies.set('cloudlens_refresh_token', refreshedTokens.refreshToken, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60, // 30 days
            });

            // Continue with the request
            return response;
        } else {
            // Refresh failed, clear tokens and redirect to signin
            const response = NextResponse.redirect(new URL('/signin', request.url));
            response.cookies.delete('cloudlens_access_token');
            response.cookies.delete('cloudlens_refresh_token');
            response.cookies.delete('cloudlens_user');
            return response;
        }
    }

    // Clear invalid tokens
    if (accessToken && isTokenExpired(accessToken) && (!refreshToken || isTokenExpired(refreshToken))) {
        const response = pathname === '/signin' ? NextResponse.next() : NextResponse.redirect(new URL('/signin', request.url));
        response.cookies.delete('cloudlens_access_token');
        response.cookies.delete('cloudlens_refresh_token');
        response.cookies.delete('cloudlens_user');
        return response;
    }

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && authRoutes.includes(pathname)) {
        const redirectUrl = userData?.onboardingCompleted ? '/dashboard' : '/onboarding';
        return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Redirect unauthenticated users from protected routes
    if (!isAuthenticated && (protectedRoutes.includes(pathname) || pathname.startsWith('/dashboard'))) {
        return NextResponse.redirect(new URL('/signin', request.url));
    }

    // Handle onboarding redirect
    if (isAuthenticated && userData) {
        if (!userData.onboardingCompleted && pathname !== '/onboarding' && !publicRoutes.includes(pathname)) {
            return NextResponse.redirect(new URL('/onboarding', request.url));
        }

        if (userData.onboardingCompleted && pathname === '/onboarding') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    // Add authorization header to API requests if authenticated
    const response = NextResponse.next();

    if (isAuthenticated && accessToken) {
        // Check if token is near expiry and refresh proactively
        if (isTokenNearExpiry(accessToken) && hasValidRefreshToken) {
            // Don't block the request, but attempt refresh in background
            refreshTokens(refreshToken).then(refreshedTokens => {
                if (refreshedTokens) {
                    // This won't affect the current request but will update tokens for future requests
                    console.log('Proactively refreshed tokens');
                }
            });
        }

        // Add auth header for internal API calls
        response.headers.set('x-user-id', userData?.id || '');
        response.headers.set('x-tenant-id', userData?.tenantId || '');
    }

    return response;
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
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
    ],
}; 