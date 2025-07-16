import { useEffect } from 'react'
import { useRegions } from '@/context/regions-context'
import { useRegionsData } from '@/hooks/queries/useRegionsData'

export const useInitRegions = (cloudProvider: string = 'AWS') => {
    const {
        setRegions,
        setIsLoading,
        setError,
        setSelectedProvider
    } = useRegions()

    const { data, isLoading, error } = useRegionsData({ cloud_provider: cloudProvider })

    useEffect(() => {
        setIsLoading(isLoading)
    }, [isLoading, setIsLoading])

    useEffect(() => {
        if (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch regions')
        } else {
            setError(null)
        }
    }, [error, setError])

    useEffect(() => {
        if (data) {
            setRegions(data)
            setSelectedProvider(cloudProvider)
        }
    }, [data, setRegions, setSelectedProvider, cloudProvider])

    return {
        regions: data || [],
        isLoading,
        error,
        refresh: () => {
            // This would trigger a refetch
        }
    }
}

// Hook for initializing multiple cloud providers
export const useInitAllRegions = () => {
    const { setRegions, setIsLoading, setError } = useRegions()

    const awsQuery = useRegionsData({ cloud_provider: 'AWS' })
    const azureQuery = useRegionsData({ cloud_provider: 'Azure' })
    const gcpQuery = useRegionsData({ cloud_provider: 'GCP' })

    const isLoading = awsQuery.isLoading || azureQuery.isLoading || gcpQuery.isLoading
    const error = awsQuery.error || azureQuery.error || gcpQuery.error

    useEffect(() => {
        setIsLoading(isLoading)
    }, [isLoading, setIsLoading])

    useEffect(() => {
        if (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch regions')
        } else {
            setError(null)
        }
    }, [error, setError])

    useEffect(() => {
        const allRegions = [
            ...(awsQuery.data || []),
            ...(azureQuery.data || []),
            ...(gcpQuery.data || [])
        ]

        if (allRegions.length > 0) {
            setRegions(allRegions)
        }
    }, [awsQuery.data, azureQuery.data, gcpQuery.data, setRegions])

    return {
        regions: {
            aws: awsQuery.data || [],
            azure: azureQuery.data || [],
            gcp: gcpQuery.data || []
        },
        isLoading,
        error,
        refresh: () => {
            awsQuery.refetch()
            azureQuery.refetch()
            gcpQuery.refetch()
        }
    }
} 