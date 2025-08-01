"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Server,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import {
  Scan,
  ScanFilters,
  useScansDataWithRefresh,
} from "@/hooks/queries/useScansData";
import { useScanDetailsWithRefresh } from "@/hooks/queries/useScanDetails";
import ScanServiceResults from "@/components/ScanServiceResults";
import RegionsCards from "@/components/RegionsCards";
import NewScanModal from "@/components/NewScanModal";
import { Region, useRegions } from "@/context/regions-context";

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "PENDING":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "PENDING":
      return "secondary";
    default:
      return "outline";
  }
};

export default function ScansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getRegionByName } = useRegions();

  const [filters, setFilters] = useState<ScanFilters>({
    limit: 50,
    offset: 0,
  });

  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [showScanDetails, setShowScanDetails] = useState(false);
  const [showNewScanModal, setShowNewScanModal] = useState(false);

  const {
    data: scans = [],
    isLoading,
    error,
    refresh,
  } = useScansDataWithRefresh(filters);

  const {
    data: scanDetails,
    isLoading: scanDetailsLoading,
    error: scanDetailsError,
    refresh: refreshScanDetails,
  } = useScanDetailsWithRefresh(selectedScan?.scan_id || null);

  // Initialize state from URL parameters
  useEffect(() => {
    const scanId = searchParams.get("scan");
    const regionName = searchParams.get("region");
    const showDetails = searchParams.get("details") === "true";

    if (scanId && scans.length > 0) {
      const scan = scans.find((s) => s.scan_id === scanId);
      if (scan) {
        setSelectedScan(scan);
        setShowScanDetails(showDetails);

        // If there's a region parameter, we need to wait for scan details to load
        if (regionName && scanDetails) {
          // Find the region in the scan details and get the proper region object
          const regionExists = scanDetails.service_scan_results.some(
            (r) => r.region === regionName
          );
          if (regionExists) {
            const region = getRegionByName(regionName, scan.cloud_provider);
            if (region) {
              setSelectedRegion(region);
            }
          }
        } else if (!regionName) {
          // Clear region if not in URL
          setSelectedRegion(null);
        }
      }
    } else if (!scanId) {
      // Clear all states if no scan in URL
      setSelectedScan(null);
      setSelectedRegion(null);
      setShowScanDetails(false);
    }
  }, [searchParams, scans, scanDetails, getRegionByName]);

  // Update URL when navigation state changes
  const updateURL = (
    scanId?: string,
    regionName?: string,
    showDetails?: boolean
  ) => {
    const params = new URLSearchParams();

    if (scanId) {
      params.set("scan", scanId);
      if (showDetails) {
        params.set("details", "true");
      }
      if (regionName) {
        params.set("region", regionName);
      }
    }

    const url = params.toString() ? `/scans?${params.toString()}` : "/scans";
    router.replace(url);
  };

  const handleScanClick = (scan: Scan) => {
    setSelectedScan(scan);
    setSelectedRegion(null);
    setShowScanDetails(false);
    updateURL(scan.scan_id);
  };

  const handleViewScanDetails = (scan: Scan) => {
    setSelectedScan(scan);
    setShowScanDetails(true);
    setSelectedRegion(null);
    updateURL(scan.scan_id, undefined, true);
  };

  const handleBackToScans = () => {
    setSelectedScan(null);
    setSelectedRegion(null);
    setShowScanDetails(false);
    setShowNewScanModal(false);
    updateURL();
  };

  const handleRegionClick = (region: Region) => {
    setSelectedRegion(region);
    updateURL(selectedScan?.scan_id, region.name);
    console.log("Region clicked:", region, "for scan:", selectedScan?.scan_id);
  };

  const handleBackToRegions = () => {
    setSelectedRegion(null);
    updateURL(selectedScan?.scan_id);
  };

  const columns: ColumnDef<Scan>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div
          className="font-medium cursor-pointer hover:text-blue-600"
          onClick={() => handleScanClick(row.original)}
        >
          {row.getValue("name")}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <Badge variant={getStatusVariant(status)}>{status}</Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "cloud_provider",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Cloud Provider
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.getValue("cloud_provider")}
        </Badge>
      ),
    },
    {
      accessorKey: "metadata",
      header: "Regions Scanned",
      cell: ({ row }) => {
        const metadata = row.getValue("metadata") as Scan["metadata"];
        return (
          <div className="text-center">{metadata.total_regions_scanned}</div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {formatDate(row.getValue("created_at"))}
        </div>
      ),
    },
    {
      accessorKey: "metadata.scan_timestamp",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Scan
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const metadata = row.getValue("metadata") as Scan["metadata"];
        return (
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            {formatDate(metadata.scan_timestamp)}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const scan = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(scan.scan_id)}
              >
                Copy scan ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleScanClick(scan)}>
                View regions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewScanDetails(scan)}>
                View scan details
              </DropdownMenuItem>
              <DropdownMenuItem>Download report</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleStatusFilterChange = (status: string) => {
    setFilters((prev) => ({
      ...prev,
      status:
        status === "all" ? undefined : (status as "PENDING" | "COMPLETED"),
      offset: 0, // Reset pagination
    }));
  };

  const handleCloudProviderFilterChange = (provider: string) => {
    setFilters((prev) => ({
      ...prev,
      cloud_provider: provider === "all" ? undefined : provider,
      offset: 0, // Reset pagination
    }));
  };

  const filters_component = (
    <div className="flex items-center gap-2">
      <Select
        value={filters.status || "all"}
        onValueChange={handleStatusFilterChange}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.cloud_provider || "all"}
        onValueChange={handleCloudProviderFilterChange}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Provider" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Providers</SelectItem>
          <SelectItem value="AWS">AWS</SelectItem>
          <SelectItem value="Azure" disabled>
            Azure (Coming Soon)
          </SelectItem>
          <SelectItem value="GCP" disabled>
            GCP (Coming Soon)
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const handleNewScanClick = () => {
    setShowNewScanModal(true);
  };

  const handleScanCreated = () => {
    // Refresh the scans list
    refresh();
  };

  const toolbar = (
    <div className="flex items-center gap-2">
      <Button onClick={handleNewScanClick}>
        <Plus className="h-4 w-4 mr-2" />
        New Scan
      </Button>
    </div>
  );

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Scans
            </CardTitle>
            <CardDescription>
              Failed to load scans data. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={refresh} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show scan details when requested
  if (selectedScan && showScanDetails) {
    if (scanDetailsLoading) {
      return (
        <div className="flex-1 space-y-4 p-4 pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBackToScans}>
              ← Back to Scans
            </Button>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading scan details...</p>
            </div>
          </div>
        </div>
      );
    }

    if (scanDetailsError) {
      return (
        <div className="flex-1 space-y-4 p-4 pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBackToScans}>
              ← Back to Scans
            </Button>
          </div>
          <div className="flex items-center justify-center h-64">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Error Loading Scan Details
                </CardTitle>
                <CardDescription>
                  Failed to load scan details. Please try again.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={refreshScanDetails} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    if (scanDetails) {
      return (
        <div className="flex-1 space-y-4 p-4 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <Button
                variant="outline"
                onClick={handleBackToScans}
                className="mb-4"
              >
                ← Back to Scans
              </Button>
              <h2 className="text-3xl font-bold tracking-tight">
                {scanDetails.name}
              </h2>
              <p className="text-muted-foreground">
                Detailed scan results for {scanDetails.cloud_provider}{" "}
                infrastructure
              </p>
            </div>
            <div className="flex gap-2">
              <Badge
                variant={
                  scanDetails.status === "COMPLETED" ? "default" : "secondary"
                }
              >
                {scanDetails.status}
              </Badge>
              <Badge variant="outline">{scanDetails.cloud_provider}</Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scan ID</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-mono">{scanDetails.scan_id}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Regions Scanned
                </CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {scanDetails.metadata.total_regions_scanned}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Services Scanned
                </CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    [
                      ...new Set(
                        scanDetails.service_scan_results.map(
                          (r) => r.service_name
                        )
                      ),
                    ].length
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Last Updated
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {formatDate(scanDetails.metadata.scan_timestamp)}
                </div>
              </CardContent>
            </Card>
          </div>

          <ScanServiceResults
            serviceScanResults={scanDetails.service_scan_results}
            cloudProvider={scanDetails.cloud_provider}
          />
        </div>
      );
    }
  }

  // Show scan results for a specific region when region is selected
  if (selectedScan && selectedRegion && scanDetails) {
    const regionScanResults = scanDetails.service_scan_results.filter(
      (result) => result.region === selectedRegion.name
    );

    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              onClick={handleBackToRegions}
              className="mb-4"
            >
              ← Back to Regions
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">
              {selectedRegion.name} - {scanDetails.name}
            </h2>
            <p className="text-muted-foreground">
              Scan results for {selectedRegion.name} region in{" "}
              {scanDetails.cloud_provider}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline">{selectedRegion.name}</Badge>
            <Badge variant="outline">{scanDetails.cloud_provider}</Badge>
            <Badge
              variant={
                scanDetails.status === "COMPLETED" ? "default" : "secondary"
              }
            >
              {scanDetails.status}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Region</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedRegion.name}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Services Scanned
              </CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {regionScanResults.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scan Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {formatDate(scanDetails.metadata.scan_timestamp)}
              </div>
            </CardContent>
          </Card>
        </div>

        {regionScanResults.length > 0 ? (
          <ScanServiceResults
            serviceScanResults={regionScanResults}
            cloudProvider={scanDetails.cloud_provider}
          />
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center">
                <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No scan data</h3>
                <p className="text-muted-foreground">
                  No scan results found for {selectedRegion.name} region
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show regions cards when a scan is selected (but not showing details)
  if (selectedScan && !showScanDetails) {
    // Extract regions that have scan data and their service counts
    const scanResultRegions = scanDetails?.service_scan_results
      ? [
          ...new Set(
            scanDetails.service_scan_results.map((result) => result.region)
          ),
        ]
      : undefined;

    const regionServiceCounts = scanDetails?.service_scan_results
      ? scanDetails.service_scan_results.reduce((acc, result) => {
          acc[result.region] = (acc[result.region] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      : undefined;

    return (
      <div className="flex-1 space-y-4 p-4 pt-6">
        <RegionsCards
          cloudProvider={selectedScan.cloud_provider}
          scanData={{
            scan_id: selectedScan.scan_id,
            name: selectedScan.name,
            status: selectedScan.status,
            created_at: selectedScan.created_at,
          }}
          scanResultRegions={scanResultRegions}
          regionServiceCounts={regionServiceCounts}
          onBack={handleBackToScans}
          onRegionClick={handleRegionClick}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cloud Scans</h2>
          <p className="text-muted-foreground">
            Monitor and manage your cloud infrastructure security scans
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scans.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scans.filter((scan) => scan.status === "COMPLETED").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scans.filter((scan) => scan.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Regions Scanned
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scans.reduce(
                (total, scan) => total + scan.metadata.total_regions_scanned,
                0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
          <CardDescription>
            Recent cloud infrastructure security scans and their status. Click
            on a scan name to view regions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={scans}
            searchKey="name"
            searchPlaceholder="Search scans..."
            isLoading={isLoading}
            onRefresh={refresh}
            filters={filters_component}
            toolbar={toolbar}
            pageSize={20}
          />
        </CardContent>
      </Card>

      {/* New Scan Modal */}
      <NewScanModal
        open={showNewScanModal}
        onOpenChange={setShowNewScanModal}
        onScanCreated={handleScanCreated}
      />
    </div>
  );
}
