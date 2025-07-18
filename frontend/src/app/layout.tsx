import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/react-query";
import SidebarLayout from "@/components/sidebar-layout";
import { RegionsProvider } from "@/context/regions-context";
import { AuthProvider } from "@/context/auth-context";
import RouteProtection from "@/components/RouteProtection";
import RegionsInitializer from "@/components/RegionsInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CloudLens - AWS Security Dashboard",
  description:
    "Comprehensive AWS cloud security scanning and monitoring platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouteProtection>
              <RegionsProvider>
                <RegionsInitializer />
                <SidebarLayout>{children}</SidebarLayout>
              </RegionsProvider>
            </RouteProtection>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
