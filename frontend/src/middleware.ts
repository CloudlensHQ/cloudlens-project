import { authkit } from "@workos-inc/authkit-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const unauthenticatedPaths = ["/signin", "/signup", "/callback"];
  const isUnauthenticatedPath = unauthenticatedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  try {
    const { session, headers, authorizationUrl } = await authkit(request, {
      debug: true,
    });
    // Skip authentication check for unauthenticated paths
    if (isUnauthenticatedPath) {
      return NextResponse.next();
    }
    // Protect all routes except unauthenticated paths
    if (!session.user) {
      return NextResponse.redirect(authorizationUrl!);
    }
    headers.set("Authorization", `Bearer ${session.accessToken}`);
    return NextResponse.next({
      headers: headers,
    });
  } catch (error) {
    // Handle authentication errors by redirecting to signin
    console.error("Authentication error:", error);
    return NextResponse.redirect(new URL("/signin", request.url));
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)", "/api/:path*"],
};

export default middleware;
