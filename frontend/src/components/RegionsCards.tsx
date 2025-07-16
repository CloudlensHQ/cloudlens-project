"use client";

import { useRegions } from "@/context/regions-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowLeft, Clock, Calendar } from "lucide-react";
import { Region } from "@/context/regions-context";

interface RegionsCardsProps {
  cloudProvider: string;
  scanData?: {
    scan_id: string;
    name: string;
    status: string;
    created_at: string;
  };
  onBack?: () => void;
  onRegionClick?: (region: Region) => void;
}

export const RegionsCards: React.FC<RegionsCardsProps> = ({
  cloudProvider,
  scanData,
  onBack,
  onRegionClick,
}) => {
  const { getRegionsByProvider, isLoading, error } = useRegions();

  const regions = getRegionsByProvider(cloudProvider);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRegionClick = (region: Region) => {
    if (onRegionClick) {
      onRegionClick(region);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MapPin className="h-8 w-8 animate-pulse mx-auto mb-2" />
          <p>Loading regions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading regions: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scans
          </Button>
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{cloudProvider} Regions</h2>
          {scanData && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <span>Scan:</span>
                <Badge variant="outline">{scanData.name}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(scanData.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <Badge
                  variant={
                    scanData.status === "COMPLETED" ? "default" : "secondary"
                  }
                >
                  {scanData.status}
                </Badge>
              </div>
            </div>
          )}
        </div>
        <Badge variant="outline" className="text-base px-3 py-1">
          {regions.length} regions
        </Badge>
      </div>

      {/* Regions Grid */}
      {regions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {regions.map((region) => (
            <Card
              key={region.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleRegionClick(region)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{region.name}</CardTitle>
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription>
                  {region.cloud_provider} Region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Provider:</span>
                    <Badge variant="outline">{region.cloud_provider}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2">
                    Click to view scan data
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No regions found</h3>
          <p className="text-muted-foreground">
            No regions available for {cloudProvider}
          </p>
        </div>
      )}
    </div>
  );
};

export default RegionsCards;
