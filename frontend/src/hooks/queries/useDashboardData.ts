/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@/lib/react-query'
import { QUERY_KEYS } from '@/lib/query-keys'

// Types for API requests
interface DashboardRequest {
    tenant_id: string
    scan_id?: string
    days?: number
}

interface DashboardMetricsResponse {
    scan_overview: {
        total_scans: number
        completed_scans: number
        failed_scans: number
        in_progress_scans: number
        total_regions_scanned: number
        total_services_scanned: number
        last_scan_time?: string
    }
    service_metrics: Array<{
        service_name: string
        resource_count: number
        regions: string[]
        last_scan_time?: string
    }>
    region_metrics: Array<{
        region: string
        resource_count: number
        services: string[]
    }>
    security_metrics: {
        ec2_instances_running: number
        ec2_instances_stopped: number
        ec2_imds_v1_count: number
        ec2_imds_v2_count: number
        s3_encrypted_buckets: number
        s3_unencrypted_buckets: number
        s3_public_buckets: number
        s3_private_buckets: number
        ebs_encrypted_volumes: number
        ebs_unencrypted_volumes: number
        security_groups_with_risky_rules: number
        rds_databases_count: number
        kms_keys_count: number
    }
    resource_trends: Array<{
        date: string
        ec2_count: number
        s3_count: number
        rds_count: number
        ebs_count: number
    }>
    top_resources: Array<{
        name: string
        type: string
        region: string
        risk_score?: number
        status: string
    }>
    scan_history: Array<{
        scan_id: string
        name: string
        status: string
        created_at: string
        cloud_provider: string
        metadata: Record<string, any>
    }>
    alerts: Array<{
        type: string
        severity: string
        message: string
        resource: string
        region: string
    }>
}

// Custom hook for fetching dashboard metrics
export function useDashboardMetrics(filters: DashboardRequest, options?: {
    enabled?: boolean
    refetchInterval?: number
    staleTime?: number
}) {
    return useQuery({
        queryKey: QUERY_KEYS.DASHBOARD.METRICS(filters),
        queryFn: async (): Promise<DashboardMetricsResponse> => {
            try {
                // Get access token from localStorage for authorization
                const accessToken = localStorage.getItem('cloudlens_access_token');

                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };

                if (accessToken) {
                    headers['Authorization'] = `Bearer ${accessToken}`;
                }

                // Make API call to dashboard metrics endpoint via Next.js API
                const response = await fetch('/api/dashboard/metrics', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(filters),
                })

                if (!response.ok) {
                    const errorData = await response.json()
                    throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
                }

                const data = await response.json()
                return data
            } catch (error) {
                console.error('Error fetching dashboard metrics:', error)
                throw error
            }
        },
        enabled: options?.enabled ?? !!filters.tenant_id,
        refetchInterval: options?.refetchInterval ?? 30000, // 30 seconds
        staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })
}

// Custom hook for dashboard data with automatic refresh
export function useDashboardData(filters: DashboardRequest, options?: {
    autoRefresh?: boolean
    refreshInterval?: number
}) {
    const queryClient = useQueryClient()

    const query = useDashboardMetrics(filters, {
        enabled: !!filters.tenant_id,
        refetchInterval: options?.autoRefresh ? (options.refreshInterval || 30000) : undefined,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    const refresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD.METRICS(filters) })
    }, [queryClient, filters])

    const prefetch = useCallback((newFilters: DashboardRequest) => {
        queryClient.prefetchQuery({
            queryKey: QUERY_KEYS.DASHBOARD.METRICS(newFilters),
            queryFn: async () => {
                // Get access token from localStorage for authorization
                const accessToken = localStorage.getItem('cloudlens_access_token');

                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };

                if (accessToken) {
                    headers['Authorization'] = `Bearer ${accessToken}`;
                }

                const response = await fetch('/api/dashboard/metrics', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(newFilters),
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                return response.json()
            },
            staleTime: 5 * 60 * 1000,
        })
    }, [queryClient])

    return {
        ...query,
        refresh,
        prefetch,
    }
}

