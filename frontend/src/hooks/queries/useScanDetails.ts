/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query-keys'

export interface SecurityGroup {
    VpcId: string
    GroupId: string
    GroupName: string
    Description: string
    InboundRuleCount: number
    OutboundRuleCount: number
    RiskyInboundRules: Array<{
        source: string
        protocol: string
        port_range: string
    }>
}

export interface EC2Instance {
    State: string
    InstanceId: string
    IMDSVersion: string
    InstanceName: string
    PublicIpAddress: string
    PrivateIpAddress: string
}

export interface EBSVolume {
    Size: number
    State: string
    VolumeId: string
    Encrypted: boolean
    CreateTime: string
    VolumeName: string
    AttachedInstanceId: string | null
}

export interface S3Bucket {
    Region: string
    BucketName: string
    CreationDate: string
    EncryptionEnabled: boolean
    VersioningEnabled: boolean
    PublicAccessBlockConfiguration: {
        BlockPublicAcls: boolean
        IgnorePublicAcls: boolean
        BlockPublicPolicy: boolean
        RestrictPublicBuckets: boolean
    }
}

export interface KMSKey {
    KeyId: string
    KeyArn: string
    Origin: string
    KeyState: string
    KeyUsage: string
    CreationDate: string
    RotationEnabled: boolean
}

export interface ServiceScanResult {
    id: string
    service_name: string
    region: string
    scan_result_metadata: {
        timestamp: string
        service_type: string
    }
    service_scan_data: {
        SecurityGroups?: SecurityGroup[]
        EC2Instances?: EC2Instance[]
        EBSVolumes?: EBSVolume[]
        S3Buckets?: S3Bucket[]
        KMSKeys?: KMSKey[]
        RDSDatabases?: any[]
        note?: string
    }
    created_at: string
    updated_at: string
    tenant_id: string
}

export interface ScanDetails {
    scan_id: string
    status: string
    name: string
    cloud_provider: string
    tenant_id: string
    metadata: {
        scan_timestamp: string
        total_regions_scanned: number
    }
    created_at: string
    updated_at: string
    service_scan_results: ServiceScanResult[]
}

const fetchScanDetails = async (scanId: string): Promise<ScanDetails> => {
    // Get access token from localStorage for authorization
    const accessToken = localStorage.getItem('cloudlens_access_token');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`/api/scans/${scanId}`, {
        method: 'GET',
        headers,
    })

    if (!response.ok) {
        throw new Error('Failed to fetch scan details')
    }

    return response.json()
}

export const useScanDetails = (scanId: string | null) => {
    return useQuery({
        queryKey: QUERY_KEYS.SCANS.DETAIL(scanId || ''),
        queryFn: () => fetchScanDetails(scanId!),
        enabled: !!scanId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    })
}

export const useScanDetailsWithRefresh = (scanId: string | null) => {
    const query = useScanDetails(scanId)

    return {
        ...query,
        refresh: () => query.refetch(),
    }
} 