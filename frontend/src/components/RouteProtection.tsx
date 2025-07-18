"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

interface RouteProtectionProps {
  children: React.ReactNode;
}

const publicRoutes = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
];
const authRoutes = ["/signin", "/signup"];

export default function RouteProtection({ children }: RouteProtectionProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && authRoutes.includes(pathname)) {
      if (user?.onboardingCompleted) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
      return;
    }

    // Redirect unauthenticated users to signin
    if (!isAuthenticated && !publicRoutes.includes(pathname)) {
      router.push("/signin");
      return;
    }

    // Redirect authenticated users who haven't completed onboarding
    if (
      isAuthenticated &&
      !user?.onboardingCompleted &&
      pathname !== "/onboarding"
    ) {
      router.push("/onboarding");
      return;
    }

    // Redirect users who have completed onboarding away from onboarding page
    if (
      isAuthenticated &&
      user?.onboardingCompleted &&
      pathname === "/onboarding"
    ) {
      router.push("/dashboard");
      return;
    }
  }, [isAuthenticated, isLoading, user, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading for redirects
  if (isAuthenticated && authRoutes.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !publicRoutes.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
