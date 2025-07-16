import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query-keys'
import { Region } from '@/context/regions-context'

export interface RegionsQueryParams {
    cloud_provider?: string
}

const fetchRegions = async (params: RegionsQueryParams = {}): Promise<Region[]> => {
    const { cloud_provider = 'AWS' } = params

    const response = await fetch(`/api/regions?cloud_provider=${cloud_provider}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })

    if (!response.ok) {
        throw new Error('Failed to fetch regions')
    }

    return response.json()
}

export const useRegionsData = (params: RegionsQueryParams = {}) => {
    return useQuery({
        queryKey: QUERY_KEYS.CLOUD_PROVIDERS.REGIONS(params.cloud_provider || 'AWS'),
        queryFn: () => fetchRegions(params),
        staleTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        retry: 3,
    })
}

export const useRegionsDataWithRefresh = (params: RegionsQueryParams = {}) => {
    const query = useRegionsData(params)

    return {
        ...query,
        refresh: () => query.refetch(),
    }
}

// Hook for specific cloud provider regions
export const useAWSRegions = () => {
    return useRegionsData({ cloud_provider: 'AWS' })
}

export const useAzureRegions = () => {
    return useRegionsData({ cloud_provider: 'Azure' })
}

export const useGCPRegions = () => {
    return useRegionsData({ cloud_provider: 'GCP' })
}

// Hook that combines regions data with context
export const useRegionsWithContext = (params: RegionsQueryParams = {}) => {
    const query = useRegionsData(params)

    return {
        ...query,
        regions: query.data || [],
        getRegionsByProvider: (provider: string) => {
            if (!query.data) return []
            return query.data.filter(region =>
                region.cloud_provider.toLowerCase() === provider.toLowerCase()
            )
        },
        getRegionById: (id: string) => {
            if (!query.data) return undefined
            return query.data.find(region => region.id === id)
        },
        getRegionByName: (name: string, provider?: string) => {
            if (!query.data) return undefined
            return query.data.find(region => {
                const nameMatch = region.name.toLowerCase() === name.toLowerCase()
                if (provider) {
                    return nameMatch && region.cloud_provider.toLowerCase() === provider.toLowerCase()
                }
                return nameMatch
            })
        }
    }
} 