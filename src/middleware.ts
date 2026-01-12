import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';


export const config = {
    matcher: ['/dashboard/:path*', '/sign-in', '/sign-up', '/', '/verify/:path*', '/profile'],
};

export async function middleware(request: NextRequest) {
    const token = await getToken({ req: request });
    const url = request.nextUrl;

    // Redirect to dashboard if the user is already authenticated
    // and trying to access sign-in, sign-up, or verify
    if (token) {
        // If user is not onboarded and not on onboarding page, force onboarding
        if (token.isOnboarded === false && !url.pathname.startsWith('/onboarding')) {
            return NextResponse.redirect(new URL('/onboarding', request.url));
        }

        // If user IS onboarded and tries to access auth pages, redirect to dashboard
        if (
            token.isOnboarded !== false &&
            (url.pathname.startsWith('/sign-in') ||
                url.pathname.startsWith('/sign-up') ||
                url.pathname.startsWith('/verify'))
        ) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    if (!token && (url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/profile'))) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    return NextResponse.next();
}