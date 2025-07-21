import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query-keys'

export interface Scan {
    scan_id: string
    name: string
    status: 'PENDING' | 'COMPLETED'
    cloud_provider: string
    created_by: string
    metadata: {
        scan_timestamp: string
        total_regions_scanned: number
    }
    created_at: string
    updated_at: string
}

export interface ScanFilters {
    status?: 'PENDING' | 'COMPLETED'
    cloud_provider?: string
    limit?: number
    offset?: number
}

const fetchScans = async (filters: ScanFilters = {}): Promise<Scan[]> => {
    // Get access token from localStorage for authorization
    const accessToken = localStorage.getItem('cloudlens_access_token');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch('/api/scans', {
        method: 'POST',
        headers,
        body: JSON.stringify(filters),
    })

    if (!response.ok) {
        throw new Error('Failed to fetch scans')
    }

    return response.json()
}

export const useScansData = (filters: ScanFilters = {}) => {
    return useQuery({
        queryKey: QUERY_KEYS.SCANS.LIST({
            tenant_id: 'current', // This will be replaced by the actual tenant_id from the backend
            ...filters,
        }),
        queryFn: () => fetchScans(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    })
}

export const useScansDataWithRefresh = (filters: ScanFilters = {}) => {
    const query = useScansData(filters)

    return {
        ...query,
        refresh: () => query.refetch(),
    }
} 