// Custom hook for real-time dashboard updates
export function useRealtimeDashboard(filters: DashboardRequest, options?: {
    enabled?: boolean
    interval?: number
}) {
    const queryClient = useQueryClient()

    const query = useDashboardMetrics(filters, {
        enabled: options?.enabled ?? true,
        refetchInterval: options?.interval ?? 15000, // 15 seconds for real-time
        staleTime: 30 * 1000, // 30 seconds
    })

    // Mutation for manual refresh
    const refreshMutation = useMutation({
        mutationFn: async () => {
            await queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.DASHBOARD.METRICS(filters)
            })
        },
        onSuccess: () => {
            console.log('Dashboard data refreshed')
        },
        onError: (error) => {
            console.error('Failed to refresh dashboard data:', error)
        },
    })

    const forceRefresh = useCallback(() => {
        refreshMutation.mutate()
    }, [refreshMutation])

    return {
        ...query,
        forceRefresh,
        isRefreshing: refreshMutation.isPending,
    }
}

// Custom hook for dashboard alerts
export function useDashboardAlerts(filters: DashboardRequest) {
    return useQuery({
        queryKey: QUERY_KEYS.DASHBOARD.ALERTS(filters),
        queryFn: async () => {
            // Get access token from localStorage for authorization
            const accessToken = localStorage.getItem('cloudlens_access_token');

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            const response = await fetch('/api/dashboard/metrics', {
                method: 'POST',
                headers,
                body: JSON.stringify(filters),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data: DashboardMetricsResponse = await response.json()
            return data.alerts
        },
        enabled: !!filters.tenant_id,
        refetchInterval: 60000, // 1 minute for alerts
        staleTime: 30 * 1000, // 30 seconds
    })
}

// Custom hook for dashboard trends
export function useDashboardTrends(filters: DashboardRequest) {
    return useQuery({
        queryKey: QUERY_KEYS.DASHBOARD.TRENDS(filters),
        queryFn: async () => {
            // Get access token from localStorage for authorization
            const accessToken = localStorage.getItem('cloudlens_access_token');

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            const response = await fetch('/api/dashboard/metrics', {
                method: 'POST',
                headers,
                body: JSON.stringify(filters),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const data: DashboardMetricsResponse = await response.json()
            return data.resource_trends
        },
        enabled: !!filters.tenant_id,
        staleTime: 10 * 60 * 1000, // 10 minutes for trends
    })
}

// Mutation for updating dashboard filters
export function useUpdateDashboardFilters() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (newFilters: DashboardRequest) => {
            // Invalidate all dashboard queries with the new filters
            await queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.DASHBOARD.ALL
            })

            // Prefetch with new filters
            await queryClient.prefetchQuery({
                queryKey: QUERY_KEYS.DASHBOARD.METRICS(newFilters),
                queryFn: async () => {
                    // Get access token from localStorage for authorization
                    const accessToken = localStorage.getItem('cloudlens_access_token');

                    const headers: Record<string, string> = {
                        'Content-Type': 'application/json',
                    };

                    if (accessToken) {
                        headers['Authorization'] = `Bearer ${accessToken}`;
                    }

                    const response = await fetch('/api/dashboard/metrics', {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(newFilters),
                    })

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`)
                    }

                    return response.json()
                },
            })
        },
        onSuccess: () => {
            console.log('Dashboard filters updated')
        },
        onError: (error) => {
            console.error('Failed to update dashboard filters:', error)
        },
    })
}

// Utility function to invalidate all dashboard queries
export function useInvalidateAllDashboardQueries() {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.DASHBOARD.ALL
    })
}

// Utility function to clear dashboard cache
export function useClearDashboardCache() {
    const queryClient = useQueryClient()
    return () => queryClient.removeQueries({
        queryKey: QUERY_KEYS.DASHBOARD.ALL
    })
}

export type { DashboardRequest, DashboardMetricsResponse } 