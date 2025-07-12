// Centralized query keys for the entire project
// This ensures consistency and easy maintenance of all React Query keys

export const QUERY_KEYS = {
    // Dashboard related queries
    DASHBOARD: {
        ALL: ['dashboard'] as const,
        METRICS: (filters: { tenant_id: string; scan_id?: string; days?: number }) =>
            [...QUERY_KEYS.DASHBOARD.ALL, 'metrics', filters] as const,
        TRENDS: (filters: { tenant_id: string; scan_id?: string; days?: number }) =>
            [...QUERY_KEYS.DASHBOARD.ALL, 'trends', filters] as const,
        ALERTS: (filters: { tenant_id: string; scan_id?: string; days?: number }) =>
            [...QUERY_KEYS.DASHBOARD.ALL, 'alerts', filters] as const,
        OVERVIEW: ['dashboard', 'overview'] as const,
        SECURITY_INSIGHTS: ['dashboard', 'security-insights'] as const,
        REGIONAL_DISTRIBUTION: ['dashboard', 'regional-distribution'] as const,
        COMPLIANCE_STATUS: ['dashboard', 'compliance'] as const,
        SERVICE_DETAILS: (serviceName: string) => ['dashboard', 'service-details', serviceName] as const,
        TIMELINE: ['dashboard', 'timeline'] as const,
    },

    // Scan related queries
    SCANS: {
        ALL: ['scans'] as const,
        LIST: (filters: { tenant_id: string; status?: string; limit?: number; offset?: number }) =>
            [...QUERY_KEYS.SCANS.ALL, 'list', filters] as const,
        DETAIL: (scanId: string) => [...QUERY_KEYS.SCANS.ALL, 'detail', scanId] as const,
        STATUS: (scanId: string) => [...QUERY_KEYS.SCANS.ALL, 'status', scanId] as const,
        SERVICE_RESULTS: (scanId: string, serviceName: string, region?: string) =>
            [...QUERY_KEYS.SCANS.ALL, 'service-results', scanId, serviceName, region] as const,
        HISTORY: (tenantId: string) => [...QUERY_KEYS.SCANS.ALL, 'history', tenantId] as const,
    },

    // Cloud provider related queries
    CLOUD_PROVIDERS: {
        ALL: ['cloud-providers'] as const,
        REGIONS: (provider: string) => [...QUERY_KEYS.CLOUD_PROVIDERS.ALL, 'regions', provider] as const,
        SERVICES: (provider: string) => [...QUERY_KEYS.CLOUD_PROVIDERS.ALL, 'services', provider] as const,
    },

    // Security related queries
    SECURITY: {
        ALL: ['security'] as const,
        SCORE: (tenantId: string) => [...QUERY_KEYS.SECURITY.ALL, 'score', tenantId] as const,
        VULNERABILITIES: (tenantId: string, severity?: string) =>
            [...QUERY_KEYS.SECURITY.ALL, 'vulnerabilities', tenantId, severity] as const,
        COMPLIANCE: (tenantId: string, framework?: string) =>
            [...QUERY_KEYS.SECURITY.ALL, 'compliance', tenantId, framework] as const,
        RECOMMENDATIONS: (tenantId: string) => [...QUERY_KEYS.SECURITY.ALL, 'recommendations', tenantId] as const,
    },

    // Resources related queries
    RESOURCES: {
        ALL: ['resources'] as const,
        BY_SERVICE: (tenantId: string, service: string) =>
            [...QUERY_KEYS.RESOURCES.ALL, 'by-service', tenantId, service] as const,
        BY_REGION: (tenantId: string, region: string) =>
            [...QUERY_KEYS.RESOURCES.ALL, 'by-region', tenantId, region] as const,
        RISK_ASSESSMENT: (tenantId: string) => [...QUERY_KEYS.RESOURCES.ALL, 'risk-assessment', tenantId] as const,
        INVENTORY: (tenantId: string) => [...QUERY_KEYS.RESOURCES.ALL, 'inventory', tenantId] as const,
    },

    // User and team related queries
    USER: {
        ALL: ['user'] as const,
        PROFILE: ['user', 'profile'] as const,
        PERMISSIONS: ['user', 'permissions'] as const,
        PREFERENCES: ['user', 'preferences'] as const,
    },

    // Team related queries
    TEAM: {
        ALL: ['team'] as const,
        MEMBERS: (tenantId: string) => [...QUERY_KEYS.TEAM.ALL, 'members', tenantId] as const,
        ROLES: ['team', 'roles'] as const,
        ACTIVITY: (tenantId: string) => [...QUERY_KEYS.TEAM.ALL, 'activity', tenantId] as const,
    },

    // Reports related queries
    REPORTS: {
        ALL: ['reports'] as const,
        LIST: (tenantId: string) => [...QUERY_KEYS.REPORTS.ALL, 'list', tenantId] as const,
        DETAIL: (reportId: string) => [...QUERY_KEYS.REPORTS.ALL, 'detail', reportId] as const,
        EXPORT: (reportId: string, format: string) => [...QUERY_KEYS.REPORTS.ALL, 'export', reportId, format] as const,
    },

    // Settings related queries
    SETTINGS: {
        ALL: ['settings'] as const,
        GENERAL: ['settings', 'general'] as const,
        NOTIFICATIONS: ['settings', 'notifications'] as const,
        INTEGRATIONS: ['settings', 'integrations'] as const,
        API_KEYS: ['settings', 'api-keys'] as const,
    },
} as const

// Type helpers for better TypeScript support
export type DashboardMetricsKey = ReturnType<typeof QUERY_KEYS.DASHBOARD.METRICS>
export type ScanListKey = ReturnType<typeof QUERY_KEYS.SCANS.LIST>
export type SecurityScoreKey = ReturnType<typeof QUERY_KEYS.SECURITY.SCORE>

// Utility functions for invalidating related queries
export const invalidatePatterns = {
    allDashboard: QUERY_KEYS.DASHBOARD.ALL,
    allScans: QUERY_KEYS.SCANS.ALL,
    allSecurity: QUERY_KEYS.SECURITY.ALL,
    allResources: QUERY_KEYS.RESOURCES.ALL,
    allReports: QUERY_KEYS.REPORTS.ALL,
} as const 