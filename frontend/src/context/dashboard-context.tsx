/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";

// Types
export interface ServiceMetric {
  service_name: string;
  resource_count: number;
  regions: string[];
  last_scan_time?: string;
}

export interface RegionMetric {
  region: string;
  resource_count: number;
  services: string[];
}

export interface SecurityMetrics {
  ec2_instances_running: number;
  ec2_instances_stopped: number;
  ec2_imds_v1_count: number;
  ec2_imds_v2_count: number;
  s3_encrypted_buckets: number;
  s3_unencrypted_buckets: number;
  s3_public_buckets: number;
  s3_private_buckets: number;
  ebs_encrypted_volumes: number;
  ebs_unencrypted_volumes: number;
  security_groups_with_risky_rules: number;
  rds_databases_count: number;
  kms_keys_count: number;
}

export interface ScanOverview {
  total_scans: number;
  completed_scans: number;
  failed_scans: number;
  in_progress_scans: number;
  total_regions_scanned: number;
  total_services_scanned: number;
  last_scan_time?: string;
}

export interface ResourceTrend {
  date: string;
  ec2_count: number;
  s3_count: number;
  rds_count: number;
  ebs_count: number;
}

export interface TopResource {
  name: string;
  type: string;
  region: string;
  risk_score?: number;
  status: string;
}

export interface Alert {
  type: string;
  severity: string;
  message: string;
  resource: string;
  region: string;
}

export interface ScanHistory {
  scan_id: string;
  name: string;
  status: string;
  created_at: string;
  cloud_provider: string;
  metadata: Record<string, any>;
}

export interface DashboardData {
  scan_overview: ScanOverview;
  service_metrics: ServiceMetric[];
  region_metrics: RegionMetric[];
  security_metrics: SecurityMetrics;
  resource_trends: ResourceTrend[];
  top_resources: TopResource[];
  scan_history: ScanHistory[];
  alerts: Alert[];
}

export interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  filters: {
    tenant_id: string;
    scan_id?: string;
    days?: number;
  };
  selectedTimeRange: string;
  selectedServices: string[];
  selectedRegions: string[];
  refreshInterval: number;
  lastRefresh: Date | null;
}

// Actions
export type DashboardAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_DATA"; payload: DashboardData }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_FILTERS"; payload: Partial<DashboardState["filters"]> }
  | { type: "SET_TIME_RANGE"; payload: string }
  | { type: "SET_SELECTED_SERVICES"; payload: string[] }
  | { type: "SET_SELECTED_REGIONS"; payload: string[] }
  | { type: "SET_REFRESH_INTERVAL"; payload: number }
  | { type: "SET_LAST_REFRESH"; payload: Date }
  | { type: "CLEAR_ERROR" }
  | { type: "REFRESH_DATA" };

// Initial state
const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null,
  filters: {
    tenant_id: "",
    scan_id: undefined,
    days: 30,
  },
  selectedTimeRange: "30d",
  selectedServices: [],
  selectedRegions: [],
  refreshInterval: 30000, // 30 seconds
  lastRefresh: null,
};

// Reducer
function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_DATA":
      return {
        ...state,
        data: action.payload,
        loading: false,
        error: null,
        lastRefresh: new Date(),
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case "SET_FILTERS":
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case "SET_TIME_RANGE":
      return {
        ...state,
        selectedTimeRange: action.payload,
        filters: {
          ...state.filters,
          days:
            action.payload === "7d" ? 7 : action.payload === "30d" ? 30 : 90,
        },
      };

    case "SET_SELECTED_SERVICES":
      return {
        ...state,
        selectedServices: action.payload,
      };

    case "SET_SELECTED_REGIONS":
      return {
        ...state,
        selectedRegions: action.payload,
      };

    case "SET_REFRESH_INTERVAL":
      return {
        ...state,
        refreshInterval: action.payload,
      };

    case "SET_LAST_REFRESH":
      return {
        ...state,
        lastRefresh: action.payload,
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "REFRESH_DATA":
      return { ...state, loading: true, error: null };

    default:
      return state;
  }
}

// Context
interface DashboardContextType {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;

  // Computed values
  getFilteredServiceMetrics: () => ServiceMetric[];
  getFilteredRegionMetrics: () => RegionMetric[];
  getFilteredTopResources: () => TopResource[];
  getFilteredAlerts: () => Alert[];
  getSecurityScore: () => number;
  getCriticalAlerts: () => Alert[];

