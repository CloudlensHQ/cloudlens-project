// Enhanced API client with automatic token management
import { useAuth } from '@/context/auth-context';

// Token storage keys
const ACCESS_TOKEN_KEY = 'cloudlens_access_token';
const REFRESH_TOKEN_KEY = 'cloudlens_refresh_token';
const USER_KEY = 'cloudlens_user';

interface ApiClientConfig {
    baseUrl?: string;
    timeout?: number;
    headers?: Record<string, string>;
}

interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

class ApiClient {
    private baseUrl: string;
    private timeout: number;
    private defaultHeaders: Record<string, string>;

    constructor(config: ApiClientConfig = {}) {
        this.baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        this.timeout = config.timeout || 30000;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            ...config.headers,
        };
    }

    // Get authentication tokens from storage
    private getTokens() {
        if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };

        const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        return { accessToken, refreshToken };
    }

    // Get user data from storage
    private getUserData() {
        if (typeof window === 'undefined') return null;

        try {
            const userData = localStorage.getItem(USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch {
            return null;
        }
    }

    // Update tokens in storage
    private updateTokens(accessToken: string, refreshToken: string) {
        if (typeof window === 'undefined') return;

        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    // Clear authentication data
    private clearAuthData() {
        if (typeof window === 'undefined') return;

        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    // Check if token is expired
    private isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch {
            return true;
        }
    }

    // Refresh access token
    private async refreshAccessToken(): Promise<boolean> {
        const { refreshToken } = this.getTokens();

        if (!refreshToken || this.isTokenExpired(refreshToken)) {
            this.clearAuthData();
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: this.defaultHeaders,
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                this.updateTokens(data.access_token, data.refresh_token);

                // Update user data if provided
                if (data.user) {
                    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
                }

                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }

        this.clearAuthData();
        return false;
    }

    // Get request headers with authentication
    private async getHeaders(additionalHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
        let { accessToken } = this.getTokens();
        const userData = this.getUserData();

        // Check if access token needs refresh
        if (accessToken && this.isTokenExpired(accessToken)) {
            const refreshed = await this.refreshAccessToken();
            if (refreshed) {
                accessToken = this.getTokens().accessToken;
            } else {
                accessToken = null;
            }
        }

        const headers: Record<string, string> = {
            ...this.defaultHeaders,
            ...additionalHeaders,
        };

        // Add authentication header
        if (accessToken) {
            headers.Authorization = `Bearer ${accessToken}`;
        }

        // Add tenant context headers
        if (userData) {
            headers['X-User-ID'] = userData.id || '';
            headers['X-Tenant-ID'] = userData.tenantId || '';
        }

        return headers;
    }

    // Main request method
    private async request<T = any>(
        method: string,
        endpoint: string,
        data?: any,
        options: {
            headers?: Record<string, string>;
            requireAuth?: boolean;
            timeout?: number;
        } = {}
    ): Promise<ApiResponse<T>> {
        const { requireAuth = true, timeout = this.timeout } = options;

        // Check authentication requirement
        if (requireAuth) {
            const { accessToken } = this.getTokens();
            if (!accessToken) {
                throw new Error('Authentication required');
            }
        }

        const url = `${this.baseUrl}${endpoint}`;
        const headers = await this.getHeaders(options.headers);

        const config: RequestInit = {
            method,
            headers,
            signal: AbortSignal.timeout(timeout),
        };

        if (data && !['GET', 'HEAD'].includes(method.toUpperCase())) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            const responseData = await response.json();

            if (!response.ok) {
                // Handle authentication errors
                if (response.status === 401) {
                    // Try to refresh token once
                    if (requireAuth) {
                        const refreshed = await this.refreshAccessToken();
                        if (refreshed) {
                            // Retry the request with new token
                            const newHeaders = await this.getHeaders(options.headers);
                            const retryResponse = await fetch(url, {
                                ...config,
                                headers: newHeaders,
                            });
                            const retryData = await retryResponse.json();

                            if (retryResponse.ok) {
                                return { success: true, data: retryData };
                            }
                        }
                    }

                    // Clear auth data and redirect to login
                    this.clearAuthData();
                    if (typeof window !== 'undefined') {
                        window.location.href = '/signin';
                    }
                }

                return {
                    success: false,
                    error: responseData.detail || responseData.message || 'Request failed',
                    data: responseData,
                };
            }

            return { success: true, data: responseData };
        } catch (error) {
            console.error('API request failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            };
        }
    }

    // HTTP method helpers
    async get<T = any>(endpoint: string, options?: { headers?: Record<string, string>; requireAuth?: boolean }): Promise<ApiResponse<T>> {
        return this.request<T>('GET', endpoint, undefined, options);
    }

    async post<T = any>(endpoint: string, data?: any, options?: { headers?: Record<string, string>; requireAuth?: boolean }): Promise<ApiResponse<T>> {
        return this.request<T>('POST', endpoint, data, options);
    }

    async put<T = any>(endpoint: string, data?: any, options?: { headers?: Record<string, string>; requireAuth?: boolean }): Promise<ApiResponse<T>> {
        return this.request<T>('PUT', endpoint, data, options);
    }

    async patch<T = any>(endpoint: string, data?: any, options?: { headers?: Record<string, string>; requireAuth?: boolean }): Promise<ApiResponse<T>> {
        return this.request<T>('PATCH', endpoint, data, options);
    }

    async delete<T = any>(endpoint: string, options?: { headers?: Record<string, string>; requireAuth?: boolean }): Promise<ApiResponse<T>> {
        return this.request<T>('DELETE', endpoint, undefined, options);
    }

    // Tenant-scoped methods for common operations
    async getTenantData<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        return this.get<T>(endpoint, { requireAuth: true });
    }

    async createTenantResource<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        return this.post<T>(endpoint, data, { requireAuth: true });
    }

    async updateTenantResource<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        return this.put<T>(endpoint, data, { requireAuth: true });
    }

    async deleteTenantResource<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        return this.delete<T>(endpoint, { requireAuth: true });
    }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Hook for using API client in components
export function useApiClient() {
    return apiClient;
}

// Export types
export type { ApiResponse, ApiClientConfig }; 