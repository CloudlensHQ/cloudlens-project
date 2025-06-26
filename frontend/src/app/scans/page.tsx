'use client';

import { useState, useEffect } from 'react';
import { TimestampSelector } from './components/timestamp';
import { RegionCard } from './components/region-card';
import { ServiceDrawer } from './components/service-drawer';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  getAvailableTimestamps,
  getAvailableRegions,
  getAvailableServices,
} from './service/scan-data.service';
import { RegionCardSkeleton } from './components/region-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { CloudSelectionDialog } from './components/cloud-selection-dialog';

export default function DashboardPage() {
  const [timestamps, setTimestamps] = useState<string[]>([]);
  const [selectedTimestamp, setSelectedTimestamp] = useState<string>('');
  const [regions, setRegions] = useState<
    { name: string; resourceCount: number; complianceScore: number }[]
  >([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isCloudDialogOpen, setIsCloudDialogOpen] = useState(false);

  useEffect(() => {
    // Load available timestamps
    setIsLoading(true);
    getAvailableTimestamps().then((timestamps) => {
      setTimestamps(timestamps);
      if (timestamps.length > 0) {
        setSelectedTimestamp(timestamps[0]);
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedTimestamp) {
      // Load available regions for selected timestamp
      setIsLoading(true);
      getAvailableRegions(selectedTimestamp).then(async (regionNames) => {
        const regionsWithData = regionNames.map((name) => ({
          name,
          resourceCount: 0, // This will be updated when we load services
          complianceScore: 90, // Default score, could be calculated based on service data
        }));
        setRegions(regionsWithData);

        // Update resource counts for each region
        const updatedRegions = await Promise.all(
          regionNames.map(async (region) => {
            const services = await getAvailableServices(
              selectedTimestamp,
              region
            );
            return {
              name: region,
              resourceCount: services.length,
              complianceScore: 90, // Default score, could be calculated based on service data
            };
          })
        );
        setRegions(updatedRegions);
        setIsLoading(false);
      });
    }
  }, [selectedTimestamp]);

  useEffect(() => {
    if (selectedTimestamp && selectedRegion) {
      // Load available services for selected region
      setIsLoadingServices(true);
      getAvailableServices(selectedTimestamp, selectedRegion).then(
        (services) => {
          setAvailableServices(services);
          setIsLoadingServices(false);
        }
      );
    }
  }, [selectedTimestamp, selectedRegion]);

  // Generate skeleton cards for loading state
  const skeletonCards = Array.from({ length: 12 }, (_, i) => (
    <RegionCardSkeleton key={i} />
  ));

  const handleScanSubmit = async (credentials: {
    cloudProvider: string;
    accessKey: string;
    secretKey: string;
    scanName: string;
  }) => {
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aws_access_key_id: credentials.accessKey,
          aws_secret_access_key: credentials.secretKey,
          scan_name: credentials.scanName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start scan');
      }

      // Optionally refresh the data after scan
      if (selectedTimestamp) {
        getAvailableRegions(selectedTimestamp).then(async (regionNames) => {
          const regionsWithData = regionNames.map((name) => ({
            name,
            resourceCount: 0,
            complianceScore: 90,
          }));
          setRegions(regionsWithData);
        });
      }
    } catch (error) {
      console.error('Error starting scan:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex justify-between items-center px-3 py-2 border-b border-border">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Scans</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Button
          variant="default"
          size="sm"
          className="text-white font-medium w-[100px]"
          onClick={() => setIsCloudDialogOpen(true)}
        >
          Scan Now
        </Button>
      </div>
      <div className="flex justify-between items-center px-3">
        {isLoading ? (
          <Skeleton className="h-4 w-[60px]" />
        ) : (
          <p className="text-sm text-white font-medium">Regions</p>
        )}
        <TimestampSelector
          timestamps={timestamps}
          onSelect={setSelectedTimestamp}
          isLoading={isLoading}
        />
      </div>
      <div className="grid grid-cols-1 px-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? skeletonCards
          : regions.map((region) => (
              <RegionCard
                key={region.name}
                region={region}
                onClick={() => setSelectedRegion(region.name)}
              />
            ))}
      </div>
      <ServiceDrawer
        isOpen={!!selectedRegion}
        onClose={() => setSelectedRegion(null)}
        region={selectedRegion}
        timestamp={selectedTimestamp}
        services={availableServices}
        isLoading={isLoadingServices}
      />
      <CloudSelectionDialog
        isOpen={isCloudDialogOpen}
        onClose={() => setIsCloudDialogOpen(false)}
        onSubmit={handleScanSubmit}
      />
    </div>
  );
}
