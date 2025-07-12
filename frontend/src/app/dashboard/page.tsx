"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  Legend,
} from "recharts";
import {
  Shield,
  Cloud,
  Server,
  Database,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Zap,
} from "lucide-react";

import { DashboardProvider, useDashboard } from "@/context/dashboard-context";
import { useDashboardData } from "@/hooks/queries/useDashboardData";
import SidebarLayout from "@/components/sidebar-layout";

// Mock tenant ID for now - in real app this would come from auth
const MOCK_TENANT_ID = "65556962-a76c-46b7-9a90-b3589c240733";

// Color schemes for charts
const COLORS = {
  primary: "#3b82f6",
  secondary: "#10b981",
  accent: "#f59e0b",
  danger: "#ef4444",
  warning: "#f59e0b",
  success: "#10b981",
  muted: "#6b7280",
};

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
];

// Dashboard Components
function DashboardOverview() {
  const { state } = useDashboard();
  const { data } = state;

  if (!data) return null;

  const { scan_overview, security_metrics } = data;

  const overviewCards = [
    {
      title: "Total Scans",
      value: scan_overview.total_scans,
      icon: Cloud,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Regions Scanned",
      value: scan_overview.total_regions_scanned,
      icon: MapPin,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Services Monitored",
      value: scan_overview.total_services_scanned,
      icon: Server,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Critical Alerts",
      value: data.alerts.filter((a) => a.severity === "critical").length,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${card.bgColor}`}>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SecurityScoreCard() {
  const { state, getSecurityScore } = useDashboard();
  const { data } = state;

  if (!data) return null;

  const score = getSecurityScore();
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Attention";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Score
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
            <Badge
              variant={
                score >= 80
                  ? "default"
                  : score >= 60
                  ? "secondary"
                  : "destructive"
              }
            >
              {getScoreStatus(score)}
            </Badge>
          </div>
          <Progress value={score} className="h-2" />
          <div className="text-sm text-muted-foreground">
            Based on security configurations across your cloud resources
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResourceDistributionChart() {
  const { state } = useDashboard();
  const { data } = state;

  if (!data) return null;

  const chartData = data.service_metrics.map((metric) => ({
    name: metric.service_name.toUpperCase(),
    value: metric.resource_count,
    color:
      CHART_COLORS[data.service_metrics.indexOf(metric) % CHART_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Distribution</CardTitle>
        <CardDescription>Resources across AWS services</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function RegionalDistributionChart() {
  const { state } = useDashboard();
  const { data } = state;

  if (!data) return null;

  const chartData = data.region_metrics.map((metric) => ({
    name: metric.region,
    resources: metric.resource_count,
    services: metric.services.length,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regional Distribution</CardTitle>
        <CardDescription>Resources by AWS region</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="resources" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function SecurityMetricsChart() {
  const { state } = useDashboard();
  const { data } = state;

  if (!data) return null;

  const { security_metrics } = data;

  const ec2Data = [
    {
      name: "Running",
      value: security_metrics.ec2_instances_running,
      color: COLORS.success,
    },
    {
      name: "Stopped",
      value: security_metrics.ec2_instances_stopped,
      color: COLORS.warning,
    },
  ];

  const s3Data = [
    {
      name: "Encrypted",
      value: security_metrics.s3_encrypted_buckets,
      color: COLORS.success,
    },
    {
      name: "Unencrypted",
      value: security_metrics.s3_unencrypted_buckets,
      color: COLORS.danger,
    },
  ];

  const imdsData = [
    {
      name: "IMDSv2",
      value: security_metrics.ec2_imds_v2_count,
      color: COLORS.success,
    },
    {
      name: "IMDSv1",
      value: security_metrics.ec2_imds_v1_count,
      color: COLORS.danger,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">EC2 Instances</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ec2Data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {ec2Data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">S3 Encryption</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={s3Data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {s3Data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">IMDS Version</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={imdsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {imdsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function AlertsPanel() {
  const { state, getCriticalAlerts } = useDashboard();
  const { data } = state;

  if (!data) return null;

  const criticalAlerts = getCriticalAlerts();
  const allAlerts = data.alerts.slice(0, 10); // Show top 10 alerts

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Security Alerts
        </CardTitle>
        <CardDescription>
          {criticalAlerts.length} critical alerts requiring immediate attention
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {allAlerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border rounded-lg"
              >
                <AlertTriangle
                  className={`h-4 w-4 mt-1 ${
                    getSeverityColor(alert.severity).split(" ")[0]
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={getSeverityColor(alert.severity)}
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {alert.region}
                    </span>
                  </div>
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Resource: {alert.resource}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function TopResourcesPanel() {
  const { state, getFilteredTopResources } = useDashboard();
  const { data } = state;

  if (!data) return null;

  const topResources = getFilteredTopResources().slice(0, 10);

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 20) return "text-red-600 bg-red-50";
    if (riskScore >= 10) return "text-orange-600 bg-orange-50";
    if (riskScore >= 5) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Top Risk Resources
        </CardTitle>
        <CardDescription>
          Resources with highest security risk scores
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {topResources.map((resource, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{resource.name}</span>
                    <Badge variant="outline">{resource.type}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {resource.region}
                    <span>•</span>
                    <span className="capitalize">{resource.status}</span>
                  </div>
                </div>
                <Badge className={getRiskColor(resource.risk_score || 0)}>
                  Risk: {resource.risk_score || 0}
                </Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ResourceTrendsChart() {
  const { state } = useDashboard();
  const { data } = state;

  if (!data) return null;

  const trendData = data.resource_trends;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Trends</CardTitle>
        <CardDescription>Resource counts over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="ec2_count"
                stackId="1"
                stroke={COLORS.primary}
                fill={COLORS.primary}
              />
              <Area
                type="monotone"
                dataKey="s3_count"
                stackId="1"
                stroke={COLORS.secondary}
                fill={COLORS.secondary}
              />
              <Area
                type="monotone"
                dataKey="rds_count"
                stackId="1"
                stroke={COLORS.accent}
                fill={COLORS.accent}
              />
              <Area
                type="monotone"
                dataKey="ebs_count"
                stackId="1"
                stroke={COLORS.warning}
                fill={COLORS.warning}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function DashboardContent() {
  const { state, setFilters, refreshData, setData } = useDashboard();
  const { filters } = state;

  const {
    data: dashboardData,
    isLoading,
    error: queryError,
    refresh,
  } = useDashboardData(
    {
      tenant_id: filters.tenant_id,
      scan_id: filters.scan_id,
      days: filters.days,
    },
    {
      autoRefresh: true,
      refreshInterval: 30000,
    }
  );

  // Update dashboard context when data changes - only when data actually exists
  useEffect(() => {
    if (dashboardData && !isLoading) {
      setData(dashboardData);
    }
  }, [dashboardData, isLoading]); // Only update when data changes and loading is complete

  const handleRefresh = () => {
    refresh();
    refreshData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  if (queryError) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {queryError?.message || "Failed to load dashboard data"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cloud Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your AWS infrastructure security and compliance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <DashboardOverview />

      {/* Security Score & Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <SecurityScoreCard />
        <AlertsPanel />
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ResourceDistributionChart />
            <RegionalDistributionChart />
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityMetricsChart />
          <TopResourcesPanel />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ResourceDistributionChart />
            <TopResourcesPanel />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <ResourceTrendsChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardProvider initialTenantId={MOCK_TENANT_ID}>
      <SidebarLayout>
        <DashboardContent />
      </SidebarLayout>
    </DashboardProvider>
  );
}
