"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CloudLensLogo } from "@/components/CloudLensLogo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "Contains uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "Contains lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "Contains number", test: (p) => /\d/.test(p) },
];

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const router = useRouter();
  const { signup, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push("/dashboard");
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.firstName ||
      !formData.lastName
    ) {
      return "All fields are required";
    }

    if (!formData.email.includes("@")) {
      return "Please enter a valid email address";
    }

    // Check password requirements
    const failedRequirements = passwordRequirements.filter(
      (req) => !req.test(formData.password)
    );
    if (failedRequirements.length > 0) {
      return "Password does not meet requirements";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await signup(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );
      // Redirect is handled by the auth context
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during sign up";
      toast({
        title: "Sign up failed",
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

        {/* Right Side - Sign Up Panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-12 overflow-y-auto">
          <div className="w-full max-w-md">
            <Card className="bg-white shadow-sm border border-gray-100 rounded-2xl">
              <CardContent className="pt-8 pb-8 px-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                  Create account
                </h1>
                
                <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all pr-10"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 focus:outline-none focus:text-gray-600"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(!showPassword);
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>

                {/* Password requirements */}
                {(passwordFocused || formData.password) && (
                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req, index) => {
                      const isValid = req.test(formData.password);
                      return (
                        <div
                          key={index}
                          className={`flex items-center space-x-2 text-sm ${
                            isValid ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isValid ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          <span>{req.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all pr-10"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 focus:outline-none focus:text-gray-600"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowConfirmPassword(!showConfirmPassword);
                    }}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword &&
                  formData.password !== formData.confirmPassword && (
                    <p className="text-sm text-red-600">
                      Passwords do not match
                    </p>
                  )}
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="terms"
                  className="ml-2 block text-sm text-gray-900"
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>

              <div className="text-center">
                <span className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    href="/signin"
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Sign in here
                  </Link>
                </span>
              </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
