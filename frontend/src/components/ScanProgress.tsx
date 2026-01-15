"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, CheckCircle } from "lucide-react";

interface ScanProgressProps {
  scanId: string;
  onComplete?: () => void;
}

interface ScanStatus {
  status: string;
  metadata: {
    progress_percentage?: number;
    regions_completed?: number;
    total_regions?: number;
    current_region?: string;
  };
}

export function ScanProgress({ scanId, onComplete }: ScanProgressProps) {
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const fetchScanStatus = async () => {
      try {
        const response = await fetch(`/api/scans/status/${scanId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("cloudlens_access_token")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch scan status");
        }

        const data = await response.json();
        setScanStatus(data);

        // Stop polling if scan is complete or failed
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          setIsPolling(false);
          if (data.status === "COMPLETED" && onComplete) {
            onComplete();
          }
        }
      } catch (error) {
        console.error("Error fetching scan status:", error);
      }
    };

    if (isPolling) {
      // Fetch immediately
      fetchScanStatus();

      // Then poll every 3 seconds
      intervalId = setInterval(fetchScanStatus, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [scanId, isPolling, onComplete]);

  if (!scanStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const progress = scanStatus.metadata.progress_percentage || 0;
  const regionsCompleted = scanStatus.metadata.regions_completed || 0;
  const totalRegions = scanStatus.metadata.total_regions || 0;
  const currentRegion = scanStatus.metadata.current_region;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Scan Progress</CardTitle>
          <Badge
            variant={
              scanStatus.status === "COMPLETED" ? "default" : "secondary"
            }
          >
            {scanStatus.status === "IN_PROGRESS" && (
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            )}
            {scanStatus.status === "COMPLETED" && (
              <CheckCircle className="mr-2 h-3 w-3" />
            )}
            {scanStatus.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Regions</span>
            <span className="font-medium">
              {regionsCompleted} / {totalRegions}
            </span>
          </div>

          {currentRegion && scanStatus.status === "IN_PROGRESS" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Currently scanning: {currentRegion}</span>
            </div>
          )}
        </div>

        {scanStatus.status === "COMPLETED" && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm text-green-800 dark:text-green-200">
            <CheckCircle className="inline h-4 w-4 mr-2" />
            Scan completed successfully!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
