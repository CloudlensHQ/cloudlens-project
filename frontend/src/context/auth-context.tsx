"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";

// Types
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  isVerified: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  tenantId?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  completeOnboarding: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const ACCESS_TOKEN_KEY = "cloudlens_access_token";
const REFRESH_TOKEN_KEY = "cloudlens_refresh_token";
const USER_KEY = "cloudlens_user";

// Cookie helpers
const setCookie = (name: string, value: string, days: number = 30) => {
  if (typeof document === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
};

const deleteCookie = (name: string) => {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Helper function to transform user data from snake_case to camelCase
  const transformUserData = (userData: any) => ({
    ...userData,
    onboardingCompleted:
      userData.onboarding_completed ?? userData.onboardingCompleted,
    firstName: userData.first_name ?? userData.firstName,
    lastName: userData.last_name ?? userData.lastName,
    isActive: userData.is_active ?? userData.isActive,
    isVerified: userData.is_verified ?? userData.isVerified,
    createdAt: userData.created_at ?? userData.createdAt,
    updatedAt: userData.updated_at ?? userData.updatedAt,
    lastLogin: userData.last_login ?? userData.lastLogin,
    tenantId: userData.tenant_id ?? userData.tenantId,
  });

  // Initialize auth state from localStorage and cookies
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (accessToken && refreshToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Transform user data to ensure consistent camelCase format
          const transformedUser = transformUserData(parsedUser);
          setUser(transformedUser);
          setTokens({
            accessToken,
            refreshToken,
            tokenType: "bearer",
            expiresIn: 1800, // 30 minutes default
          });

          // Set cookies for middleware
          setCookie(ACCESS_TOKEN_KEY, accessToken, 0.02); // 30 minutes
          setCookie(REFRESH_TOKEN_KEY, refreshToken, 30); // 30 days
          setCookie(USER_KEY, JSON.stringify(transformedUser), 30);

          // Verify token is still valid
          await verifyCurrentUser(accessToken);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Verify current user with backend
  const verifyCurrentUser = async (accessToken: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token verification failed");
      }

      const userData = await response.json();
      const transformedUserData = transformUserData(userData);
      setUser(transformedUserData);
      localStorage.setItem(USER_KEY, JSON.stringify(transformedUserData));
      setCookie(USER_KEY, JSON.stringify(transformedUserData), 30);
    } catch (error) {
      console.error("User verification error:", error);
      clearAuthData();
    }
  };

  // Clear auth data from both localStorage and cookies
  const clearAuthData = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    deleteCookie(ACCESS_TOKEN_KEY);
    deleteCookie(REFRESH_TOKEN_KEY);
    deleteCookie(USER_KEY);

    setUser(null);
    setTokens(null);
  };

  // Store auth data in both localStorage and cookies
  const storeAuthData = (authData: any) => {
    const { access_token, refresh_token, user: userData } = authData;

    // Transform user data from snake_case to camelCase to match frontend expectations
    const transformedUserData = transformUserData(userData);

    // Store in localStorage
    localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(transformedUserData));

    // Store in cookies for middleware
    setCookie(ACCESS_TOKEN_KEY, access_token, 0.02); // 30 minutes
    setCookie(REFRESH_TOKEN_KEY, refresh_token, 30); // 30 days
    setCookie(USER_KEY, JSON.stringify(transformedUserData), 30);

    setUser(transformedUserData);
    setTokens({
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenType: "bearer",
      expiresIn: 1800,
    });
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const authData = await response.json();

      if (authData.success && authData.data) {
        storeAuthData(authData.data);

        // Redirect based on onboarding status
        if (!authData.data.user.onboarding_completed) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      } else {
        throw new Error(authData.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Signup function
  const signup = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Signup failed");
      }

      const authData = await response.json();

      if (authData.success && authData.data) {
        storeAuthData(authData.data);

        // Redirect to onboarding for new users
        router.push("/onboarding");
      } else {
        throw new Error(authData.message || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    clearAuthData();
    router.push("/signin");
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const authData = await response.json();
      storeAuthData(authData);
    } catch (error) {
      console.error("Token refresh error:", error);
      clearAuthData();
      router.push("/signin");
    }
  };

  // Complete onboarding function
  const completeOnboarding = async (data: any) => {
    try {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) {
        throw new Error("No access token available");
      }

      const response = await fetch("/api/auth/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Onboarding completion failed");
      }

      // Update user data to reflect completed onboarding
      if (user) {
        const updatedUser = { ...user, onboardingCompleted: true };
        setUser(updatedUser);
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        setCookie(USER_KEY, JSON.stringify(updatedUser), 30);
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Onboarding completion error:", error);
      throw error;
    }
  };

  const value = {
    user,
    tokens,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshToken,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