  // Action creators
  setLoading: (loading: boolean) => void;
  setData: (data: DashboardData) => void;
  setError: (error: string) => void;
  setFilters: (filters: Partial<DashboardState["filters"]>) => void;
  setTimeRange: (range: string) => void;
  setSelectedServices: (services: string[]) => void;
  setSelectedRegions: (regions: string[]) => void;
  setRefreshInterval: (interval: number) => void;
  clearError: () => void;
  refreshData: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

// Provider
interface DashboardProviderProps {
  children: ReactNode;
  initialTenantId: string;
}

export function DashboardProvider({
  children,
  initialTenantId,
}: DashboardProviderProps) {
  const [state, dispatch] = useReducer(dashboardReducer, {
    ...initialState,
    filters: { ...initialState.filters, tenant_id: initialTenantId },
  });

  // Computed values
  const getFilteredServiceMetrics = () => {
    if (!state.data) return [];

    let metrics = state.data.service_metrics;

    if (state.selectedServices.length > 0) {
      metrics = metrics.filter((m) =>
        state.selectedServices.includes(m.service_name)
      );
    }

    return metrics;
  };

  const getFilteredRegionMetrics = () => {
    if (!state.data) return [];

    let metrics = state.data.region_metrics;

    if (state.selectedRegions.length > 0) {
      metrics = metrics.filter((m) => state.selectedRegions.includes(m.region));
    }

    return metrics;
  };

  const getFilteredTopResources = () => {
    if (!state.data) return [];

    let resources = state.data.top_resources;

    if (state.selectedRegions.length > 0) {
      resources = resources.filter((r) =>
        state.selectedRegions.includes(r.region)
      );
    }

    return resources.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));
  };

  const getFilteredAlerts = () => {
    if (!state.data) return [];

    let alerts = state.data.alerts;

    if (state.selectedRegions.length > 0) {
      alerts = alerts.filter((a) => state.selectedRegions.includes(a.region));
    }

    return alerts;
  };

  const getSecurityScore = () => {
    if (!state.data) return 0;

    const { security_metrics } = state.data;

    // Calculate security score based on various metrics
    let score = 100;

    // Deduct points for security issues
    const totalInstances =
      security_metrics.ec2_instances_running +
      security_metrics.ec2_instances_stopped;
    if (totalInstances > 0) {
      const imdsV1Ratio = security_metrics.ec2_imds_v1_count / totalInstances;
      score -= imdsV1Ratio * 20; // Deduct up to 20 points for IMDSv1
    }

    const totalBuckets =
      security_metrics.s3_encrypted_buckets +
      security_metrics.s3_unencrypted_buckets;
    if (totalBuckets > 0) {
      const unencryptedRatio =
        security_metrics.s3_unencrypted_buckets / totalBuckets;
      score -= unencryptedRatio * 15; // Deduct up to 15 points for unencrypted buckets

      const publicRatio = security_metrics.s3_public_buckets / totalBuckets;
      score -= publicRatio * 25; // Deduct up to 25 points for public buckets
    }

    const totalVolumes =
      security_metrics.ebs_encrypted_volumes +
      security_metrics.ebs_unencrypted_volumes;
    if (totalVolumes > 0) {
      const unencryptedRatio =
        security_metrics.ebs_unencrypted_volumes / totalVolumes;
      score -= unencryptedRatio * 10; // Deduct up to 10 points for unencrypted volumes
    }

    return Math.max(0, Math.round(score));
  };

  const getCriticalAlerts = () => {
    if (!state.data) return [];

    return state.data.alerts.filter((alert) => alert.severity === "critical");
  };

  // Action creators with useCallback to prevent infinite loops
  const setLoading = useCallback(
    (loading: boolean) => dispatch({ type: "SET_LOADING", payload: loading }),
    [dispatch]
  );
  const setData = useCallback(
    (data: DashboardData) => dispatch({ type: "SET_DATA", payload: data }),
    [dispatch]
  );
  const setError = useCallback(
    (error: string) => dispatch({ type: "SET_ERROR", payload: error }),
    [dispatch]
  );
  const setFilters = useCallback(
    (filters: Partial<DashboardState["filters"]>) =>
      dispatch({ type: "SET_FILTERS", payload: filters }),
    [dispatch]
  );
  const setTimeRange = useCallback(
    (range: string) => dispatch({ type: "SET_TIME_RANGE", payload: range }),
    [dispatch]
  );
  const setSelectedServices = useCallback(
    (services: string[]) =>
      dispatch({ type: "SET_SELECTED_SERVICES", payload: services }),
    [dispatch]
  );
  const setSelectedRegions = useCallback(
    (regions: string[]) =>
      dispatch({ type: "SET_SELECTED_REGIONS", payload: regions }),
    [dispatch]
  );
  const setRefreshInterval = useCallback(
    (interval: number) =>
      dispatch({ type: "SET_REFRESH_INTERVAL", payload: interval }),
    [dispatch]
  );
  const clearError = useCallback(
    () => dispatch({ type: "CLEAR_ERROR" }),
    [dispatch]
  );
  const refreshData = useCallback(
    () => dispatch({ type: "REFRESH_DATA" }),
    [dispatch]
  );

  const value: DashboardContextType = {
    state,
    dispatch,
    getFilteredServiceMetrics,
    getFilteredRegionMetrics,
    getFilteredTopResources,
    getFilteredAlerts,
    getSecurityScore,
    getCriticalAlerts,
    setLoading,
    setData,
    setError,
    setFilters,
    setTimeRange,
    setSelectedServices,
    setSelectedRegions,
    setRefreshInterval,
    clearError,
    refreshData,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// Hook
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}

export default DashboardContext;
