"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Calendar,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Plus,
  RefreshCw,
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
import RegionsCards from "@/components/RegionsCards";
import { Region } from "@/context/regions-context";

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
  const [filters, setFilters] = useState<ScanFilters>({
    limit: 50,
    offset: 0,
  });

  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const {
    data: scans = [],
    isLoading,
    error,
    refresh,
  } = useScansDataWithRefresh(filters);

  const handleScanClick = (scan: Scan) => {
    setSelectedScan(scan);
    setSelectedRegion(null);
  };

  const handleBackToScans = () => {
    setSelectedScan(null);
    setSelectedRegion(null);
  };

  const handleRegionClick = (region: Region) => {
    setSelectedRegion(region);
    // TODO: In the future, this will show scan data for the selected region
    console.log("Region clicked:", region, "for scan:", selectedScan?.scan_id);
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
              <DropdownMenuItem>View results</DropdownMenuItem>
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

  const toolbar = (
    <div className="flex items-center gap-2">
      <Button>
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

  // Show regions cards when a scan is selected
  if (selectedScan) {
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
    </div>
  );
}
