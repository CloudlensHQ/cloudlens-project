"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CloudLensLogo } from "@/components/CloudLensLogo";
import { CloudProviderLogo } from "@/components/CloudProviderLogo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"email" | "password">("email");
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push("/dashboard");
    return null;
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setStep("password");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      // Redirect is handled by the auth context
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during sign in";
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top Navigation */}
      <nav className="border-b border-gray-100 px-8 py-4 flex items-center">
        <CloudLensLogo size="sm" />
      </nav>

      {/* Main Content - Two Columns */}
      <div className="flex flex-1">
        {/* Left Side - Radar Scanning Animation */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 via-white to-indigo-50 items-center justify-center relative overflow-hidden">
          <style>{`
            @keyframes radarSweep {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
            
            @keyframes radarPulse {
              0%, 100% {
                opacity: 0.3;
                r: 40px;
              }
              50% {
                opacity: 0.6;
                r: 80px;
              }
            }
            
            @keyframes radarDotAppear {
              0% {
                opacity: 0;
              }
              50% {
                opacity: 1;
              }
              100% {
                opacity: 0;
              }
            }
            
            .radar-sweep {
              animation: radarSweep 4s linear infinite;
              transform-origin: center;
            }
            
            .radar-pulse {
              animation: radarPulse 2s ease-in-out infinite;
            }
            
            .radar-dot-1 {
              animation: radarDotAppear 4s ease-in-out infinite 0s;
            }
            
            .radar-dot-2 {
              animation: radarDotAppear 4s ease-in-out infinite 1.3s;
            }
            
            .radar-dot-3 {
              animation: radarDotAppear 4s ease-in-out infinite 2.6s;
            }
          `}</style>
          
          <svg className="w-96 h-96 max-w-md" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            {/* Background radar circles */}
            <circle cx="200" cy="200" r="20" fill="none" stroke="#e5e7eb" strokeWidth="1" />
            <circle cx="200" cy="200" r="60" fill="none" stroke="#e5e7eb" strokeWidth="1" />
            <circle cx="200" cy="200" r="100" fill="none" stroke="#e5e7eb" strokeWidth="1" />
            <circle cx="200" cy="200" r="140" fill="none" stroke="#e5e7eb" strokeWidth="1" />
            
            {/* Radar grid lines */}
            <line x1="200" y1="60" x2="200" y2="340" stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
            <line x1="60" y1="200" x2="340" y2="200" stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
            <line x1="113" y1="113" x2="287" y2="287" stroke="#e5e7eb" strokeWidth="1" opacity="0.3" />
            <line x1="287" y1="113" x2="113" y2="287" stroke="#e5e7eb" strokeWidth="1" opacity="0.3" />
            
            {/* Scanning dots that appear along the sweep */}
            <circle cx="200" cy="100" r="5" fill="#3b82f6" className="radar-dot-1" opacity="0" />
            <circle cx="270" cy="200" r="5" fill="#3b82f6" className="radar-dot-2" opacity="0" />
            <circle cx="200" cy="300" r="5" fill="#3b82f6" className="radar-dot-3" opacity="0" />
            
            {/* Pulsing dot at center */}
            <circle cx="200" cy="200" r="6" fill="#3b82f6" opacity="0.8" />
            <circle cx="200" cy="200" r="8" fill="none" stroke="#3b82f6" strokeWidth="2" className="radar-pulse" />
            
            {/* Rotating sweep beam */}
            <g className="radar-sweep">
              <line x1="200" y1="200" x2="200" y2="60" stroke="#3b82f6" strokeWidth="2" opacity="0.8" />
              <line x1="200" y1="200" x2="200" y2="60" stroke="#3b82f6" strokeWidth="6" opacity="0.2" />
              {/* Gradient effect on sweep */}
              <defs>
                <linearGradient id="sweepGradient" x1="200" y1="200" x2="200" y2="60">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="200" y1="200" x2="200" y2="60" stroke="url(#sweepGradient)" strokeWidth="8" />
            </g>
          </svg>
        </div>

        {/* Right Side - Login Panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-12">
          <div className="w-full max-w-md">
            <Card className="bg-white shadow-sm border border-gray-100 rounded-2xl">
              <CardContent className="pt-8 pb-8 px-8">
                <div className="flex items-center justify-between mb-8">
                  {step === "password" && (
                    <button
                      onClick={() => setStep("email")}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  <h1 className={`text-2xl font-bold text-gray-900 ${step === "email" ? "mx-auto" : ""}`}>
                    Login
                  </h1>
                  {step === "password" && <div className="w-10" />}
                </div>

                {step === "email" ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                        placeholder="Enter your email"
                        autoFocus
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                      Continue
                    </Button>

                    <div className="text-center text-sm text-gray-600">
                      Don&apos;t have an account?{" "}
                      <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
                        Sign up
                      </Link>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handlePasswordSubmit} className="space-y-5">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700 font-medium">{email}</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all pr-10"
                          placeholder="Enter your password"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-700">
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Continue
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
